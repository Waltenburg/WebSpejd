export class PatrolNotFoundError extends Error {
    constructor(patrolId) {
        super(`Patrol with ID ${patrolId} not found.`);
        this.name = "PatrolNotFoundError";
    }
}
export class LocationNotFoundError extends Error {
    constructor(locationId) {
        super(`Location with ID ${locationId} not found.`);
        this.name = "LocationNotFoundError";
    }
}
export class RouteNotFoundError extends Error {
    constructor(fromLocationId, toLocationId) {
        super(`Route from location ID ${fromLocationId} to location ID ${toLocationId} not found.`);
        this.name = "RouteNotFoundError";
    }
}
export class UserNotFoundError extends Error {
    constructor(userId) {
        super(`User with ID ${userId} not found.`);
        this.name = "UserNotFoundError";
    }
}
//# sourceMappingURL=error.js.map