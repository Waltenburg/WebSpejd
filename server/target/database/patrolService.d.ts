import { ServiceBase } from "./database";
import { Patrol } from "@/shared/types";
export declare class PatrolService extends ServiceBase {
    /**
    * Get information about patrol.
    * @param patrolId the id of the patrol to get information about
    * @returns information about the patrol
    */
    patrolInfo(patrolId: number): Patrol;
    /**
     * Change udgået status of patrol.
     *
     * @param patrolId the id of the patrol to change
     * @param udgået `true` if the patrol id "udgået", `false` otherwise
     */
    changePatrolStatus(patrolId: number, udgået: boolean): void;
    /**
     * Get list of all patrol ids.
     *
     * @returns a list of all patrol ids
     */
    allPatrolIds(): number[];
    allPatrolsWithNoUpdates(): number[];
}
