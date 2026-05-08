import { PatrolService, LocationService, UpdateService } from "../databaseBarrel";
type Request = import('../request').Request;
import * as responses from '../response';
export declare const getPatrolUpdatesTable: (request: Request, updateService: UpdateService, locationService: LocationService, patrolService: PatrolService) => Promise<responses.Response>;
export {};
//# sourceMappingURL=patrolUpdatesHandler.d.ts.map