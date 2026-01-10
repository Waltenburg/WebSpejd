import { RunResult } from "better-sqlite3";
import { deletePatrol } from "../endpointHandlers/patrolConfigHandler";
import { PatrolNotFoundError } from "../error";
import { PATROL_TABLE, PATROL_UPDATE_TABLE, ServiceBase } from "./database";
import { PatrolLocationType, Patrol } from "@shared/types";

export class PatrolService extends ServiceBase {
    /**
    * Get information about patrol.
    * @param patrolId the id of the patrol to get information about
    * @returns information about the patrol
    */
    patrolInfo(patrolId: number): Patrol{
        const patrol = this.prepare("SELECT * FROM patrol WHERE id = ?").get(patrolId) as Patrol | undefined;
        if(!patrol)
            throw new PatrolNotFoundError(patrolId);
        // @ts-expect-error - converting from integer to boolean
        patrol.udgået = patrol.udgået === 1;
        return patrol;
    }

    /**
     * Change udgået status of patrol.
     *
     * @param patrolId the id of the patrol to change
     * @param udgået `true` if the patrol id "udgået", `false` otherwise
     */
    changePatrolStatus(patrolId: number, udgået: boolean): void{
        const result = this.prepare("UPDATE patrol SET udgået = ? WHERE id = ?").run(udgået ? 1 : 0, patrolId);
        if(result.changes === 0)
            throw new PatrolNotFoundError(patrolId);
    }

    addPatrol(number: string, name: string): number {
        const result = this.prepare("INSERT INTO patrol (number, name, udgået) VALUES (?, ?, 0)").run(number, name);
        return result.lastInsertRowid as number;
    }

    deletePatrol(patrolId: number): boolean {
        const result = this.prepare("DELETE FROM patrol WHERE id = ?").run(patrolId);
        return result.changes > 0;
    }

    alterPatrolNumberAndName(patrolId: number, number?: string, name?: string): boolean {
        let result: RunResult;
        if (number && name) 
            result = this.prepare("UPDATE patrol SET number = ?, name = ? WHERE id = ?").run(number, name, patrolId);
        else if (number)
            result = this.prepare("UPDATE patrol SET number = ? WHERE id = ?").run(number, patrolId);
        else if (name)
            result = this.prepare("UPDATE patrol SET name = ? WHERE id = ?").run(name, patrolId);
        else
            return false;
        return result.changes > 0;
    }

    /**
     * Get list of all patrol ids.
     *
     * @returns a list of all patrol ids
     */
    allPatrolIds(): number[]{
        const rows = this.prepare("SELECT id FROM patrol ORDER BY number").all() as { id: number }[];
        return rows.map((row) => row.id);
    }

    allPatrolsWithNoUpdates(): number[] {
        const rows = this.prepare(
            `SELECT p.id
            FROM patrol p
            LEFT JOIN ${PATROL_UPDATE_TABLE.LATEST_UPDATE_VIEW} lu ON p.id = lu.patrolId
            WHERE lu.patrolId IS NULL`
        ).all() as { id: number }[];
        return rows.map((row) => row.id);
    }
}