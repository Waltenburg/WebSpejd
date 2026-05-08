import * as responses from '../response';
import type { Request } from '../request';
import { PatrolService } from '../databaseBarrel';
type Response = responses.Response;
export declare const addPatrol: (request: Request, patrolService: PatrolService) => Promise<Response>;
export declare const changePatrolStatus: (request: Request, patrolService: PatrolService) => Promise<Response>;
export declare const deletePatrol: (request: Request, patrolService: PatrolService) => Promise<Response>;
export declare const alterPatrolNumberAndName: (request: Request, patrolService: PatrolService) => Promise<Response>;
export declare const getPatrolConfigTableRow: (request: Request, patrolService: PatrolService) => Promise<Response>;
export declare const getPatrolConfigTableBody: (request: Request, patrolService: PatrolService) => Promise<Response>;
export declare const getPatrolConfigTable: (request: Request, patrolService: PatrolService) => Promise<Response>;
export declare const getRenamePatrolRow: (request: Request, patrolService: PatrolService) => Promise<Response>;
export {};
//# sourceMappingURL=patrolConfigHandler.d.ts.map