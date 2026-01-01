import type { Location, Patrol, PatrolUpdate } from "./types";

export interface PatrolInfoToMandskab extends Pick<Patrol, "id" | "number" | "name"> {}

export interface MandskabData {
    patrolsOnLocation: PatrolInfoToMandskab[];
    patrolsTowardsLocation: PatrolInfoToMandskab[];
    location: Location;
    routesTo: Location[];
    latestUpdates: FullPatrolUpdateInfo[];
}

export interface PatrolUpdateFromMandskab {
    patrolId: number;
    targetLocationId: number;
}

export interface FullPatrolUpdateInfo extends Omit<PatrolUpdate, "patrolId"> {
    patrol: PatrolInfoToMandskab;
    targetLocationName: string;
}
