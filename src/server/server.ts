import 'source-map-support/register';

import * as http from 'http'

// ====== ENDPOINTS ======
import { Endpoints } from '@shared/endpoints';

// ====== Core server components ======
import { User, UserType, UserCache } from './users';
import { Router, parseForm, Request } from "./request";
import { UpdateService, AdminService, PatrolService, LocationService, Database } from "./databaseBarrel";
import * as responses from "./response";

// ====== Utilities ======
import { Command } from 'commander';
import { inspect } from 'util';

// ====== Pages and HTML generation ======
import * as pages from "./endpointHandlers/pages";
import * as LocationConfigHandler from './endpointHandlers/LocationConfigHandler';
import * as LocationStatusHandler from './endpointHandlers/locationStatusHandler';
import * as RouteConfigHandler from './endpointHandlers/RouteConfigHandler';
import * as PatrolStatusHandler from './endpointHandlers/patrolStatusHandler';
import * as PatrolUpdatesHandler from './endpointHandlers/patrolUpdatesHandler';
import * as PatrolConfigHandler from './endpointHandlers/patrolConfigHandler';
import * as LocationPasswordHandler from './endpointHandlers/locationPasswordHandler';

// ========== Miscenlaneous Types ========== 
import type { PatrolUpdate, PatrolUpdateWithNoId, Route} from '@shared/types';
import type { MandskabData, PatrolUpdateFromMandskab } from '@shared/responseTypes';
import { SETTINGS_TABLE } from './database/database';


export type { Server };

const enum SETTINGS {
    NUMBER_OF_UPDATES_SEND_TO_CLIENT = 10,
    MAX_AGE_OF_UPDATE_THAT_CAN_BE_DELETED_BY_MANDSKAB = 30 * 1000, // Milliseconds
}

type Response = responses.Response;

class Server {
    private db: Database;
    private adminService: AdminService;
    private locationService: LocationService;
    private patrolService: PatrolService;
    private updateService: UpdateService;

    private users: UserCache;
    private router: Router;

    /**
     * Create new server.
    */
    constructor(address: string, port: number, assets: string,
        db: Database, adminService: AdminService,
        locationService: LocationService, patrolService: PatrolService,
        updateService: UpdateService) {

        this.db = db;
        this.adminService = adminService;
        this.locationService = locationService;
        this.patrolService = patrolService;
        this.updateService = updateService;

        this.users = new UserCache();
        this.router = this.createRouter(address, port, assets, this.users);

        const numberOfPosts = locationService.allLocationIds().length;
        const numberOfPatrols = patrolService.allPatrolIds().length;
        const numberOfUsers = adminService.userIds().length;
        console.log(`Alle filer succesfuldt loadet. Loadet ${numberOfPosts} poster, ${numberOfUsers} brugere og ${numberOfPatrols} patruljer`);

        http.createServer(async (req, connection) => {
            try {
                // let timeStart = Date.now();
                let response = await this.router.handleRequest(req);
                responses.send(connection, response);
                // let timeEnd = Date.now();
                // console.log(`Request to ${req.url} took ${timeEnd - timeStart} ms`);
            } catch (e) {
                console.error(e);
                responses.send(connection, responses.server_error());
            }
        })
            .listen(port, address, () => {
                console.log(`Server is now listening at http://${address}:${port}`);
            });
    }

