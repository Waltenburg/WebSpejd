import { LocationService } from '../databaseBarrel';
import * as responses from '../response';
import { Request } from '../request';
type Response = responses.Response;
export declare const addLocation: (request: Request, locationService: LocationService) => Promise<Response>;
export declare const changeLocationStatus: (request: Request, locationService: LocationService) => Promise<Response>;
export declare const renameLocation: (request: Request, locationService: LocationService) => Promise<Response>;
export declare const deleteLocation: (request: Request, locationService: LocationService) => Promise<Response>;
export declare const makeLocationFirstLocation: (request: Request, locationService: LocationService) => Promise<Response>;
export declare const setInfoOnMandskabPage: (request: Request, locationService: LocationService) => Promise<Response>;
export declare const getLocationConfigTableRow: (request: Request, locationService: LocationService) => Promise<Response>;
export declare const getLocationConfigTable: (request: Request, locationService: LocationService) => Promise<Response>;
export declare const getLocationConfigTableBody: (request: Request, locationService: LocationService) => Promise<Response>;
export declare const getRenameLocationRow: (request: Request, locationService: LocationService) => Promise<Response>;
export {};
//# sourceMappingURL=LocationConfigHandler.d.ts.map