import { PatrolNotFoundError } from "../error.js";
import { ServiceBase } from "./database.js";
export class PatrolService extends ServiceBase {
    /**
    * Get information about patrol.
    * @param patrolId the id of the patrol to get information about
    * @returns information about the patrol
    */
    patrolInfo(patrolId) {
        const patrol = this.prepare("SELECT * FROM patrol WHERE id = ?").get(patrolId);
        if (!patrol) {
            throw new PatrolNotFoundError(patrolId);
        }
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
    changePatrolStatus(patrolId, udgået) {
        const result = this.prepare("UPDATE patrol SET udgået = ? WHERE id = ?").run(udgået ? 1 : 0, patrolId);
        if (result.changes === 0)
            throw new PatrolNotFoundError(patrolId);
    }
    addPatrol(number, name) {
        const result = this.prepare("INSERT INTO patrol (number, name, udgået) VALUES (?, ?, 0)").run(number, name);
        return result.lastInsertRowid;
    }
    deletePatrol(patrolId) {
        const result = this.prepare("DELETE FROM patrol WHERE id = ?").run(patrolId);
        return result.changes > 0;
    }
    alterPatrolNumberAndName(patrolId, number, name) {
        let result;
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
    allPatrolIds() {
        const rows = this.prepare("SELECT id FROM patrol ORDER BY number").all();
        return rows.map((row) => row.id);
    }
    allPatrolsWithNoUpdates() {
        const rows = this.prepare(`SELECT p.id
            FROM patrol p
            LEFT JOIN ${"LatestPatrolUpdates" /* PATROL_UPDATE_TABLE.LATEST_UPDATE_VIEW */} lu ON p.id = lu.patrolId
            WHERE lu.patrolId IS NULL`).all();
        return rows.map((row) => row.id);
    }
}
//# sourceMappingURL=patrolService.js.map