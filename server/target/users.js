"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = exports.UserCache = void 0;
class UserCache {
    users;
    constructor() {
        this.users = {};
    }
    /**
     * Add user to cache.
     *
     * @param identifier the identifier of the user
     * @param locationId the id of the post the user is authorized to adminster
     * @returns the user object
     */
    addUser(identifier, locationId) {
        const user = new User(locationId);
        this.users[identifier] = user;
        return user;
    }
    /**
     * Retrieve user of client sending request.
     *
     * @param identifier the identifier of an user
     * @returns the matching user
     */
    userFromIdentifier(identifier) {
        const user = this.users[identifier];
        if (user === undefined) {
            return new User(-1);
        }
        return user;
    }
    /**
     * Retrieve user of client sending request.
     *
     * @param req the request from the client
     * @returns the matching user
     */
    userFromRequest(req) {
        const identifier = req.headers["id"];
        return this.userFromIdentifier(identifier);
    }
    /**
     * Delete users not access recently.
     */
    deleteUnusedUsers() {
        // TODO
    }
}
exports.UserCache = UserCache;
class User {
    /** Id of the post the user is connected to. */
    locationId;
    constructor(locationId) {
        this.locationId = locationId;
    }
    /**
     * Check if an user is a master user.
     *
     * @param userId the id of the user to check
     * @returns `true` if the user is a master user, `false` otherwise
     */
    isMasterUser() {
        return this.locationId === Infinity;
    }
    /**
     * Check if an user is a post user.
     *
     * @param userId the id of the user to check
     * @return `true` if the user is a post user, `false` otherwise
     */
    isPostUser() {
        return this.locationId >= 0 && this.locationId !== Infinity;
    }
}
exports.User = User;
