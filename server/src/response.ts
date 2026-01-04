import * as fs from "fs/promises";
import * as http from 'http'

/**
 * Http response.
 */
export class Response {
    public statusCode: number;
    public content: string | Buffer | undefined;
    public headers: {
        [key: string]: string
    }
    public cookies: {
        [key: string]: string
    }

    /**
     * Create new empty http response.
     *
     * @param statusCode the status code of the response
     */
    public constructor(statusCode: number) {
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
    public static ok(): Response {
        return new Response(200);
    }

    /**
     * Create new redirect http response.
     *
     * @param path the path to redirect to
     * @returns a new response
     */
    public static redirect(path: string): Response {
        return new Response(303)
            .setHeader("Location", path)
    }

    /**
     * Create a new unauthorized response.
     *
     * @returns a new response
     */
    public static unauthorized(): Response {
        return new Response(401);
    }

    /**
     * Create a new forbidden response.
     *
     * @returns a new response
     */
    public static forbidden(): Response {
        return new Response(403);
    }

    /**
     * Create a new not found response.
     *
     * @returns a new response
     */
    public static notFound() {
        return new Response(404);
    }

    /**
     * Create a new server error response.
     *
     * @returns a new response
     */
    public static serverError() {
        return new Response(500);
    }

    /**
     * Set a header of the response
     *
     * @param key the key of the header
     * @param value the value of the header
     * @returns this response
     */
    public setHeader(key: string, value: string): Response {
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
    public setCookie(key: string, value: string): Response {
        this.cookies[key] = value;
        return this;
    }

    /**
     * Set the content of the response.
     *
     * @param content the new content of the response
     * @returns this response
     */
    public setContent(content: string | Buffer): Response {
        this.content = content;
        return this;
    }

    /**
     * Create a http response with the contents of a file.
     *
     * @param path the path to the file to send
     * @returns a response
     */
    public static async file(path: string): Promise<Response> {
        try{
            const content = await fs.readFile(path);
            const mimeType = determineContentType(path);
            return new Response(200)
                .setContent(content)
                .setHeader("Content-Type", mimeType);
        } catch(e) {
            return Response.serverError();
        }
    }

}

/** Mimetypes */
const enum Mime {
    html = "text/html",
    json = 'application/JSON',
    css = "text/css",
    jpg = "image/jpg",
    png = "image/png",
    ico = "image/x-icon",
    mp3 = "audio/mpeg",
    javascript = "application/javascript",
    any = "*/*",
}


/**
 * Determine the filetype of a file.
 *
 * @param path the path to the file to determine mimetype of
 * @returns the mime type of the file
 */
const determineContentType = (path: string): Mime => {
    let split = path.split(".")
    let extension = split[split.length - 1].toLowerCase()

    const extensionsToMimeTypes: { [extension: string]: Mime } = {
        "css": Mime.css,
        "html": Mime.html,
        "ico": Mime.ico,
        "jpg": Mime.jpg,
        "json": Mime.json,
        "js": Mime.javascript,
        "mp3": Mime.mp3,
        "png": Mime.png,
    };
    if (extension in extensionsToMimeTypes) {
        return extensionsToMimeTypes[extension];
    }
    return Mime.any;
}


/**
 * Send response to client.
 *
 * @param connection the connection with the client
 * @param response the response to send to the client
 */
export function send(connection: http.ServerResponse, response: Response) {
    try{
        for(let header in response.headers) {
            connection.setHeader(header, response.headers[header]);
        }
        connection.writeHead(response.statusCode);
        connection.end(response.content);
    }
    catch(e) {
        console.error(e);
        connection.statusCode = 500;
        connection.end();
    }
}
