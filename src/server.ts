import * as http from 'http'
import { files } from './files'
import * as users from "./users";
import { JsonDatabase, DatabaseWrapper, Database, Checkin, CheckinType } from "./database";
import * as responses from "./response";

type Response = responses.Response;

class Server {
    private db: DatabaseWrapper;
    private users: users.UserCache;

    /**
     * Create new server.
     *
     * @param address the binding address
     * @param port the binding port
     * @param db the database
     */
    constructor(address: string, port: number, db: Database) {
        this.db = new DatabaseWrapper(db);
        this.db.initialize();

        this.users = new users.UserCache();

        const numberOfPosts = db.allPostIds().length;
        const numberOfPatrols = db.allPatrolIds().length;
        const numberOfUsers = db.userIds().length;
        console.log(`Alle filer succesfuldt loadet. Loadet ${numberOfPosts} poster, ${numberOfUsers} brugere og ${numberOfPatrols} patruljer`);

        http.createServer(async (req, connection) => {
                const response = await this.handleRequest(req);
                responses.send(connection, response);
            })
            .listen(port, address, () => {
                console.log(`Server is now listening at http://${address}:${port}`);
            });
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
     * Handle incoming http requests.
     *
     * @param req the incoming http request
     * @param res the http response builder
     */
    async handleRequest(req: http.IncomingMessage): Promise<Response> {
        if (req.method != "GET") {
            return responses.server_error();
        }

        if(req.url === undefined) {
            return responses.server_error();
        }

        if (files.isAssetFile(req.url)) {
            let relative_path = req.url.slice(1);
            return responses.file(relative_path);
        }

        if (files.isClientJs(req.url)) {
            let relative_path = req.url.slice(4);
            let javascript_path = `${__dirname}/clientFiles/${relative_path}`;
            return responses.file(javascript_path);
        }

        switch (req.url) {
            case "/":
            case "/home":
                return await responses.file("assets/html/home.html");
            case "/plot":
                return await responses.file("assets/html/patruljePlot.html");
            case "/login":
                return this.loginReq(req);
            case "/mandskab":
                return await responses.file("assets/html/mandskab.html");
            case "/getUpdate":
                return this.requestPostUpdate(req);
            case "/getData":
                return this.requestPostData(req);
            case "/sendUpdate":
                return this.handleCheckinRequest(req);
            case "/master":
                return await responses.file("assets/html/master.html");
            // case "/masterData":
            //     return this.masterDataReq(req);
            // case "/masterUpdate":
            //     return this.masterUpdateReq(req);
            // case "/patruljeMasterUpdate":
            //     return this.patruljeMasterUpdate(req);
            // case "/postMasterUpdate":
            //     return this.postMasterUpdate(req);
            // case "/redigerPPM":
            //     return this.redigerPPM(req);
            // case "/reset":
            //     return this.reset(req);
        }
        return responses.not_found();
    }

    /**
     * Handle login request.
     */
    loginReq (req: http.IncomingMessage): Response {
        const password = req.headers['password'] as string
        const identifier = req.headers['id'] as string
        const postId = this.db.authenticate(password);
        if(postId === undefined) {
            return responses.unauthorized();
        }
        const user = this.users.addUser(identifier, postId);
        return responses.ok(null, {
            "isMaster": user.isMasterUser()
        });
    }

    /**
     * Get updated information about post.
     */
    requestPostUpdate(req: http.IncomingMessage): Response {
        const user = this.users.userFromRequest(req);
        if (!user.isPostUser()) {
            return responses.unauthorized();
        }

        const userLastUpdate = parseInt(req.headers['last-update'] as string)
        const post = this.db.postInfo(user.postId);
        if(post === undefined) {
            return responses.not_found();
        }

        //Der er kommet ny update siden sidst klienten spurgte
        if(userLastUpdate < post.lastUpdate.getTime()){
            let response = this.requestPostData(req);
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
    requestPostData(req: http.IncomingMessage): Response {
        const user = this.users.userFromRequest(req);
        if(!user.isPostUser()) {
            console.log(`Not post user: ${user.postId}`)
            return responses.unauthorized();
        }

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
    handleCheckinRequest(req: http.IncomingMessage): Response {
        const user = this.users.userFromRequest(req);

        // User is master or unauthenticated
        if (!user.isPostUser()) {
            return responses.unauthorized();
        }

        let patrolId: number;
        let melding: string;
        let postOrOmvej: string;
        const update = req.headers['update'] as string //{patruljenummer}%{melding}%{post/omvej}
        const commit = req.headers['commit-type'] as string == "commit"
        try {
            const split = update.split('%')
            patrolId = Number.parseInt(split[0]);
            melding = split[1]
            postOrOmvej = split[2]
        } catch(error) {
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

        // Client wants to commit changes
        if (commit) {
            this.db.checkin(checkin);
        }

        return responses.ok();
    }

}

/**
 * Read command line arguments to get address and port.
 * @return binding address and port
 */
const readArguments = (): [string, number] => {
    let address = "127.0.0.1";
    if (process.argv.length >= 3) {
        address = process.argv[2];
    }

    let port = 3000;
    if (process.argv.length >= 4) {
        port = parseInt(process.argv[3]);
    }

    return [address, port];
};


async function main(): Promise<void> {
    let [address, port] = readArguments();
    const db = new JsonDatabase("data/database.json");
    const server = new Server(address, port, db);

    [`exit`, `SIGINT`, `SIGUSR1`, `SIGUSR2`, `uncaughtException`, `SIGTERM`].forEach((eventType) => {
        process.on(eventType, server.cleanup.bind(null, eventType));
    })
}

main();
