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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseForm = exports.Router = void 0;
const users_1 = require("./users");
const responses = __importStar(require("./response"));
class Router {
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
    route(path, userType, func, ...services) {
        this.routes.push({
            userType: userType,
            path: path,
            func: (req) => func(req, ...services)
        });
        return this;
    }
    file(path, file) {
        return this.route(path, 0, async (_request) => await responses.file(file));
    }
    async handleRequest(incoming) {
        try {
            let request = await this.parseRequest(incoming);
            let path = request.url.pathname;
            let assetDir = this.assetDirs
                .find((assetDir) => path.startsWith(`${assetDir.urlPath}/`));
            if (assetDir != undefined) {
                let relativePath = path.slice(assetDir.urlPath.length + 1);
                let fullPath = `${assetDir.dir}/${relativePath}`;
                return responses.file(fullPath);
            }
            let route = this.routes
                .find((route) => route.path === path);
            if (route === undefined) {
                return responses.not_found("Page not found");
            }
            if (!this.isAuthorized(request, route)) {
                return responses.unauthorized("Not authorized");
            }
            return await route.func(request);
        }
        catch (err) {
            console.error(err);
            return responses.server_error(err);
        }
    }
    isAuthorized(request, route) {
        const userType = route.userType;
        const user = request.user;
        return (userType === 2 && user.isMasterUser())
            || (userType === 1 && user.isPostUser())
            || (userType === 0);
    }
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
        let body = null;
        if (request.method === "POST" || request.method === "PUT") {
            const chunks = [];
            for await (const chunk of request) {
                chunks.push(chunk);
            }
            body = Buffer.concat(chunks).toString();
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
const parseForm = (body) => {
    if (!body)
        return {};
    return body.split("&").reduce((acc, pair) => {
        const [k, v] = pair.split("=");
        if (k)
            acc[decodeURIComponent(k)] = decodeURIComponent(v ?? "");
        return acc;
    }, {});
};
exports.parseForm = parseForm;
//# sourceMappingURL=request.js.map