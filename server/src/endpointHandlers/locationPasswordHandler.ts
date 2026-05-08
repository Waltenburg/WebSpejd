import { AdminService, LocationService } from "../databaseBarrel";
import { Request, parseForm } from "../request";
import * as responses from "../response";

import type { Response } from "../response";

interface PasswordRow {
    id: number;
    password: string;
}

const jsonResponse = (payload: object): Response =>
    responses.ok(JSON.stringify(payload), { "Content-Type": "application/json" });

export const getLocationPasswords = async (
    request: Request,
    adminService: AdminService,
    locationService: LocationService
): Promise<Response> => {
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

export const addLocationPassword = async (
    request: Request,
    adminService: AdminService
): Promise<Response> => {
    const form = parseForm(request.body ?? null);
    const locationId = Number.parseInt(form["locationId"] ?? "");
    const password = (form["password"] ?? "").trim();

    if (Number.isNaN(locationId) || password.length === 0) {
        return responses.response_code(400, "Missing location id or password");
    }

    const userId = adminService.addUser(locationId, password);
    const entry: PasswordRow = { id: userId, password };
    return jsonResponse(entry);
};

export const deleteLocationPassword = async (
    request: Request,
    adminService: AdminService
): Promise<Response> => {
    const form = parseForm(request.body ?? null);
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