    private createRouter(address: string, port: number, assets: string, users: UserCache): Router {
        return new Router(address, port, users)
            // ================================ Asset and script directories ==================================
            .assetDir("/assets", assets)
            .assetDir("/js", `${__dirname}/../client`)

            // ================================ Static File Endpoints ==================================
            .file(Endpoints.Home, `${assets}/html/home.html`)
            .file(Endpoints.HomeAlias, `${assets}/html/home.html`)
            .file(Endpoints.Mandskab, `${assets}/html/mandskab.html`)
            .file(Endpoints.Contact, `${assets}/html/contact.html`)
            .file('/favicon.ico', `${assets}/favicon.ico`)

            // ================================ Authentication Endpoints ==================================
            .route(Endpoints.Login, UserType.None, this.login)
            .route(Endpoints.Logout, UserType.None, this.logout)
            
            // ================================ Mandskab Endpoints ==================================
            .route(Endpoints.MandskabDeletePatrolUpdate, UserType.Post, this.mandskabDeleteUpdate)
            .route(Endpoints.MandskabSendPatrolUpdate, UserType.Post, this.makePatrolUpdate)
            .route(Endpoints.GetMandskabData, UserType.Post, this.locationDataForMandskab)
            
            // ================================ Master Pages Endpoints ==================================
            .route(Endpoints.MainMasterPage, UserType.Master, pages.mainMasterPage, this.locationService, this.updateService, this.patrolService)
            .route(Endpoints.LocationRouteConfigPage, UserType.Master, pages.locatonAndRouteConfigPage, this.locationService, this.updateService, this.patrolService)
            .route(Endpoints.PatrolConfigPage, UserType.Master, pages.patrolConfigPage, this.patrolService)
            .route(Endpoints.MasterPatrolPage, UserType.Master, pages.patrolPage, this.patrolService, this.locationService, this.updateService)
            .route(Endpoints.MasterAddPatrolUpdatePage, UserType.Master, pages.addPatrolUpdatePage, this.patrolService, this.locationService)
            .route(Endpoints.MasterHeartbeat, UserType.Master, async () => responses.ok())
            
            // ================================ Route Config Endpoints ================================
            .route(Endpoints.AddRoute, UserType.Master, RouteConfigHandler.addRoute, this.locationService)
            .route(Endpoints.DeleteRoute, UserType.Master, RouteConfigHandler.deleteRoute, this.locationService)
            .route(Endpoints.ChangeRouteStatus, UserType.Master, RouteConfigHandler.changeRouteStatus, this.locationService)
            .route(Endpoints.GetRouteTableRow, UserType.Master, RouteConfigHandler.getRouteConfigTableRow, this.locationService)
            .route(Endpoints.GetRoutesTable, UserType.Master, RouteConfigHandler.getRouteConfigTable, this.locationService)
            
            // ================================ Patrol Update Endpoints ================================
            .route(Endpoints.GetPatrolUpdatesTable, UserType.Master, PatrolUpdatesHandler.getPatrolUpdatesTable, this.updateService, this.locationService, this.patrolService)
            .route(Endpoints.DeletePatrolUpdate, UserType.Master, this.masterDeletePatrolUpdate)
            .route(Endpoints.AddPatrolUpdate, UserType.Master, this.makeMasterPatrolUpdate)
            
            // ================================ Patrol Status Endpoints ================================
            .route(Endpoints.GetPatrolStatusTable, UserType.Master, PatrolStatusHandler.getPatrolStatusTable, this.locationService, this.patrolService, this.updateService)
            .route(Endpoints.ChangePatrolStatus, UserType.Master, PatrolConfigHandler.changePatrolStatus, this.patrolService)


            // ================================= Patrol config Endpoints ================================
            .route(Endpoints.AddPatrol, UserType.Master, PatrolConfigHandler.addPatrol, this.patrolService)
            .route(Endpoints.DeletePatrol, UserType.Master, PatrolConfigHandler.deletePatrol, this.patrolService)
            .route(Endpoints.AlterPatrol, UserType.Master, PatrolConfigHandler.alterPatrolNumberAndName, this.patrolService)
            .route(Endpoints.GetPatrolConfigTable, UserType.Master, PatrolConfigHandler.getPatrolConfigTable, this.patrolService)
            .route(Endpoints.GetPatrolConfigTableBody, UserType.Master, PatrolConfigHandler.getPatrolConfigTableBody, this.patrolService)
            .route(Endpoints.GetPatrolConfigTableRow, UserType.Master, PatrolConfigHandler.getPatrolConfigTableRow, this.patrolService)
            .route(Endpoints.GetPatrolConfigTableRenameRow, UserType.Master, PatrolConfigHandler.getRenamePatrolRow, this.patrolService)
            /** TODO
             * ADD patrol + row for it
             * DELETE patrol
             * RENAME patrol + row for it
             * 
             *  */ 

            // ================================ Location Status Endpoints ================================
            .route(Endpoints.GetLocationStatusTable, UserType.Master, LocationStatusHandler.getLocationStatusTable, this.locationService)

            // ================================ Location Config Endpoints ============================
            .route(Endpoints.AddLocation, UserType.Master, LocationConfigHandler.addLocation, this.locationService)
            .route(Endpoints.DeleteLocation, UserType.Master, LocationConfigHandler.deleteLocation, this.locationService)
            .route(Endpoints.ChangeLocationStatus, UserType.Master, LocationConfigHandler.changeLocationStatus, this.locationService)
            .route(Endpoints.RenameLocation, UserType.Master, LocationConfigHandler.renameLocation, this.locationService)
            .route(Endpoints.GetLocationConfigTableRow, UserType.Master, LocationConfigHandler.getLocationConfigTableRow, this.locationService)
            .route(Endpoints.GetLocationConfigTable, UserType.Master, LocationConfigHandler.getLocationConfigTable, this.locationService)
            .route(Endpoints.GetLocationConfigTableBody, UserType.Master, LocationConfigHandler.getLocationConfigTableBody, this.locationService)
            .route(Endpoints.GetRenameLocationRow, UserType.Master, LocationConfigHandler.getRenameLocationRow, this.locationService)

            // =============================== Location password Endpoints ================================
            .route(Endpoints.GetLocationPasswords, UserType.Master, LocationPasswordHandler.getLocationPasswords, this.adminService, this.locationService)
            .route(Endpoints.AddLocationPassword, UserType.Master, LocationPasswordHandler.addLocationPassword, this.adminService)
            .route(Endpoints.DeleteLocationPassword, UserType.Master, LocationPasswordHandler.deleteLocationPassword, this.adminService)


    }

