import * as http from 'http';
/**
 * Http response.
 */
export declare class Response {
    statusCode: number;
    content: string | Buffer | undefined;
    headers: {
        [key: string]: string;
    };
    cookies: {
        [key: string]: string;
    };
    /**
     * Create new empty http response.
     *
     * @param statusCode the status code of the response
     */
    constructor(statusCode: number);
    /**
     * Create new ok http response.
     *
     * @returns a new response
     */
    static ok(): Response;
    /**
     * Create new redirect http response.
     *
     * @param path the path to redirect to
     * @returns a new response
     */
    static redirect(path: string): Response;
    /**
     * Create a new unauthorized response.
     *
     * @returns a new response
     */
    static unauthorized(): Response;
    /**
     * Create a new forbidden response.
     *
     * @returns a new response
     */
    static forbidden(): Response;
    /**
     * Create a new not found response.
     *
     * @returns a new response
     */
    static notFound(): Response;
    /**
     * Create a new server error response.
     *
     * @returns a new response
     */
    static serverError(): Response;
    /**
     * Set a header of the response
     *
     * @param key the key of the header
     * @param value the value of the header
     * @returns this response
     */
    setHeader(key: string, value: string): Response;
    /**
     * Set a cookie of the response
     *
     * @param key the key of the cookie
     * @param value the value of the cookie
     * @returns this response
     */
    setCookie(key: string, value: string): Response;
    /**
     * Set the content of the response.
     *
     * @param content the new content of the response
     * @returns this response
     */
    setContent(content: string | Buffer): Response;
    /**
     * Create a http response with the contents of a file.
     *
     * @param path the path to the file to send
     * @returns a response
     */
    static file(path: string): Promise<Response>;
}
/**
 * Send response to client.
 *
 * @param connection the connection with the client
 * @param response the response to send to the client
 */
export declare function send(connection: http.ServerResponse, response: Response): void;
