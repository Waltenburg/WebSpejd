import { Marked, Token, Tokens } from "marked";
import { LOCATION_TABLE, ServiceBase, SETTINGS_TABLE } from "./database";
import { Location, Route } from "@shared/types";

export const enum SortType {
    TOPOLOGICAL = "TOPOLOGICAL",
    ALPHABETICAL = "ALPHABETICAL",
    ID = "ID"
}

export class LocationService extends ServiceBase {
    // Cache for topologically sorted location ids, along with timestamps to determine when to invalidate.
    private lastRouteChangeTime: number = Date.now();
    private topologicalSortTime: number = 0;
    private topologicalSortCache: number[] = [];

     /**
     * Get list of patrols currently on a location.
     * @param locationID the id of the location.
     * @returns list of patrol ids currently on the location. Patrols most recently checked in at are first.
     */
    patrolsOnLocation(locationID: number): number[] {
        const rows = this.prepare(
            `SELECT lpu.patrolId
            FROM LatestPatrolUpdates lpu
            JOIN Patrol p ON lpu.PatrolId = p.id
            WHERE lpu.currentLocationId = ?
            AND lpu.targetLocationId = lpu.currentLocationId
            AND p.udgået = 0
            ORDER BY lpu.timeStr DESC`
        ).all(locationID) as { patrolId: number }[];

        return rows.map((row) => row.patrolId);
    }

    
    /**
     * Get patrols that are currently moving towards a location.
     * @param locationID the id of the location.
     * @returns a list of patrol ids currently moving towards the location. Patrols most recently checked out at are first.
     */
    patrolsTowardsLocation(locationID: number): number[] {
        const rows = this.prepare(
            `SELECT lpu.patrolId
            FROM LatestPatrolUpdates lpu
            JOIN Patrol p ON lpu.PatrolId = p.id
            WHERE lpu.targetLocationId = ?
            AND lpu.currentLocationId != lpu.targetLocationId
            AND p.udgået = 0
            ORDER BY lpu.timeStr DESC`
        ).all(locationID) as { patrolId: number }[];

        return rows.map((row) => row.patrolId);
    }

    /**
     * Get ids of patrols that are checked out of a location.
     *
     *
     * @param locationId the id of the location the patrols have leaved
     * @returns a list of patrol ids
     */
    patrolsCheckedOutFromLocation(locationID: number): number[] {
        const rows = this.prepare(
            `SELECT DISTINCT patrolId
            FROM PatrolUpdates
            WHERE currentLocationId = ?
            AND targetLocationId != ?;`
        ).all(locationID, locationID) as { patrolId: number }[];
        return rows.map((row) => row.patrolId);
    }

    private convertFromDBRoute(dbRoutes: Route[]): Route[] {
        return dbRoutes.map((route) => ({
            ...route,
            //@ts-expect-error
            is_open: route.is_open === 1,
        }));
    }

    routeInfo(routeId: number): Route | undefined {
        const row = this.prepare("SELECT * FROM Route WHERE id = ?").get(routeId) as Route | undefined;
        return row ? this.convertFromDBRoute([row])[0] : undefined;
    }

    allRoutes(): Route[] {
        const rows = this.prepare("SELECT id, fromLocationId, toLocationId, is_open, distance FROM Route").all() as Route[];
        return this.convertFromDBRoute(rows);
    }

    isRouteAvailable(currentLocationId: number, targetLocationId: number): boolean{
        const route = this.prepare("SELECT * FROM Route WHERE fromLocationId = ? AND toLocationId = ? AND is_open = 1").get(currentLocationId, targetLocationId);
        return route != undefined;
    }

    allRoutesFromLocation(locationId: number): Route[] {
        const routes = (this.prepare("SELECT * FROM Route WHERE fromLocationId = ?").all(locationId) as Route[])
        return this.convertFromDBRoute(routes);
    }

    allRoutesToLocation(locationId: number): Route[] {
        const routes = this.prepare("SELECT * FROM Route WHERE toLocationId = ?").all(locationId) as Route[];
        return this.convertFromDBRoute(routes);
    }

    addRoute(fromLocationId: number, toLocationId: number, open: boolean): boolean {
        const existingRoute = this.prepare("SELECT 1 FROM Route WHERE fromLocationId = ? AND toLocationId = ?").get(fromLocationId, toLocationId);
        if (existingRoute) {
            return false; // already exists
        }
        const result = this.prepare("INSERT INTO Route (fromLocationId, toLocationId, is_open) VALUES (?, ?, ?)")
            .run(fromLocationId, toLocationId, open ? 1 : 0);
        if (result.changes ===0)
            return false;

        
        this.lastRouteChangeTime = Date.now();
        return true;
    }

    changeRouteStatus(routeId: number, open: boolean): boolean {
        const result = this.prepare("UPDATE Route SET is_open = ? WHERE id = ?").run(open ? 1 : 0, routeId);
        // Return true if a row was changed
        return result.changes > 0;
    }