    /**
     * Cleanup server.
     *
     * @param options ?
     * @param event the event that caused the cleanup
     */
    cleanup(_options: any, event: string) {
        console.log("Program exiting with code: " + event);
        console.log(event);
        process.exit()
    };

    /**
     * Handle login request.
     */
    login = async (req: Request): Promise<Response> => {
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
    }

    logout = async (_request: Request): Promise<Response> => {
        let response = responses.redirect("/");
        response.headers["Set-Cookie"] = "identifier=deleted; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        return response;
    }

    // TODO: Update to work with new location routing
    /**
     * Get information about post.
     */
    locationDataForMandskab = async (req: Request): Promise<Response> => {
        const user = req.user;

        const location = this.locationService.locationInfo(user.locationId);
        if (location === undefined)
            return responses.not_found(`post ${user.locationId} not found`);

        let towardsLocation = this.locationService.patrolsTowardsLocation(user.locationId);

        // if the location is the first location, include patrols that have no patrol update yet
        if (location.id === Number.parseInt(this.adminService.settings[SETTINGS_TABLE.SETTING_FIRST_LOCATION_ID])) {
            const patrolsWithNoUpdates = this.patrolService.allPatrolsWithNoUpdates();
            towardsLocation = towardsLocation.concat(patrolsWithNoUpdates);
        }

        const onLocation = this.locationService.patrolsOnLocation(user.locationId);
        const routesFromLocation = this.locationService.allRoutesFromLocation(user.locationId)
        const openRoutes = routesFromLocation.filter(route => route.is_open);
        const nextLocations = openRoutes.map(route => this.locationService.locationInfo(route.toLocationId));
        const latestUpdates = this.updateService.updatesAtLocation(user.locationId, SETTINGS.NUMBER_OF_UPDATES_SEND_TO_CLIENT)
            .map(update => {
                return {
                    ...update,
                    patrol: this.patrolService.patrolInfo(update.patrolId),
                    targetLocationName: this.locationService.locationInfo(update.targetLocationId)?.name || "Ukendt destination"
                };
            });

        const data: MandskabData = {
            patrolsOnLocation: onLocation.map(p => this.patrolService.patrolInfo(p)),
            patrolsTowardsLocation: towardsLocation.map(p => this.patrolService.patrolInfo(p)),
            location: location,
            routesTo: nextLocations,
            latestUpdates: latestUpdates

        };

        return responses.ok("", {
            data: JSON.stringify(data)
        });
    }



    tryGet<In, Out>(input: In, map: (input: In) => Out | undefined, errorHandler?: (error: Error) => void): Out | undefined {
        try {
            const result = map(input);
            return result;
        } catch (error) {
            if (errorHandler) {
                errorHandler(error);
            }
            return undefined;
        }
    }

    /**
     * End point for checking in or out at a location
     *
     * @param req the http request
     * @return Promise of a response to send to client
     */
    makePatrolUpdate = async (request: Request): Promise<Response> => {
        const user = request.user;
        const updateHeader = request.headers['update'] //{PatolId}%{targetLocationID}

        const update = this.tryGet<string, PatrolUpdateFromMandskab>(updateHeader,
            (upd) => JSON.parse(upd) as PatrolUpdateFromMandskab,
            (err) => console.error("Error parsing update string:", err)
        ) as PatrolUpdateFromMandskab | undefined;

        if (!update)
            return responses.response_code(400);

        const checkin: PatrolUpdateWithNoId = {
            time: new Date(),
            patrolId: update.patrolId,
            currentLocationId: user.locationId,
            targetLocationId: update.targetLocationId
        };

        const thisIsFirstLocation = user.locationId === Number.parseInt(this.adminService.settings[SETTINGS_TABLE.SETTING_FIRST_LOCATION_ID]);
        if (!this.updateService.isPatrolUpdateValid(checkin, true, true, thisIsFirstLocation)) {
            return responses.response_code(400);
        }

        const checkinID = this.updateService.updatePatrol(checkin);

        //Send id back to client
        return responses.ok("", {
            "checkinID": checkinID
        });

    }

