import { Database } from "./database";
import { Location } from "@/shared/types";
import * as validation from "@/shared/validation";
import * as zod from "zod";

const Location = zod.object({
    id: zod.number(),
    name: zod.string(),
    team: zod.number(),
    open: validation.boolean,
    lastUpdate: zod.date(),
});

/**
 * Get information about a location.
 *
 * @param database the database
 * @param locationId the id of the location to get
 * @returns the location
 */
export function getLocation(database: Database, locationId: number): Location {
    const rawLocation = database.prepare("SELECT * FROM Location WHERE id = ?")
        .get(locationId);
    return Location.parse(rawLocation);
}

/**
 * Change status of location.
 *
 * @param database the database
 * @param locationId the id of the location to change
 * @param open `true` if the location should be open, `false` otherwise
 */
export function changeLocationStatus(database: Database, locationId: number, open: boolean): void {
    database.prepare("UPDATE Location SET open = ? WHERE id = ?")
        .run(open, locationId);
}

/**
 * Get all ids of locations.
 *
 * @returns list of location ids
 */
export function allLocationIds(database: Database): number[] {
    const rows = database.prepare("SELECT id FROM Location").all() as { id: number }[];
    return rows.map((row) => row.id);
}
