import { ServiceBase } from "./database";
import { PatrolLocationType, PatrolLocation, Patrol } from "./types";

export class PatrolService extends ServiceBase {
    /**
    * Get information about patrol.
    * @param patrolId the id of the patrol to get information about
    * @returns information about the patrol
    */
    patrolInfo(patrolId: number): Patrol | undefined{
        return this.prepare("SELECT * FROM patrol WHERE id = ?").get(patrolId) as Patrol | undefined;
    }

    /**
     * Change udgået status of patrol.
     *
     * @param patrolId the id of the patrol to change
     * @param udgået `true` if the patrol id "udgået", `false` otherwise
     */
    changePatrolStatus(patrolId: number, udgået: boolean): void{
        this.prepare("UPDATE patrol SET udgået = ? WHERE id = ?").run(udgået, patrolId);
    }

    /**
     * Get current location of patrol.
     * 
     * @param patrolId the id of the patrol
     * @returns the location as `PatrolLocation` object of the patrol or `undefined` if patrol does not exist.
     * If the patrol is udgået, the locationId will be the last location that the patrol was at.
     */
    locationOfPatrol(patrolId: number): PatrolLocation | undefined {
        // Check if patrol is udgået
        const patrol = this.patrolInfo(patrolId);
        
        const row = this.prepare(
            `SELECT lpu.currentLocationId, lpu.targetLocationId
            FROM LatestPatrolUpdates lpu
            WHERE lpu.patrolId = ?`
        ).get(patrolId) as { currentLocationId: number, targetLocationId: number } | undefined;

        if(row == undefined || patrol == undefined) {
            return undefined;
        }

        if(patrol.udgået) {
            return {
                type: PatrolLocationType.Udgået,
                locationId: row.currentLocationId
            };
        }

        if(row.currentLocationId === row.targetLocationId) {
            return {
                type: PatrolLocationType.OnLocation,
                locationId: row.currentLocationId
            };
        }
        else{
            return {
                type: PatrolLocationType.GoingToLocation,
                locationId: row.targetLocationId
            };
        }
    }

    /**
     * Get list of all patrol ids.
     *
     * @returns a list of all patrol ids
     */
    allPatrolIds(): number[]{
        const rows = this.prepare("SELECT id FROM patrol").all() as { id: number }[];
        return rows.map((row) => row.id);
    }
}