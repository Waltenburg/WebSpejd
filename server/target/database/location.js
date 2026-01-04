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
exports.getLocation = getLocation;
exports.changeLocationStatus = changeLocationStatus;
exports.allLocationIds = allLocationIds;
const validation = __importStar(require("@/shared/validation"));
const zod = __importStar(require("zod"));
const Location = zod.object({
    id: zod.number(),
    name: zod.string(),
    team: zod.number(),
    open: validation.boolean,
    lastUpdate: zod.date(),
});
/**
 * Get information about a location.
 *
 * @param database the database
 * @param locationId the id of the location to get
 * @returns the location
 */
function getLocation(database, locationId) {
    const rawLocation = database.prepare("SELECT * FROM Location WHERE id = ?")
        .get(locationId);
    return Location.parse(rawLocation);
}
/**
 * Change status of location.
 *
 * @param database the database
 * @param locationId the id of the location to change
 * @param open `true` if the location should be open, `false` otherwise
 */
function changeLocationStatus(database, locationId, open) {
    database.prepare("UPDATE Location SET open = ? WHERE id = ?")
        .run(open, locationId);
}
/**
 * Get all ids of locations.
 *
 * @returns list of location ids
 */
function allLocationIds(database) {
    const rows = database.prepare("SELECT id FROM Location").all();
    return rows.map((row) => row.id);
}
