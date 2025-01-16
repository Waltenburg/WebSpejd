import 'source-map-support/register';

import * as http from 'http'
import * as users from "./users";
import { JsonDatabase, DatabaseWrapper, Database, Checkin, CheckinType } from "./database";
import * as responses from "./response";
import * as pages from "./pages";
import * as router from "./request";
import { UserType, Request } from './request';
import { Command } from 'commander';
import { inspect } from 'util';

type Response = responses.Response;

class Server {
    private db: DatabaseWrapper;
    private users: users.UserCache;
    private pages: pages.Pages;
    private router: router.Router;

    /**
     * Create new server.
     *
     * @param address the binding address
     * @param port the binding port
     * @param db the database
     */
    constructor(address: string, port: number, assets: string, db: DatabaseWrapper) {
        this.db = new DatabaseWrapper(db);
        //this.db.initialize();

        this.users = new users.UserCache();
        this.pages = new pages.Pages(`${assets}/html`, this.db, false);
        this.router = this.createRouter(address, port, assets, this.users);

        const numberOfPosts = db.allPostIds().length;
        const numberOfPatrols = db.allPatrolIds().length;
        const numberOfUsers = db.userIds().length;
        console.log(`Alle filer succesfuldt loadet. Loadet ${numberOfPosts} poster, ${numberOfUsers} brugere og ${numberOfPatrols} patruljer`);

        http.createServer(async (req, connection) => {
                let response = await this.router.handleRequest(req);
                responses.send(connection, response);
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
            .route("/sendUpdate", UserType.Post, this.postCheckin)
            .route("/deleteCheckin", UserType.Post, this.mandskabDeleteCheckin)
            .route("/master", UserType.Master, this.pages.master)
            .route("/master/checkin", UserType.Master, this.pages.checkin)
            .route("/master/addcheckin", UserType.Master, this.masterCheckin)
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
        const postId = this.db.authenticate(password);
        if(postId === undefined) {
            return responses.unauthorized();
        }
        const user = this.users.addUser(identifier, postId);
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
        const post = this.db.postInfo(user.postId);
        if(post === undefined) {
            return responses.not_found();
        }

        //Der er kommet ny update siden sidst klienten spurgte
        //+5000ms sikrer at hvis der er en lille forskel i tid mellem klient og server, så vil klienten stadig få opdateringen
        if(userLastUpdate < post.lastUpdate.getTime() + 5000){
            let response = await this.postData(req);
            if(response.headers) {
                response.headers.update = "true";
            }
            return response;
        } else{
            return responses.ok(null, { "update": "false" });
        }
    }

    /**
     * Get information about post.
     */
    postData = async (req: Request): Promise<Response> => {
        const user = req.user;

        const post = this.db.postInfo(user.postId);
        if(post === undefined) {
            return responses.not_found(`post ${user.postId} not found`);
        }
        const nextPost = this.db.postInfo(user.postId + 1);
        const isLastPost = nextPost === undefined;
        const omvejÅben = !isLastPost && !post.detour && nextPost?.detour && nextPost?.open;

        return responses.ok("", {
            "data": JSON.stringify({
                "påPost": this.db.patruljerPåPost(user.postId),
                "påVej": this.db.patruljerPåVej(user.postId),
                "post": post.name,
                "omvejÅben": omvejÅben,
            })
        });
    }

    /**
     * Check patrol in or out.
     *
     * @param req the http request
     * @param res the http response builder
     */
    postCheckin = async (request: Request): Promise<Response> => {
        const user = request.user;

        let patrolId: number;
        let melding: string;
        let postOrOmvej: string;
        const update = request.headers['update'] //{patruljenummer}%{melding}%{post/omvej}

        try {
            const split = update.split('%')
            patrolId = Number.parseInt(split[0]);
            melding = split[1]
            postOrOmvej = split[2]
        } catch(error) {
            console.error(error);
            return responses.server_error();
        }

        const checkin: Checkin = {
            time: new Date(),
            patrolId: patrolId,
            postId: user.postId,
            type: melding === "ind"
                ? CheckinType.CheckIn
                : postOrOmvej === "omvej"
                    ? CheckinType.Detour
                    : CheckinType.CheckOut
        };

        if(!this.db.isCheckinValid(checkin)) {
            return responses.response_code(400);
        }

        const checkinID = this.db.checkin(checkin);

        //Send id back to client
        return responses.ok("", {
            "checkinID": checkinID
        });

    }

    masterCheckin = async (request: Request): Promise<Response> => {
        const params = request.url.searchParams;
        const patrolId = params.get("patrol");
        const postId = params.get("post");
        const checkinType = params.get("type");

        if(patrolId == undefined || postId == undefined || checkinType == undefined) {
            return responses.server_error();
        }

        const checkin: Checkin = {
            time: new Date(),
            patrolId: Number.parseInt(patrolId),
            postId: Number.parseInt(postId),
            type: checkinType === "checkin"
                ? CheckinType.CheckIn
                : checkinType === "detour"
                    ? CheckinType.Detour
                    : CheckinType.CheckOut
        };

        this.db.checkin(checkin);

        return responses.redirect("/master");
    }

    postStatus = async(request: Request): Promise<Response> => {
        const params = request.url.searchParams;
        const statusParam = params.get("status");
        const postId = Number.parseInt(params.get("post"));
        const newStatus = statusParam === "open";

        this.db.changePostStatus(postId, newStatus);
        return responses.redirect(`/master/post?id=${postId}`);
    }

    patrolStatus = async (request: Request): Promise<Response> => {
        const params = request.url.searchParams;
        const patrolId = Number.parseInt(params.get("patrolId"));
        const status = params.get("status");
        const isOut = status === "out";
        this.db.changePatrolStatus(patrolId, isOut);
        return responses.redirect(`/master/patrol?id=${patrolId}`);
    }

    deleteCheckin = async (request: Request): Promise<Response> => {
        const params = request.url.searchParams;
        const checkinId = Number.parseInt(params.get("id"));
        this.db.deleteCheckin(checkinId);
        return responses.ok();
    }

    mandskabDeleteCheckin = async (request: Request): Promise<Response> => {
        const timeToUndo = 1000 * 20; // 20 seconds

        const params = request.url.searchParams;
        const checkinId = Number.parseInt(params.get("id"));
        // const postIdRequest = this.db.authenticate(request.headers['id'])
        const postIdRequest = this.users.userFromIdentifier(request.headers['id']).postId;
        const checkin = this.db.checkinById(checkinId);
        const postIdCheckin = checkin?.postId;

        const requestAndCheckinMatch = postIdCheckin == postIdRequest && postIdCheckin != null;
        const checkinIsRecent = checkin?.time.getTime() > Date.now() - timeToUndo;

        if(requestAndCheckinMatch && checkinIsRecent) {
            this.db.deleteCheckin(checkinId);
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
            "data/database.json"
        )
        .option(
            "--databaseInMemory ", //Boolean flag
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
    const address = options["address"]
    const database = options["database"]
    const assets = options["assets"]
    const inMemory = options["DatabaseInMemory"] === true;
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

    const db = new JsonDatabase(database, inMemory, resetDatabase);
    const server = new Server(address, port, assets, new DatabaseWrapper(db));

    [`exit`, `SIGINT`, `SIGUSR1`, `SIGUSR2`, `uncaughtException`, `SIGTERM`].forEach((eventType) => {
        process.on(eventType, server.cleanup.bind(null, eventType));
    })
}

main();