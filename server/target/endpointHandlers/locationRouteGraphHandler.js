import { parseForm } from '../request.js';
import { Response } from '../response.js';
const NODE_MIN_SIZE = 18;
const NODE_SIZE_SCALE = 8;
const EDGE_MIN_WIDTH = 1;
const EDGE_WIDTH_SCALE = 2.2;
const edgeKey = (from, to) => `${from}->${to}`;
const parseLayout = (rawLayout) => {
    if (!rawLayout) {
        return {};
    }
    try {
        const parsed = JSON.parse(rawLayout);
        if (typeof parsed !== 'object' || parsed == null) {
            return {};
        }
        return parsed;
    }
    catch {
        return {};
    }
};
const nodeColor = (isOpen, patrolsOnLocation) => {
    const borderColor = isOpen ? '#155c24' : '#535353';
    const fillColor = patrolsOnLocation > 0 ? '#2c803e' : '#a0a0a0';
    return { fill: fillColor, border: borderColor };
};
const edgeColor = (routeExists, routeOpen, patrolsOnRoute) => {
    // Color logic:
    // 1. If route doesn't exist → red (broken/invalid)
    // 2. If route exists but closed → yellow/orange (blocked)
    // 3. If route exists and open → green (active)
    // Patrol count affects shade/opacity, not color
    const opacity = Math.min(1, 0.3 + Math.sqrt(patrolsOnRoute) * 0.2); // More patrols → more opaque
    const hexOpacity = Math.floor(opacity * 255).toString(16).padStart(2, '0'); // Convert opacity to hex
    const routeValid = routeExists && routeOpen;
    if (!routeValid) {
        const baseColor = '#f8760c'; // Orange
        return baseColor + hexOpacity;
    }
    const baseColor = '#25a804'; // Green
    return baseColor + hexOpacity;
};
const latestActivePatrolUpdates = (patrolService, updateService) => {
    const updates = [];
    for (const patrolId of patrolService.allPatrolIds()) {
        const patrol = patrolService.patrolInfo(patrolId);
        if (patrol.udgået) {
            continue;
        }
        const update = updateService.latestUpdateOfPatrol(patrolId);
        if (update) {
            updates.push(update);
        }
    }
    return updates;
};
export const getLocationRouteGraphData = async (_request, locationService, patrolService, updateService) => {
    const locationIds = locationService.allLocationIds();
    const firstLocationId = locationService.getFirstLocationId();
    const routes = locationService.allRoutes();
    const routesByKey = new Map();
    for (const route of routes) {
        routesByKey.set(edgeKey(route.fromLocationId, route.toLocationId), route);
    }
    const updates = latestActivePatrolUpdates(patrolService, updateService);
    const patrolsOnLocationById = new Map();
    const patrolsOnRouteByKey = new Map();
    for (const update of updates) {
        if (update.currentLocationId === update.targetLocationId) {
            patrolsOnLocationById.set(update.currentLocationId, (patrolsOnLocationById.get(update.currentLocationId) ?? 0) + 1);
            continue;
        }
        const key = edgeKey(update.currentLocationId, update.targetLocationId);
        patrolsOnRouteByKey.set(key, (patrolsOnRouteByKey.get(key) ?? 0) + 1);
    }
    const savedLayout = parseLayout(locationService.getLocationRouteGraphLayout());
    const nodes = locationIds
        .map((locationId) => {
        const location = locationService.locationInfo(locationId);
        if (!location) {
            return null;
        }
        const patrolsOnLocation = patrolsOnLocationById.get(location.id) ?? 0;
        const size = NODE_MIN_SIZE + Math.sqrt(patrolsOnLocation) * NODE_SIZE_SCALE;
        const colors = nodeColor(location.open, patrolsOnLocation);
        const savedPosition = savedLayout[location.id.toString()];
        return {
            id: location.id,
            label: location.name,
            isOpen: location.open,
            isFirstLocation: firstLocationId === location.id,
            patrolsOnLocation,
            size,
            color: colors.fill,
            borderColor: colors.border,
            x: Number.isFinite(savedPosition?.x) ? savedPosition.x : undefined,
            y: Number.isFinite(savedPosition?.y) ? savedPosition.y : undefined,
            title: `${location.name}\nPatruljer på lokation: ${patrolsOnLocation}\nStatus: ${location.open ? 'Åben' : 'Lukket'}`,
            link: `${"/master/location_page" /* Endpoints.MasterLocationPage */}?locationId=${location.id}`
        };
    })
        .filter((node) => node != null);
    const allEdgeKeys = new Set([
        ...routes.map(route => edgeKey(route.fromLocationId, route.toLocationId)),
        ...patrolsOnRouteByKey.keys()
    ]);
    const edges = Array.from(allEdgeKeys.values()).map((key) => {
        const route = routesByKey.get(key);
        const [fromStr, toStr] = key.split('->');
        const from = Number.parseInt(fromStr);
        const to = Number.parseInt(toStr);
        const patrolsOnRoute = patrolsOnRouteByKey.get(key) ?? 0;
        const width = EDGE_MIN_WIDTH + Math.sqrt(patrolsOnRoute) * EDGE_WIDTH_SCALE;
        const routeExists = route != null;
        const routeOpen = route?.is_open ?? false;
        return {
            id: key,
            from,
            to,
            routeExists,
            routeOpen,
            patrolsOnRoute,
            width,
            color: edgeColor(routeExists, routeOpen, patrolsOnRoute),
            dashes: !routeExists,
            title: `Patruljer på rute: ${patrolsOnRoute}\nStatus: ${routeExists ? (routeOpen ? 'Åben' : 'Lukket') : 'Rute ikke oprettet'}`
        };
    });
    return Response.ok(JSON.stringify({ nodes, edges, firstLocationId }))
        .setHeader("Content-Type", "application/json");
};
export const setLocationRouteGraphLayout = async (request, locationService) => {
    if (request.body === undefined) {
        return Response.badRequest();
    }
    const contentType = request.headers['content-type'] ?? '';
    let layoutRaw = '';
    if (contentType.includes('application/json')) {
        layoutRaw = request.body ?? '';
    }
    else {
        const formData = parseForm(request.body);
        layoutRaw = formData['layout'];
    }
    if (!layoutRaw) {
        return Response.badRequest('Missing layout payload');
    }
    const parsedLayout = parseLayout(layoutRaw);
    locationService.setLocationRouteGraphLayout(JSON.stringify(parsedLayout));
    return Response.ok();
};
//# sourceMappingURL=locationRouteGraphHandler.js.map