import { ServiceBase, SETTINGS_TABLE } from "./database";
import { Location, Route } from "./types";

export class LocationService extends ServiceBase {
     /**
     * Get list of patrols currently on a location.
     * @param locationID the id of the location.
     * @returns list of patrol ids currently on the location. Patrols most recently checked in at are first.
     */
    patrolsOnLocation(locationID: number): number[] {
        const rows = this.prepare(
            `SELECT lpu.patrolId
            FROM LatestPatrolUpdates lpu
            JOIN Patrol p ON lpu.PatrolId = p.id
            WHERE lpu.currentLocationId = ?
            AND lpu.targetLocationId = lpu.currentLocationId
            AND p.udgået = 0
            ORDER BY lpu.timeStr DESC`
        ).all(locationID) as { patrolId: number }[];

        return rows.map((row) => row.patrolId);
    }

    
    /**
     * Get patrols that are currently moving towards a location.
     * @param locationID the id of the location.
     * @returns a list of patrol ids currently moving towards the location. Patrols most recently checked out at are first.
     */
    patrolsTowardsLocation(locationID: number): number[] {
        const rows = this.prepare(
            `SELECT lpu.patrolId
            FROM LatestPatrolUpdates lpu
            JOIN Patrol p ON lpu.PatrolId = p.id
            WHERE lpu.targetLocationId = ?
            AND p.udgået = 0
            ORDER BY lpu.timeStr DESC`
        ).all(locationID) as { patrolId: number }[];

        return rows.map((row) => row.patrolId);
    }

    /**
     * Get ids of patrols that are checked out of a location.
     *
     *
     * @param locationId the id of the location the patrols have leaved
     * @returns a list of patrol ids
     */
    patrolsCheckedOutFromLocation(locationID: number): number[] {
        const rows = this.prepare(
            `SELECT DISTINCT patrolId
            FROM PatrolUpdates
            WHERE currentLocationId = ?
            AND targetLocationId != ?;`
        ).all(locationID, locationID) as { patrolId: number }[];
        return rows.map((row) => row.patrolId);
    }

    allRoutes(): Route[] {
        const routes = this.prepare("SELECT * FROM Route").all() as Route[];
        return routes;
    }

    isRouteAvailable(currentLocationId: number, targetLocationId: number): boolean{
        const route = this.prepare("SELECT * FROM Route WHERE fromLocationId = ? AND toLocationId = ? AND is_open = 1").get(currentLocationId, targetLocationId);
        return route != undefined;
    }

    allRoutesFromLocation(locationId: number): Route[] {
        const routes = this.prepare("SELECT * FROM Route WHERE fromLocationId = ?").all(locationId) as Route[];
        return routes;
    }

    allRoutesToLocation(locationId: number): Route[] {
        const routes = this.prepare("SELECT * FROM Route WHERE toLocationId = ?").all(locationId) as Route[];
        return routes;
    }

    /**
     * Get information about a location.
     * @param locationId the id of the location
     * @return information about the location or `undefined` if not found
     */
    locationInfo(locationId: number): Location | undefined{
        return this.prepare("SELECT * FROM Location WHERE id = ?").get(locationId) as Location | undefined;
    }

    /**
     * Change status of location.
     *
     * @param locationId the id of the location to change
     * @param open `true` if the location should be open, `false` otherwise
     */
    changeLocationStatus(locationId: number, open: boolean): void{
        this.prepare("UPDATE Location SET open = ? WHERE id = ?").run(open, locationId);
    }

    /**
     * Get all ids of locations.
     *
     * @returns list of location ids
     */
    allLocationIds(): number[]{
        const rows = this.prepare("SELECT id FROM Location").all() as { id: number }[];
        return rows.map((row) => row.id);
    }
}