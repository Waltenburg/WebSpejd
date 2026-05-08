import { LocationService, UpdateService, PatrolService } from "../databaseBarrel.js";
import { Response } from '../response.js';
import { Request } from "../request.js";
export declare const mainMasterPage: (request: Request, locationService: LocationService, updateService: UpdateService, patrolService: PatrolService) => Promise<Response>;
export declare const locatonAndRouteConfigPage: (request: Request, locationService: LocationService, updateService: UpdateService, patrolService: PatrolService) => Promise<Response>;
export declare const locationRouteGraphPage: (_request: Request) => Promise<Response>;
export declare const patrolConfigPage: (request: Request, patrolService: PatrolService) => Promise<Response>;
export declare const patrolPage: (request: Request, patrolService: PatrolService, locationService: LocationService, updateService: UpdateService) => Promise<Response>;
export declare const addPatrolUpdatePage: (request: Request, patrolService: PatrolService, locationService: LocationService) => Promise<Response>;
export declare const locationPage: (request: Request, locationService: LocationService, updateService: UpdateService, patrolService: PatrolService) => Promise<Response>;
export declare const patrolsUrl: (patrolId: number) => string;
//# sourceMappingURL=pages.d.ts.map