import { ServiceBase } from "./database.js";
import { Patrol } from "@webspejd/core/types";
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
    addPatrol(number: string, name: string): number;
    deletePatrol(patrolId: number): boolean;
    alterPatrolNumberAndName(patrolId: number, number?: string, name?: string): boolean;
    /**
     * Get list of all patrol ids.
     *
     * @returns a list of all patrol ids
     */
    allPatrolIds(): number[];
    allPatrolsWithNoUpdates(): number[];
}
//# sourceMappingURL=patrolService.d.ts.map