"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = exports.UserCache = void 0;
class UserCache {
    constructor() {
        this.users = {};
    }
    addUser(identifier, locationId) {
        const user = new User(locationId);
        this.users[identifier] = user;
        return user;
    }
    userFromIdentifier(identifier) {
        const user = this.users[identifier];
        if (user === undefined) {
            return new User(-1);
        }
        return user;
    }
    userFromRequest(req) {
        const identifier = req.headers["id"];
        return this.userFromIdentifier(identifier);
    }
    deleteUnusedUsers() {
    }
}
exports.UserCache = UserCache;
class User {
    constructor(locationId) {
        this.locationId = locationId;
    }
    isMasterUser() {
        return this.locationId === Infinity;
    }
    isPostUser() {
        return this.locationId >= 0 && this.locationId !== Infinity;
    }
}
exports.User = User;
//# sourceMappingURL=users.js.map