import { Database } from "./database";
import { Location } from "@/shared/types";
import * as zod from "zod";
declare const Location: zod.ZodObject<{
    id: zod.ZodNumber;
    name: zod.ZodString;
    team: zod.ZodNumber;
    open: any;
    lastUpdate: zod.ZodDate;
}, zod.z.core.$strip>;
/**
 * Get information about a location.
 *
 * @param database the database
 * @param locationId the id of the location to get
 * @returns the location
 */
export declare function getLocation(database: Database, locationId: number): Location;
/**
 * Change status of location.
 *
 * @param database the database
 * @param locationId the id of the location to change
 * @param open `true` if the location should be open, `false` otherwise
 */
export declare function changeLocationStatus(database: Database, locationId: number, open: boolean): void;
/**
 * Get all ids of locations.
 *
 * @returns list of location ids
 */
export declare function allLocationIds(database: Database): number[];
export {};
