import { AdminService, LocationService } from "../databaseBarrel";
import { Request } from "../request";
import type { Response } from "../response";
export declare const getLocationPasswords: (request: Request, adminService: AdminService, locationService: LocationService) => Promise<Response>;
export declare const addLocationPassword: (request: Request, adminService: AdminService) => Promise<Response>;
export declare const deleteLocationPassword: (request: Request, adminService: AdminService) => Promise<Response>;
//# sourceMappingURL=locationPasswordHandler.d.ts.map