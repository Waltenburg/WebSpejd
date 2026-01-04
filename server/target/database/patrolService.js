"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatrolService = void 0;
const error_1 = require("../error");
const database_1 = require("./database");
class PatrolService extends database_1.ServiceBase {
    /**
    * Get information about patrol.
    * @param patrolId the id of the patrol to get information about
    * @returns information about the patrol
    */
    patrolInfo(patrolId) {
        const patrol = this.prepare("SELECT * FROM patrol WHERE id = ?").get(patrolId);
        if (!patrol)
            throw new error_1.PatrolNotFoundError(patrolId);
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
            throw new error_1.PatrolNotFoundError(patrolId);
    }
    // /**
    //  * Get current location of patrol.
    //  * 
    //  * @param patrolId the id of the patrol
    //  * @returns the location as `PatrolLocation` object of the patrol or `undefined` if patrol does not exist.
    //  * If the patrol is udgået, the locationId will be the last location that the patrol was at.
    //  */
    // locationOfPatrol(patrolId: number): PatrolLocation | undefined {
    //     // Check if patrol is udgået
    //     const patrol = this.patrolInfo(patrolId);
    //     if(!patrol)
    //         throw new PatrolNotFoundError(patrolId);
    //     const row = this.prepare(
    //         `SELECT lpu.currentLocationId, lpu.targetLocationId
    //         FROM LatestPatrolUpdates lpu
    //         WHERE lpu.patrolId = ?`
    //     ).get(patrolId) as { currentLocationId: number, targetLocationId: number } | undefined;
    //     const patrolHasUpdates = row !== undefined;
    //     const patrolIsActive = !patrol.udgået;
    //     const locationType = row === undefined ? PatrolLocationType.NoLocationUpdates : 
    //         (row.currentLocationId === row.targetLocationId ? PatrolLocationType.OnLocation : PatrolLocationType.GoingToLocation);
    //     if(row.currentLocationId === row.targetLocationId) {
    //         return {
    //             type: PatrolLocationType.OnLocation,
    //             locationId: row.currentLocationId
    //         };
    //     }
    //     else{
    //         return {
    //             type: PatrolLocationType.GoingToLocation,
    //             locationId: row.targetLocationId
    //         };
    //     }
    // }
    /**
     * Get list of all patrol ids.
     *
     * @returns a list of all patrol ids
     */
    allPatrolIds() {
        const rows = this.prepare("SELECT id FROM patrol").all();
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
exports.PatrolService = PatrolService;
