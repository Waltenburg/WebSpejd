import * as http from 'http';
import { serverClasses as sc } from "./serverClasses";

export class User {
    /** Id of the post the user is connected to. */
    postId: number;

    constructor(postId: number) {
        this.postId = postId;
    }

    /**
     * Check if an user is a master user.
     *
     * @param userId the id of the user to check
     * @returns `true` if the user is a master user, `false` otherwise
     */
    isMasterUser(): boolean {
        return this.postId === Infinity;
    }

    /**
     * Check if an user is a post user.
     *
     * @param userId the id of the user to check
     * @return `true` if the user is a post user, `false` otherwise
     */
    isPostUser(): boolean {
        return this.postId >= 0 && this.postId !== Infinity;
    }
}

/**
 * Extract user id from request.
 *
 * @param req the incoming http request
 * @return user id in request
 */
export const userFromRequest = (req: http.IncomingMessage): User => {
    const userId = req.headers["id"] as string;
    const postId = sc.User.recognizeUser(userId);
    return new User(postId);
}
