export class PatrolNotFoundError extends Error {
    constructor(patrolId: number) {
        super(`Patrol with ID ${patrolId} not found.`);
        this.name = "PatrolNotFoundError";
    }
}

export class LocationNotFoundError extends Error {
    constructor(locationId: number) {
        super(`Location with ID ${locationId} not found.`);
        this.name = "LocationNotFoundError";
    }
}

export class RouteNotFoundError extends Error {
    constructor(fromLocationId: number, toLocationId: number) {
        super(`Route from location ID ${fromLocationId} to location ID ${toLocationId} not found.`);
        this.name = "RouteNotFoundError";
    }
}

export class UserNotFoundError extends Error {
    constructor(userId: number) {
        super(`User with ID ${userId} not found.`);
        this.name = "UserNotFoundError";
    }
}

export class AccessDeniedError extends Error {
    constructor() {
        super(`The user does not have access to the requested resource`);
        this.name = "AccessDeniedError";
    }
}
