import { ServiceBase} from "./database";
import { PatrolUpdate } from "./types";

/** Information about a patrol checkin or checkout.\
 * Same as `PatrolUpdate` except that it has `timeStr: string` instead of `time: Date`*/
interface DatabasePatrolUpdate {
    id: number;
    patrolId: number;
    currentLocationId: number;
    targetLocationId: number;
    timeStr: string; // String representation of the time in UTC
}

export class UpdateService extends ServiceBase {

    /** Converts from `DatabasePatrolUpdate` to `PatrolUpdate` as used in the rest of the application */
    private convertFromDBPatrolUpdate(dbPatrolUpdate: DatabasePatrolUpdate[]): PatrolUpdate[] {
        return dbPatrolUpdate.map((patrolUpdate) => {
            return {
                id: patrolUpdate.id,
                patrolId: patrolUpdate.patrolId,
                currentLocationId: patrolUpdate.currentLocationId,
                targetLocationId: patrolUpdate.targetLocationId,
                time: this.db.toLocalDateObject(patrolUpdate.timeStr),
            };
        });
    }

    /**
     * Find the latest `PatrolUpdates` of the specified patrol.
     * @param patrol the patrol to get the latest `PatrolUpdates` of
     * @return the latest `PatrolUpdates` of the patrol or `null` if none exist
     */
    latestUpdatesOfPatrol(patrol: number, amount: number): PatrolUpdate[]{
        const patrolUpdates = this.prepare("SELECT * FROM PatrolUpdates WHERE patrolId = ? ORDER BY timeStr DESC LIMIT ?").all(patrol, amount) as DatabasePatrolUpdate[];
        return this.convertFromDBPatrolUpdate(patrolUpdates);
    }

    /** Check patrol in or out of post.
     * @param patrolUpdate the patrol update to add to the database
     * @returns the id of the patrol update
    */
    updatePatrol(patrolUpdate: PatrolUpdate): number{
        this.prepare("INSERT INTO PatrolUpdates (patrolId, currentLocationId, targetLocationId) VALUES (?, ?, ?)")
        .run(patrolUpdate.patrolId, patrolUpdate.currentLocationId, patrolUpdate.targetLocationId);

        const id = (this.prepare("SELECT last_insert_rowid() as id").get() as DatabasePatrolUpdate).id;
        return id;
    }

    /**
     * Get patrol update by id.
     *
     * @param updateId the id of the patrol update
     * @returns the patrol update with the id or `undefined` if patrol update does not exist
     */
    updateById(patrolUpdateId: number): PatrolUpdate | undefined{
        const dbPatrolUpdate = this.prepare("SELECT * FROM PatrolUpdates WHERE id = ?").get(patrolUpdateId) as DatabasePatrolUpdate | undefined;
        if(dbPatrolUpdate == undefined) {
            return undefined;
        }
        return this.convertFromDBPatrolUpdate([dbPatrolUpdate])[0];
    }

    /**
     * Delete patrol update from database.
     *
     * @param patrolUpdateId the id of the patrol update to delete
     */
    deleteUpdate(patrolUpdateId: number): void{
        this.prepare("DELETE FROM PatrolUpdates WHERE id = ?").run(patrolUpdateId);
    }

    /**
     * Get the last n patrol updates.
     *
     * @param amount the amount of patrol updates to get
     * @returns the last n patrol updates
     */
    lastUpdates(amount: number): PatrolUpdate[]{
        const patrolUpdates = this.prepare("SELECT * FROM PatrolUpdates ORDER BY timeStr DESC LIMIT ?").all(amount) as DatabasePatrolUpdate[];
        return this.convertFromDBPatrolUpdate(patrolUpdates);
    }

    /**
     * Get all patrol updates at location
     * @param locationId the id of the location
     * @returns the patrol updates at the location
     */
    updatesAtLocation(locationId: number): PatrolUpdate[]{
        const patrolUpdates = this.prepare("SELECT * FROM PatrolUpdates WHERE currentLocationId = ? ORDER BY timeStr DESC").all(locationId) as DatabasePatrolUpdate[];
        return this.convertFromDBPatrolUpdate(patrolUpdates);
    }

    /**
     * Get all ids of patrol updates.
     *
     * @returns list of patrol update ids
     */
    allPatrolUpdatesIds(): number[]{
        const rows = this.prepare("SELECT id FROM PatrolUpdates").all() as { id: number }[];
        return rows.map((row) => row.id);
    }
      

}
