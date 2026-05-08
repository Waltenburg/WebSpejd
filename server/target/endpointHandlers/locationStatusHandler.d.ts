import { LocationService } from '../databaseBarrel.js';
import { Response } from '../response.js';
import { Request } from '../request.js';
export declare const getLocationStatusTable: (request: Request, locationService: LocationService) => Promise<Response>;
export declare const html_locationStatusTable: (locationService: LocationService, locationIds: number[], searchParamStr: string) => string;
//# sourceMappingURL=locationStatusHandler.d.ts.map