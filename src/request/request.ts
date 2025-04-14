import * as http from 'http'

// export interface Request {
//     user: User;
//     url: URL;
//     path: string;
//     query: { [key: string]: string };
//     headers: { [key: string]: string };
//     cookies: { [key: string]: string };
//     body: string;
// }

export class Request {
    url: URL;
    path: string;
    headers: { [key: string]: string };
    cookies: { [key: string]: string };
    inner: http.IncomingMessage;


    constructor(request: http.IncomingMessage) {
        this.url = new URL(`http://example.com${request.url}`);
        this.path = this.url.pathname;
        this.inner = request;

        this.headers = {}
        for(let header in request.headers) {
            this.headers[header.toLowerCase()] = request.headers[header] as string;
        }

        this.cookies = {};
        if(this.headers["cookie"] !== undefined) {
            this.headers["cookie"]
                .split(";")
                .forEach((cookieString) => {
                    const trimmed = cookieString.trim();
                    const splitPoint = trimmed.indexOf("=");
                    const key = trimmed.slice(0, splitPoint);
                    const value = trimmed.slice(splitPoint+1);
                    this.cookies[key] = value;
                });
        }
    }


    getParam = (key: string): string | null => {
        return this.url.searchParams.get(key);
    }

    getParamAsNumber = (key: string): number | null => {
        const value = this.getParam(key);
        if(value === null) {
            return null;
        }
        return Number.parseInt(value);
    }


    body = async (): Promise<string> => {
        const body: string = await new Promise((resolve, reject) => {
            const chunks: string[] = [];

            this.inner.on("data", (chunk) => {
                chunks.push(chunk);
            });

            this.inner.on("end", () => {
                resolve(chunks.join());
            });

            this.inner.on("error", (error) => {
                reject(error);
            });
        });
        return body;
    }

}
