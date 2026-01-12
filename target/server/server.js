"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
require("source-map-support/register");
const http = __importStar(require("http"));
const users_1 = require("./users");
const request_1 = require("./request");
const databaseBarrel_1 = require("./databaseBarrel");
const responses = __importStar(require("./response"));
const util_1 = require("util");
const pages = __importStar(require("./endpointHandlers/pages"));
const LocationConfigHandler = __importStar(require("./endpointHandlers/LocationConfigHandler"));
const LocationStatusHandler = __importStar(require("./endpointHandlers/locationStatusHandler"));
const RouteConfigHandler = __importStar(require("./endpointHandlers/RouteConfigHandler"));
const PatrolStatusHandler = __importStar(require("./endpointHandlers/patrolStatusHandler"));
const PatrolUpdatesHandler = __importStar(require("./endpointHandlers/patrolUpdatesHandler"));
const PatrolConfigHandler = __importStar(require("./endpointHandlers/patrolConfigHandler"));
const LocationPasswordHandler = __importStar(require("./endpointHandlers/locationPasswordHandler"));
const LogsHandler = __importStar(require("./endpointHandlers/logsHandler"));
const logService_1 = require("./database/logService");
const fs_1 = require("fs");
class Server {
    constructor(address, port, assets, db, adminService, locationService, patrolService, updateService) {
        this.login = async (req) => {
            const password = req.headers['password'];
            const identifier = req.headers['id'];
            const locationId = this.adminService.authenticate(password);
            if (locationId === undefined) {
                return responses.unauthorized();
            }
            const user = this.users.addUser(identifier, locationId);
            return responses.ok(null, {
                "isMaster": user.isMasterUser()
            });
        };
        this.logout = async (_request) => {
            let response = responses.redirect("/");
            response.headers["Set-Cookie"] = "identifier=deleted; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
            return response;
        };
        this.locationDataForMandskab = async (req) => {
            const user = req.user;
            const location = this.locationService.locationInfo(user.locationId);
            if (location === undefined)
                return responses.not_found(`post ${user.locationId} not found`);
            let towardsLocation = this.locationService.patrolsTowardsLocation(user.locationId);
            if (location.id === Number.parseInt(this.adminService.settings["first_location"])) {
                const patrolsWithNoUpdates = this.patrolService.allPatrolsWithNoUpdates();
                towardsLocation = towardsLocation.concat(patrolsWithNoUpdates);
            }
            const patrolsOnLocation = this.locationService.patrolsOnLocation(user.locationId);
            const routesFromLocation = this.locationService.allRoutesFromLocation(user.locationId);
            const openRoutes = routesFromLocation.filter(route => route.is_open);
            const nextLocations = openRoutes.map(route => this.locationService.locationInfo(route.toLocationId));
            const latestUpdates = this.updateService.updatesAtLocation(user.locationId, 10)
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
            return responses.ok("", {
                data: JSON.stringify(data)
            });
        };
        this.makePatrolUpdate = async (request) => {
            const user = request.user;
            const updateHeader = request.headers['update'];
            const update = this.tryGet(updateHeader, (upd) => JSON.parse(upd), (err) => console.error("Error parsing update string:", err));
            if (!update)
                return responses.response_code(400);
            const checkin = {
                time: new Date(),
                patrolId: update.patrolId,
                currentLocationId: user.locationId,
                targetLocationId: update.targetLocationId
            };
            const thisIsFirstLocation = user.locationId === Number.parseInt(this.adminService.settings["first_location"]);
            if (!this.updateService.isPatrolUpdateValid(checkin, true, true, thisIsFirstLocation)) {
                return responses.response_code(400);
            }
            const checkinID = this.updateService.updatePatrol(checkin);
            return responses.ok("", {
                "checkinID": checkinID
            });
        };
        this.makeMasterPatrolUpdate = async (request) => {
            const formData = (0, request_1.parseForm)(request.body);
            const dateStr = formData['date'];
            const timeStr = formData['time'];
            let patrolUpdate = {
                time: new Date(dateStr + "T" + timeStr + ":00"),
                patrolId: Number.parseInt(formData['patrol']),
                currentLocationId: 0,
                targetLocationId: 0
            };
            const type = formData['type'];
            if (type === 'checkin') {
                const locationId = Number.parseInt(formData['singleLocation']);
                patrolUpdate.currentLocationId = locationId;
                patrolUpdate.targetLocationId = locationId;
            }
            else if (type === 'checkout') {
                const fromLocationId = Number.parseInt(formData['fromLocation']);
                const toLocationId = Number.parseInt(formData['toLocation']);
                patrolUpdate.currentLocationId = fromLocationId;
                patrolUpdate.targetLocationId = toLocationId;
            }
            else {
                return responses.response_code(400);
            }
            if (!this.updateService.isPatrolUpdateValid(patrolUpdate, false, false, true)) {
                console.error("Invalid patrol update in masterCheckin:", patrolUpdate);
                return responses.response_code(400);
            }
            this.updateService.updatePatrolWithTime(patrolUpdate);
            return responses.ok();
        };
        this.masterDeletePatrolUpdate = async (request) => {
            const form = (0, request_1.parseForm)(request.body);
            const updateId = Number.parseInt(form["patrolUpdateId"]);
            const succes = this.updateService.deleteUpdate(updateId);
            if (!succes) {
                return responses.not_found("Patrol update not found");
            }
            return responses.ok();
        };
        this.mandskabDeleteUpdate = async (request) => {
            const params = request.url.searchParams;
            const checkinId = Number.parseInt(params.get("patrolUpdateId"));
            const checkin = this.updateService.updateById(checkinId);
            const locationIdAtCheckin = checkin?.currentLocationId;
            const requestAndCheckinMatch = locationIdAtCheckin === request.user.locationId && locationIdAtCheckin != null;
            const checkinIsRecent = checkin?.time.getTime() > Date.now() - 30000;
            if (requestAndCheckinMatch && checkinIsRecent) {
                this.updateService.deleteUpdate(checkinId);
                return responses.ok();
            }
            return responses.forbidden();
        };
        this.masterHeartbeat = async (_request) => {
            return responses.ok();
        };
        this.db = db;
        this.adminService = adminService;
        this.locationService = locationService;
        this.patrolService = patrolService;
        this.updateService = updateService;
        this.logService = new logService_1.LogService(db);
        this.users = new users_1.UserCache();
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
                responses.send(connection, response);
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
                const status = response.status_code ?? 0;
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
        return new request_1.Router(address, port, users)
            .assetDir("/assets", assets)
            .assetDir("/js", `${__dirname}/../client`)
            .file("/", `${assets}/html/home.html`)
            .file("/home", `${assets}/html/home.html`)
            .file("/mandskab", `${assets}/html/mandskab.html`)
            .file("/contact", `${assets}/html/contact.html`)
            .file('/favicon.ico', `${assets}/favicon.ico`)
            .route("/login", 0, this.login)
            .route("/logout", 0, this.logout)
            .route("/deletePatrolUpdateMandskab", 1, this.mandskabDeleteUpdate)
            .route("/sendPatrolUpdateMandskab", 1, this.makePatrolUpdate)
            .route("/getData", 1, this.locationDataForMandskab)
            .route("/master", 2, pages.mainMasterPage, this.locationService, this.updateService, this.patrolService)
            .route("/master/locationRouteConfig", 2, pages.locatonAndRouteConfigPage, this.locationService, this.updateService, this.patrolService)
            .route("/master/patrolConfig", 2, pages.patrolConfigPage, this.patrolService)
            .route("/master/patrol_page", 2, pages.patrolPage, this.patrolService, this.locationService, this.updateService)
            .route("/master/updatePage", 2, pages.addPatrolUpdatePage, this.patrolService, this.locationService)
            .route("/master/location_page", 2, pages.locationPage, this.locationService, this.updateService, this.patrolService)
            .route("/master/heartbeat", 2, async () => responses.ok())
            .route("/master/addRoute", 2, RouteConfigHandler.addRoute, this.locationService)
            .route("/master/deleteRoute", 2, RouteConfigHandler.deleteRoute, this.locationService)
            .route("/master/changeRouteStatus", 2, RouteConfigHandler.changeRouteStatus, this.locationService)
            .route("/master/getRouteTableRow", 2, RouteConfigHandler.getRouteConfigTableRow, this.locationService)
            .route("/master/getRoutesTable", 2, RouteConfigHandler.getRouteConfigTable, this.locationService)
            .route("/master/patrolUpdatesTable", 2, PatrolUpdatesHandler.getPatrolUpdatesTable, this.updateService, this.locationService, this.patrolService)
            .route("/master/deletePatrolUpdate", 2, this.masterDeletePatrolUpdate)
            .route("/master/addPatrolUpdate", 2, this.makeMasterPatrolUpdate)
            .route("/master/patrolStatusTable", 2, PatrolStatusHandler.getPatrolStatusTable, this.locationService, this.patrolService, this.updateService)
            .route("/master/patrolStatus", 2, PatrolConfigHandler.changePatrolStatus, this.patrolService)
            .route("/master/addPatrol", 2, PatrolConfigHandler.addPatrol, this.patrolService)
            .route("/master/deletePatrol", 2, PatrolConfigHandler.deletePatrol, this.patrolService)
            .route("/master/renamePatrol", 2, PatrolConfigHandler.alterPatrolNumberAndName, this.patrolService)
            .route("/master/getPatrolConfigTable", 2, PatrolConfigHandler.getPatrolConfigTable, this.patrolService)
            .route("/master/getPatrolConfigTableBody", 2, PatrolConfigHandler.getPatrolConfigTableBody, this.patrolService)
            .route("/master/getPatrolConfigTableRow", 2, PatrolConfigHandler.getPatrolConfigTableRow, this.patrolService)
            .route("/master/getPatrolConfigTableRenameRow", 2, PatrolConfigHandler.getRenamePatrolRow, this.patrolService)
            .route("/master/getLocationStatusTable", 2, LocationStatusHandler.getLocationStatusTable, this.locationService)
            .route("/master/addLocation", 2, LocationConfigHandler.addLocation, this.locationService)
            .route("/master/deleteLocation", 2, LocationConfigHandler.deleteLocation, this.locationService)
            .route("/master/changeLocationStatus", 2, LocationConfigHandler.changeLocationStatus, this.locationService)
            .route("/master/renameLocation", 2, LocationConfigHandler.renameLocation, this.locationService)
            .route("/master/getLocationTableRow", 2, LocationConfigHandler.getLocationConfigTableRow, this.locationService)
            .route("/master/getLocationsTable", 2, LocationConfigHandler.getLocationConfigTable, this.locationService)
            .route("/master/getLocationsTableBody", 2, LocationConfigHandler.getLocationConfigTableBody, this.locationService)
            .route("/master/renameLocationRow", 2, LocationConfigHandler.getRenameLocationRow, this.locationService)
            .route("/master/makeLocationFirstLocation", 2, LocationConfigHandler.makeLocationFirstLocation, this.locationService)
            .route("/master/getLocationPasswords", 2, LocationPasswordHandler.getLocationPasswords, this.adminService, this.locationService)
            .route("/master/addLocationPassword", 2, LocationPasswordHandler.addLocationPassword, this.adminService)
            .route("/master/deleteLocationPassword", 2, LocationPasswordHandler.deleteLocationPassword, this.adminService)
            .route("/master/getLogs", 2, LogsHandler.getLogs, this.logService);
    }
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
            if (errorHandler) {
                errorHandler(error);
            }
            return undefined;
        }
    }
}
async function main() {
    const config = JSON.parse((0, fs_1.readFileSync)(`${__dirname}/server.config.json`, 'utf-8'));
    const port = Number.parseInt(config["port"]);
    const address = config["address"];
    const database = config["databasePath"];
    const assets = config["assetsPath"];
    const inMemory = config["inMemory"] ?? false;
    const resetDatabase = config["resetDatabase"] ?? false;
    console.log(`Starting server with options: ${(0, util_1.inspect)({
        address: address,
        port: port,
        database: database,
        assets: assets,
        inMemory: inMemory,
        resetDatabase: resetDatabase
    }, { colors: true, depth: null })}`);
    const db = new databaseBarrel_1.Database(database, inMemory, resetDatabase);
    const adminService = new databaseBarrel_1.AdminService(db);
    const locationService = new databaseBarrel_1.LocationService(db);
    const patrolService = new databaseBarrel_1.PatrolService(db);
    const updateService = new databaseBarrel_1.UpdateService(db);
    if (resetDatabase) {
        console.log("Resetting database: Deleting all patrol updates");
        updateService.allPatrolUpdatesIds().forEach(id => updateService.deleteUpdate(id));
    }
    const server = new Server(address, port, assets, db, adminService, locationService, patrolService, updateService);
    [`exit`, `SIGINT`, `SIGUSR1`, `SIGUSR2`, `uncaughtException`, `SIGTERM`].forEach((eventType) => {
        process.on(eventType, server.cleanup.bind(null, eventType));
    });
}
main();
//# sourceMappingURL=server.js.map