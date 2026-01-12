"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserNotFoundError = exports.RouteNotFoundError = exports.LocationNotFoundError = exports.PatrolNotFoundError = void 0;
class PatrolNotFoundError extends Error {
    constructor(patrolId) {
        super(`Patrol with ID ${patrolId} not found.`);
        this.name = "PatrolNotFoundError";
    }
}
exports.PatrolNotFoundError = PatrolNotFoundError;
class LocationNotFoundError extends Error {
    constructor(locationId) {
        super(`Location with ID ${locationId} not found.`);
        this.name = "LocationNotFoundError";
    }
}
exports.LocationNotFoundError = LocationNotFoundError;
class RouteNotFoundError extends Error {
    constructor(fromLocationId, toLocationId) {
        super(`Route from location ID ${fromLocationId} to location ID ${toLocationId} not found.`);
        this.name = "RouteNotFoundError";
    }
}
exports.RouteNotFoundError = RouteNotFoundError;
class UserNotFoundError extends Error {
    constructor(userId) {
        super(`User with ID ${userId} not found.`);
        this.name = "UserNotFoundError";
    }
}
exports.UserNotFoundError = UserNotFoundError;
//# sourceMappingURL=error.js.map