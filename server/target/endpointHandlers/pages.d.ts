import { LocationService, UpdateService, PatrolService } from "../databaseBarrel";
import * as responses from '../response';
type Request = import('../request').Request;
export declare const mainMasterPage: (request: Request, locationService: LocationService, updateService: UpdateService, patrolService: PatrolService) => Promise<responses.Response>;
export declare const locatonAndRouteConfigPage: (request: Request, locationService: LocationService, updateService: UpdateService, patrolService: PatrolService) => Promise<responses.Response>;
export declare const locationRouteGraphPage: (_request: Request) => Promise<responses.Response>;
export declare const patrolConfigPage: (request: Request, patrolService: PatrolService) => Promise<responses.Response>;
export declare const patrolPage: (request: Request, patrolService: PatrolService, locationService: LocationService, updateService: UpdateService) => Promise<responses.Response>;
export declare const addPatrolUpdatePage: (request: Request, patrolService: PatrolService, locationService: LocationService) => Promise<responses.Response>;
export declare const locationPage: (request: Request, locationService: LocationService, updateService: UpdateService, patrolService: PatrolService) => Promise<responses.Response>;
export declare const patrolsUrl: (patrolId: number) => string;
export {};
//# sourceMappingURL=pages.d.ts.map