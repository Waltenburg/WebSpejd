import { User, UserCache, UserType } from "./users.js";
import * as http from 'http';
import { Response } from "./response.js";
import type { ServiceBase } from "./databaseBarrel.js";
export interface Request {
    user: User;
    url: URL;
    headers: {
        [key: string]: string;
    };
    cookies: {
        [key: string]: string;
    };
    body?: string;
}
export declare class Router {
    private users;
    private address;
    private port;
    private routes;
    private assetDirs;
    constructor(address: string, port: number, users: UserCache);
    assetDir(urlPath: string, dir: string): Router;
    /**
     * Registers a route with dependency injection.
     *
     * @param path - The URL endpoint path.
     * @param userType - Required authorization level.
     * @param func - Handler receiving `(Request, ...services)`.
     * @param services - Instances of `ServiceBase` to inject into the handler. If none, it behaves like a normal route.
     * @returns `this` (instance of `Router`) for chaining.
     */
    route<T extends ServiceBase[]>(path: string, userType: UserType, func: RouteFunction<T>, ...services: T): Router;
    /**
     * Create new route for a file.
     *
     * @param path the url path
     * @param file the file to the string
     * @returns `this`
     */
    file(path: string, file: string): Router;
    /**
     * Handle incoming http request
     *
     * @param incoming the incoming http request
     * @returns a http response
     */
    handleRequest(incoming: http.IncomingMessage): Promise<Response>;
    /**
     * Verifies a request to a route is authorized.
     *
     * @param request the request recieved by the router
     * @param route the route the request is hitting
     * @returns `true` if request is authorized, `false` otherwise
     */
    isAuthorized(request: Request, route: Route): boolean;
    /**
     * Parse incoming http message.
     *
     * @param request the incoming http method
     * @returns a new `Request` object
     */
    parseRequest(request: http.IncomingMessage): Promise<Request>;
}
export declare const parseForm: (body: string | null) => Record<string, string>;
type RouteFunction<T extends ServiceBase[]> = (request: Request, ...services: T) => Promise<Response>;
interface Route {
    userType: UserType;
    path: string;
    func: RouteFunction<any>;
}
export {};
//# sourceMappingURL=request.d.ts.map