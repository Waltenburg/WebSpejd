import { Request } from "./request";
import { Response } from "./response";
import { Database } from "./database/database";
export declare function postStatus(database: Database, request: Request): Promise<Response>;
export declare function patrolStatus(database: Database, request: Request): Promise<Response>;
/**
 * Endpoint for the admin to delete patrol updated.
 *
 * @param database the database
 * @param request the request to the endpoint
 * @returns a http response
 */
export declare function masterDeletePatrolUpdate(database: Database, request: Request): Promise<Response>;
export declare function mandskabDeleteUpdate(database: Database, request: Request): Promise<Response>;
/**
 * Makes sure the user has access to the given location.
 *
 * @param request the request to get the user from
 * @param locationId the id of the location
 */
export declare function canUserAccessLocation(request: Request, locationId: number): boolean;
