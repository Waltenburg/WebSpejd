"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocationService = void 0;
const database_1 = require("./database");
class LocationService extends database_1.ServiceBase {
    /**
    * Get list of patrols currently on a location.
    * @param locationID the id of the location.
    * @returns list of patrol ids currently on the location. Patrols most recently checked in at are first.
    */
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
    /**
     * Get patrols that are currently moving towards a location.
     * @param locationID the id of the location.
     * @returns a list of patrol ids currently moving towards the location. Patrols most recently checked out at are first.
     */
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
    /**
     * Get ids of patrols that are checked out of a location.
     *
     *
     * @param locationId the id of the location the patrols have leaved
     * @returns a list of patrol ids
     */
    patrolsCheckedOutFromLocation(locationID) {
        const rows = this.prepare(`SELECT DISTINCT patrolId
            FROM PatrolUpdates
            WHERE currentLocationId = ?
            AND targetLocationId != ?;`).all(locationID, locationID);
        return rows.map((row) => row.patrolId);
    }
    allRoutes() {
        const routes = this.prepare("SELECT * FROM Route").all();
        return routes;
    }
    isRouteAvailable(currentLocationId, targetLocationId) {
        const route = this.prepare("SELECT * FROM Route WHERE fromLocationId = ? AND toLocationId = ? AND is_open = 1").get(currentLocationId, targetLocationId);
        return route != undefined;
    }
    allRoutesFromLocation(locationId) {
        const routes = this.prepare("SELECT * FROM Route WHERE fromLocationId = ?").all(locationId);
        return routes;
    }
    allRoutesToLocation(locationId) {
        const routes = this.prepare("SELECT * FROM Route WHERE toLocationId = ?").all(locationId);
        return routes;
    }
    /**
     * Get information about a location.
     * @param locationId the id of the location
     * @return information about the location or `undefined` if not found
     */
    locationInfo(locationId) {
        return this.prepare("SELECT * FROM Location WHERE id = ?")
            .get(locationId);
    }
    /**
     * Change status of location.
     *
     * @param locationId the id of the location to change
     * @param open `true` if the location should be open, `false` otherwise
     */
    changeLocationStatus(locationId, open) {
        this.prepare("UPDATE Location SET open = ? WHERE id = ?").run(open, locationId);
    }
    /**
     * Get all ids of locations.
     *
     * @returns list of location ids
     */
    allLocationIds() {
        const rows = this.prepare("SELECT id FROM Location").all();
        return rows.map((row) => row.id);
    }
}
exports.LocationService = LocationService;
