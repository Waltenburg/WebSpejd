"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocationService = void 0;
const database_1 = require("./database");
class LocationService extends database_1.ServiceBase {
    patrolsOnLocation(locationID) {
        const rows = this.prepare(`SELECT lpu.patrolId
            FROM LatestPatrolUpdates lpu
            JOIN Patrol p ON lpu.PatrolId = p.id
            WHERE lpu.currentLocationId = ?
            AND lpu.targetLocationId = lpu.currentLocationId
            AND p.udgået = 0
            ORDER BY lpu.timeStr DESC`).all(locationID);
        return rows.map((row) => row.patrolId);
    }
    patrolsTowardsLocation(locationID) {
        const rows = this.prepare(`SELECT lpu.patrolId
            FROM LatestPatrolUpdates lpu
            JOIN Patrol p ON lpu.PatrolId = p.id
            WHERE lpu.targetLocationId = ?
            AND lpu.currentLocationId != lpu.targetLocationId
            AND p.udgået = 0
            ORDER BY lpu.timeStr DESC`).all(locationID);
        return rows.map((row) => row.patrolId);
    }
    patrolsCheckedOutFromLocation(locationID) {
        const rows = this.prepare(`SELECT DISTINCT patrolId
            FROM PatrolUpdates
            WHERE currentLocationId = ?
            AND targetLocationId != ?;`).all(locationID, locationID);
        return rows.map((row) => row.patrolId);
    }
    convertFromDBRoute(dbRoutes) {
        return dbRoutes.map((route) => ({
            ...route,
            is_open: route.is_open === 1,
        }));
    }
    routeInfo(routeId) {
        const row = this.prepare("SELECT * FROM Route WHERE id = ?").get(routeId);
        return row ? this.convertFromDBRoute([row])[0] : undefined;
    }
    allRoutes() {
        const rows = this.prepare("SELECT id, fromLocationId, toLocationId, is_open, distance FROM Route").all();
        return this.convertFromDBRoute(rows);
    }
    isRouteAvailable(currentLocationId, targetLocationId) {
        const route = this.prepare("SELECT * FROM Route WHERE fromLocationId = ? AND toLocationId = ? AND is_open = 1").get(currentLocationId, targetLocationId);
        return route != undefined;
    }
    allRoutesFromLocation(locationId) {
        const routes = this.prepare("SELECT * FROM Route WHERE fromLocationId = ?").all(locationId);
        return this.convertFromDBRoute(routes);
    }
    allRoutesToLocation(locationId) {
        const routes = this.prepare("SELECT * FROM Route WHERE toLocationId = ?").all(locationId);
        return this.convertFromDBRoute(routes);
    }
    addRoute(fromLocationId, toLocationId, open) {
        const existingRoute = this.prepare("SELECT 1 FROM Route WHERE fromLocationId = ? AND toLocationId = ?").get(fromLocationId, toLocationId);
        if (existingRoute) {
            return false;
        }
        const result = this.prepare("INSERT INTO Route (fromLocationId, toLocationId, is_open) VALUES (?, ?, ?)")
            .run(fromLocationId, toLocationId, open ? 1 : 0);
        if (result.changes === 0)
            return false;
        return true;
    }
    changeRouteStatus(routeId, open) {
        const result = this.prepare("UPDATE Route SET is_open = ? WHERE id = ?").run(open ? 1 : 0, routeId);
        return result.changes > 0;
    }
    deleteRoute(routeId) {
        this.prepare("DELETE FROM Route WHERE id = ?").run(routeId);
    }
    locationInfo(locationId) {
        return this.prepare("SELECT * FROM Location WHERE id = ?").get(locationId);
    }
    addLocation(name, team, open) {
        const existingLocation = this.prepare(`SELECT 1 FROM ${"Location"} WHERE ${"name"} = ?`).get(name);
        if (existingLocation) {
            return null;
        }
        const result = this.prepare(`INSERT INTO ${"Location"} (${"name"}, ${"team"}, ${"open"}) VALUES (?, ?, ?)`)
            .run(name, team, open ? 1 : 0);
        if (result.changes === 0) {
            return null;
        }
        return result.lastInsertRowid;
    }
    renameLocation(locationId, name, team) {
        const location = this.locationInfo(locationId);
        if (!location) {
            return false;
        }
        const newName = name ?? location.name;
        const newTeam = team ?? location.team;
        const result = this.prepare(`UPDATE ${"Location"} SET ${"name"} = ?, ${"team"} = ? WHERE id = ?`)
            .run(newName, newTeam, locationId);
        return result.changes > 0;
    }
    deleteLocation(locationId) {
        const result = this.prepare(`DELETE FROM ${"Location"} WHERE id = ?`).run(locationId);
        return result.changes > 0;
    }
    changeLocationStatus(locationId, open) {
        const result = this.prepare("UPDATE Location SET open = ? WHERE id = ?").run(open ? 1 : 0, locationId);
        return result.changes > 0;
    }
    getFirstLocationId() {
        const row = this.prepare(`SELECT value FROM ${"settings"} WHERE ${"key"} = ?`).get("first_location");
        if (!row) {
            return null;
        }
        return parseInt(row.value);
    }
    setFirstLocationId(locationId) {
        if (locationId === null) {
            this.prepare(`DELETE FROM ${"settings"} WHERE ${"key"} = ?`).run("first_location");
        }
        else {
            this.prepare(`
                INSERT INTO ${"settings"} (${"key"}, ${"value"}) VALUES (?, ?)`).run("first_location", locationId.toString());
        }
    }
    allLocationIds() {
        const rows = this.prepare(`SELECT id FROM ${"Location"} ORDER BY ${"name"}`).all();
        return rows.map((row) => row.id);
    }
}
exports.LocationService = LocationService;
//# sourceMappingURL=locationService.js.map