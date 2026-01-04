import * as zod from "zod";

import { Request } from "./request";
import { Response } from "./response";
import { Endpoints } from '@/shared/endpoints';
import { Database } from "./database/database";

import * as location from "./database/location";
import * as patrol from "./database/patrol";
import * as update from "./database/update";


/** Parameters for the post status endpoint. */
const PostStatusParams = zod.object({
    status: zod.string(),
    locationId: zod.string().pipe(zod.coerce.number()),
});

export async function postStatus(database: Database, request: Request): Promise<Response> {
    const { locationId, status } = PostStatusParams.parse(request.url.searchParams);
    const newStatus = status === "open";

    location.changeLocationStatus(database, locationId, newStatus);
    return Response.redirect(`${Endpoints.MasterPostStatus}?id=${locationId}`);
}

const PatrolStatusParams = zod.object({
    status: zod.string(),
    patrolId: zod.string().pipe(zod.coerce.number()),
});

export async function patrolStatus(database: Database, request: Request): Promise<Response> {
    const { patrolId, status } = PatrolStatusParams.parse(request.url.searchParams);
    const isHalted = status === "out";

    patrol.changePatrolStatus(database, patrolId, isHalted);
    return Response.redirect(`/master/patrol?id=${patrolId}`);
}

const MasterDeletePatrolUpdateParams = zod.object({
    id: zod.string().pipe(zod.coerce.number()),
});

/**
 * Endpoint for the admin to delete patrol updated.
 *
 * @param database the database
 * @param request the request to the endpoint
 * @returns a http response
 */
export async function masterDeletePatrolUpdate(database: Database, request: Request): Promise<Response> {
    const { id } = MasterDeletePatrolUpdateParams.parse(request.url.searchParams);
    update.deleteUpdate(database, id);
    return Response.ok();
}


const MandskabDeleteUpdateParams = zod.object({
    id: zod.string().pipe(zod.coerce.number()),
});


/**
 * The maximum age an update can be deleted by the "mandskab". Measured in
 * milliseconds.
 */
const MAX_AGE_OF_UPDATE_THAT_CAN_BE_DELETED_BY_MANDSKAB = 30 * 1000;


export async function mandskabDeleteUpdate(database: Database, request: Request): Promise<Response> {
    const params = MandskabDeleteUpdateParams.parse(request.url.searchParams);
    const checkin = update.getUpdateById(database, params.id);

    const requestAndCheckinMatch = canUserAccessLocation(request, checkin.currentLocationId);
    const updateIsRecent = checkin.time.getTime() > Date.now() - MAX_AGE_OF_UPDATE_THAT_CAN_BE_DELETED_BY_MANDSKAB;

    if(!requestAndCheckinMatch || !updateIsRecent) {
        return Response.forbidden();
    }

    update.deleteUpdate(database, checkin.id);
    return Response.ok();
}

/**
 * Makes sure the user has access to the given location.
 *
 * @param request the request to get the user from
 * @param locationId the id of the location
 */
export function canUserAccessLocation(request: Request, locationId: number) {
    return request.user.locationId !== locationId;
}
