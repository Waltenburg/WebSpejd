"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Router = void 0;
const users_1 = require("./users");
const response_1 = require("./response");
class Router {
    users;
    address;
    port;
    routes;
    assetDirs;
    constructor(address, port, users) {
        this.users = users;
        this.address = address;
        this.port = port;
        this.routes = [];
        this.assetDirs = [];
    }
    assetDir(urlPath, dir) {
        this.assetDirs.push({
            urlPath: urlPath,
            dir: dir
        });
        return this;
    }
    route(path, userType, func) {
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
    file(path, file) {
        return this.route(path, 0 /* UserType.None */, async (_request) => await response_1.Response.file(file));
    }
    /**
     * Handle incoming http request
     *
     * @param incoming the incoming http request
     * @returns a http response
     */
    async handleRequest(incoming) {
        try {
            let request = await this.parseRequest(incoming);
            let path = request.url.pathname;
            // Asset directories
            let assetDir = this.assetDirs
                .find((assetDir) => path.startsWith(`${assetDir.urlPath}/`));
            if (assetDir != undefined) {
                let relativePath = path.slice(assetDir.urlPath.length + 1);
                let fullPath = `${assetDir.dir}/${relativePath}`;
                return await response_1.Response.file(fullPath);
            }
            // Function routes
            let route = this.routes
                .find((route) => route.path === path);
            if (route === undefined) {
                return response_1.Response.notFound()
                    .setContent("Page not found");
            }
            //TODO: Autherization check is failing
            if (!this.isAuthorized(request, route)) {
                return response_1.Response.unauthorized()
                    .setContent("Not authorized");
            }
            return await route.func(request);
        }
        catch (err) {
            console.error(err);
            return response_1.Response.serverError()
                .setContent(err.toString());
        }
    }
    /**
     * Verifies a request to a route is authorized.
     *
     * @param request the request recieved by the router
     * @param route the route the request is hitting
     * @returns `true` if request is authorized, `false` otherwise
     */
    isAuthorized(request, route) {
        const userType = route.userType;
        const user = request.user;
        return (userType === 2 /* UserType.Master */ && user.isMasterUser())
            || (userType === 1 /* UserType.Post */ && user.isPostUser())
            || (userType === 0 /* UserType.None */);
    }
    /**
     * Parse incoming http message.
     *
     * @param request the incoming http method
     * @returns a new `Request` object
     */
    async parseRequest(request) {
        const url = new URL(`http://${this.address}:${this.port}${request.url}`);
        const headers = {};
        for (let header in request.headers) {
            headers[header.toLowerCase()] = request.headers[header];
        }
        const cookies = {};
        if (headers["cookie"] !== undefined) {
            headers["cookie"]
                .split(";")
                .forEach((cookieString) => {
                const trimmed = cookieString.trim();
                const splitPoint = trimmed.indexOf("=");
                const key = trimmed.slice(0, splitPoint);
                const value = trimmed.slice(splitPoint + 1);
                cookies[key] = value;
            });
        }
        const userIdentifier = cookies["identifier"] || headers["id"];
        const user = userIdentifier === undefined
            ? new users_1.User(-1)
            : this.users.userFromIdentifier(userIdentifier);
        // Get body asynchronously
        let body = undefined;
        if (request.method === "POST" || request.method === "PUT") {
            const chunks = [];
            for await (const chunk of request) {
                chunks.push(chunk);
            }
            //@ts-ignore
            body = Buffer.concat(chunks).toString();
        }
        if (body === undefined) {
            body = "";
        }
        return {
            user: user,
            url: url,
            headers: headers,
            cookies: cookies,
            body: body
        };
    }
}
exports.Router = Router;
