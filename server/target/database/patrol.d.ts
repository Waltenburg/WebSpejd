import { Database } from "./database";
import { Patrol } from "@/shared/types";
import * as zod from "zod";
declare const Patrol: zod.ZodObject<{
    id: zod.ZodNumber;
    number: zod.ZodString;
    name: zod.ZodString;
    udgået: any;
}, zod.z.core.$strip>;
/**
 * Get information about patrol.
 *
 * @param database the database
 * @param patrolId the id of the patrol to get information about
 * @returns information about the patrol
 */
export declare function getPatrol(database: Database, patrolId: number): Patrol;
/**
 * Change udgået status of patrol.
 *
 * @param database the database to update
 * @param patrolId the id of the patrol to change
 * @param halted `true` if the patrol id "halted", `false` otherwise
 */
export declare function changePatrolStatus(database: Database, patrolId: number, halted: boolean): void;
export {};
