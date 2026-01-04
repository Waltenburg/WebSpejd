import 'source-map-support/register';

import * as api from "./api";
import * as http from 'http'
import * as users from "./users";
import { Response, send as sendResponse } from "./response";
import * as pages from "./pages/pages";
import * as router from "./request";
import { UserType, Request } from './request';
import { Command } from 'commander';
import { inspect } from 'util';

// Database and data types
import { UpdateService, AdminService, PatrolService, LocationService, Database} from "./databaseBarrel";
import { PatrolUpdateWithNoId } from '@/shared/types';
import { SETTINGS_TABLE } from './database/tables';
import { Endpoints } from '@/shared/endpoints';
import { MandskabData, PatrolUpdateFromMandskab } from '@/shared/responseTypes';

import * as database from "./database/database";
import * as patrol from "./database/patrol";
import * as location from "./database/location";


const enum SETTINGS {
    NUMBER_OF_UPDATES_SEND_TO_CLIENT = 10,
    MAX_AGE_OF_UPDATE_THAT_CAN_BE_DELETED_BY_MANDSKAB = 30 * 1000, // Milliseconds
}

class Server {
    private db: Database;
    private adminService: AdminService;
    private locationService: LocationService;
    private patrolService: PatrolService;
    private updateService: UpdateService;

    private users: users.UserCache;
    private pages: pages.Pages;
    private router: router.Router;

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

        this.users = new users.UserCache();
        this.pages = new pages.Pages(`${assets}/html`, this.db, false,
            this.locationService, this.patrolService, this.updateService, this.adminService
        );
        this.router = this.createRouter(address, port, assets, this.users);

        const numberOfPosts = locationService.allLocationIds().length;
        const numberOfPatrols = patrolService.allPatrolIds().length;
        const numberOfUsers = adminService.userIds().length;
        console.log(`Alle filer succesfuldt loadet. Loadet ${numberOfPosts} poster, ${numberOfUsers} brugere og ${numberOfPatrols} patruljer`);

