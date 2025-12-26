import 'source-map-support/register';

import * as http from 'http'
import * as users from "./users";
import * as responses from "./response";
import * as pages from "./pages";
import * as router from "./request";
import { UserType, Request } from './request';
import { Command } from 'commander';
import { inspect } from 'util';

// Database and data types
import { UpdateService, AdminService, PatrolService, LocationService, ServiceBase, Database} from "./databaseBarrel";
import { PatrolUpdate } from './database/types';
import { SETTINGS_TABLE } from './database/database';


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
            .assetDir("/js", `${__dirname}/clientFiles`)
            .file("/", `${assets}/html/home.html`)
            .file("/home", `${assets}/html/home.html`)
            .file("/plot", `${assets}/html/patruljePlot.html`)
            .file("/mandskab", `${assets}/html/mandskab.html`)
            .route("/login", UserType.None, this.login)
            .route("/logout", UserType.None, this.logout)
            .route("/getUpdate", UserType.Post, this.postUpdate)
            .route("/getData", UserType.Post, this.postData)
            .route("/sendUpdate", UserType.Post, this.makePatrolUpdate)
            .route("/deleteCheckin", UserType.Post, this.mandskabDeleteCheckin)
            .route("/master", UserType.Master, this.pages.master)
            .route("/master/checkin", UserType.Master, this.pages.checkin)
            .route("/master/addcheckin", UserType.Master, this.makeMasterPatrolUpdate)
            .route("/master/checkins", UserType.Master, this.pages.checkins)
            .route("/master/posts", UserType.Master, this.pages.posts)
            .route("/master/post", UserType.Master, this.pages.post)
            .route("/master/patrols", UserType.Master, this.pages.patrols)
            .route("/master/patrol", UserType.Master, this.pages.patrol)
            .route("/master/patrolStatus", UserType.Master, this.patrolStatus)
            .route("/master/deleteCheckin", UserType.Master, this.deleteCheckin)
            .route("/master/graph", UserType.Master, this.pages.graph)
            .route("/master/postStatus", UserType.Master, this.postStatus);
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

    /**
     * Get updated information about post.
     */
    postUpdate = async (req: Request): Promise<Response> => {
        const user = req.user;

        const userLastUpdate = parseInt(req.headers['last-update'] as string)
        const post = this.locationService.locationInfo(user.locationId);
        if(post === undefined) {
            return responses.not_found();
        }

        //Der er kommet ny update siden sidst klienten spurgte
        // const postLastUpdate = post.lastUpdate.getTime();
        if(true){
        //if(userLastUpdate < postLastUpdate){
            let response = await this.postData(req);
            if(response.headers) {
                response.headers.update = "true";
            }
            return response;
        } /* else{
            return responses.ok(null, { "update": "false" });
        } */
    }

    // TODO: Update to work with new location routing
    /**
     * Get information about post.
     */
    postData = async (req: Request): Promise<Response> => {
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


        return responses.ok("", {
            data: JSON.stringify({
                onLocation: this.locationService.patrolsOnLocation(user.locationId),
                towardsLocation: towardsLocation,
                locationName: location.name,
                routes: this.locationService.allRoutesFromLocation(user.locationId)
            })
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
        const update = request.headers['update'] //{PatolId}%{targetLocationID}

        const updateVals = this.tryGet<string, number[]>(update,
            (upd) => upd.split('%').map((str) => Number.parseInt(str)),
            (err) => console.error("Error parsing update string:", err)
        ) as readonly number[] | undefined;

        if(!updateVals || updateVals.length !== 2 || updateVals.some(v => !Number.isInteger(v))) {
            console.error("Invalid update format:", update);
            return responses.server_error();
        }

        const checkin: PatrolUpdate = {
            time: new Date(),
            patrolId: updateVals[0],
            currentLocationId: user.locationId,
            targetLocationId: updateVals[1]
        };

        if(!this.updateService.isPatrolUpdateValid(checkin)) {
            return responses.response_code(400);
        }

        const checkinID = this.updateService.updatePatrol(checkin);

        //Send id back to client
        return responses.ok("", {
            "checkinID": checkinID
        });

    }

    makeMasterPatrolUpdate = async (request: Request): Promise<Response> => {
        const params = request.url.searchParams;

        const updateVals = this.tryGet<string[], number[]>([
            'patrol',
            'currentLocationId',
            'targetLocationId' ],
        (strs) => strs.map((str) => Number.parseInt(params.get(str) as string)),
        (err) => console.error("Error parsing master patrol update parameters:", err)
        ) as readonly number[] | undefined;

        if(!updateVals || updateVals.length !== 2 || updateVals.some(v => !Number.isInteger(v))) {
            console.error("Invalid update format in masterCheckin:", updateVals);
            return responses.server_error();
        }

        const checkin: PatrolUpdate = {
            time: new Date(),
            patrolId: updateVals[0],
            currentLocationId: updateVals[1],
            targetLocationId: updateVals[2],
        };

        if(!this.updateService.isPatrolUpdateValid(checkin, {skipRouteValidation: true})) {
            console.error("Invalid patrol update in masterCheckin:", checkin);
            return responses.response_code(400);
        }

        this.updateService.updatePatrol(checkin);

        return responses.redirect("/master");
    }


    postStatus = async(request: Request): Promise<Response> => {
        const params = request.url.searchParams;
        const statusParam = params.get("status");
        const locationId = Number.parseInt(params.get("post"));
        const newStatus = statusParam === "open";

        this.locationService.changeLocationStatus(locationId, newStatus);
        return responses.redirect(`/master/post?id=${locationId}`);
    }


    patrolStatus = async (request: Request): Promise<Response> => {
        const params = request.url.searchParams;
        const patrolId = Number.parseInt(params.get("patrolId"));
        const status = params.get("status");
        const isOut = status === "out";
        this.patrolService.changePatrolStatus(patrolId, isOut);
        return responses.redirect(`/master/patrol?id=${patrolId}`);
    }

    deleteCheckin = async (request: Request): Promise<Response> => {
        const params = request.url.searchParams;
        const checkinId = Number.parseInt(params.get("id"));
        this.updateService.deleteUpdate(checkinId);
        return responses.ok();
    }

    // TODO: Update to work with new PatrolUpdate structure
    mandskabDeleteCheckin = async (request: Request): Promise<Response> => {
        const timeToUndo = 1000 * 20; // 20 seconds

        const params = request.url.searchParams;
        const checkinId = Number.parseInt(params.get("id"));
        const checkin = this.updateService.updateById(checkinId);
        const locationIdAtCheckin = checkin?.currentLocationId;

        const requestAndCheckinMatch = locationIdAtCheckin == request.user.locationId && locationIdAtCheckin != null;
        const checkinIsRecent = checkin?.time.getTime() > Date.now() - timeToUndo;

        if(requestAndCheckinMatch && checkinIsRecent) {
            this.updateService.deleteUpdate(checkinId);
            return responses.ok();
        }
        return responses.forbidden();
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
            "127.0.0.1"
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

    const server = new Server(address, port, assets, db,
        adminService, locationService, patrolService, updateService
    );

    [`exit`, `SIGINT`, `SIGUSR1`, `SIGUSR2`, `uncaughtException`, `SIGTERM`].forEach((eventType) => {
        process.on(eventType, server.cleanup.bind(null, eventType));
    })
}

main();