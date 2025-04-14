import { User, UserCache } from "../users";
import * as responses from "../response";
import { Request } from "./request";

import * as http from 'http'

export enum UserType {
    None, Post, Master
}

export enum HttpMethod {
    Get, Post
}

export interface Routing {

    /**
     * Get routes
     *
     * @returns the routes
     */
    routes(): Routes;
}

export class Routes {
    private routes: Route[];
    private subRoutes: SubRoutes[];
    private assetDirs: AssetDir[];

    constructor() {
        this.routes = [];
        this.subRoutes = [];
        this.assetDirs = [];
    }

    assetDir(urlPath: string, dir: string): Routes {
        this.assetDirs.push({
            urlPath: urlPath,
            dir: dir
        });
        return this;
    }

    post(path: string, userType: UserType, func: RouteFunction): Routes {
        this.routes.push({
            httpMethod: HttpMethod.Post,
            userType: userType,
            path: path,
            func: func
        });
        return this;
    }

    route(path: string, userType: UserType, func: RouteFunction): Routes {
        this.routes.push({
            httpMethod: HttpMethod.Get,
            userType: userType,
            path: path,
            func: func
        });
        return this;
    }

    subRoute(path: string, userType: UserType, routes: Routing): Routes {
        this.subRoutes.push({userType, path, routes: routes.routes()});
        return this;
    }

    /**
     * Create new route for a file.
     *
     * @param path the url path
     * @param file the file to the string
     * @returns `this`
     */
    file(path: string, file: string): Routes {
        return this.route(
            path,
            UserType.None,
            async (_request) => await responses.file(file)
        );
    }

    findRoute(request: Request): Route | undefined {
        const path = request.path;

        // Sub routing
        const subRoute = this.subRoutes
            .find((subRoute) => path.startsWith(`${subRoute.path}/`));
        if(subRoute != undefined) {
            request.path = path.substring(subRoute.path.length);
            return subRoute.routes.findRoute(request);
        }

        // Asset directories
        const assetDir = this.assetDirs
            .find((assetDir) => path.startsWith(`${assetDir.urlPath}/`));
        if(assetDir != undefined) {
            let relativePath = path.slice(assetDir.urlPath.length + 1);
            let fullPath = `${assetDir.dir}/${relativePath}`;
            return {
                httpMethod: HttpMethod.Get,
                userType: UserType.None,
                path: assetDir.urlPath,
                func: async (_) => responses.file(fullPath)
            };
        }

        // Function routes
        const route = this.routes.find((route) => route.path === path);
        return route;
    }

}

export class Router {
    private users: UserCache;
    private routes: Routes;

    constructor(users: UserCache) {
        this.users = users;
        this.routes = new Routes();
    }

    assetDir(urlPath: string, dir: string): Router {
        this.routes.assetDir(urlPath, dir);
        return this;
    }

    route(path: string, userType: UserType, func: RouteFunction): Router {
        this.routes.route(path, userType, func);
        return this;
    }

    subRoute(path: string, userType: UserType, routes: Routing): Router {
        this.routes.subRoute(path, userType, routes);
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
            const request = new Request(incoming);
            const route = this.routes.findRoute(request);

            if(route === undefined) {
                return responses.not_found("Page not found");
            }

            const user = this.users.userFromRequest(request);
            if(!this.isAuthorized(user, route)) {
                return responses.unauthorized("Not authorized");
            }

            return await route.func(request);
        } catch(err) {
            console.error(err);
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
    isAuthorized(user: User, route: Route): boolean {
        const userType = route.userType;
        return (userType === UserType.Master && user.isMasterUser())
            || (userType === UserType.Post && user.isPostUser())
            || (userType === UserType.None);
    }
}

type Response = responses.Response;
type RouteFunction = (request: Request) => Promise<Response>;

interface SubRoutes {
    userType: UserType;
    path: string;
    routes: Routes;
}

interface Route {
    httpMethod: HttpMethod,
    userType: UserType;
    path: string;
    func: RouteFunction
}

interface AssetDir {
    urlPath: string,
    dir: string
}
