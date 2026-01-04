"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.postStatus = postStatus;
exports.patrolStatus = patrolStatus;
exports.masterDeletePatrolUpdate = masterDeletePatrolUpdate;
exports.mandskabDeleteUpdate = mandskabDeleteUpdate;
exports.canUserAccessLocation = canUserAccessLocation;
const zod = __importStar(require("zod"));
const response_1 = require("./response");
const endpoints_1 = require("@/shared/endpoints");
const location = __importStar(require("./database/location"));
const patrol = __importStar(require("./database/patrol"));
const update = __importStar(require("./database/update"));
/** Parameters for the post status endpoint. */
const PostStatusParams = zod.object({
    status: zod.string(),
    locationId: zod.string().pipe(zod.coerce.number()),
});
async function postStatus(database, request) {
    const { locationId, status } = PostStatusParams.parse(request.url.searchParams);
    const newStatus = status === "open";
    location.changeLocationStatus(database, locationId, newStatus);
    return response_1.Response.redirect(`${endpoints_1.Endpoints.MasterPostStatus}?id=${locationId}`);
}
const PatrolStatusParams = zod.object({
    status: zod.string(),
    patrolId: zod.string().pipe(zod.coerce.number()),
});
async function patrolStatus(database, request) {
    const { patrolId, status } = PatrolStatusParams.parse(request.url.searchParams);
    const isHalted = status === "out";
    patrol.changePatrolStatus(database, patrolId, isHalted);
    return response_1.Response.redirect(`/master/patrol?id=${patrolId}`);
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
async function masterDeletePatrolUpdate(database, request) {
    const { id } = MasterDeletePatrolUpdateParams.parse(request.url.searchParams);
    update.deleteUpdate(database, id);
    return response_1.Response.ok();
}
const MandskabDeleteUpdateParams = zod.object({
    id: zod.string().pipe(zod.coerce.number()),
});
/**
 * The maximum age an update can be deleted by the "mandskab". Measured in
 * milliseconds.
 */
const MAX_AGE_OF_UPDATE_THAT_CAN_BE_DELETED_BY_MANDSKAB = 30 * 1000;
async function mandskabDeleteUpdate(database, request) {
    const params = MandskabDeleteUpdateParams.parse(request.url.searchParams);
    const checkin = update.getUpdateById(database, params.id);
    const requestAndCheckinMatch = canUserAccessLocation(request, checkin.currentLocationId);
    const updateIsRecent = checkin.time.getTime() > Date.now() - MAX_AGE_OF_UPDATE_THAT_CAN_BE_DELETED_BY_MANDSKAB;
    if (!requestAndCheckinMatch || !updateIsRecent) {
        return response_1.Response.forbidden();
    }
    update.deleteUpdate(database, checkin.id);
    return response_1.Response.ok();
}
/**
 * Makes sure the user has access to the given location.
 *
 * @param request the request to get the user from
 * @param locationId the id of the location
 */
function canUserAccessLocation(request, locationId) {
    return request.user.locationId !== locationId;
}
