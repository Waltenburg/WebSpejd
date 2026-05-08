import { ServiceBase } from "./database";
import { Location, Route } from "@webspejd/core/types";
export declare const enum SortType {
    TOPOLOGICAL = "TOPOLOGICAL",
    ALPHABETICAL = "ALPHABETICAL",
    ID = "ID"
}
export declare class LocationService extends ServiceBase {
    private lastRouteChangeTime;
    private topologicalSortTime;
    private topologicalSortCache;
    /**
    * Get list of patrols currently on a location.
    * @param locationID the id of the location.
    * @returns list of patrol ids currently on the location. Patrols most recently checked in at are first.
    */
    patrolsOnLocation(locationID: number): number[];
    /**
     * Get patrols that are currently moving towards a location.
     * @param locationID the id of the location.
     * @returns a list of patrol ids currently moving towards the location. Patrols most recently checked out at are first.
     */
    patrolsTowardsLocation(locationID: number): number[];
    /**
     * Get ids of patrols that are checked out of a location.
     *
     *
     * @param locationId the id of the location the patrols have leaved
     * @returns a list of patrol ids
     */
    patrolsCheckedOutFromLocation(locationID: number): number[];
    private convertFromDBRoute;
    routeInfo(routeId: number): Route | undefined;
    allRoutes(): Route[];
    isRouteAvailable(currentLocationId: number, targetLocationId: number): boolean;
    allRoutesFromLocation(locationId: number): Route[];
    allRoutesToLocation(locationId: number): Route[];
    addRoute(fromLocationId: number, toLocationId: number, open: boolean): boolean;
    changeRouteStatus(routeId: number, open: boolean): boolean;
    deleteRoute(routeId: number): void;
    /**
     * Get information about a location.
     * @param locationId the id of the location
     * @return information about the location or `undefined` if not found
     */
    locationInfo(locationId: number): Location | undefined;
    /**
     * Add a new location.
     * @param name Display name of the location.
     * @param team Team responsible for the location.
     * @param open Whether the location is open.
     * @returns true if the location was added, false if it already exists or insertion failed.
     */
    addLocation(name: string, team: string, open: boolean): number | null;
    renameLocation(locationId: number, name?: string, team?: string): boolean;
    /**
     * Delete a location.
     * @param locationId the id of the location to delete
     * @returns `true` if the location was deleted, `false` if not found
     */
    deleteLocation(locationId: number): boolean;
    /**
     * Change status of location.
     *
     * @param locationId the id of the location to change
     * @param open `true` if the location should be open, `false` otherwise
     */
    changeLocationStatus(locationId: number, open: boolean): boolean;
    getFirstLocationId(): number | null;
    setFirstLocationId(locationId: number | null): void;
    /**
     * Get all ids of locations.
     *
     * @returns list of location ids
     */
    allLocationIds(sortType?: SortType): number[];
    /**
     * Get all ids of locations sorted topologically.
     *
     * Rules:
     * 1. The 'First Location' (Start) is forced to be index 0.
     * 2. A location appears only after all locations with routes pointing TO it have been listed (Dependency order).
     * 3. If multiple locations are ready (dependencies met), the one closest to the Start (hop count) is chosen first.
     * 4. Cycles are handled by breaking the dependency chain at the point of lowest remaining dependencies.
     */
    private allSortedLocationsIds;
    setMandskabPageInfo(info: string): void;
    getMandskabPageInfo(): string;
    getParsedMandskabPageInfo(): string;
    getLocationRouteGraphLayout(): string;
    setLocationRouteGraphLayout(layoutJson: string): void;
}
//# sourceMappingURL=locationService.d.ts.map