        http.createServer(async (req, connection) => {
            try{
                let response = await this.router.handleRequest(req);
                sendResponse(connection, response);
            }catch(e) {
                console.error(e);
                sendResponse(connection, Response.serverError());
            }
        })
            .listen(port, address, () => {
                console.log(`Server is now listening at http://${address}:${port}`);
            });
    }

    private createRouter(address: string, port: number, assets: string, users: users.UserCache): router.Router {
        return new router.Router(address, port, users)
            .assetDir("/assets", assets)
            .assetDir("/js", `${__dirname}/../client`)
            .file(Endpoints.Home, `${assets}/html/home.html`)
            .file(Endpoints.HomeAlias, `${assets}/html/home.html`)
            // .file("/plot", `${assets}/html/patruljePlot.html`)
            .file(Endpoints.Mandskab, `${assets}/html/mandskab.html`)
            .file(Endpoints.Contact, `${assets}/html/contact.html`)
            .file('/favicon.ico', `${assets}/favicon.ico`)
            .route(Endpoints.Login, UserType.None, this.login)
            .route(Endpoints.Logout, UserType.None, this.logout)
            .route(Endpoints.GetData, UserType.Post, this.locationDataForMandskab)
            .route(Endpoints.SendUpdate, UserType.Post, this.makePatrolUpdate)
            .route(Endpoints.DeleteCheckin, UserType.Post, this.mandskabDeleteUpdate)
            .route(Endpoints.Master, UserType.Master, this.pages.master)
            .route(Endpoints.MasterAddPatrolUpdatePage, UserType.Master, this.pages.patrolUpdatePage)
            .route(Endpoints.MasterAddPatrolUpdate, UserType.Master, this.makeMasterPatrolUpdate)
            .route(Endpoints.MasterPatrolUpdates, UserType.Master, this.pages.patrolUpdates)
            .route(Endpoints.MasterPosts, UserType.Master, this.pages.locations)
            .route(Endpoints.MasterPost, UserType.Master, this.pages.location)
            .route(Endpoints.MasterPatrols, UserType.Master, this.pages.patrols)
            .route(Endpoints.MasterPatrol, UserType.Master, this.pages.patrol)
            .route(Endpoints.MasterPatrolStatus, UserType.Master, this.patrolStatus)
            .route(Endpoints.MasterDeletePatrolUpdate, UserType.Master, this.masterDeletePatrolUpdate)
            .route(Endpoints.MasterPostStatus, UserType.Master, this.postStatus)
            .route(Endpoints.MasterHeartbeat, UserType.Master, async () => Response.ok());
    }

    /**
     * Cleanup server.
     *
     * @param options ?
     * @param event the event that caused the cleanup
     */
    cleanup(_options:any, event:string) {
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
        if(locationId === undefined) {
            return Response.unauthorized();
        }
        const user = this.users.addUser(identifier, locationId);
        return Response.ok()
            .setHeader("isMaster", user.isMasterUser.toString())
    }

    logout = async (_request: Request): Promise<Response> => {
        return Response.redirect("/")
            .setHeader("Set-Cookie", "identifier=deleted; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT");
    }

    // TODO: Update to work with new location routing
    /**
     * Get information about post.
     */
    locationDataForMandskab = async (req: Request): Promise<Response> => {
        const user = req.user;

        const locationOfUser = this.locationService.locationInfo(user.locationId);
        if(locationOfUser === undefined) {
            return Response.notFound()
                .setContent(`post ${user.locationId} not found`);
        }

        let towardsLocation = this.locationService.patrolsTowardsLocation(user.locationId);

        // if the location is the first location, include patrols that have no patrol update yet
        if(locationOfUser.id === Number.parseInt(this.adminService.settings[SETTINGS_TABLE.SETTING_FIRST_LOCATION_ID])) {
            const patrolsWithNoUpdates = this.patrolService.allPatrolsWithNoUpdates();
            towardsLocation = towardsLocation.concat(patrolsWithNoUpdates);
        }

        const onLocation = this.locationService.patrolsOnLocation(user.locationId);
        const routesFromLocation = this.locationService.allRoutesFromLocation(user.locationId);
        const locationsFromRoutes = routesFromLocation.map(route => location.getLocation(this.db, route.toLocationId));
        const latestUpdates = this.updateService.updatesAtLocation(user.locationId, SETTINGS.NUMBER_OF_UPDATES_SEND_TO_CLIENT)
        .map(update => {
            return {
                ...update,
                patrol: patrol.getPatrol(this.db, update.patrolId),
                targetLocationName: this.locationService.locationInfo(update.targetLocationId)?.name || "Ukendt destination"
            };
        });

        const data: MandskabData = {
            patrolsOnLocation: onLocation.map(p => this.patrolService.patrolInfo(p)),
            patrolsTowardsLocation: towardsLocation.map(p => this.patrolService.patrolInfo(p)),
            location: locationOfUser,
            routesTo: locationsFromRoutes,
            latestUpdates: latestUpdates
        };

        return Response.ok()
            .setHeader("data", JSON.stringify(data))
    }

    tryGet<In, Out> (input: In, map: (input: In) => Out | undefined, errorHandler?: (error: Error) => void): Out | undefined {
        try {
            const result = map(input);
            return result;
        } catch (error: any) {
            if(errorHandler === undefined) {
                return undefined;
            }
            errorHandler(error);
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

        if(!update) {
            return new Response(400);
        }

        const checkin: PatrolUpdateWithNoId = {
            time: new Date(),
            patrolId: update.patrolId,
            currentLocationId: user.locationId,
            targetLocationId: update.targetLocationId
        };

        const thisIsFirstLocation = user.locationId === Number.parseInt(this.adminService.settings[SETTINGS_TABLE.SETTING_FIRST_LOCATION_ID]);
        if(!this.updateService.isPatrolUpdateValid(checkin, true, true, thisIsFirstLocation)) {
            return new Response(400);
        }

        const checkinID = this.updateService.updatePatrol(checkin);

        // Send id back to client
        return Response.ok()
            .setHeader("checkinID", checkinID.toString());
    }

    makeMasterPatrolUpdate = async (request: Request): Promise<Response> => {
        const formData = request.body.split("&").map(pair => pair.split("=")).reduce((acc, [key, value]) => {
            acc[decodeURIComponent(key)] = decodeURIComponent(value);
            return acc;
        }, {} as { [key: string]: string });

        let patrolUpdate: PatrolUpdateWithNoId = {
            time: new Date(),
            patrolId: Number.parseInt(formData['patrol']),
            currentLocationId: 0,
            targetLocationId: 0
        }

        const type = formData['type']; // "checkin" or "checkout"
        if(type === 'checkin') {
            const locationId = Number.parseInt(formData['singleLocation']);
            patrolUpdate.currentLocationId = locationId;
            patrolUpdate.targetLocationId = locationId;
        } else if(type === 'checkout') {
            const fromLocationId = Number.parseInt(formData['fromLocation']);
            const toLocationId = Number.parseInt(formData['toLocation']);
            patrolUpdate.currentLocationId = fromLocationId;
            patrolUpdate.targetLocationId = toLocationId;
        } else {
            return new Response(400);
        }


        // This checkin is made by an admin, so we skip route validation and
        // current equals target check. Also, we allow the target to be the
        // first location.
        if(!this.updateService.isPatrolUpdateValid(patrolUpdate, false, false, true)) {
            console.error("Invalid patrol update in masterCheckin:", patrolUpdate);
            return new Response(400);
        }

        this.updateService.updatePatrol(patrolUpdate);

        return Response.redirect("/master");
    }


    postStatus = async(request: Request): Promise<Response> => {
        return await api.postStatus(this.db, request);
    }

    patrolStatus = async (request: Request): Promise<Response> => {
        return await api.patrolStatus(this.db, request);
    }

    masterDeletePatrolUpdate = async (request: Request): Promise<Response> => {
        return await api.masterDeletePatrolUpdate(this.db, request);
    }

    mandskabDeleteUpdate = async (request: Request): Promise<Response> => {
        return await api.mandskabDeleteUpdate(this.db, request);
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
            // "127.0.0.1"
            "192.168.1.138"
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
    const databasePath = options["database"] as string;
    const assetsDir = options["assets"] as string;
    const inMemory = options["databaseInMemory"] === true;
    const resetDatabase = options["resetDatabase"] === true;

    console.log(`Starting server with options: ${inspect(
        {
            address: address,
            port: port,
            database: databasePath,
            assets: assetsDir,
            inMemory: inMemory,
            resetDatabase: resetDatabase
        },
        { colors: true, depth: null })}`);

    let db;
    const schemaPath = `${assetsDir}/sql/databaseSchema.sql`;
    if(inMemory) {
        db = Database.createInMemoryDatabase(schemaPath);
    } else {
        db = new Database(databasePath, schemaPath);
    }
    if(resetDatabase) {
        database.resetCheckins(db);
    }
    const adminService = new AdminService(db);
    const locationService = new LocationService(db);
    const patrolService = new PatrolService(db);
    const updateService = new UpdateService(db);

    const server = new Server(address, port, assetsDir, db,
        adminService, locationService, patrolService, updateService
    );

    [`exit`, `SIGINT`, `SIGUSR1`, `SIGUSR2`, `uncaughtException`, `SIGTERM`].forEach((eventType) => {
        process.on(eventType, server.cleanup.bind(null, eventType));
    })
}

main();
