import type { LocationService, PatrolService, UpdateService } from '../databaseBarrel.js';
import { Request } from '../request.js';
import { Response } from '../response.js';
export declare const getLocationRouteGraphData: (_request: Request, locationService: LocationService, patrolService: PatrolService, updateService: UpdateService) => Promise<Response>;
export declare const setLocationRouteGraphLayout: (request: Request, locationService: LocationService) => Promise<Response>;
//# sourceMappingURL=locationRouteGraphHandler.d.ts.map