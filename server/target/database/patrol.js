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
exports.getPatrol = getPatrol;
exports.changePatrolStatus = changePatrolStatus;
const error_1 = require("../error");
const zod = __importStar(require("zod"));
const location = __importStar(require("@/shared/validation"));
const Patrol = zod.object({
    id: zod.number(),
    number: zod.string(),
    name: zod.string(),
    udgået: location.boolean,
});
/**
 * Get information about patrol.
 *
 * @param database the database
 * @param patrolId the id of the patrol to get information about
 * @returns information about the patrol
 */
function getPatrol(database, patrolId) {
    const rawPatrol = database.prepare("SELECT * FROM patrol WHERE id = ?")
        .get(patrolId);
    return Patrol.parse(rawPatrol);
}
/**
 * Change udgået status of patrol.
 *
 * @param database the database to update
 * @param patrolId the id of the patrol to change
 * @param halted `true` if the patrol id "halted", `false` otherwise
 */
function changePatrolStatus(database, patrolId, halted) {
    const result = database.prepare("UPDATE patrol SET udgået = ? WHERE id = ?")
        .run(halted ? 1 : 0, patrolId);
    if (result.changes === 0) {
        throw new error_1.PatrolNotFoundError(patrolId);
    }
}
