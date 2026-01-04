import { User, UserCache } from "./users";
import * as http from 'http';
import { Response } from "./response";
export interface Request {
    user: User;
    url: URL;
    headers: {
        [key: string]: string;
    };
    cookies: {
        [key: string]: string;
    };
    body: string;
}
export declare const enum UserType {
    None = 0,
    Post = 1,
    Master = 2
}
export declare class Router {
    private users;
    private address;
    private port;
    private routes;
    private assetDirs;
    constructor(address: string, port: number, users: UserCache);
    assetDir(urlPath: string, dir: string): Router;
    route(path: string, userType: UserType, func: RouteFunction): Router;
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
type RouteFunction = (request: Request) => Promise<Response>;
interface Route {
    userType: UserType;
    path: string;
    func: RouteFunction;
}
export {};
