import { ServiceBase } from "./database";
import { Location, Route } from "@/shared/types";
export declare class LocationService extends ServiceBase {
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
    allRoutes(): Route[];
    isRouteAvailable(currentLocationId: number, targetLocationId: number): boolean;
    allRoutesFromLocation(locationId: number): Route[];
    allRoutesToLocation(locationId: number): Route[];
    /**
     * Get information about a location.
     * @param locationId the id of the location
     * @return information about the location or `undefined` if not found
     */
    locationInfo(locationId: number): Location | undefined;
    /**
     * Change status of location.
     *
     * @param locationId the id of the location to change
     * @param open `true` if the location should be open, `false` otherwise
     */
    changeLocationStatus(locationId: number, open: boolean): void;
    /**
     * Get all ids of locations.
     *
     * @returns list of location ids
     */
    allLocationIds(): number[];
}
