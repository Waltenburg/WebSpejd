import { LocationService } from '../databaseBarrel';
import type { Route } from '@webspejd/core/types';
import * as responses from '../response';
import { Request } from '../request';
type Response = responses.Response;
export declare const addRoute: (request: Request, locationService: LocationService) => Promise<Response>;
export declare const changeRouteStatus: (request: Request, locationService: LocationService) => Promise<Response>;
export declare const deleteRoute: (request: Request, locationService: LocationService) => Promise<Response>;
export declare const getRouteConfigTableRow: (request: Request, locationService: LocationService) => Promise<Response>;
export declare const getRouteConfigTable: (request: Request, locationService: LocationService) => Promise<Response>;
export declare const table: (locationService: LocationService, routes: Route[], locationId?: number, skipFrom?: boolean, skipTo?: boolean, selectedFrom?: number, selectedTo?: number) => string;
export {};
//# sourceMappingURL=RouteConfigHandler.d.ts.map