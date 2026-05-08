import type { LocationService, PatrolService, UpdateService } from '../databaseBarrel';
import { Request } from '../request';
import * as responses from '../response';
export declare const getLocationRouteGraphData: (_request: Request, locationService: LocationService, patrolService: PatrolService, updateService: UpdateService) => Promise<responses.Response>;
export declare const setLocationRouteGraphLayout: (request: Request, locationService: LocationService) => Promise<responses.Response>;
//# sourceMappingURL=locationRouteGraphHandler.d.ts.map