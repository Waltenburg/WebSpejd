import { LOCATION_TABLE, ServiceBase, SETTINGS_TABLE } from "./database";
import { Location, Route } from "@shared/types";

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
            AND lpu.currentLocationId != lpu.targetLocationId
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

    private convertFromDBRoute(dbRoutes: Route[]): Route[] {
        return dbRoutes.map((route) => ({
            ...route,
            //@ts-expect-error
            is_open: route.is_open === 1,
        }));
    }

    routeInfo(routeId: number): Route | undefined {
        const row = this.prepare("SELECT * FROM Route WHERE id = ?").get(routeId) as Route | undefined;
        return row ? this.convertFromDBRoute([row])[0] : undefined;
    }

    allRoutes(): Route[] {
        const rows = this.prepare("SELECT id, fromLocationId, toLocationId, is_open, distance FROM Route").all() as Route[];
        return this.convertFromDBRoute(rows);
    }

    isRouteAvailable(currentLocationId: number, targetLocationId: number): boolean{
        const route = this.prepare("SELECT * FROM Route WHERE fromLocationId = ? AND toLocationId = ? AND is_open = 1").get(currentLocationId, targetLocationId);
        return route != undefined;
    }

    allRoutesFromLocation(locationId: number): Route[] {
        const routes = (this.prepare("SELECT * FROM Route WHERE fromLocationId = ?").all(locationId) as Route[])
        return this.convertFromDBRoute(routes);
    }

    allRoutesToLocation(locationId: number): Route[] {
        const routes = this.prepare("SELECT * FROM Route WHERE toLocationId = ?").all(locationId) as Route[];
        return this.convertFromDBRoute(routes);
    }

    addRoute(fromLocationId: number, toLocationId: number, open: boolean): boolean {
        const existingRoute = this.prepare("SELECT 1 FROM Route WHERE fromLocationId = ? AND toLocationId = ?").get(fromLocationId, toLocationId);
        if (existingRoute) {
            return false; // already exists
        }
        const result = this.prepare("INSERT INTO Route (fromLocationId, toLocationId, is_open) VALUES (?, ?, ?)")
            .run(fromLocationId, toLocationId, open ? 1 : 0);
        if (result.changes ===0)
            return false;
        return true;
    }

    changeRouteStatus(routeId: number, open: boolean): boolean {
        const result = this.prepare("UPDATE Route SET is_open = ? WHERE id = ?").run(open ? 1 : 0, routeId);
        // Return true if a row was changed
        return result.changes > 0;
    }

    deleteRoute(routeId: number): void {
        this.prepare("DELETE FROM Route WHERE id = ?").run(routeId);
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
     * Add a new location.
     * @param name Display name of the location.
     * @param team Team responsible for the location.
     * @param open Whether the location is open.
     * @returns true if the location was added, false if it already exists or insertion failed.
     */
    addLocation(name: string, team: string, open: boolean): number | null {
        const existingLocation = this.prepare(`SELECT 1 FROM ${LOCATION_TABLE.TABLE_NAME} WHERE ${LOCATION_TABLE.NAME} = ?`).get(name);
        if (existingLocation) {
            return null; // already exists
        }
        const result = this.prepare(`INSERT INTO ${LOCATION_TABLE.TABLE_NAME} (${LOCATION_TABLE.NAME}, ${LOCATION_TABLE.TEAM}, ${LOCATION_TABLE.OPEN}) VALUES (?, ?, ?)`)
        .run(name, team, open ? 1 : 0);
        if (result.changes === 0) {
            return null;
        }
        return result.lastInsertRowid as number;
    }

    /**
     * Delete a location.
     * @param locationId the id of the location to delete
     * @returns `true` if the location was deleted, `false` if not found
     */
    deleteLocation(locationId: number): boolean {
        const result = this.prepare(`DELETE FROM ${LOCATION_TABLE.TABLE_NAME} WHERE id = ?`).run(locationId);
        return result.changes > 0;
    }

    /**
     * Change status of location.
     *
     * @param locationId the id of the location to change
     * @param open `true` if the location should be open, `false` otherwise
     */
    changeLocationStatus(locationId: number, open: boolean): boolean{
        const result = this.prepare("UPDATE Location SET open = ? WHERE id = ?").run(open ? 1 : 0, locationId);
        return result.changes > 0;
    }

    /**
     * Get all ids of locations.
     *
     * @returns list of location ids
     */
    allLocationIds(): number[]{
        const rows = this.prepare(`SELECT id FROM ${LOCATION_TABLE.TABLE_NAME} ORDER BY ${LOCATION_TABLE.NAME}`).all() as { id: number }[];
        return rows.map((row) => row.id);
    }
}