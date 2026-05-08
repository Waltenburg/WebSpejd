import * as fs from "fs/promises";
import { files } from "./files";
export function ok(content, headers) {
    return {
        status_code: 200,
        content: content,
        headers: headers
    };
}
export async function file(path) {
    try {
        const content = await fs.readFile(path);
        const mimeType = files.determineContentType(path);
        return {
            status_code: 200,
            content: content,
            headers: {
                "Content-Type": mimeType
            }
        };
    }
    catch (e) {
        // console.error(e);
        return server_error();
    }
}
export function server_error(content) {
    return {
        status_code: 500,
        content: content
    };
}
export function not_found(content) {
    return {
        status_code: 404,
        content: content
    };
}
export function unauthorized(content) {
    return {
        status_code: 401,
        content: content
    };
}
export function forbidden(content) {
    return {
        status_code: 403,
        content: content
    };
}
export function redirect(path) {
    return {
        status_code: 303,
        content: null,
        headers: {
            "Location": path
        }
    };
}
export function response_code(status_code, content) {
    return {
        status_code: status_code,
        content: content
    };
}
/**
 * Send response to client.
 *
 * @param connection the connection with the client
 * @param response the response to send to the client
 */
export function send(connection, response) {
    for (let header in response.headers) {
        connection.setHeader(header, response.headers[header]);
    }
    connection.writeHead(response.status_code);
    connection.end(response.content);
}
//# sourceMappingURL=response.js.map