import * as zod from "zod";

import { Database } from "./database";
import { PatrolUpdate } from "@/shared/types";

const PatrolUpdate = zod.object({
    id: zod.number(),
    patrolId: zod.number(),
    currentLocationId: zod.number(),
    targetLocationId: zod.number(),
    time: zod.date(),
}).brand("PatrolUpdate");

/**
 * Delete patrol update from database.
 *
 * @param database the database to delete updatr from
 * @param patrolUpdateId the id of the patrol update to delete
 */
export function deleteUpdate(database: Database, patrolUpdateId: number): void {
    database.prepare("DELETE FROM PatrolUpdates WHERE id = ?")
        .run(patrolUpdateId);
}

/**
 * Get patrol update by id.
 *
 * @param database the database to retrieve the update from
 * @param patrolUpdateId the id of the patrol update
 * @returns the patrol update
 */
export function getUpdateById(database: Database, patrolUpdateId: number): PatrolUpdate {
    const databaseResponse = database.prepare("SELECT * FROM PatrolUpdates WHERE id = ?")
        .get(patrolUpdateId)
    return PatrolUpdate.parse(databaseResponse);
}

/**
 * Get the latest `PatrolUpdate` of the specified patrol.
 *
 * @param database the database
 * @param patrolId the id of the patrol to get the latest updates of
 * @param amount the number of `PatrolUpdate`s to get
 * @returns the latest `PatrolUpdate`s of the patrol
 */
export function latestUpdatesOfPatrol(database: Database, patrolId: number, amount?: number): PatrolUpdate[] {
        const fetchStmt = "SELECT * FROM PatrolUpdates WHERE patrolId = ? ORDER BY timeStr DESC";

        let patrolUpdates;
        if (amount === undefined) {
            patrolUpdates = database.prepare(fetchStmt).all(patrolId);
        } else  {
            patrolUpdates = database.prepare(fetchStmt + " LIMIT ?")
                .all(patrolId, amount);
        }

        return zod.array(PatrolUpdate).parse(patrolUpdates);
}

/**
 * Get the latest `PatrolUpdate` of the specified patrol.
 *
 * @param database the database
 * @param patrolId the id of the patrol to get the latest update of
 * @returns A `PatrolUpdate` object representing the latest update of the patrol
 */
export function latestUpdateOfPatrol(database: Database, patrolId: number): PatrolUpdate {
    return latestUpdatesOfPatrol(database, patrolId, 1)[0];
}
