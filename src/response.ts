import * as fs from "fs/promises";
import * as http from 'http'

export interface Response {
    status_code: number;
    content: string | Buffer | null;
    headers?: {
        [key: string]: any
    }
}

export function ok(content?: any, headers?: {[key: string]: any}): Response {
    return {
        status_code: 200,
        content: content,
        headers: headers
    }
}

export async function file(path: string): Promise<Response> {
    try{
        const content = await fs.readFile(path);
        const mimeType = determineContentType(path);
        return {
            status_code: 200,
            content: content,
            headers: {
                "Content-Type": mimeType
            }
        }
    }catch(e) {
        // console.error(e);
        return server_error();
    }
}

export function server_error(content?: any): Response {
    return {
        status_code: 500,
        content: content
    }
}

export function bad_request(content?: any): Response {
    return {
        status_code: 400,
        content: content,
    }
}

export function not_found(content?: any): Response {
    return {
        status_code: 404,
        content: content
    }
}

export function unauthorized(content?: any): Response {
    return {
        status_code: 401,
        content: content
    }
}

export function forbidden(content?: any): Response {
    return {
        status_code: 403,
        content: content
    }
}

export function redirect(path: string): Response {
    return {
        status_code: 303,
        content: null,
        headers: {
            "Location": path
        }
    }
}

export function response_code(status_code: number, content?: any): Response {
    return {
        status_code: status_code,
        content: content
    }
}

export function set_header(response: Response, key: string, value: string) {
    if(response.headers === undefined) {
        response.headers = {};
    }
    response.headers[key] = value;
}

export enum MIME {
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
 * Guess mimetype of file based on extension.
 * @param path the path to get mimetype of
 * @return the mimetype based on the path
 */
export const determineContentType = (path: string): MIME => {
    let split = path.split(".")
    let extension = split[split.length - 1].toLowerCase()

    const extensionsToMimeTypes: { [extension: string]: MIME } = {
        "css": MIME.css,
        "html": MIME.html,
        "ico": MIME.ico,
        "jpg": MIME.jpg,
        "json": MIME.json,
        "js": MIME.javascript,
        "mp3": MIME.mp3,
        "png": MIME.png,
    };
    if (extension in extensionsToMimeTypes) {
        return extensionsToMimeTypes[extension];
    }
    return MIME.any;
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
        connection.writeHead(response.status_code);
        connection.end(response.content);
    }
    catch(e) {
        console.error(e);
        connection.statusCode = 500;
        connection.end();
    }
}
