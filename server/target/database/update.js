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
exports.deleteUpdate = deleteUpdate;
exports.getUpdateById = getUpdateById;
exports.latestUpdatesOfPatrol = latestUpdatesOfPatrol;
exports.latestUpdateOfPatrol = latestUpdateOfPatrol;
const zod = __importStar(require("zod"));
const PatrolUpdate = zod.object({
    id: zod.number(),
    patrolId: zod.number(),
    currentLocationId: zod.number(),
    targetLocationId: zod.number(),
    time: zod.date(),
}).brand("PatrolUpdate");
/**
 * Delete patrol update from database.
 *
 * @param database the database to delete updatr from
 * @param patrolUpdateId the id of the patrol update to delete
 */
function deleteUpdate(database, patrolUpdateId) {
    database.prepare("DELETE FROM PatrolUpdates WHERE id = ?")
        .run(patrolUpdateId);
}
/**
 * Get patrol update by id.
 *
 * @param database the database to retrieve the update from
 * @param patrolUpdateId the id of the patrol update
 * @returns the patrol update
 */
function getUpdateById(database, patrolUpdateId) {
    const databaseResponse = database.prepare("SELECT * FROM PatrolUpdates WHERE id = ?")
        .get(patrolUpdateId);
    return PatrolUpdate.parse(databaseResponse);
}
/**
 * Get the latest `PatrolUpdate` of the specified patrol.
 *
 * @param database the database
 * @param patrolId the id of the patrol to get the latest updates of
 * @param amount the number of `PatrolUpdate`s to get
 * @returns the latest `PatrolUpdate`s of the patrol
 */
function latestUpdatesOfPatrol(database, patrolId, amount) {
    const fetchStmt = "SELECT * FROM PatrolUpdates WHERE patrolId = ? ORDER BY timeStr DESC";
    let patrolUpdates;
    if (amount === undefined) {
        patrolUpdates = database.prepare(fetchStmt).all(patrolId);
    }
    else {
        patrolUpdates = database.prepare(fetchStmt + " LIMIT ?")
            .all(patrolId, amount);
    }
    return zod.array(PatrolUpdate).parse(patrolUpdates);
}
/**
 * Get the latest `PatrolUpdate` of the specified patrol.
 *
 * @param database the database
 * @param patrolId the id of the patrol to get the latest update of
 * @returns A `PatrolUpdate` object representing the latest update of the patrol
 */
function latestUpdateOfPatrol(database, patrolId) {
    return latestUpdatesOfPatrol(database, patrolId, 1)[0];
}