    deleteRoute(routeId: number): void {
        let result = this.prepare("DELETE FROM Route WHERE id = ?").run(routeId);
        if (result.changes > 0)
            this.lastRouteChangeTime = Date.now();
    }
    /**
     * Get information about a location.
     * @param locationId the id of the location
     * @return information about the location or `undefined` if not found
     */
    locationInfo(locationId: number): Location | undefined{
        return this.prepare("SELECT * FROM Location WHERE id = ?").get(locationId) as Location | undefined;
    }


    /**
     * Add a new location.
     * @param name Display name of the location.
     * @param team Team responsible for the location.
     * @param open Whether the location is open.
     * @returns true if the location was added, false if it already exists or insertion failed.
     */
    addLocation(name: string, team: string, open: boolean): number | null {
        const existingLocation = this.prepare(`SELECT 1 FROM ${LOCATION_TABLE.TABLE_NAME} WHERE ${LOCATION_TABLE.NAME} = ?`).get(name);
        if (existingLocation) {
            return null; // already exists
        }
        const result = this.prepare(`INSERT INTO ${LOCATION_TABLE.TABLE_NAME} (${LOCATION_TABLE.NAME}, ${LOCATION_TABLE.TEAM}, ${LOCATION_TABLE.OPEN}) VALUES (?, ?, ?)`)
        .run(name, team, open ? 1 : 0);
        if (result.changes === 0) {
            return null;
        }
        if(result.changes > 0)
            this.lastRouteChangeTime = Date.now();
        return result.lastInsertRowid as number;
    }

    renameLocation(locationId: number, name?: string, team?: string): boolean {
        const location = this.locationInfo(locationId);
        if (!location) {
            return false;
        }
        const newName = name ?? location.name;
        const newTeam = team ?? location.team;
        const result = this.prepare(`UPDATE ${LOCATION_TABLE.TABLE_NAME} SET ${LOCATION_TABLE.NAME} = ?, ${LOCATION_TABLE.TEAM} = ? WHERE id = ?`)
            .run(newName, newTeam, locationId);
        return result.changes > 0;
    }

    /**
     * Delete a location.
     * @param locationId the id of the location to delete
     * @returns `true` if the location was deleted, `false` if not found
     */
    deleteLocation(locationId: number): boolean {
        const result = this.prepare(`DELETE FROM ${LOCATION_TABLE.TABLE_NAME} WHERE id = ?`).run(locationId);
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
    changeLocationStatus(locationId: number, open: boolean): boolean{
        const result = this.prepare("UPDATE Location SET open = ? WHERE id = ?").run(open ? 1 : 0, locationId);
        return result.changes > 0;
    }

    getFirstLocationId(): number | null {
        const row = this.prepare(`SELECT value FROM ${SETTINGS_TABLE.TABLE_NAME} WHERE ${SETTINGS_TABLE.KEY} = ?`).get(SETTINGS_TABLE.SETTING_FIRST_LOCATION_ID) as { value: string } | undefined;
        if (!row) {
            return null;
        }
        return parseInt(row.value);
    }

    setFirstLocationId(locationId: number | null): void {
        if (locationId === null) {
            this.prepare(`DELETE FROM ${SETTINGS_TABLE.TABLE_NAME} WHERE ${SETTINGS_TABLE.KEY} = ?`).run(SETTINGS_TABLE.SETTING_FIRST_LOCATION_ID);
        } else {
            this.prepare(`
                INSERT INTO ${SETTINGS_TABLE.TABLE_NAME} (${SETTINGS_TABLE.KEY}, ${SETTINGS_TABLE.VALUE}) VALUES (?, ?)
                ON CONFLICT(${SETTINGS_TABLE.KEY}) DO UPDATE SET ${SETTINGS_TABLE.VALUE} = excluded.${SETTINGS_TABLE.VALUE}`)
                .run(SETTINGS_TABLE.SETTING_FIRST_LOCATION_ID, locationId.toString());
        }
    }

    /**
     * Get all ids of locations.
     *
     * @returns list of location ids
     */
    allLocationIds(sortType: SortType = SortType.ID): number[]{
        let orderBy;
        switch (sortType) {
            case SortType.ALPHABETICAL:
                orderBy = LOCATION_TABLE.NAME;
                break;
            case SortType.ID:
                orderBy = "id";
                break;
            case SortType.TOPOLOGICAL:
                return this.allSortedLocationsIds();
        }

        const rows = this.prepare(`SELECT id FROM ${LOCATION_TABLE.TABLE_NAME} ORDER BY ${orderBy}`).all() as { id: number }[];
        return rows.map((row) => row.id);
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
    private allSortedLocationsIds(): number[] {
        if(this.topologicalSortTime > this.lastRouteChangeTime) {
            return this.topologicalSortCache;
        }
        this.topologicalSortTime = Date.now();

        // 1. Fetch Data
        const allLocations = this.allLocationIds(SortType.ID);
        const allRoutes = this.allRoutes();
        const startLocationId = this.getFirstLocationId();

        // 2. Structures
        const adjList = new Map<number, number[]>(); // Outgoing edges
        const inDegree = new Map<number, number>();  // Incoming edge count

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
                adjList.get(r.fromLocationId)!.push(r.toLocationId);
                inDegree.set(r.toLocationId, inDegree.get(r.toLocationId)! + 1);
            }
        });

