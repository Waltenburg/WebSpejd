import * as http from 'http';
export declare class UserCache {
    private users;
    constructor();
    /**
     * Add user to cache.
     *
     * @param identifier the identifier of the user
     * @param locationId the id of the post the user is authorized to adminster
     * @returns the user object
     */
    addUser(identifier: string, locationId: number): User;
    /**
     * Retrieve user of client sending request.
     *
     * @param identifier the identifier of an user
     * @returns the matching user
     */
    userFromIdentifier(identifier: string): User;
    /**
     * Retrieve user of client sending request.
     *
     * @param req the request from the client
     * @returns the matching user
     */
    userFromRequest(req: http.IncomingMessage): User;
    /**
     * Delete users not access recently.
     */
    deleteUnusedUsers(): void;
}
export declare class User {
    /** Id of the post the user is connected to. */
    locationId: number;
    constructor(locationId: number);
    /**
     * Check if an user is a master user.
     *
     * @param userId the id of the user to check
     * @returns `true` if the user is a master user, `false` otherwise
     */
    isMasterUser(): boolean;
    /**
     * Check if an user is a post user.
     *
     * @param userId the id of the user to check
     * @return `true` if the user is a post user, `false` otherwise
     */
    isPostUser(): boolean;
}
