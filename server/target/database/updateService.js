"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateService = void 0;
const database_1 = require("./database");
class UpdateService extends database_1.ServiceBase {
    /** Converts from `DatabasePatrolUpdate` to `PatrolUpdate` as used in the rest of the application */
    convertFromDBPatrolUpdate(dbPatrolUpdate) {
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
    isPatrolUpdateValid(newUpdate, includeRouteValidation = true, includeCurrentEqualsTargetCheck = true, isTargetFirstLocation = false) {
        const patrolExists = this.prepare(`SELECT 1 FROM ${"Patrol" /* PATROL_TABLE.TABLE_NAME */} WHERE id = ?`).get(newUpdate.patrolId) != undefined;
        const currentLocationExists = this.prepare(`SELECT 1 FROM ${"Location" /* LOCATION_TABLE.TABLE_NAME */} WHERE id = ?`).get(newUpdate.currentLocationId) != undefined;
        const targetLocationExists = this.prepare(`SELECT 1 FROM ${"Location" /* LOCATION_TABLE.TABLE_NAME */} WHERE id = ?`).get(newUpdate.targetLocationId) != undefined;
        const routeIsValid = newUpdate.currentLocationId === newUpdate.targetLocationId || this.prepare(`SELECT 1 FROM ${"Route" /* ROUTE_TABLE.TABLE_NAME */} WHERE (${"fromLocationId" /* ROUTE_TABLE.FROM_LOCATION_ID */} = ? AND ${"toLocationId" /* ROUTE_TABLE.TO_LOCATION_ID */} = ?)`).get(newUpdate.currentLocationId, newUpdate.targetLocationId) != undefined;
        const lastUpdate = this.latestUpdateOfPatrol(newUpdate.patrolId);
        // Check that data is valid
        if (!patrolExists || !currentLocationExists || !targetLocationExists) {
            console.error("Invalid patrol update: patrol or location does not exist");
            return false;
        }
        if (includeRouteValidation && !routeIsValid) {
            console.error("Invalid patrol update: no valid route between locations");
            return false;
        }
        if (lastUpdate) {
            if (includeCurrentEqualsTargetCheck && lastUpdate.targetLocationId !== newUpdate.currentLocationId) {
                console.error("Invalid patrol update: current location does not match last target location");
                return false;
            }
        }
        else {
            if (!isTargetFirstLocation) {
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
    latestUpdatesOfPatrol(patrol, amount) {
        const fetchStmt = "SELECT * FROM PatrolUpdates WHERE patrolId = ? ORDER BY timeStr DESC";
        let patrolUpdates;
        if (amount === 0)
            patrolUpdates = this.prepare(fetchStmt).all(patrol);
        else
            patrolUpdates = this.prepare(fetchStmt + " LIMIT ?").all(patrol, amount);
        return this.convertFromDBPatrolUpdate(patrolUpdates);
    }
    /**
     * Get the latest `PatrolUpdate` of the specified patrol.
     * @param patrol patrolId the patrol to get the latest `PatrolUpdate` of
     * @returns A `PatrolUpdate` object representing the latest update of the patrol or `null` if no updates exist or the patrol does not exist
     */
    latestUpdateOfPatrol(patrol) {
        return this.latestUpdatesOfPatrol(patrol, 1)[0] || null;
    }
    /** Check patrol in or out of post.
     * @param patrolUpdate the patrol update to add to the database
     * @returns the id of the patrol update
    */
    updatePatrol(patrolUpdate) {
        this.prepare("INSERT INTO PatrolUpdates (patrolId, currentLocationId, targetLocationId) VALUES (?, ?, ?)")
            .run(patrolUpdate.patrolId, patrolUpdate.currentLocationId, patrolUpdate.targetLocationId);
        const id = this.prepare("SELECT last_insert_rowid() as id").get().id;
        return id;
    }
    /**
     * Get patrol update by id.
     *
     * @param updateId the id of the patrol update
     * @returns the patrol update with the id or `undefined` if patrol update does not exist
     */
    updateById(patrolUpdateId) {
        const dbPatrolUpdate = this.prepare("SELECT * FROM PatrolUpdates WHERE id = ?").get(patrolUpdateId);
        if (dbPatrolUpdate == undefined) {
            return undefined;
        }
        return this.convertFromDBPatrolUpdate([dbPatrolUpdate])[0];
    }
    /**
     * Delete patrol update from database.
     *
     * @param patrolUpdateId the id of the patrol update to delete
     */
    deleteUpdate(patrolUpdateId) {
        this.prepare("DELETE FROM PatrolUpdates WHERE id = ?").run(patrolUpdateId);
    }
    /**
     * Get the last n patrol updates.
     *
     * @param amount the amount of patrol updates to get
     * @returns the last n patrol updates
     */
    lastUpdates(amount) {
        const patrolUpdates = this.prepare("SELECT * FROM PatrolUpdates ORDER BY timeStr DESC LIMIT ?").all(amount);
        return this.convertFromDBPatrolUpdate(patrolUpdates);
    }
    /**
     * Get all patrol updates at location
     * @param locationId the id of the location
     * @returns the patrol updates at the location
     */
    updatesAtLocation(locationId, amount) {
        const query = this.prepare("SELECT * FROM PatrolUpdates WHERE currentLocationId = ? ORDER BY timeStr DESC" + (amount !== undefined ? " LIMIT ?" : ""));
        let patrolUpdates;
        if (amount != undefined)
            patrolUpdates = query.all(locationId, amount);
        else
            patrolUpdates = query.all(locationId);
        return this.convertFromDBPatrolUpdate(patrolUpdates);
    }
    /**
     * Get all ids of patrol updates.
     *
     * @returns list of patrol update ids
     */
    allPatrolUpdatesIds() {
        const rows = this.prepare("SELECT id FROM PatrolUpdates").all();
        return rows.map((row) => row.id);
    }
}
exports.UpdateService = UpdateService;
