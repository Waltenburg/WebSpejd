import { Marked } from "marked";
import { ServiceBase } from "./database.js";
export class LocationService extends ServiceBase {
    constructor() {
        super(...arguments);
        // Cache for topologically sorted location ids, along with timestamps to determine when to invalidate.
        this.lastRouteChangeTime = Date.now();
        this.topologicalSortTime = 0;
        this.topologicalSortCache = [];
    }
    /**
    * Get list of patrols currently on a location.
    * @param locationID the id of the location.
    * @returns list of patrol ids currently on the location. Patrols most recently checked in at are first.
    */
    patrolsOnLocation(locationID) {
        const rows = this.prepare(`SELECT lpu.patrolId
            FROM LatestPatrolUpdates lpu
            JOIN Patrol p ON lpu.PatrolId = p.id
            WHERE lpu.currentLocationId = ?
            AND lpu.targetLocationId = lpu.currentLocationId
            AND p.udgået = 0
            ORDER BY lpu.timeStr DESC`).all(locationID);
        return rows.map((row) => row.patrolId);
    }
    /**
     * Get patrols that are currently moving towards a location.
     * @param locationID the id of the location.
     * @returns a list of patrol ids currently moving towards the location. Patrols most recently checked out at are first.
     */
    patrolsTowardsLocation(locationID) {
        const rows = this.prepare(`SELECT lpu.patrolId
            FROM LatestPatrolUpdates lpu
            JOIN Patrol p ON lpu.PatrolId = p.id
            WHERE lpu.targetLocationId = ?
            AND lpu.currentLocationId != lpu.targetLocationId
            AND p.udgået = 0
            ORDER BY lpu.timeStr DESC`).all(locationID);
        return rows.map((row) => row.patrolId);
    }
    /**
     * Get ids of patrols that are checked out of a location.
     *
     *
     * @param locationId the id of the location the patrols have leaved
     * @returns a list of patrol ids
     */
    patrolsCheckedOutFromLocation(locationID) {
        const rows = this.prepare(`SELECT DISTINCT patrolId
            FROM PatrolUpdates
            WHERE currentLocationId = ?
            AND targetLocationId != ?;`).all(locationID, locationID);
        return rows.map((row) => row.patrolId);
    }
    convertFromDBRoute(dbRoutes) {
        return dbRoutes.map((route) => ({
            ...route,
            //@ts-expect-error
            is_open: route.is_open === 1,
        }));
    }
    routeInfo(routeId) {
        const row = this.prepare("SELECT * FROM Route WHERE id = ?").get(routeId);
        return row ? this.convertFromDBRoute([row])[0] : undefined;
    }
    allRoutes() {
        const rows = this.prepare("SELECT id, fromLocationId, toLocationId, is_open, distance FROM Route").all();
        return this.convertFromDBRoute(rows);
    }
    isRouteAvailable(currentLocationId, targetLocationId) {
        const route = this.prepare("SELECT * FROM Route WHERE fromLocationId = ? AND toLocationId = ? AND is_open = 1").get(currentLocationId, targetLocationId);
        return route != undefined;
    }
    allRoutesFromLocation(locationId) {
        const routes = this.prepare("SELECT * FROM Route WHERE fromLocationId = ?").all(locationId);
        return this.convertFromDBRoute(routes);
    }
    allRoutesToLocation(locationId) {
        const routes = this.prepare("SELECT * FROM Route WHERE toLocationId = ?").all(locationId);
        return this.convertFromDBRoute(routes);
    }
    addRoute(fromLocationId, toLocationId, open) {
        const existingRoute = this.prepare("SELECT 1 FROM Route WHERE fromLocationId = ? AND toLocationId = ?").get(fromLocationId, toLocationId);
        if (existingRoute) {
            return false; // already exists
        }
        const result = this.prepare("INSERT INTO Route (fromLocationId, toLocationId, is_open) VALUES (?, ?, ?)")
            .run(fromLocationId, toLocationId, open ? 1 : 0);
        if (result.changes === 0)
            return false;
        this.lastRouteChangeTime = Date.now();
        return true;
    }
    changeRouteStatus(routeId, open) {
        const result = this.prepare("UPDATE Route SET is_open = ? WHERE id = ?").run(open ? 1 : 0, routeId);
        // Return true if a row was changed
        return result.changes > 0;
    }
    deleteRoute(routeId) {
        let result = this.prepare("DELETE FROM Route WHERE id = ?").run(routeId);
        if (result.changes > 0)
            this.lastRouteChangeTime = Date.now();
    }
    /**
     * Get information about a location.
     * @param locationId the id of the location
     * @return information about the location or `undefined` if not found
     */
    locationInfo(locationId) {
        return this.prepare("SELECT * FROM Location WHERE id = ?").get(locationId);
    }
    /**
     * Add a new location.
     * @param name Display name of the location.
     * @param team Team responsible for the location.
     * @param open Whether the location is open.
     * @returns true if the location was added, false if it already exists or insertion failed.
     */
    addLocation(name, team, open) {
        const existingLocation = this.prepare(`SELECT 1 FROM ${"Location" /* LOCATION_TABLE.TABLE_NAME */} WHERE ${"name" /* LOCATION_TABLE.NAME */} = ?`).get(name);
        if (existingLocation) {
            return null; // already exists
        }
        const result = this.prepare(`INSERT INTO ${"Location" /* LOCATION_TABLE.TABLE_NAME */} (${"name" /* LOCATION_TABLE.NAME */}, ${"team" /* LOCATION_TABLE.TEAM */}, ${"open" /* LOCATION_TABLE.OPEN */}) VALUES (?, ?, ?)`)
            .run(name, team, open ? 1 : 0);
        if (result.changes === 0) {
            return null;
        }
        if (result.changes > 0)
            this.lastRouteChangeTime = Date.now();
        return result.lastInsertRowid;
    }
    renameLocation(locationId, name, team) {
        const location = this.locationInfo(locationId);
        if (!location) {
            return false;
        }
        const newName = name ?? location.name;
        const newTeam = team ?? location.team;
        const result = this.prepare(`UPDATE ${"Location" /* LOCATION_TABLE.TABLE_NAME */} SET ${"name" /* LOCATION_TABLE.NAME */} = ?, ${"team" /* LOCATION_TABLE.TEAM */} = ? WHERE id = ?`)
            .run(newName, newTeam, locationId);
        return result.changes > 0;
    }
    /**
     * Delete a location.
     * @param locationId the id of the location to delete
     * @returns `true` if the location was deleted, `false` if not found
     */
    deleteLocation(locationId) {
        const result = this.prepare(`DELETE FROM ${"Location" /* LOCATION_TABLE.TABLE_NAME */} WHERE id = ?`).run(locationId);
        if (result.changes > 0)
            this.lastRouteChangeTime = Date.now();
        return result.changes > 0;
    }
    /**
     * Change status of location.
     *
     * @param locationId the id of the location to change
     * @param open `true` if the location should be open, `false` otherwise
     */
    changeLocationStatus(locationId, open) {
        const result = this.prepare("UPDATE Location SET open = ? WHERE id = ?").run(open ? 1 : 0, locationId);
        return result.changes > 0;
    }
    getFirstLocationId() {
        const row = this.prepare(`SELECT value FROM ${"settings" /* SETTINGS_TABLE.TABLE_NAME */} WHERE ${"key" /* SETTINGS_TABLE.KEY */} = ?`).get("first_location" /* SETTINGS_TABLE.SETTING_FIRST_LOCATION_ID */);
        if (!row) {
            return null;
        }
        return parseInt(row.value);
    }
    setFirstLocationId(locationId) {
        if (locationId === null) {
            this.prepare(`DELETE FROM ${"settings" /* SETTINGS_TABLE.TABLE_NAME */} WHERE ${"key" /* SETTINGS_TABLE.KEY */} = ?`).run("first_location" /* SETTINGS_TABLE.SETTING_FIRST_LOCATION_ID */);
        }
        else {
            this.prepare(`
                INSERT INTO ${"settings" /* SETTINGS_TABLE.TABLE_NAME */} (${"key" /* SETTINGS_TABLE.KEY */}, ${"value" /* SETTINGS_TABLE.VALUE */}) VALUES (?, ?)
                ON CONFLICT(${"key" /* SETTINGS_TABLE.KEY */}) DO UPDATE SET ${"value" /* SETTINGS_TABLE.VALUE */} = excluded.${"value" /* SETTINGS_TABLE.VALUE */}`)
                .run("first_location" /* SETTINGS_TABLE.SETTING_FIRST_LOCATION_ID */, locationId.toString());
        }
    }
    /**
     * Get all ids of locations.
     *
     * @returns list of location ids
     */
    allLocationIds(sortType = "ID" /* SortType.ID */) {
        let orderBy;
        switch (sortType) {
            case "ALPHABETICAL" /* SortType.ALPHABETICAL */:
                orderBy = "name" /* LOCATION_TABLE.NAME */;
                break;
            case "ID" /* SortType.ID */:
                orderBy = "id";
                break;
            case "TOPOLOGICAL" /* SortType.TOPOLOGICAL */:
                return this.allSortedLocationsIds();
        }
        const rows = this.prepare(`SELECT id FROM ${"Location" /* LOCATION_TABLE.TABLE_NAME */} ORDER BY ${orderBy}`).all();
        return rows.map((row) => row.id);
    }
    /**
     * Get all locations.
     *
     * @param sortType the sorting of the locations
     * @return all locations available.
     */
    allLocations(sortType = "ID" /* SortType.ID */) {
        return this.allLocationIds(sortType)
            .map(locationId => this.locationInfo(locationId))
            .filter(location => location !== undefined);
    }
    /**
     * Get all ids of locations sorted topologically.
     *
     * Rules:
     * 1. The 'First Location' (Start) is forced to be index 0.
     * 2. A location appears only after all locations with routes pointing TO it have been listed (Dependency order).
     * 3. If multiple locations are ready (dependencies met), the one closest to the Start (hop count) is chosen first.
     * 4. Cycles are handled by breaking the dependency chain at the point of lowest remaining dependencies.
     */
    allSortedLocationsIds() {
        if (this.topologicalSortTime > this.lastRouteChangeTime) {
            return this.topologicalSortCache;
        }
        this.topologicalSortTime = Date.now();
        // 1. Fetch Data
        const allLocations = this.allLocationIds("ID" /* SortType.ID */);
        const allRoutes = this.allRoutes();
        const startLocationId = this.getFirstLocationId();
        // 2. Structures
        const adjList = new Map(); // Outgoing edges
        const inDegree = new Map(); // Incoming edge count
        // Initialize maps
        allLocations.forEach(id => {
            adjList.set(id, []);
            inDegree.set(id, 0);
        });
        // Build Graph
        allRoutes.forEach((r) => {
            // Only consider open routes for valid traversal, unless you want structure regardless of status
            // Assuming structure is based on configured routes:
            if (adjList.has(r.fromLocationId) && inDegree.has(r.toLocationId)) {
                adjList.get(r.fromLocationId).push(r.toLocationId);
                inDegree.set(r.toLocationId, inDegree.get(r.toLocationId) + 1);
            }
        });
        // 3. Calculate Hop Counts (Shortest Path via BFS)
        // We need this for the "Tie Breaker": A and C are both ready, but A is closer to Start.
        const hopCount = new Map();
        allLocations.forEach(id => hopCount.set(id, Infinity));
        if (startLocationId && hopCount.has(startLocationId)) {
            const bfsQueue = [{ id: startLocationId, dist: 0 }];
            const bfsVisited = new Set([startLocationId]);
            hopCount.set(startLocationId, 0);
            while (bfsQueue.length > 0) {
                const { id, dist } = bfsQueue.shift();
                const neighbors = adjList.get(id) || [];
                for (const neighbor of neighbors) {
                    if (!bfsVisited.has(neighbor)) {
                        bfsVisited.add(neighbor);
                        hopCount.set(neighbor, dist + 1);
                        bfsQueue.push({ id: neighbor, dist: dist + 1 });
                    }
                }
            }
        }
        // 4. Initialize Topological Sort
        const sortedIds = [];
        const queue = [];
        const visited = new Set();
        // Logic: The Start Location must be first, regardless of In-Degree (cycles back to start).
        // Effectively, we "pretend" the start location has In-Degree 0 to begin.
        if (startLocationId && allLocations.some(id => id === startLocationId)) {
            queue.push(startLocationId);
            visited.add(startLocationId);
        }
        // Add any other disconnected components with In-Degree 0
        allLocations.forEach(id => {
            if (id !== startLocationId && inDegree.get(id) === 0) {
                queue.push(id);
                visited.add(id);
            }
        });
        // 5. Process Queue (Kahn's Algorithm with Priority)
        while (sortedIds.length < allLocations.length) {
            // If queue is empty but we haven't processed all nodes, we have a CYCLE.
            if (queue.length === 0) {
                // Heuristic: Pick the unvisited node with the lowest In-Degree (break the weakest link)
                // If tie, pick lowest Hop Count.
                const leftovers = allLocations.filter(id => !visited.has(id));
                if (leftovers.length === 0)
                    break; // Should not happen given the while loop condition
                leftovers.sort((a, b) => {
                    const degA = inDegree.get(a);
                    const degB = inDegree.get(b);
                    if (degA !== degB)
                        return degA - degB;
                    return (hopCount.get(a) || Infinity) - (hopCount.get(b) || Infinity);
                });
                const forcedNext = leftovers[0];
                queue.push(forcedNext);
                visited.add(forcedNext);
            }
            // TIE-BREAKER: Sort the 'ready' queue by Hop Count (ASC).
            // This ensures if A and C are both ready, A (dist 1) goes before C (dist 2).
            queue.sort((a, b) => {
                const distA = hopCount.get(a) || Infinity;
                const distB = hopCount.get(b) || Infinity;
                return distA - distB;
            });
            // Pop the best candidate
            const currentId = queue.shift();
            sortedIds.push(currentId);
            // Decrease dependency count for neighbors
            const neighbors = adjList.get(currentId) || [];
            for (const neighborId of neighbors) {
                // Ignore if already added (handles explicit cycles pointing to things we already finished)
                if (visited.has(neighborId))
                    continue;
                const newDegree = inDegree.get(neighborId) - 1;
                inDegree.set(neighborId, newDegree);
                // If dependencies are met, add to queue
                if (newDegree <= 0) {
                    visited.add(neighborId);
                    queue.push(neighborId);
                }
            }
        }
        this.topologicalSortCache = sortedIds;
        return sortedIds;
    }
    setMandskabPageInfo(info) {
        const sanitizedInfo = info.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        const mdParser = new Marked();
        mdParser.use({
            walkTokens(token) {
                if (token.type === "link")
                    token.href = token.href.replace(/javascript:/gi, ""); // Basic XSS prevention for links
                if (token.type === 'heading') {
                    const header = token;
                    header.depth = Math.min(header.depth + 2, 6);
                }
            }
        });
        const parsedInfo = mdParser.parse(info, { gfm: true, breaks: true });
        [["parsed_mandskab_page_info" /* SETTINGS_TABLE.SETTING_PARSED_MANDSKAB_PAGE_INFO */, parsedInfo], ["mandskab_page_info" /* SETTINGS_TABLE.SETTING_MANDSKAB_PAGE_INFO */, info]].forEach(([key, value]) => {
            this.prepare(`
                INSERT INTO ${"settings" /* SETTINGS_TABLE.TABLE_NAME */} (${"key" /* SETTINGS_TABLE.KEY */}, ${"value" /* SETTINGS_TABLE.VALUE */}) VALUES (?, ?)
                ON CONFLICT(${"key" /* SETTINGS_TABLE.KEY */}) DO UPDATE SET ${"value" /* SETTINGS_TABLE.VALUE */} = excluded.${"value" /* SETTINGS_TABLE.VALUE */}
            `).run(key, value);
        });
    }
    getMandskabPageInfo() {
        const result = this.prepare(`select value from ${"settings" /* SETTINGS_TABLE.TABLE_NAME */} where ${"key" /* SETTINGS_TABLE.KEY */} = ?`).get("mandskab_page_info" /* SETTINGS_TABLE.SETTING_MANDSKAB_PAGE_INFO */);
        return result?.value || "";
    }
    getParsedMandskabPageInfo() {
        const result = this.prepare(`select value from ${"settings" /* SETTINGS_TABLE.TABLE_NAME */} where ${"key" /* SETTINGS_TABLE.KEY */} = ?`).get("parsed_mandskab_page_info" /* SETTINGS_TABLE.SETTING_PARSED_MANDSKAB_PAGE_INFO */);
        return result?.value || "";
    }
    getLocationRouteGraphLayout() {
        const result = this.prepare(`select value from ${"settings" /* SETTINGS_TABLE.TABLE_NAME */} where ${"key" /* SETTINGS_TABLE.KEY */} = ?`).get("location_route_graph_layout" /* SETTINGS_TABLE.SETTING_LOCATION_ROUTE_GRAPH_LAYOUT */);
        return result?.value || "";
    }
    setLocationRouteGraphLayout(layoutJson) {
        this.prepare(`
            INSERT INTO ${"settings" /* SETTINGS_TABLE.TABLE_NAME */} (${"key" /* SETTINGS_TABLE.KEY */}, ${"value" /* SETTINGS_TABLE.VALUE */}) VALUES (?, ?)
            ON CONFLICT(${"key" /* SETTINGS_TABLE.KEY */}) DO UPDATE SET ${"value" /* SETTINGS_TABLE.VALUE */} = excluded.${"value" /* SETTINGS_TABLE.VALUE */}
        `).run("location_route_graph_layout" /* SETTINGS_TABLE.SETTING_LOCATION_ROUTE_GRAPH_LAYOUT */, layoutJson);
    }
}
//# sourceMappingURL=locationService.js.map