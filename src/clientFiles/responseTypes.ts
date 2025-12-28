import type { Location, Patrol } from "../database/types";

// export interface PatrolInfoToMandskab {
//     id: number;
//     number: number;
//     name: string;
// }

export interface PatrolInfoToMandskab extends Pick<Patrol, "id" | "number" | "name"> {}

export interface MandskabData {
    patrolsOnLocation: PatrolInfoToMandskab[];
    patrolsTowardsLocation: PatrolInfoToMandskab[];
    location: Location;
    routesTo: Location[];
}

export const enum Action {
    checkinToLocation,
    checkoutFromLocation
}

export interface PatrolUpdateFromMandskab {
    patrolId: number;
    targetLocationId: number;
}