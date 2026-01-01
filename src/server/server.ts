import 'source-map-support/register';

import * as http from 'http'
import * as users from "./users";
import * as responses from "./response";
import * as pages from "./pages/pages";
import * as router from "./request";
import { UserType, Request } from './request';
import { Command } from 'commander';
import { inspect } from 'util';

// Database and data types
import { UpdateService, AdminService, PatrolService, LocationService, Database} from "./databaseBarrel";
import { PatrolUpdate, PatrolUpdateWithNoId } from '@shared/types';
import { SETTINGS_TABLE } from './database/database';
import { Endpoints } from '@shared/endpoints';
import { MandskabData, PatrolUpdateFromMandskab } from '@shared/responseTypes';


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
                responses.send(connection, response);
            }catch(e) {
                console.error(e);
                responses.send(connection, responses.server_error());
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
            .route(Endpoints.MasterHeartbeat, UserType.Master, async () => responses.ok());
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
            return responses.unauthorized();
        }
        const user = this.users.addUser(identifier, locationId);
        return responses.ok(null, {
            "isMaster": user.isMasterUser()
        });
    }

    logout = async (_request: Request): Promise<Response> => {
        let response = responses.redirect("/");
        response.headers["Set-Cookie"] =  "identifier=deleted; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        return response;
    }

    // TODO: Update to work with new location routing
    /**
     * Get information about post.
     */
    locationDataForMandskab = async (req: Request): Promise<Response> => {
        const user = req.user;

        const location = this.locationService.locationInfo(user.locationId);
        if(location === undefined)
            return responses.not_found(`post ${user.locationId} not found`);

        let towardsLocation = this.locationService.patrolsTowardsLocation(user.locationId);

        // if the location is the first location, include patrols that have no patrol update yet
        if(location.id === Number.parseInt(this.adminService.settings[SETTINGS_TABLE.SETTING_FIRST_LOCATION_ID])) {
            const patrolsWithNoUpdates = this.patrolService.allPatrolsWithNoUpdates();
            towardsLocation = towardsLocation.concat(patrolsWithNoUpdates);
        }

        const onLocation = this.locationService.patrolsOnLocation(user.locationId);
        const routesFromLocation = this.locationService.allRoutesFromLocation(user.locationId);
        const locationsFromRoutes = routesFromLocation.map(route => this.locationService.locationInfo(route.toLocationId));
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
            routesTo: locationsFromRoutes,
            latestUpdates: latestUpdates

        };

        return responses.ok("", {
            data: JSON.stringify(data)
        });
    }

    

    tryGet<In, Out> (input: In, map: (input: In) => Out | undefined, errorHandler?: (error: Error) => void): Out | undefined {
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
        
        if(!update)
            return responses.response_code(400);

        const checkin: PatrolUpdateWithNoId = {
            time: new Date(),
            patrolId: update.patrolId,
            currentLocationId: user.locationId,
            targetLocationId: update.targetLocationId
        };

        const thisIsFirstLocation = user.locationId === Number.parseInt(this.adminService.settings[SETTINGS_TABLE.SETTING_FIRST_LOCATION_ID]);
        if(!this.updateService.isPatrolUpdateValid(checkin, true, true, thisIsFirstLocation)) {
            return responses.response_code(400);
        }

        const checkinID = this.updateService.updatePatrol(checkin);

        //Send id back to client
        return responses.ok("", {
            "checkinID": checkinID
        });

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
            return responses.response_code(400);
        }


        // This checkin is made by an admin, so we skip route validation and current equals target check. Also, we allow the target to be the first location.
        if(!this.updateService.isPatrolUpdateValid(patrolUpdate, false, false, true)) {
            console.error("Invalid patrol update in masterCheckin:", patrolUpdate);
            return responses.response_code(400);
        }

        this.updateService.updatePatrol(patrolUpdate);

        return responses.redirect("/master");
    }


    postStatus = async(request: Request): Promise<Response> => {
        const params = request.url.searchParams;
        const statusParam = params.get("status");
        const locationId = Number.parseInt(params.get("post"));
        const newStatus = statusParam === "open";

        this.locationService.changeLocationStatus(locationId, newStatus);
        return responses.redirect(`${Endpoints.MasterPostStatus}?id=${locationId}`);
    }


    patrolStatus = async (request: Request): Promise<Response> => {
        const params = request.url.searchParams;
        const patrolId = Number.parseInt(params.get("patrolId"));
        const status = params.get("status");
        const isOut = status === "out";
        this.patrolService.changePatrolStatus(patrolId, isOut);
        return responses.redirect(`/master/patrol?id=${patrolId}`);
    }

    masterDeletePatrolUpdate = async (request: Request): Promise<Response> => {
        const params = request.url.searchParams;
        const updateId = Number.parseInt(params.get("id"));
        this.updateService.deleteUpdate(updateId);
        return responses.ok();
    }

    mandskabDeleteUpdate = async (request: Request): Promise<Response> => {
        const params = request.url.searchParams;
        const checkinId = Number.parseInt(params.get("id"));
        const checkin = this.updateService.updateById(checkinId);
        const locationIdAtCheckin = checkin?.currentLocationId;

        const requestAndCheckinMatch = locationIdAtCheckin === request.user.locationId && locationIdAtCheckin != null;
        const checkinIsRecent = checkin?.time.getTime() > Date.now() - SETTINGS.MAX_AGE_OF_UPDATE_THAT_CAN_BE_DELETED_BY_MANDSKAB;

        if(requestAndCheckinMatch && checkinIsRecent) {
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

    if(resetDatabase){
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