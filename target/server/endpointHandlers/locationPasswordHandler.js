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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteLocationPassword = exports.addLocationPassword = exports.getLocationPasswords = void 0;
const request_1 = require("../request");
const responses = __importStar(require("../response"));
const jsonResponse = (payload) => responses.ok(JSON.stringify(payload), { "Content-Type": "application/json" });
const getLocationPasswords = async (request, adminService, locationService) => {
    const locationId = Number.parseInt(request.url.searchParams.get("locationId") ?? "");
    if (Number.isNaN(locationId)) {
        return responses.response_code(400, "Invalid location id");
    }
    const location = locationService.locationInfo(locationId);
    if (!location) {
        return responses.not_found("Location not found");
    }
    const passwords = adminService.passwordsForLocation(locationId);
    return jsonResponse({
        locationId,
        locationName: location.name,
        team: location.team,
        passwords
    });
};
exports.getLocationPasswords = getLocationPasswords;
const addLocationPassword = async (request, adminService) => {
    const form = (0, request_1.parseForm)(request.body ?? null);
    const locationId = Number.parseInt(form["locationId"] ?? "");
    const password = (form["password"] ?? "").trim();
    if (Number.isNaN(locationId) || password.length === 0) {
        return responses.response_code(400, "Missing location id or password");
    }
    const userId = adminService.addUser(locationId, password);
    const entry = { id: userId, password };
    return jsonResponse(entry);
};
exports.addLocationPassword = addLocationPassword;
const deleteLocationPassword = async (request, adminService) => {
    const form = (0, request_1.parseForm)(request.body ?? null);
    const userId = Number.parseInt(form["userId"] ?? "");
    if (Number.isNaN(userId)) {
        return responses.response_code(400, "Missing password identifier");
    }
    const deleted = adminService.deleteUser(userId);
    if (!deleted) {
        return responses.not_found("Password not found");
    }
    return jsonResponse({ success: true });
};
exports.deleteLocationPassword = deleteLocationPassword;
//# sourceMappingURL=locationPasswordHandler.js.map