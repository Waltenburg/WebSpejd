import type { Location, Patrol } from "./types";

export interface PatrolInfoToMandskab extends Pick<Patrol, "id" | "number" | "name"> {}

export interface MandskabData {
    patrolsOnLocation: PatrolInfoToMandskab[];
    patrolsTowardsLocation: PatrolInfoToMandskab[];
    location: Location;
    routesTo: Location[];
}

export interface PatrolUpdateFromMandskab {
    patrolId: number;
    targetLocationId: number;
}