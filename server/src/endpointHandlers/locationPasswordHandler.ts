import { AdminService, LocationService } from "../databaseBarrel.js";
import { Request, parseForm } from "../request.js";
import { Response } from "../response.js";

interface PasswordRow {
    id: number;
    password: string;
}

const jsonResponse = (payload: object): Response => {
    return Response.ok(JSON.stringify(payload))
        .setHeader("Content-Type", "application/json");
}

export const getLocationPasswords = async (
    request: Request,
    adminService: AdminService,
    locationService: LocationService
): Promise<Response> => {
    const locationId = Number.parseInt(request.url.searchParams.get("locationId") ?? "");
    if (Number.isNaN(locationId)) {
        return Response.badRequest("Invalid location id");
    }

    const location = locationService.locationInfo(locationId);
    if (!location) {
        return Response.notFound("Location not found");
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
        return Response.badRequest("Missing location id or password");
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
        return Response.badRequest("Missing password identifier");
    }

    const deleted = adminService.deleteUser(userId);
    if (!deleted) {
        return Response.notFound("Password not found");
    }

    return jsonResponse({ success: true });
};
