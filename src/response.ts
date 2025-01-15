import * as fs from "fs/promises";
import * as http from 'http'
import {files} from "./files";
import * as pages from "./pages";

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
    const content = await fs.readFile(path);
    const mimeType = files.determineContentType(path);
    return {
        status_code: 200,
        content: content,
        headers: {
            "Content-Type": mimeType
        }
    }
}

export function server_error(content?: any): Response {
    return {
        status_code: 500,
        content: content
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
