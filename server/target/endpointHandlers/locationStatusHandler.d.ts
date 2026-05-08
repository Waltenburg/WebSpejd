import { LocationService } from '../databaseBarrel';
import * as responses from '../response';
import { Request } from '../request';
type Response = responses.Response;
export declare const getLocationStatusTable: (request: Request, locationService: LocationService) => Promise<Response>;
export declare const html_locationStatusTable: (locationService: LocationService, locationIds: number[], searchParamStr: string) => string;
export {};
//# sourceMappingURL=locationStatusHandler.d.ts.map