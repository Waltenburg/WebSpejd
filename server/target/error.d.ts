export declare class PatrolNotFoundError extends Error {
    constructor(patrolId: number);
}
export declare class LocationNotFoundError extends Error {
    constructor(locationId: number);
}
export declare class RouteNotFoundError extends Error {
    constructor(fromLocationId: number, toLocationId: number);
}
export declare class UserNotFoundError extends Error {
    constructor(userId: number);
}
export declare class AccessDeniedError extends Error {
    constructor();
}
