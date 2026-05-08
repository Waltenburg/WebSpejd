import * as http from 'http';
export interface Response {
    status_code: number;
    content: string | Buffer | null;
    headers?: {
        [key: string]: any;
    };
}
export declare function ok(content?: any, headers?: {
    [key: string]: any;
}): Response;
export declare function file(path: string): Promise<Response>;
export declare function server_error(content?: any): Response;
export declare function not_found(content?: any): Response;
export declare function unauthorized(content?: any): Response;
export declare function forbidden(content?: any): Response;
export declare function redirect(path: string): Response;
export declare function response_code(status_code: number, content?: any): Response;
/**
 * Send response to client.
 *
 * @param connection the connection with the client
 * @param response the response to send to the client
 */
export declare function send(connection: http.ServerResponse, response: Response): void;
//# sourceMappingURL=response.d.ts.map