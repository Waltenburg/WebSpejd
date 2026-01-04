import { PatrolNotFoundError } from "../error";
import { Database } from "./database";
import { Patrol } from "@/shared/types";
import * as zod from "zod";
import * as location from "@/shared/validation";

const Patrol = zod.object({
    id: zod.number(),
    number: zod.string(),
    name: zod.string(),
    udgået: location.boolean,
});

/**
 * Get information about patrol.
 *
 * @param database the database
 * @param patrolId the id of the patrol to get information about
 * @returns information about the patrol
 */
export function getPatrol(database: Database, patrolId: number): Patrol {
    const rawPatrol = database.prepare("SELECT * FROM patrol WHERE id = ?")
        .get(patrolId);
    return Patrol.parse(rawPatrol);
}

/**
 * Change udgået status of patrol.
 *
 * @param database the database to update
 * @param patrolId the id of the patrol to change
 * @param halted `true` if the patrol id "halted", `false` otherwise
 */
export function changePatrolStatus(database: Database, patrolId: number, halted: boolean): void{
    const result = database.prepare("UPDATE patrol SET udgået = ? WHERE id = ?")
        .run(halted ? 1 : 0, patrolId);
    if(result.changes === 0) {
        throw new PatrolNotFoundError(patrolId);
    }
}
