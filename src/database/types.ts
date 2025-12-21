/** Information about a location. */
export interface Location {
    id: number;
    name: string;
    team: number;
    open: boolean;
    lastUpdate: Date;
}

export interface Route{
    id: number;
    fromLocation: number;
    toLocation: number;
    open: boolean;
    distance?: number;
}

export enum PatrolLocationType {
    OnLocation, GoingToLocation, Udgået
}

export interface PatrolLocation {
    /** Is the patrol on a location or going to a location. */
    type: PatrolLocationType,
    /** Id of the location the patrol is going to or on */
    locationId: number,
}

/** Information about a patrol. */
export interface Patrol {
    id: number;
    name: string;
    udgået: boolean;
}

export enum PatrolUpdateType {
    CheckIn, CheckOut
}

/** Information about a patrol checkin or checkout. */
export interface PatrolUpdate {
    /** Id of the checkin. */
    id?: number;
    /** The id of the patrol that checked in. */
    patrolId: number;
    /** The id of the post the patrol is currently at. */
    currentLocationId: number;
    /** The id of the post the patrol is moving towards or checking into. */
    targetLocationId: number;
    /** The time the patrol was checked in. */
    time: Date;
}

/** Information about a user as it is stored in the database */
export interface User{
    id: number;
    postId: number;
    password: string;
}