"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateService = void 0;
const database_1 = require("./database");
class UpdateService extends database_1.ServiceBase {
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
    isPatrolUpdateValid(newUpdate, includeRouteValidation = true, includeCurrentEqualsTargetCheck = true, isTargetFirstLocation = false) {
        const patrolExists = this.prepare(`SELECT 1 FROM ${"Patrol"} WHERE id = ?`).get(newUpdate.patrolId) != undefined;
        const currentLocationExists = this.prepare(`SELECT 1 FROM ${"Location"} WHERE id = ?`).get(newUpdate.currentLocationId) != undefined;
        const targetLocationExists = this.prepare(`SELECT 1 FROM ${"Location"} WHERE id = ?`).get(newUpdate.targetLocationId) != undefined;
        const routeIsValid = newUpdate.currentLocationId === newUpdate.targetLocationId || this.prepare(`SELECT 1 FROM ${"Route"} WHERE (${"fromLocationId"} = ? AND ${"toLocationId"} = ? AND ${"is_open"} = 1)`).get(newUpdate.currentLocationId, newUpdate.targetLocationId) != undefined;
        const lastUpdate = this.latestUpdateOfPatrol(newUpdate.patrolId);
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
    updatesOfPatrol(patrol, amount) {
        const fetchStmt = "SELECT * FROM PatrolUpdates WHERE patrolId = ? ORDER BY timeStr DESC";
        let patrolUpdates;
        if (amount == null)
            patrolUpdates = this.prepare(fetchStmt).all(patrol);
        else
            patrolUpdates = this.prepare(fetchStmt + " LIMIT ?").all(patrol, amount);
        return this.convertFromDBPatrolUpdate(patrolUpdates);
    }
    latestUpdateOfPatrol(patrol) {
        return this.updatesOfPatrol(patrol, 1)[0] || null;
    }
    updatePatrol(patrolUpdate) {
        this.prepare("INSERT INTO PatrolUpdates (patrolId, currentLocationId, targetLocationId) VALUES (?, ?, ?)")
            .run(patrolUpdate.patrolId, patrolUpdate.currentLocationId, patrolUpdate.targetLocationId);
        const id = this.prepare("SELECT last_insert_rowid() as id").get().id;
        return id;
    }
    updatePatrolWithTime(patrolUpdate) {
        this.prepare("INSERT INTO PatrolUpdates (patrolId, currentLocationId, targetLocationId, timeStr) VALUES (?, ?, ?, ?)")
            .run(patrolUpdate.patrolId, patrolUpdate.currentLocationId, patrolUpdate.targetLocationId, this.db.toUTCString(patrolUpdate.time));
        const id = this.prepare("SELECT last_insert_rowid() as id").get().id;
        return id;
    }
    updateById(patrolUpdateId) {
        const dbPatrolUpdate = this.prepare("SELECT * FROM PatrolUpdates WHERE id = ?").get(patrolUpdateId);
        if (dbPatrolUpdate == undefined) {
            return undefined;
        }
        return this.convertFromDBPatrolUpdate([dbPatrolUpdate])[0];
    }
    deleteUpdate(patrolUpdateId) {
        const runResults = this.prepare("DELETE FROM PatrolUpdates WHERE id = ?").run(patrolUpdateId);
        return runResults.changes > 0;
    }
    lastUpdates(amount) {
        const patrolUpdates = this.prepare("SELECT * FROM PatrolUpdates ORDER BY timeStr DESC LIMIT ?").all(amount);
        return this.convertFromDBPatrolUpdate(patrolUpdates);
    }
    updatesAtLocation(locationId, amount) {
        const query = this.prepare("SELECT * FROM PatrolUpdates WHERE currentLocationId = ? ORDER BY timeStr DESC" + (amount !== undefined ? " LIMIT ?" : ""));
        let patrolUpdates;
        if (amount != undefined)
            patrolUpdates = query.all(locationId, amount);
        else
            patrolUpdates = query.all(locationId);
        return this.convertFromDBPatrolUpdate(patrolUpdates);
    }
    allPatrolUpdatesIds() {
        const rows = this.prepare("SELECT id FROM PatrolUpdates").all();
        return rows.map((row) => row.id);
    }
}
exports.UpdateService = UpdateService;
//# sourceMappingURL=updateService.js.map