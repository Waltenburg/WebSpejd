import { ServiceBase, } from "./database";
import { PATROL_TABLE, LOCATION_TABLE, ROUTE_TABLE } from "./tables";
import { PatrolUpdate, PatrolUpdateWithNoId } from "@/shared/types";

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
     * Validates a `PatrolUpdate`.
     * @param newUpdate `PatrolUpdate` object to validate
     * @param opts options for validation as a dictionary.
     *  - `skipRouteValidation`: if true, skips the route validation check
     * @returns `true` if the `PatrolUpdate` is valid, `false` otherwise
     */
    isPatrolUpdateValid(
        newUpdate: PatrolUpdateWithNoId, 
        includeRouteValidation = true,
        includeCurrentEqualsTargetCheck = true,
        isTargetFirstLocation = false
    ): boolean {
        const patrolExists = this.prepare(`SELECT 1 FROM ${PATROL_TABLE.TABLE_NAME} WHERE id = ?`).get(newUpdate.patrolId) != undefined;
        const currentLocationExists = this.prepare(`SELECT 1 FROM ${LOCATION_TABLE.TABLE_NAME} WHERE id = ?`).get(newUpdate.currentLocationId) != undefined;
        const targetLocationExists = this.prepare(`SELECT 1 FROM ${LOCATION_TABLE.TABLE_NAME} WHERE id = ?`).get(newUpdate.targetLocationId) != undefined;
        const routeIsValid = newUpdate.currentLocationId === newUpdate.targetLocationId || this.prepare(`SELECT 1 FROM ${ROUTE_TABLE.TABLE_NAME} WHERE (${ROUTE_TABLE.FROM_LOCATION_ID} = ? AND ${ROUTE_TABLE.TO_LOCATION_ID} = ?)`).get(newUpdate.currentLocationId, newUpdate.targetLocationId) != undefined;
        const lastUpdate = this.latestUpdateOfPatrol(newUpdate.patrolId);

        // Check that data is valid
        if (!patrolExists || !currentLocationExists || !targetLocationExists) {
            console.error("Invalid patrol update: patrol or location does not exist");
            return false;
        }
        if(includeRouteValidation && !routeIsValid) {
            console.error("Invalid patrol update: no valid route between locations");
            return false;
        }
        if(lastUpdate) {
            if(includeCurrentEqualsTargetCheck && lastUpdate.targetLocationId !== newUpdate.currentLocationId) {
                console.error("Invalid patrol update: current location does not match last target location");
                return false;
            }
        }else{
            if(!isTargetFirstLocation){
                console.error("Invalid patrol update: first update must be to a target location that is a first location");
                return false;
            }
        }

        return true;
    }

    /**
     * Find the latest `PatrolUpdates` of the specified patrol.
     * @param patrol the patrol to get the latest `PatrolUpdates` of
     * @param amount the number of `PatrolUpdates` to get. If set to 0, all updates will be returned.
     * @return the latest `PatrolUpdates` of the patrol or `null` if none exist
     */
    latestUpdatesOfPatrol(patrol: number, amount: number): PatrolUpdate[]{
        const fetchStmt = "SELECT * FROM PatrolUpdates WHERE patrolId = ? ORDER BY timeStr DESC"; 
        let patrolUpdates: DatabasePatrolUpdate[];
        if (amount === 0)
            patrolUpdates = this.prepare(fetchStmt).all(patrol) as DatabasePatrolUpdate[];
        else 
            patrolUpdates = this.prepare(fetchStmt + " LIMIT ?").all(patrol, amount) as DatabasePatrolUpdate[];
        
        return this.convertFromDBPatrolUpdate(patrolUpdates);
    }

    /**
     * Get the latest `PatrolUpdate` of the specified patrol.
     * @param patrol patrolId the patrol to get the latest `PatrolUpdate` of
     * @returns A `PatrolUpdate` object representing the latest update of the patrol or `null` if no updates exist or the patrol does not exist
     */
    latestUpdateOfPatrol(patrol: number): PatrolUpdate | null{
        return this.latestUpdatesOfPatrol(patrol, 1)[0] || null;
    }

    /** Check patrol in or out of post.
     * @param patrolUpdate the patrol update to add to the database
     * @returns the id of the patrol update
    */
    updatePatrol(patrolUpdate: PatrolUpdateWithNoId): number{
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
    updatesAtLocation(locationId: number, amount?: number): PatrolUpdate[]{
        const query = this.prepare("SELECT * FROM PatrolUpdates WHERE currentLocationId = ? ORDER BY timeStr DESC" + (amount !== undefined ? " LIMIT ?" : ""));
        let patrolUpdates: DatabasePatrolUpdate[];

        if(amount != undefined)
            patrolUpdates = query.all(locationId, amount) as DatabasePatrolUpdate[];
        else
            patrolUpdates = query.all(locationId) as DatabasePatrolUpdate[];
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
