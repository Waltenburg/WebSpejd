import 'source-map-support/register.js';
import * as http from 'http';
// ====== Core server components ======
import { UserCache } from './users.js';
import { Router, parseForm } from "./request.js";
import { UpdateService, AdminService, PatrolService, LocationService, Database } from "./databaseBarrel.js";
import { Response, send_response } from "./response.js";
// ====== Utilities ======
import { inspect } from 'util';
import * as zod from "zod";
import * as validation from "@webspejd/core/validation.js";
// ====== Pages and HTML generation ======
import * as pages from "./endpointHandlers/pages.js";
import * as LocationConfigHandler from './endpointHandlers/LocationConfigHandler.js';
import * as LocationStatusHandler from './endpointHandlers/locationStatusHandler.js';
import * as RouteConfigHandler from './endpointHandlers/RouteConfigHandler.js';
import * as PatrolStatusHandler from './endpointHandlers/patrolStatusHandler.js';
import * as PatrolUpdatesHandler from './endpointHandlers/patrolUpdatesHandler.js';
import * as PatrolConfigHandler from './endpointHandlers/patrolConfigHandler.js';
import * as LocationPasswordHandler from './endpointHandlers/locationPasswordHandler.js';
import * as LogsHandler from './endpointHandlers/logsHandler.js';
import * as LocationRouteGraphHandler from './endpointHandlers/locationRouteGraphHandler.js';
import { LogService } from './database/logService.js';
import { readFileSync } from 'fs';
import { env } from 'process';
class Server {
    /**
     * Create new server.
    */
    constructor(address, port, assets, db, adminService, locationService, patrolService, updateService) {
        /**
         * Handle login request.
         */
        this.login = async (req) => {
            const password = req.headers['password'];
            const identifier = req.headers['id'];
            const locationId = this.adminService.authenticate(password);
            if (locationId === undefined) {
                return Response.unauthorized();
            }
            const user = this.users.addUser(identifier, locationId);
            return Response.ok()
                .setHeader("isMaster", user.isMasterUser().toString());
        };
        this.logout = async (_request) => {
            return Response.redirect("/")
                .setHeader("Set-Cookie", "identifier=deleted; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT");
        };
        // TODO: Update to work with new location routing
        /**
         * Get information about post.
         */
        this.locationDataForMandskab = async (req) => {
            const user = req.user;
            const location = this.locationService.locationInfo(user.locationId);
            if (location === undefined) {
                return Response.notFound()
                    .setContent(`post ${user.locationId} not found`);
            }
            let towardsLocation = this.locationService.patrolsTowardsLocation(user.locationId);
            // if the location is the first location, include patrols that have no patrol update yet
            if (location.id === this.locationService.getFirstLocationId()) {
                const patrolsWithNoUpdates = this.patrolService.allPatrolsWithNoUpdates();
                towardsLocation = towardsLocation.concat(patrolsWithNoUpdates);
            }
            const patrolsOnLocation = this.locationService.patrolsOnLocation(user.locationId);
            const routesFromLocation = this.locationService.allRoutesFromLocation(user.locationId);
            const openRoutes = routesFromLocation.filter(route => route.is_open);
            const nextLocations = openRoutes
                .map(route => this.locationService.locationInfo(route.toLocationId))
                .filter(location => location !== undefined);
            const latestUpdates = this.updateService.updatesAtLocation(user.locationId, 10 /* SETTINGS.NUMBER_OF_UPDATES_SEND_TO_CLIENT */)
                .map(update => {
                return {
                    ...update,
                    patrol: this.patrolService.patrolInfo(update.patrolId),
                    targetLocationName: this.locationService.locationInfo(update.targetLocationId)?.name || "Ukendt destination"
                };
            });
            const data = {
                patrolsOnLocation: patrolsOnLocation.map(p => this.patrolService.patrolInfo(p)),
                patrolsTowardsLocation: towardsLocation.map(p => this.patrolService.patrolInfo(p)),
                location: location,
                routesTo: nextLocations,
                latestUpdates: latestUpdates
            };
            return Response.ok().setContent(JSON.stringify(data));
        };
        this.infoForMandskab = async (_req) => {
            const info = this.locationService.getParsedMandskabPageInfo();
            return Response.ok().setContent(info);
        };
        /**
         * End point for checking in or out at a location
         *
         * @param req the http request
         * @return Promise of a response to send to client
         */
        this.makePatrolUpdate = async (request) => {
            const user = request.user;
            const updateHeader = request.headers['update']; //{PatolId}%{targetLocationID}
            const update = this.tryGet(updateHeader, (upd) => JSON.parse(upd), (err) => console.error("Error parsing update string:", err));
            if (!update) {
                return Response.badRequest();
            }
            const checkin = {
                time: new Date(),
                patrolId: update.patrolId,
                currentLocationId: user.locationId,
                targetLocationId: update.targetLocationId
            };
            const thisIsFirstLocation = user.locationId === this.locationService.getFirstLocationId();
            if (!this.updateService.isPatrolUpdateValid(checkin, true, true, thisIsFirstLocation)) {
                return Response.badRequest();
            }
            const checkinID = this.updateService.updatePatrol(checkin);
            //Send id back to client
            return Response.ok()
                .setHeader("checkinID", checkinID.toString());
        };
        this.makeMasterBulkPatrolUpdates = async (request) => {
            if (request.body === undefined) {
                return Response.badRequest();
            }
            const formData = parseForm(request.body);
            const datetimeStr = formData['datetime'];
            const type = formData['type']; // "checkin" or "checkout"
            const patrolIds = formData['patrolIds'].split(',').map((id) => Number.parseInt(id));
            let currentLocationId;
            let targetLocationId;
            if (type === 'checkin') {
                currentLocationId = Number.parseInt(formData['singleLocation']);
                targetLocationId = currentLocationId;
            }
            else if (type === 'checkout') {
                currentLocationId = Number.parseInt(formData['fromLocation']);
                targetLocationId = Number.parseInt(formData['toLocation']);
            }
            else {
                return Response.badRequest();
            }
            const patrolUpdates = patrolIds.map((patrolId) => {
                return {
                    time: new Date(datetimeStr),
                    patrolId: patrolId,
                    currentLocationId: currentLocationId,
                    targetLocationId: targetLocationId
                };
            });
            // This checkin is made by an admin, so we skip route validation and
            // current equals target check. Also, we allow the target to be the
            // first location.
            const allValid = patrolUpdates.every(update => this.updateService.isPatrolUpdateValid(update, false, false, true, false));
            if (!allValid) {
                console.error("One or more invalid patrol updates in master bulk update:", patrolUpdates);
                return Response.badRequest();
            }
            this.updateService.batchUpdatePatrol(patrolUpdates);
            return Response.ok();
        };
        this.masterDeletePatrolUpdate = async (request) => {
            if (request.body === undefined) {
                return Response.badRequest();
            }
            const form = parseForm(request.body);
            const updateId = Number.parseInt(form["patrolUpdateId"]);
            const succes = this.updateService.deleteUpdate(updateId);
            if (!succes) {
                return Response.notFound().setContent("Patrol update not found");
            }
            return Response.ok();
        };
        this.mandskabDeleteUpdate = async (request) => {
            const checkinId = validation.parseUrlParams(zod.object({ patrolUpdateId: validation.AnyNumber }), request.url).patrolUpdateId;
            const checkin = this.updateService.updateById(checkinId);
            if (checkin === undefined) {
                return Response.notFound();
            }
            const locationIdAtCheckin = checkin.currentLocationId;
            const requestAndCheckinMatch = locationIdAtCheckin === request.user.locationId && locationIdAtCheckin != null;
            const checkinIsRecent = checkin.time.getTime() > Date.now() - 30000 /* SETTINGS.MAX_AGE_OF_UPDATE_THAT_CAN_BE_DELETED_BY_MANDSKAB */;
            if (requestAndCheckinMatch && checkinIsRecent) {
                this.updateService.deleteUpdate(checkinId);
                return Response.ok();
            }
            return Response.forbidden();
        };
        this.adminService = adminService;
        this.locationService = locationService;
        this.patrolService = patrolService;
        this.updateService = updateService;
        this.logService = new LogService(db);
        this.users = new UserCache();
        this.router = this.createRouter(address, port, assets, this.users);
        const numberOfPosts = locationService.allLocationIds().length;
        const numberOfPatrols = patrolService.allPatrolIds().length;
        const numberOfUsers = adminService.userIds().length;
        console.log(`Alle filer succesfuldt loadet. Loadet ${numberOfPosts} poster, ${numberOfUsers} brugere og ${numberOfPatrols} patruljer`);
        http.createServer(async (req, connection) => {
            const startTime = Date.now();
            let response;
            let errorMessage = "";
            let severity = "info";
            try {
                response = await this.router.handleRequest(req);
                send_response(connection, response);
            }
            catch (softError) {
                console.error(softError);
                errorMessage = softError instanceof Error ? softError.message : String(softError);
                severity = "error";
                try {
                    if (!connection.headersSent)
                        connection.writeHead(500);
                    connection.end();
                }
                catch (hardError) {
                    errorMessage += `; Additionally, failed to send error response: ${hardError instanceof Error ? hardError.message : String(hardError)}`;
                    connection.destroy();
                    severity = "critical";
                }
            }
            try {
                const status = 200; // TODO: fix
                const sensitiveHeaders = new Set([
                    "password",
                    "authorization",
                    "cookie",
                    "set-cookie",
                    "update",
                ]);
                const filteredHeaders = {};
                for (const [key, value] of Object.entries(req.headers)) {
                    if (sensitiveHeaders.has(key.toLowerCase())) {
                        continue;
                    }
                    if (Array.isArray(value)) {
                        filteredHeaders[key] = value.join(",");
                    }
                    else if (value != null) {
                        filteredHeaders[key] = String(value);
                    }
                }
                this.logService.addLog({
                    time: startTime,
                    method: req.method ?? "",
                    path: req.url ?? "",
                    headers: JSON.stringify(filteredHeaders),
                    duration: Date.now() - startTime,
                    status,
                    severity,
                    message: errorMessage,
                });
            }
            catch (logError) {
                console.error("Failed to log request:", logError);
            }
        })
            .listen(port, address, () => {
            console.log(`Server is now listening at http://${address}:${port}`);
        });
    }
    createRouter(address, port, assets, users) {
        return new Router(address, port, users)
            // ================================ Asset and script directories ==================================
            .assetDir("/assets", assets)
            .assetDir("/js", `client/target`)
            // ================================ Static File Endpoints ==================================
            .file("/" /* Endpoints.Home */, `${assets}/html/home.html`)
            .file("/home" /* Endpoints.HomeAlias */, `${assets}/html/home.html`)
            .file("/mandskab" /* Endpoints.Mandskab */, `${assets}/html/mandskab.html`)
            .file("/contact" /* Endpoints.Contact */, `${assets}/html/contact.html`)
            .file('/favicon.ico', `${assets}/images/favicon.ico`)
            // ================================ Mandskab info ==============================
            .route("/getMandskabPageInfo" /* Endpoints.GetMandskabPageInfo */, 1 /* UserType.Post */, this.infoForMandskab)
            // ================================ Authentication Endpoints ==================================
            .route("/login" /* Endpoints.Login */, 0 /* UserType.None */, this.login)
            .route("/logout" /* Endpoints.Logout */, 0 /* UserType.None */, this.logout)
            // ================================ Mandskab Endpoints ==================================
            .route("/deletePatrolUpdateMandskab" /* Endpoints.MandskabDeletePatrolUpdate */, 1 /* UserType.Post */, this.mandskabDeleteUpdate)
            .route("/sendPatrolUpdateMandskab" /* Endpoints.MandskabSendPatrolUpdate */, 1 /* UserType.Post */, this.makePatrolUpdate)
            .route("/getData" /* Endpoints.GetMandskabData */, 1 /* UserType.Post */, this.locationDataForMandskab)
            // ================================ Master Pages Endpoints ==================================
            .route("/master" /* Endpoints.MainMasterPage */, 2 /* UserType.Master */, pages.mainMasterPage, this.locationService, this.updateService, this.patrolService)
            .route("/master/locationRouteConfig" /* Endpoints.LocationRouteConfigPage */, 2 /* UserType.Master */, pages.locatonAndRouteConfigPage, this.locationService, this.updateService, this.patrolService)
            .route("/master/locationRouteGraph" /* Endpoints.LocationRouteGraphPage */, 2 /* UserType.Master */, pages.locationRouteGraphPage)
            .route("/master/patrolConfig" /* Endpoints.PatrolConfigPage */, 2 /* UserType.Master */, pages.patrolConfigPage, this.patrolService)
            .route("/master/patrol_page" /* Endpoints.MasterPatrolPage */, 2 /* UserType.Master */, pages.patrolPage, this.patrolService, this.locationService, this.updateService)
            .route("/master/updatePage" /* Endpoints.MasterAddPatrolUpdatePage */, 2 /* UserType.Master */, pages.addPatrolUpdatePage, this.patrolService, this.locationService)
            .route("/master/location_page" /* Endpoints.MasterLocationPage */, 2 /* UserType.Master */, pages.locationPage, this.locationService, this.updateService, this.patrolService)
            .route("/master/heartbeat" /* Endpoints.MasterHeartbeat */, 2 /* UserType.Master */, async () => Response.ok())
            .route("/master/locationRouteGraphData" /* Endpoints.GetLocationRouteGraphData */, 2 /* UserType.Master */, LocationRouteGraphHandler.getLocationRouteGraphData, this.locationService, this.patrolService, this.updateService)
            .route("/master/locationRouteGraphLayout" /* Endpoints.SetLocationRouteGraphLayout */, 2 /* UserType.Master */, LocationRouteGraphHandler.setLocationRouteGraphLayout, this.locationService)
            // ================================ Route Config Endpoints ================================
            .route("/master/addRoute" /* Endpoints.AddRoute */, 2 /* UserType.Master */, RouteConfigHandler.addRoute, this.locationService)
            .route("/master/deleteRoute" /* Endpoints.DeleteRoute */, 2 /* UserType.Master */, RouteConfigHandler.deleteRoute, this.locationService)
            .route("/master/changeRouteStatus" /* Endpoints.ChangeRouteStatus */, 2 /* UserType.Master */, RouteConfigHandler.changeRouteStatus, this.locationService)
            .route("/master/getRouteTableRow" /* Endpoints.GetRouteTableRow */, 2 /* UserType.Master */, RouteConfigHandler.getRouteConfigTableRow, this.locationService)
            .route("/master/getRoutesTable" /* Endpoints.GetRoutesTable */, 2 /* UserType.Master */, RouteConfigHandler.getRouteConfigTable, this.locationService)
            // ================================ Patrol Update Endpoints ================================
            .route("/master/patrolUpdatesTable" /* Endpoints.GetPatrolUpdatesTable */, 2 /* UserType.Master */, PatrolUpdatesHandler.getPatrolUpdatesTable, this.updateService, this.locationService, this.patrolService)
            .route("/master/deletePatrolUpdate" /* Endpoints.DeletePatrolUpdate */, 2 /* UserType.Master */, this.masterDeletePatrolUpdate)
            .route("/master/addPatrolUpdate" /* Endpoints.AddPatrolUpdate */, 2 /* UserType.Master */, this.makeMasterBulkPatrolUpdates)
            // ================================ Patrol Status Endpoints ================================
            .route("/master/patrolStatusTable" /* Endpoints.GetPatrolStatusTable */, 2 /* UserType.Master */, PatrolStatusHandler.getPatrolStatusTable, this.locationService, this.patrolService, this.updateService)
            .route("/master/patrolStatus" /* Endpoints.ChangePatrolStatus */, 2 /* UserType.Master */, PatrolConfigHandler.changePatrolStatus, this.patrolService)
            // ================================= Patrol config Endpoints ================================
            .route("/master/addPatrol" /* Endpoints.AddPatrol */, 2 /* UserType.Master */, PatrolConfigHandler.addPatrol, this.patrolService)
            .route("/master/deletePatrol" /* Endpoints.DeletePatrol */, 2 /* UserType.Master */, PatrolConfigHandler.deletePatrol, this.patrolService)
            .route("/master/renamePatrol" /* Endpoints.AlterPatrol */, 2 /* UserType.Master */, PatrolConfigHandler.alterPatrolNumberAndName, this.patrolService)
            .route("/master/getPatrolConfigTable" /* Endpoints.GetPatrolConfigTable */, 2 /* UserType.Master */, PatrolConfigHandler.getPatrolConfigTable, this.patrolService)
            .route("/master/getPatrolConfigTableBody" /* Endpoints.GetPatrolConfigTableBody */, 2 /* UserType.Master */, PatrolConfigHandler.getPatrolConfigTableBody, this.patrolService)
            .route("/master/getPatrolConfigTableRow" /* Endpoints.GetPatrolConfigTableRow */, 2 /* UserType.Master */, PatrolConfigHandler.getPatrolConfigTableRow, this.patrolService)
            .route("/master/getPatrolConfigTableRenameRow" /* Endpoints.GetPatrolConfigTableRenameRow */, 2 /* UserType.Master */, PatrolConfigHandler.getRenamePatrolRow, this.patrolService)
            // ================================ Location Status Endpoints ================================
            .route("/master/getLocationStatusTable" /* Endpoints.GetLocationStatusTable */, 2 /* UserType.Master */, LocationStatusHandler.getLocationStatusTable, this.locationService)
            // ================================ Location Config Endpoints ============================
            .route("/master/addLocation" /* Endpoints.AddLocation */, 2 /* UserType.Master */, LocationConfigHandler.addLocation, this.locationService)
            .route("/master/deleteLocation" /* Endpoints.DeleteLocation */, 2 /* UserType.Master */, LocationConfigHandler.deleteLocation, this.locationService)
            .route("/master/changeLocationStatus" /* Endpoints.ChangeLocationStatus */, 2 /* UserType.Master */, LocationConfigHandler.changeLocationStatus, this.locationService)
            .route("/master/renameLocation" /* Endpoints.RenameLocation */, 2 /* UserType.Master */, LocationConfigHandler.renameLocation, this.locationService)
            .route("/master/getLocationTableRow" /* Endpoints.GetLocationConfigTableRow */, 2 /* UserType.Master */, LocationConfigHandler.getLocationConfigTableRow, this.locationService)
            .route("/master/getLocationsTable" /* Endpoints.GetLocationConfigTable */, 2 /* UserType.Master */, LocationConfigHandler.getLocationConfigTable, this.locationService)
            .route("/master/getLocationsTableBody" /* Endpoints.GetLocationConfigTableBody */, 2 /* UserType.Master */, LocationConfigHandler.getLocationConfigTableBody, this.locationService)
            .route("/master/renameLocationRow" /* Endpoints.GetRenameLocationRow */, 2 /* UserType.Master */, LocationConfigHandler.getRenameLocationRow, this.locationService)
            .route("/master/makeLocationFirstLocation" /* Endpoints.MakeLocationFirstLocation */, 2 /* UserType.Master */, LocationConfigHandler.makeLocationFirstLocation, this.locationService)
            .route("/master/setMandskabPageInfo" /* Endpoints.SetInfoOnMandskabPage */, 2 /* UserType.Master */, LocationConfigHandler.setInfoOnMandskabPage, this.locationService)
            // =============================== Location password Endpoints ================================
            .route("/master/getLocationPasswords" /* Endpoints.GetLocationPasswords */, 2 /* UserType.Master */, LocationPasswordHandler.getLocationPasswords, this.adminService, this.locationService)
            .route("/master/addLocationPassword" /* Endpoints.AddLocationPassword */, 2 /* UserType.Master */, LocationPasswordHandler.addLocationPassword, this.adminService)
            .route("/master/deleteLocationPassword" /* Endpoints.DeleteLocationPassword */, 2 /* UserType.Master */, LocationPasswordHandler.deleteLocationPassword, this.adminService)
            // ================================ Logs Endpoints ================================
            .route("/master/getLogs" /* Endpoints.GetLogs */, 2 /* UserType.Master */, LogsHandler.getLogs, this.logService);
    }
    /**
     * Cleanup server.
     *
     * @param options ?
     * @param event the event that caused the cleanup
     */
    cleanup(_options, event) {
        console.log("Program exiting with code: " + event);
        console.log(event);
        process.exit();
    }
    ;
    tryGet(input, map, errorHandler) {
        try {
            const result = map(input);
            return result;
        }
        catch (error) {
            if (errorHandler && error instanceof Error) {
                errorHandler(error);
            }
            return undefined;
        }
    }
}
async function main() {
    const config = JSON.parse(readFileSync(`./server.config.json`, 'utf-8'));
    const port = Number.parseInt(config["port"]);
    const address = config["address"];
    const database = config["databasePath"];
    const assets = config["assetsPath"];
    const inMemory = config["inMemory"] ?? false;
    const resetDatabase = config["resetDatabase"] ?? false;
    const masterPassword = config["master_password" /* SETTINGS_TABLE.SETTING_MASTER_PASSWORD */];
    const competitionName = config['competition_name'] ?? "";
    console.log(`Starting server with options: ${inspect({
        address: address,
        port: port,
        database: database,
        assets: assets,
        inMemory: inMemory,
        resetDatabase: resetDatabase,
        master_password: masterPassword ? masterPassword : "<Inherited from existing database>",
        competition_name: competitionName,
    }, { colors: true, depth: null })}`);
    const db = new Database(database, inMemory, resetDatabase);
    const adminService = new AdminService(db);
    const locationService = new LocationService(db);
    const patrolService = new PatrolService(db);
    const updateService = new UpdateService(db);
    if (resetDatabase) {
        console.log("Resetting database: Deleting all patrol updates");
        updateService.allPatrolUpdatesIds().forEach(id => updateService.deleteUpdate(id));
    }
    if (masterPassword)
        adminService.setMasterPassword(masterPassword);
    env.COMPETITION_NAME = competitionName;
    const server = new Server(address, port, assets, db, adminService, locationService, patrolService, updateService);
    [`exit`, `SIGINT`, `SIGUSR1`, `SIGUSR2`, `uncaughtException`, `SIGTERM`].forEach((eventType) => {
        process.on(eventType, server.cleanup.bind(null, eventType));
    });
}
main();
//# sourceMappingURL=server.js.map