        // 3. Calculate Hop Counts (Shortest Path via BFS)
        // We need this for the "Tie Breaker": A and C are both ready, but A is closer to Start.
        const hopCount = new Map<number, number>();
        allLocations.forEach(id => hopCount.set(id, Infinity));
        
        if (startLocationId && hopCount.has(startLocationId)) {
            const bfsQueue: {id: number, dist: number}[] = [{ id: startLocationId, dist: 0 }];
            const bfsVisited = new Set<number>([startLocationId]);
            hopCount.set(startLocationId, 0);

            while (bfsQueue.length > 0) {
                const { id, dist } = bfsQueue.shift()!;
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
        const sortedIds: number[] = [];
        const queue: number[] = [];
        const visited = new Set<number>();

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
                
                if (leftovers.length === 0) break; // Should not happen given the while loop condition

                leftovers.sort((a, b) => {
                    const degA = inDegree.get(a)!;
                    const degB = inDegree.get(b)!;
                    if (degA !== degB) return degA - degB;
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
            const currentId = queue.shift()!;
            sortedIds.push(currentId);

            // Decrease dependency count for neighbors
            const neighbors = adjList.get(currentId) || [];
            for (const neighborId of neighbors) {
                // Ignore if already added (handles explicit cycles pointing to things we already finished)
                if (visited.has(neighborId)) continue;

                const newDegree = inDegree.get(neighborId)! - 1;
                inDegree.set(neighborId, newDegree);

                // If dependencies are met, add to queue
                if (newDegree <= 0) {
                    visited.add(neighborId);
                    queue.push(neighborId);
                }
            }
        }

        this.topologicalSortCache = sortedIds;
        return sortedIds
    }

    setMandskabPageInfo(info: string): void {
        const sanitizedInfo = info.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        const mdParser = new Marked();

        mdParser.use({
            walkTokens(token){
                if(token.type === "link")
                    token.href = token.href.replace(/javascript:/gi, ""); // Basic XSS prevention for links
                if(token.type === 'heading'){
                    const header = token as Tokens.Heading;
                    header.depth = Math.min(header.depth + 2, 6);
                }
            }
        })

        const parsedInfo = mdParser.parse(info, {gfm: true, breaks: true});
        [[SETTINGS_TABLE.SETTING_PARSED_MANDSKAB_PAGE_INFO, parsedInfo], [SETTINGS_TABLE.SETTING_MANDSKAB_PAGE_INFO, info]].forEach(([key, value]) => {
            this.prepare(`
                INSERT INTO ${SETTINGS_TABLE.TABLE_NAME} (${SETTINGS_TABLE.KEY}, ${SETTINGS_TABLE.VALUE}) VALUES (?, ?)
                ON CONFLICT(${SETTINGS_TABLE.KEY}) DO UPDATE SET ${SETTINGS_TABLE.VALUE} = excluded.${SETTINGS_TABLE.VALUE}
            `).run(key, value);
        });

    }

    getMandskabPageInfo(){
        const result = this.prepare(`select value from ${SETTINGS_TABLE.TABLE_NAME} where ${SETTINGS_TABLE.KEY} = ?`).get(SETTINGS_TABLE.SETTING_MANDSKAB_PAGE_INFO) as { value: string } | undefined;
        return result?.value || "";
    }

    getParsedMandskabPageInfo(){
        const result = this.prepare(`select value from ${SETTINGS_TABLE.TABLE_NAME} where ${SETTINGS_TABLE.KEY} = ?`).get(SETTINGS_TABLE.SETTING_PARSED_MANDSKAB_PAGE_INFO) as { value: string } | undefined;
        return result?.value || "";
    }

    getLocationRouteGraphLayout(): string {
        const result = this.prepare(`select value from ${SETTINGS_TABLE.TABLE_NAME} where ${SETTINGS_TABLE.KEY} = ?`).get(SETTINGS_TABLE.SETTING_LOCATION_ROUTE_GRAPH_LAYOUT) as { value: string } | undefined;
        return result?.value || "";
    }

    setLocationRouteGraphLayout(layoutJson: string): void {
        this.prepare(`
            INSERT INTO ${SETTINGS_TABLE.TABLE_NAME} (${SETTINGS_TABLE.KEY}, ${SETTINGS_TABLE.VALUE}) VALUES (?, ?)
            ON CONFLICT(${SETTINGS_TABLE.KEY}) DO UPDATE SET ${SETTINGS_TABLE.VALUE} = excluded.${SETTINGS_TABLE.VALUE}
        `).run(SETTINGS_TABLE.SETTING_LOCATION_ROUTE_GRAPH_LAYOUT, layoutJson);
    }
}