    makeMasterPatrolUpdate = async (request: Request): Promise<Response> => {
        const formData = parseForm(request.body);
        const dateStr = formData['date']; // "YYYY-MM-DD"
        const timeStr = formData['time']; // "HH:MM"

        let patrolUpdate: PatrolUpdateWithNoId = {
            time: new Date(dateStr + "T" + timeStr + ":00"),
            patrolId: Number.parseInt(formData['patrol']),
            currentLocationId: 0,
            targetLocationId: 0
        }

        const type = formData['type']; // "checkin" or "checkout"
        if (type === 'checkin') {
            const locationId = Number.parseInt(formData['singleLocation']);
            patrolUpdate.currentLocationId = locationId;
            patrolUpdate.targetLocationId = locationId;
        } else if (type === 'checkout') {
            const fromLocationId = Number.parseInt(formData['fromLocation']);
            const toLocationId = Number.parseInt(formData['toLocation']);
            patrolUpdate.currentLocationId = fromLocationId;
            patrolUpdate.targetLocationId = toLocationId;
        } else {
            return responses.response_code(400);
        }


        // This checkin is made by an admin, so we skip route validation and current equals target check. Also, we allow the target to be the first location.
        if (!this.updateService.isPatrolUpdateValid(patrolUpdate, false, false, true)) {
            console.error("Invalid patrol update in masterCheckin:", patrolUpdate);
            return responses.response_code(400);
        }

        this.updateService.updatePatrolWithTime(patrolUpdate);

        return responses.ok();
    }




    masterDeletePatrolUpdate = async (request: Request): Promise<Response> => {
        const form = parseForm(request.body);
        const updateId = Number.parseInt(form["patrolUpdateId"]);
        const succes = this.updateService.deleteUpdate(updateId);
        if (!succes) {
            return responses.not_found("Patrol update not found");
        }
        return responses.ok();
    }

    mandskabDeleteUpdate = async (request: Request): Promise<Response> => {
        const params = request.url.searchParams;
        const checkinId = Number.parseInt(params.get("patrolUpdateId"));
        const checkin = this.updateService.updateById(checkinId);
        const locationIdAtCheckin = checkin?.currentLocationId;

        const requestAndCheckinMatch = locationIdAtCheckin === request.user.locationId && locationIdAtCheckin != null;
        const checkinIsRecent = checkin?.time.getTime() > Date.now() - SETTINGS.MAX_AGE_OF_UPDATE_THAT_CAN_BE_DELETED_BY_MANDSKAB;

        if (requestAndCheckinMatch && checkinIsRecent) {
            this.updateService.deleteUpdate(checkinId);
            return responses.ok();
        }
        return responses.forbidden();
    }

    masterHeartbeat = async (_request: Request): Promise<Response> => {
        return responses.ok();
    }

}

/**
 * Read command line arguments to get address and port.
 * @return binding address and port
 */
const readArguments = (): Command => {
    let command = new Command()
        .option(
            "-a, --address <address>",
            "Address the server is hosted on",
            // "10.209.229.186"
            "127.0.0.1"
            // "192.168.128.1"
            // "192.168.1.138"
            // "10.34.158.253"
        )
        .option(
            "-p, --port <port>",
            "Port the server is listening on",
            "3000"
        )
        .option(
            "--assets <assets>",
            "Assets file directory",
            `assets`
        )
        .option(
            "--db, --database <file>",
            "File to store data in",
            "SQLite/webspejd.db"
        )
        .option(
            "--databaseInMemory", //Boolean flag
            "Whether to save the database or keep it in memory",
        )
        .option(
            "--resetDatabase", //Boolean flag
            "Whether to start all patrols at first post"
        );
    command.parse();
    return command;
};


async function main(): Promise<void> {
    const command = readArguments();
    const options = command.opts();
    const port = Number.parseInt(options["port"]);
    const address = options["address"] as string;
    const database = options["database"] as string;
    const assets = options["assets"] as string;
    const inMemory = options["databaseInMemory"] === true;
    const resetDatabase = options["resetDatabase"] === true;

    console.log(`Starting server with options: ${inspect(
        {
            address: address,
            port: port,
            database: database,
            assets: assets,
            inMemory: inMemory,
            resetDatabase: resetDatabase
        },
        { colors: true, depth: null })}`);

    //Be aware that different databases have different indices for the first post
    //In SQLite the first post is 1, in JSON it is 0
    //This is changed in the database wrapper field firstPostId
    const db = new Database(database, inMemory, resetDatabase);
    const adminService = new AdminService(db);
    const locationService = new LocationService(db);
    const patrolService = new PatrolService(db);
    const updateService = new UpdateService(db);

    if (resetDatabase) {
        console.log("Resetting database: Deleting all patrol updates");
        updateService.allPatrolUpdatesIds().forEach(id => updateService.deleteUpdate(id));
    }

    const server = new Server(address, port, assets, db,
        adminService, locationService, patrolService, updateService
    );

    [`exit`, `SIGINT`, `SIGUSR1`, `SIGUSR2`, `uncaughtException`, `SIGTERM`].forEach((eventType) => {
        process.on(eventType, server.cleanup.bind(null, eventType));
    })
}

main();