import { AdminService, LocationService } from "../databaseBarrel.js";
import { Request } from "../request.js";
import { Response } from "../response.js";
export declare const getLocationPasswords: (request: Request, adminService: AdminService, locationService: LocationService) => Promise<Response>;
export declare const addLocationPassword: (request: Request, adminService: AdminService) => Promise<Response>;
export declare const deleteLocationPassword: (request: Request, adminService: AdminService) => Promise<Response>;
//# sourceMappingURL=locationPasswordHandler.d.ts.map