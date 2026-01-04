import * as zod from "zod";
import { Database } from "./database";
import { PatrolUpdate } from "@/shared/types";
declare const PatrolUpdate: zod.z.core.$ZodBranded<zod.ZodObject<{
    id: zod.ZodNumber;
    patrolId: zod.ZodNumber;
    currentLocationId: zod.ZodNumber;
    targetLocationId: zod.ZodNumber;
    time: zod.ZodDate;
}, zod.z.core.$strip>, "PatrolUpdate">;
/**
 * Delete patrol update from database.
 *
 * @param database the database to delete updatr from
 * @param patrolUpdateId the id of the patrol update to delete
 */
export declare function deleteUpdate(database: Database, patrolUpdateId: number): void;
/**
 * Get patrol update by id.
 *
 * @param database the database to retrieve the update from
 * @param patrolUpdateId the id of the patrol update
 * @returns the patrol update
 */
export declare function getUpdateById(database: Database, patrolUpdateId: number): PatrolUpdate;
/**
 * Get the latest `PatrolUpdate` of the specified patrol.
 *
 * @param database the database
 * @param patrolId the id of the patrol to get the latest updates of
 * @param amount the number of `PatrolUpdate`s to get
 * @returns the latest `PatrolUpdate`s of the patrol
 */
export declare function latestUpdatesOfPatrol(database: Database, patrolId: number, amount?: number): PatrolUpdate[];
/**
 * Get the latest `PatrolUpdate` of the specified patrol.
 *
 * @param database the database
 * @param patrolId the id of the patrol to get the latest update of
 * @returns A `PatrolUpdate` object representing the latest update of the patrol
 */
export declare function latestUpdateOfPatrol(database: Database, patrolId: number): PatrolUpdate;
export {};
