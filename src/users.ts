import * as http from 'http';

export class UserCache {
    private users: { [key: string]: User };

    constructor() {
        this.users = {};
    }

    /**
     * Add user to cache.
     *
     * @param identifier the identifier of the user
     * @param postId the id of the post the user is authorized to adminster
     * @returns the user object
     */
    addUser(identifier: string, postId: number): User {
        const user = new User(postId);
        this.users[identifier] = user;
        return user;
    }

    /**
     * Retrieve user of client sending request.
     *
     * @param req the request from the client
     * @returns the matching user
     */
    userFromRequest(req: http.IncomingMessage): User {
        const identifier = req.headers["id"] as string;
        const user = this.users[identifier];
        if(user === undefined) {
            return new User(-1);
        }
        return user;
    }

    /**
     * Delete users not access recently.
     */
    deleteUnusedUsers() {
        // TODO
    }

}

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
