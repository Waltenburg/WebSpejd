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
    allPatrolIds(): number[]{
        const rows = this.prepare("SELECT id FROM patrol").all() as { id: number }[];
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