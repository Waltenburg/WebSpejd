import { Endpoints } from '@shared/endpoints';
import type { PatrolUpdate } from '@shared/types';
import type { LocationService, PatrolService, UpdateService } from '../databaseBarrel';
import { parseForm, Request } from '../request';
import * as responses from '../response';

interface Position {
    x: number;
    y: number;
}

interface SavedLayout {
    [locationId: string]: Position;
}

interface GraphNodeData {
    id: number;
    label: string;
    isOpen: boolean;
    isFirstLocation: boolean;
    patrolsOnLocation: number;
    size: number;
    color: string;
    borderColor: string;
    x?: number;
    y?: number;
    title: string;
    link: string;
}

interface GraphEdgeData {
    id: string;
    from: number;
    to: number;
    routeExists: boolean;
    routeOpen: boolean;
    patrolsOnRoute: number;
    width: number;
    color: string;
    dashes: boolean;
    title: string;
}

const NODE_MIN_SIZE = 18;
const NODE_SIZE_SCALE = 8;

const EDGE_MIN_WIDTH = 1;
const EDGE_WIDTH_SCALE = 2.2;

const edgeKey = (from: number, to: number): string => `${from}->${to}`;

const parseLayout = (rawLayout: string): SavedLayout => {
    if (!rawLayout) {
        return {};
    }

    try {
        const parsed = JSON.parse(rawLayout) as SavedLayout;
        if (typeof parsed !== 'object' || parsed == null) {
            return {};
        }
        return parsed;
    } catch {
        return {};
    }
};

const nodeColor = (isOpen: boolean, patrolsOnLocation: number): { fill: string; border: string } => {
    const borderColor = isOpen ? '#155c24' : '#535353';
    const fillColor = patrolsOnLocation > 0 ? '#2c803e' : '#a0a0a0';

    return { fill: fillColor, border: borderColor };
};

const edgeColor = (routeExists: boolean, routeOpen: boolean, patrolsOnRoute: number): string => {
    // Color logic:
    // 1. If route doesn't exist → red (broken/invalid)
    // 2. If route exists but closed → yellow/orange (blocked)
    // 3. If route exists and open → green (active)
    // Patrol count affects shade/opacity, not color

    const opacity = Math.min(1, 0.3 + Math.sqrt(patrolsOnRoute) * 0.2); // More patrols → more opaque
    const hexOpacity: string = Math.floor(opacity * 255).toString(16).padStart(2, '0'); // Convert opacity to hex

    const routeValid = routeExists && routeOpen;

    if (!routeValid) {
        const baseColor = '#f8760c'; // Orange
        return baseColor + hexOpacity;
    }

    const baseColor = '#25a804'; // Green
    return baseColor + hexOpacity;
};

const latestActivePatrolUpdates = (patrolService: PatrolService, updateService: UpdateService): PatrolUpdate[] => {
    const updates: PatrolUpdate[] = [];

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

export const getLocationRouteGraphData = async (_request: Request, locationService: LocationService, patrolService: PatrolService, updateService: UpdateService): Promise<responses.Response> => {
    const locationIds = locationService.allLocationIds();
    const firstLocationId = locationService.getFirstLocationId();
    const routes = locationService.allRoutes();
    const routesByKey = new Map<string, ReturnType<LocationService['allRoutes']>[number]>();

    for (const route of routes) {
        routesByKey.set(edgeKey(route.fromLocationId, route.toLocationId), route);
    }

    const updates = latestActivePatrolUpdates(patrolService, updateService);

    const patrolsOnLocationById = new Map<number, number>();
    const patrolsOnRouteByKey = new Map<string, number>();

    for (const update of updates) {
        if (update.currentLocationId === update.targetLocationId) {
            patrolsOnLocationById.set(update.currentLocationId, (patrolsOnLocationById.get(update.currentLocationId) ?? 0) + 1);
            continue;
        }

        const key = edgeKey(update.currentLocationId, update.targetLocationId);
        patrolsOnRouteByKey.set(key, (patrolsOnRouteByKey.get(key) ?? 0) + 1);
    }

    const savedLayout = parseLayout(locationService.getLocationRouteGraphLayout());

    const nodes: GraphNodeData[] = locationIds
        .map((locationId): GraphNodeData | null => {
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
                link: `${Endpoints.MasterLocationPage}?locationId=${location.id}`
            };
        })
        .filter((node): node is GraphNodeData => node != null);

    const allEdgeKeys = new Set<string>([
        ...routes.map(route => edgeKey(route.fromLocationId, route.toLocationId)),
        ...patrolsOnRouteByKey.keys()
    ]);

    const edges: GraphEdgeData[] = Array.from(allEdgeKeys.values()).map((key) => {
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

    return responses.ok(JSON.stringify({ nodes, edges, firstLocationId }), {
        'Content-Type': 'application/json'
    });
};

export const setLocationRouteGraphLayout = async (request: Request, locationService: LocationService): Promise<responses.Response> => {
    const contentType = request.headers['content-type'] ?? '';

    let layoutRaw = '';

    if (contentType.includes('application/json')) {
        layoutRaw = request.body ?? '';
    } else {
        const formData = parseForm(request.body);
        layoutRaw = formData['layout'];
    }

    if (!layoutRaw) {
        return responses.response_code(400, 'Missing layout payload');
    }

    const parsedLayout = parseLayout(layoutRaw);
    locationService.setLocationRouteGraphLayout(JSON.stringify(parsedLayout));
    return responses.ok();
};
