import { User } from "../users";

export interface Request {
    user: User,
    url: URL,
    path: string;
    query: { [key: string]: string };
    headers: { [key: string]: string };
    cookies: { [key: string]: string };
    body: string;
}
