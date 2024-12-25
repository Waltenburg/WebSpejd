import { User, UserCache } from "./users";
import * as http from 'http'
import * as responses from "./response";

export interface Request {
    user: User,
    url: URL,
    headers: { [key: string]: string };
    cookies: { [key: string]: string };
}

export enum UserType {
    None, Post, Master
}

export class Router {
    private users: UserCache;
    private address: string;
    private port: number;
    private routes: Route[];
    private assetDirs: AssertDir[];

    constructor(address: string, port: number, users: UserCache) {
        this.users = users;
        this.address = address;
        this.port = port;
        this.routes = [];
        this.assetDirs = [];
    }

    assetDir(urlPath: string, dir: string): Router {
        this.assetDirs.push({
            urlPath: urlPath,
            dir: dir
        });
        return this;
    }

    route(path: string, userType: UserType, func: RouteFunction): Router {
        this.routes.push({
            userType: userType,
            path: path,
            func: func
        });
        return this;
    }

    /**
     * Create new route for a file.
     *
     * @param path the url path
     * @param file the file to the string
     * @returns `this`
     */
    file(path: string, file: string): Router {
        return this.route(
            path,
            UserType.None,
            async (_request) => await responses.file(file)
        );
    }

    /**
     * Handle incoming http request
     *
     * @param incoming the incoming http request
     * @returns a http response
     */
    async handleRequest(incoming: http.IncomingMessage): Promise<Response> {
        try {
            let request = this.parseRequest(incoming);
            let path = request.url.pathname;

            // Asset directories
            let assetDir = this.assetDirs
            .find((assetDir) => path.startsWith(`${assetDir.urlPath}/`));
            if(assetDir != undefined) {
                let relativePath = path.slice(assetDir.urlPath.length + 1);
                let fullPath = `${assetDir.dir}/${relativePath}`;
                return responses.file(fullPath);
            }

            // Function routes
            let route = this.routes
            .find((route) => route.path === path);
            if(route === undefined) {
                return responses.not_found("Page not found");
            }
            if(!this.isAuthorized(request, route)) {
                return responses.unauthorized("Not authorized");
            }

            return await route.func(request);
        } catch(err) {
            return responses.server_error(err);
        }
    }

    /**
     * Verifies a request to a route is authorized.
     *
     * @param request the request recieved by the router
     * @param route the route the request is hitting
     * @returns `true` if request is authorized, `false` otherwise
     */
    isAuthorized(request: Request, route: Route): boolean {
        const userType = route.userType;
        const user = request.user;
        return (userType === UserType.Master && user.isMasterUser())
            || (userType === UserType.Post && user.isPostUser())
            || (userType === UserType.None);
    }

    /**
     * Parse incoming http message.
     *
     * @param request the incoming http method
     * @returns a new `Request` object
     */
    parseRequest(request: http.IncomingMessage): Request {
        const url = new URL(`http://${this.address}:${this.port}${request.url}`);

        const headers: { [key: string]: string } = {}
        for(let header in request.headers) {
            headers[header.toLowerCase()] = request.headers[header] as string;
        }

        const cookies: { [key: string]: string } = {};
        if(headers["cookie"] !== undefined) {
            headers["cookie"]
                .split(";")
                .forEach((cookieString) => {
                    const trimmed = cookieString.trim();
                    const splitPoint = trimmed.indexOf("=");
                    const key = trimmed.slice(0, splitPoint);
                    const value = trimmed.slice(splitPoint+1);
                    cookies[key] = value;
                });
        }

        const userIdentifier = cookies["identifier"] || headers["id"];
        const user =
            userIdentifier === undefined
            ? new User(-1)
            : this.users.userFromIdentifier(userIdentifier);

        return {
            user: user,
            url: url,
            headers: headers,
            cookies: cookies,
        };
    }
}

type Response = responses.Response;
type RouteFunction = (request?: Request) => Promise<Response>;

interface Route {
    userType: UserType;
    path: string;
    func: RouteFunction
}

interface AssertDir {
    urlPath: string,
    dir: string
}
