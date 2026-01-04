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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
require("source-map-support/register");
const api = __importStar(require("./api"));
const http = __importStar(require("http"));
const users = __importStar(require("./users"));
const response_1 = require("./response");
const pages = __importStar(require("./pages/pages"));
const router = __importStar(require("./request"));
const commander_1 = require("commander");
const util_1 = require("util");
// Database and data types
const databaseBarrel_1 = require("./databaseBarrel");
const endpoints_1 = require("@/shared/endpoints");
const database = __importStar(require("./database/database"));
const patrol = __importStar(require("./database/patrol"));
const location = __importStar(require("./database/location"));
class Server {
    db;
    adminService;
    locationService;
    patrolService;
    updateService;
    users;
    pages;
    router;
    /**
     * Create new server.
    */
    constructor(address, port, assets, db, adminService, locationService, patrolService, updateService) {
        this.db = db;
        this.adminService = adminService;
        this.locationService = locationService;
        this.patrolService = patrolService;
        this.updateService = updateService;
        this.users = new users.UserCache();
        this.pages = new pages.Pages(`${assets}/html`, this.db, false, this.locationService, this.patrolService, this.updateService, this.adminService);
        this.router = this.createRouter(address, port, assets, this.users);
        const numberOfPosts = locationService.allLocationIds().length;
        const numberOfPatrols = patrolService.allPatrolIds().length;
        const numberOfUsers = adminService.userIds().length;
        console.log(`Alle filer succesfuldt loadet. Loadet ${numberOfPosts} poster, ${numberOfUsers} brugere og ${numberOfPatrols} patruljer`);
        http.createServer(async (req, connection) => {
            try {
                let response = await this.router.handleRequest(req);
                (0, response_1.send)(connection, response);
            }
            catch (e) {
                console.error(e);
                (0, response_1.send)(connection, response_1.Response.serverError());
            }
        })
            .listen(port, address, () => {
            console.log(`Server is now listening at http://${address}:${port}`);
        });
    }
    createRouter(address, port, assets, users) {
        return new router.Router(address, port, users)
            .assetDir("/assets", assets)
            .assetDir("/js", `${__dirname}/../client`)
            .file(endpoints_1.Endpoints.Home, `${assets}/html/home.html`)
            .file(endpoints_1.Endpoints.HomeAlias, `${assets}/html/home.html`)
            // .file("/plot", `${assets}/html/patruljePlot.html`)
            .file(endpoints_1.Endpoints.Mandskab, `${assets}/html/mandskab.html`)
            .file(endpoints_1.Endpoints.Contact, `${assets}/html/contact.html`)
            .file('/favicon.ico', `${assets}/favicon.ico`)
            .route(endpoints_1.Endpoints.Login, 0 /* UserType.None */, this.login)
            .route(endpoints_1.Endpoints.Logout, 0 /* UserType.None */, this.logout)
            .route(endpoints_1.Endpoints.GetData, 1 /* UserType.Post */, this.locationDataForMandskab)
            .route(endpoints_1.Endpoints.SendUpdate, 1 /* UserType.Post */, this.makePatrolUpdate)
            .route(endpoints_1.Endpoints.DeleteCheckin, 1 /* UserType.Post */, this.mandskabDeleteUpdate)
            .route(endpoints_1.Endpoints.Master, 2 /* UserType.Master */, this.pages.master)
            .route(endpoints_1.Endpoints.MasterAddPatrolUpdatePage, 2 /* UserType.Master */, this.pages.patrolUpdatePage)
            .route(endpoints_1.Endpoints.MasterAddPatrolUpdate, 2 /* UserType.Master */, this.makeMasterPatrolUpdate)
            .route(endpoints_1.Endpoints.MasterPatrolUpdates, 2 /* UserType.Master */, this.pages.patrolUpdates)
            .route(endpoints_1.Endpoints.MasterPosts, 2 /* UserType.Master */, this.pages.locations)
            .route(endpoints_1.Endpoints.MasterPost, 2 /* UserType.Master */, this.pages.location)
            .route(endpoints_1.Endpoints.MasterPatrols, 2 /* UserType.Master */, this.pages.patrols)
            .route(endpoints_1.Endpoints.MasterPatrol, 2 /* UserType.Master */, this.pages.patrol)
            .route(endpoints_1.Endpoints.MasterPatrolStatus, 2 /* UserType.Master */, this.patrolStatus)
            .route(endpoints_1.Endpoints.MasterDeletePatrolUpdate, 2 /* UserType.Master */, this.masterDeletePatrolUpdate)
            .route(endpoints_1.Endpoints.MasterPostStatus, 2 /* UserType.Master */, this.postStatus)
            .route(endpoints_1.Endpoints.MasterHeartbeat, 2 /* UserType.Master */, async () => response_1.Response.ok());
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
    /**
     * Handle login request.
     */
    login = async (req) => {
        const password = req.headers['password'];
        const identifier = req.headers['id'];
        const locationId = this.adminService.authenticate(password);
        if (locationId === undefined) {
            return response_1.Response.unauthorized();
        }
        const user = this.users.addUser(identifier, locationId);
        return response_1.Response.ok()
            .setHeader("isMaster", user.isMasterUser.toString());
    };
    logout = async (_request) => {
        return response_1.Response.redirect("/")
            .setHeader("Set-Cookie", "identifier=deleted; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT");
    };
    // TODO: Update to work with new location routing
    /**
     * Get information about post.
     */
    locationDataForMandskab = async (req) => {
        const user = req.user;
        const locationOfUser = this.locationService.locationInfo(user.locationId);
        if (locationOfUser === undefined) {
            return response_1.Response.notFound()
                .setContent(`post ${user.locationId} not found`);
        }
        let towardsLocation = this.locationService.patrolsTowardsLocation(user.locationId);
        // if the location is the first location, include patrols that have no patrol update yet
        if (locationOfUser.id === Number.parseInt(this.adminService.settings["first_location" /* SETTINGS_TABLE.SETTING_FIRST_LOCATION_ID */])) {
            const patrolsWithNoUpdates = this.patrolService.allPatrolsWithNoUpdates();
            towardsLocation = towardsLocation.concat(patrolsWithNoUpdates);
        }
        const onLocation = this.locationService.patrolsOnLocation(user.locationId);
        const routesFromLocation = this.locationService.allRoutesFromLocation(user.locationId);
        const locationsFromRoutes = routesFromLocation.map(route => location.getLocation(this.db, route.toLocationId));
        const latestUpdates = this.updateService.updatesAtLocation(user.locationId, 10 /* SETTINGS.NUMBER_OF_UPDATES_SEND_TO_CLIENT */)
            .map(update => {
            return {
                ...update,
                patrol: patrol.getPatrol(this.db, update.patrolId),
                targetLocationName: this.locationService.locationInfo(update.targetLocationId)?.name || "Ukendt destination"
            };
        });
        const data = {
            patrolsOnLocation: onLocation.map(p => this.patrolService.patrolInfo(p)),
            patrolsTowardsLocation: towardsLocation.map(p => this.patrolService.patrolInfo(p)),
            location: locationOfUser,
            routesTo: locationsFromRoutes,
            latestUpdates: latestUpdates
        };
        return response_1.Response.ok()
            .setHeader("data", JSON.stringify(data));
    };
    tryGet(input, map, errorHandler) {
        try {
            const result = map(input);
            return result;
        }
        catch (error) {
            if (errorHandler === undefined) {
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
    makePatrolUpdate = async (request) => {
        const user = request.user;
        const updateHeader = request.headers['update']; //{PatolId}%{targetLocationID}
        const update = this.tryGet(updateHeader, (upd) => JSON.parse(upd), (err) => console.error("Error parsing update string:", err));
        if (!update) {
            return new response_1.Response(400);
        }
        const checkin = {
            time: new Date(),
            patrolId: update.patrolId,
            currentLocationId: user.locationId,
            targetLocationId: update.targetLocationId
        };
        const thisIsFirstLocation = user.locationId === Number.parseInt(this.adminService.settings["first_location" /* SETTINGS_TABLE.SETTING_FIRST_LOCATION_ID */]);
        if (!this.updateService.isPatrolUpdateValid(checkin, true, true, thisIsFirstLocation)) {
            return new response_1.Response(400);
        }
        const checkinID = this.updateService.updatePatrol(checkin);
        // Send id back to client
        return response_1.Response.ok()
            .setHeader("checkinID", checkinID.toString());
    };
    makeMasterPatrolUpdate = async (request) => {
        const formData = request.body.split("&").map(pair => pair.split("=")).reduce((acc, [key, value]) => {
            acc[decodeURIComponent(key)] = decodeURIComponent(value);
            return acc;
        }, {});
        let patrolUpdate = {
            time: new Date(),
            patrolId: Number.parseInt(formData['patrol']),
            currentLocationId: 0,
            targetLocationId: 0
        };
        const type = formData['type']; // "checkin" or "checkout"
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
            return new response_1.Response(400);
        }
        // This checkin is made by an admin, so we skip route validation and
        // current equals target check. Also, we allow the target to be the
        // first location.
        if (!this.updateService.isPatrolUpdateValid(patrolUpdate, false, false, true)) {
            console.error("Invalid patrol update in masterCheckin:", patrolUpdate);
            return new response_1.Response(400);
        }
        this.updateService.updatePatrol(patrolUpdate);
        return response_1.Response.redirect("/master");
    };
    postStatus = async (request) => {
        return await api.postStatus(this.db, request);
    };
    patrolStatus = async (request) => {
        return await api.patrolStatus(this.db, request);
    };
    masterDeletePatrolUpdate = async (request) => {
        return await api.masterDeletePatrolUpdate(this.db, request);
    };
    mandskabDeleteUpdate = async (request) => {
        return await api.mandskabDeleteUpdate(this.db, request);
    };
}
/**
 * Read command line arguments to get address and port.
 * @return binding address and port
 */
const readArguments = () => {
    let command = new commander_1.Command()
        .option("-a, --address <address>", "Address the server is hosted on", 
    // "127.0.0.1"
    "192.168.1.138")
        .option("-p, --port <port>", "Port the server is listening on", "3000")
        .option("--assets <assets>", "Assets file directory", `assets`)
        .option("--db, --database <file>", "File to store data in", "SQLite/webspejd.db")
        .option("--databaseInMemory", //Boolean flag
    "Whether to save the database or keep it in memory")
        .option("--resetDatabase", //Boolean flag
    "Whether to start all patrols at first post");
    command.parse();
    return command;
};
async function main() {
    const command = readArguments();
    const options = command.opts();
    const port = Number.parseInt(options["port"]);
    const address = options["address"];
    const databasePath = options["database"];
    const assetsDir = options["assets"];
    const inMemory = options["databaseInMemory"] === true;
    const resetDatabase = options["resetDatabase"] === true;
    console.log(`Starting server with options: ${(0, util_1.inspect)({
        address: address,
        port: port,
        database: databasePath,
        assets: assetsDir,
        inMemory: inMemory,
        resetDatabase: resetDatabase
    }, { colors: true, depth: null })}`);
    let db;
    const schemaPath = `${assetsDir}/sql/databaseSchema.sql`;
    if (inMemory) {
        db = databaseBarrel_1.Database.createInMemoryDatabase(schemaPath);
    }
    else {
        db = new databaseBarrel_1.Database(databasePath, schemaPath);
    }
    if (resetDatabase) {
        database.resetCheckins(db);
    }
    const adminService = new databaseBarrel_1.AdminService(db);
    const locationService = new databaseBarrel_1.LocationService(db);
    const patrolService = new databaseBarrel_1.PatrolService(db);
    const updateService = new databaseBarrel_1.UpdateService(db);
    const server = new Server(address, port, assetsDir, db, adminService, locationService, patrolService, updateService);
    [`exit`, `SIGINT`, `SIGUSR1`, `SIGUSR2`, `uncaughtException`, `SIGTERM`].forEach((eventType) => {
        process.on(eventType, server.cleanup.bind(null, eventType));
    });
}
main();
