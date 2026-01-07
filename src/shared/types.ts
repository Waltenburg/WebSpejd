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
    fromLocationId: number;
    toLocationId: number;
    is_open: boolean;
    distance?: number;
}

export interface FullRouteInfo extends Omit<Route, 'fromLocationId' | 'toLocationId'> {
    from: Location;
    to: Location;
}

export enum PatrolLocationType {
    OnLocation, GoingToLocation, NoLocationUpdates
}

// export interface PatrolLocation {
//     /** Is the patrol on a location or going to a location. */
//     type: PatrolLocationType,
//     /** Id of the location the patrol is going to or on */
//     locationId: number,
// }

/** Full information about a patrol, including its location.\
 *  Union of `Patrol` and some fields of `PatrolUpdate`. */
export interface FullPatrolInfo extends Patrol, Pick<PatrolUpdateWithNoId, "currentLocationId" | "targetLocationId" | "time"> {}


/** Information about a patrol. */
export interface Patrol {
    /** ID of the patrol. This is a unique identifier for the patrol. */
    id: number;
    /** Number of the patrol. This is the number that will be displayed to users. Does not have to be unique. */
    number: string;
    /** Name of the patrol */
    name: string;
    /** Whether the patrol is udgået. `true` if the patrol is udgået, `false` otherwise. */
    udgået: boolean;
}

export interface PatrolUpdateWithNoId {
    /** The id of the patrol that checked in. */
    patrolId: number;
    /** The id of the post the patrol is currently at. */
    currentLocationId: number;
    /** The id of the post the patrol is moving towards or checking into. */
    targetLocationId: number;
    /** Time of Patrol Update. */
    time: Date;
}

/** Information about a patrol checkin or checkout. */
export interface PatrolUpdate extends PatrolUpdateWithNoId {
    /** Id of the checkin. */
    id: number;
}

/** Information about a user as it is stored in the database */
export interface User{
    id: number;
    locationId: number;
    password: string;
}