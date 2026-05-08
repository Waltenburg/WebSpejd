import { LocationService } from '../databaseBarrel.js';
import type { Route } from '@webspejd/core/types.js';
import { Response } from '../response.js';
import { Request } from '../request.js';
export declare const addRoute: (request: Request, locationService: LocationService) => Promise<Response>;
export declare const changeRouteStatus: (request: Request, locationService: LocationService) => Promise<Response>;
export declare const deleteRoute: (request: Request, locationService: LocationService) => Promise<Response>;
export declare const getRouteConfigTableRow: (request: Request, locationService: LocationService) => Promise<Response>;
export declare const getRouteConfigTable: (request: Request, locationService: LocationService) => Promise<Response>;
export declare const table: (locationService: LocationService, routes: Route[], locationId?: number, skipFrom?: boolean, skipTo?: boolean, selectedFrom?: number, selectedTo?: number) => string;
//# sourceMappingURL=RouteConfigHandler.d.ts.map