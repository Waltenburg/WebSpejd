import { LocationService } from '../databaseBarrel.js';
import { Response } from '../response.js';
import { Request } from '../request.js';
export declare const addLocation: (request: Request, locationService: LocationService) => Promise<Response>;
export declare const changeLocationStatus: (request: Request, locationService: LocationService) => Promise<Response>;
export declare const renameLocation: (request: Request, locationService: LocationService) => Promise<Response>;
export declare const deleteLocation: (request: Request, locationService: LocationService) => Promise<Response>;
export declare const makeLocationFirstLocation: (request: Request, locationService: LocationService) => Promise<Response>;
export declare const setInfoOnMandskabPage: (request: Request, locationService: LocationService) => Promise<Response>;
export declare const getLocationConfigTableRow: (request: Request, locationService: LocationService) => Promise<Response>;
export declare const getLocationConfigTable: (_request: Request, locationService: LocationService) => Promise<Response>;
export declare const getLocationConfigTableBody: (_request: Request, locationService: LocationService) => Promise<Response>;
export declare const getRenameLocationRow: (request: Request, locationService: LocationService) => Promise<Response>;
//# sourceMappingURL=LocationConfigHandler.d.ts.map