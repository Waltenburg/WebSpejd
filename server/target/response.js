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
exports.Response = void 0;
exports.send = send;
const fs = __importStar(require("fs/promises"));
/**
 * Http response.
 */
class Response {
    statusCode;
    content;
    headers;
    cookies;
    /**
     * Create new empty http response.
     *
     * @param statusCode the status code of the response
     */
    constructor(statusCode) {
        this.statusCode = statusCode;
        this.content = undefined;
        this.headers = {};
        this.cookies = {};
    }
    /**
     * Create new ok http response.
     *
     * @returns a new response
     */
    static ok() {
        return new Response(200);
    }
    /**
     * Create new redirect http response.
     *
     * @param path the path to redirect to
     * @returns a new response
     */
    static redirect(path) {
        return new Response(303)
            .setHeader("Location", path);
    }
    /**
     * Create a new unauthorized response.
     *
     * @returns a new response
     */
    static unauthorized() {
        return new Response(401);
    }
    /**
     * Create a new forbidden response.
     *
     * @returns a new response
     */
    static forbidden() {
        return new Response(403);
    }
    /**
     * Create a new not found response.
     *
     * @returns a new response
     */
    static notFound() {
        return new Response(404);
    }
    /**
     * Create a new server error response.
     *
     * @returns a new response
     */
    static serverError() {
        return new Response(500);
    }
    /**
     * Set a header of the response
     *
     * @param key the key of the header
     * @param value the value of the header
     * @returns this response
     */
    setHeader(key, value) {
        this.headers[key] = value;
        return this;
    }
    /**
     * Set a cookie of the response
     *
     * @param key the key of the cookie
     * @param value the value of the cookie
     * @returns this response
     */
    setCookie(key, value) {
        this.cookies[key] = value;
        return this;
    }
    /**
     * Set the content of the response.
     *
     * @param content the new content of the response
     * @returns this response
     */
    setContent(content) {
        this.content = content;
        return this;
    }
    /**
     * Create a http response with the contents of a file.
     *
     * @param path the path to the file to send
     * @returns a response
     */
    static async file(path) {
        try {
            const content = await fs.readFile(path);
            const mimeType = determineContentType(path);
            return new Response(200)
                .setContent(content)
                .setHeader("Content-Type", mimeType);
        }
        catch (e) {
            return Response.serverError();
        }
    }
}
exports.Response = Response;
/**
 * Determine the filetype of a file.
 *
 * @param path the path to the file to determine mimetype of
 * @returns the mime type of the file
 */
const determineContentType = (path) => {
    let split = path.split(".");
    let extension = split[split.length - 1].toLowerCase();
    const extensionsToMimeTypes = {
        "css": "text/css" /* Mime.css */,
        "html": "text/html" /* Mime.html */,
        "ico": "image/x-icon" /* Mime.ico */,
        "jpg": "image/jpg" /* Mime.jpg */,
        "json": "application/JSON" /* Mime.json */,
        "js": "application/javascript" /* Mime.javascript */,
        "mp3": "audio/mpeg" /* Mime.mp3 */,
        "png": "image/png" /* Mime.png */,
    };
    if (extension in extensionsToMimeTypes) {
        return extensionsToMimeTypes[extension];
    }
    return "*/*" /* Mime.any */;
};
/**
 * Send response to client.
 *
 * @param connection the connection with the client
 * @param response the response to send to the client
 */
function send(connection, response) {
    try {
        for (let header in response.headers) {
            connection.setHeader(header, response.headers[header]);
        }
        connection.writeHead(response.statusCode);
        connection.end(response.content);
    }
    catch (e) {
        console.error(e);
        connection.statusCode = 500;
        connection.end();
    }
}
