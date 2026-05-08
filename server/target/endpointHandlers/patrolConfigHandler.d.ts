import { Response } from '../response.js';
import type { Request } from '../request.js';
import { PatrolService } from '../databaseBarrel.js';
export declare const addPatrol: (request: Request, patrolService: PatrolService) => Promise<Response>;
export declare const changePatrolStatus: (request: Request, patrolService: PatrolService) => Promise<Response>;
export declare const deletePatrol: (request: Request, patrolService: PatrolService) => Promise<Response>;
export declare const alterPatrolNumberAndName: (request: Request, patrolService: PatrolService) => Promise<Response>;
export declare const getPatrolConfigTableRow: (request: Request, patrolService: PatrolService) => Promise<Response>;
export declare const getPatrolConfigTableBody: (_request: Request, patrolService: PatrolService) => Promise<Response>;
export declare const getPatrolConfigTable: (_request: Request, patrolService: PatrolService) => Promise<Response>;
export declare const getRenamePatrolRow: (request: Request, patrolService: PatrolService) => Promise<Response>;
//# sourceMappingURL=patrolConfigHandler.d.ts.map