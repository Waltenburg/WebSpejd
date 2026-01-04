import { ServiceBase } from "./database";
import { PatrolUpdate, PatrolUpdateWithNoId } from "@/shared/types";
export declare class UpdateService extends ServiceBase {
    /** Converts from `DatabasePatrolUpdate` to `PatrolUpdate` as used in the rest of the application */
    private convertFromDBPatrolUpdate;
    /**
     * Validates a `PatrolUpdate`.
     * @param newUpdate `PatrolUpdate` object to validate
     * @param opts options for validation as a dictionary.
     *  - `skipRouteValidation`: if true, skips the route validation check
     * @returns `true` if the `PatrolUpdate` is valid, `false` otherwise
     */
    isPatrolUpdateValid(newUpdate: PatrolUpdateWithNoId, includeRouteValidation?: boolean, includeCurrentEqualsTargetCheck?: boolean, isTargetFirstLocation?: boolean): boolean;
    /**
     * Find the latest `PatrolUpdates` of the specified patrol.
     * @param patrol the patrol to get the latest `PatrolUpdates` of
     * @param amount the number of `PatrolUpdates` to get. If set to 0, all updates will be returned.
     * @return the latest `PatrolUpdates` of the patrol or `null` if none exist
     */
    latestUpdatesOfPatrol(patrol: number, amount: number): PatrolUpdate[];
    /**
     * Get the latest `PatrolUpdate` of the specified patrol.
     * @param patrol patrolId the patrol to get the latest `PatrolUpdate` of
     * @returns A `PatrolUpdate` object representing the latest update of the patrol or `null` if no updates exist or the patrol does not exist
     */
    latestUpdateOfPatrol(patrol: number): PatrolUpdate | null;
    /** Check patrol in or out of post.
     * @param patrolUpdate the patrol update to add to the database
     * @returns the id of the patrol update
    */
    updatePatrol(patrolUpdate: PatrolUpdateWithNoId): number;
    /**
     * Get patrol update by id.
     *
     * @param updateId the id of the patrol update
     * @returns the patrol update with the id or `undefined` if patrol update does not exist
     */
    updateById(patrolUpdateId: number): PatrolUpdate | undefined;
    /**
     * Delete patrol update from database.
     *
     * @param patrolUpdateId the id of the patrol update to delete
     */
    deleteUpdate(patrolUpdateId: number): void;
    /**
     * Get the last n patrol updates.
     *
     * @param amount the amount of patrol updates to get
     * @returns the last n patrol updates
     */
    lastUpdates(amount: number): PatrolUpdate[];
    /**
     * Get all patrol updates at location
     * @param locationId the id of the location
     * @returns the patrol updates at the location
     */
    updatesAtLocation(locationId: number, amount?: number): PatrolUpdate[];
    /**
     * Get all ids of patrol updates.
     *
     * @returns list of patrol update ids
     */
    allPatrolUpdatesIds(): number[];
}
