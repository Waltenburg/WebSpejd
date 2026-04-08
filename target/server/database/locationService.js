"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocationService = void 0;
const marked_1 = require("marked");
const database_1 = require("./database");
class LocationService extends database_1.ServiceBase {
    constructor() {
        super(...arguments);
        this.lastRouteChangeTime = Date.now();
        this.topologicalSortTime = 0;
        this.topologicalSortCache = [];
    }
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
            return false;
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
        return result.changes > 0;
    }
    deleteRoute(routeId) {
        let result = this.prepare("DELETE FROM Route WHERE id = ?").run(routeId);
        if (result.changes > 0)
            this.lastRouteChangeTime = Date.now();
    }
    locationInfo(locationId) {
        return this.prepare("SELECT * FROM Location WHERE id = ?").get(locationId);
    }
    addLocation(name, team, open) {
        const existingLocation = this.prepare(`SELECT 1 FROM ${"Location"} WHERE ${"name"} = ?`).get(name);
        if (existingLocation) {
            return null;
        }
        const result = this.prepare(`INSERT INTO ${"Location"} (${"name"}, ${"team"}, ${"open"}) VALUES (?, ?, ?)`)
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
        const result = this.prepare(`UPDATE ${"Location"} SET ${"name"} = ?, ${"team"} = ? WHERE id = ?`)
            .run(newName, newTeam, locationId);
        return result.changes > 0;
    }
    deleteLocation(locationId) {
        const result = this.prepare(`DELETE FROM ${"Location"} WHERE id = ?`).run(locationId);
        if (result.changes > 0)
            this.lastRouteChangeTime = Date.now();
        return result.changes > 0;
    }
    changeLocationStatus(locationId, open) {
        const result = this.prepare("UPDATE Location SET open = ? WHERE id = ?").run(open ? 1 : 0, locationId);
        return result.changes > 0;
    }
    getFirstLocationId() {
        const row = this.prepare(`SELECT value FROM ${"settings"} WHERE ${"key"} = ?`).get("first_location");
        if (!row) {
            return null;
        }
        return parseInt(row.value);
    }
    setFirstLocationId(locationId) {
        if (locationId === null) {
            this.prepare(`DELETE FROM ${"settings"} WHERE ${"key"} = ?`).run("first_location");
        }
        else {
            this.prepare(`
                INSERT INTO ${"settings"} (${"key"}, ${"value"}) VALUES (?, ?)
                ON CONFLICT(${"key"}) DO UPDATE SET ${"value"} = excluded.${"value"}`)
                .run("first_location", locationId.toString());
        }
    }
    allLocationIds(sortType = "ID") {
        let orderBy;
        switch (sortType) {
            case "ALPHABETICAL":
                orderBy = "name";
                break;
            case "ID":
                orderBy = "id";
                break;
            case "TOPOLOGICAL":
                return this.allSortedLocationsIds();
        }
        const rows = this.prepare(`SELECT id FROM ${"Location"} ORDER BY ${orderBy}`).all();
        return rows.map((row) => row.id);
    }
    allSortedLocationsIds() {
        if (this.topologicalSortTime > this.lastRouteChangeTime) {
            return this.topologicalSortCache;
        }
        this.topologicalSortTime = Date.now();
        const allLocations = this.allLocationIds("ID");
        const allRoutes = this.allRoutes();
        const startLocationId = this.getFirstLocationId();
        const adjList = new Map();
        const inDegree = new Map();
        allLocations.forEach(id => {
            adjList.set(id, []);
            inDegree.set(id, 0);
        });
        allRoutes.forEach((r) => {
            if (adjList.has(r.fromLocationId) && inDegree.has(r.toLocationId)) {
                adjList.get(r.fromLocationId).push(r.toLocationId);
                inDegree.set(r.toLocationId, inDegree.get(r.toLocationId) + 1);
            }
        });
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
        const sortedIds = [];
        const queue = [];
        const visited = new Set();
        if (startLocationId && allLocations.some(id => id === startLocationId)) {
            queue.push(startLocationId);
            visited.add(startLocationId);
        }
        allLocations.forEach(id => {
            if (id !== startLocationId && inDegree.get(id) === 0) {
                queue.push(id);
                visited.add(id);
            }
        });
        while (sortedIds.length < allLocations.length) {
            if (queue.length === 0) {
                const leftovers = allLocations.filter(id => !visited.has(id));
                if (leftovers.length === 0)
                    break;
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
            queue.sort((a, b) => {
                const distA = hopCount.get(a) || Infinity;
                const distB = hopCount.get(b) || Infinity;
                return distA - distB;
            });
            const currentId = queue.shift();
            sortedIds.push(currentId);
            const neighbors = adjList.get(currentId) || [];
            for (const neighborId of neighbors) {
                if (visited.has(neighborId))
                    continue;
                const newDegree = inDegree.get(neighborId) - 1;
                inDegree.set(neighborId, newDegree);
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
        const mdParser = new marked_1.Marked();
        mdParser.use({
            walkTokens(token) {
                if (token.type === "link")
                    token.href = token.href.replace(/javascript:/gi, "");
                if (token.type === 'heading') {
                    const header = token;
                    header.depth = Math.min(header.depth + 2, 6);
                }
            }
        });
        const parsedInfo = mdParser.parse(info, { gfm: true, breaks: true });
        [["parsed_mandskab_page_info", parsedInfo], ["mandskab_page_info", info]].forEach(([key, value]) => {
            this.prepare(`
                INSERT INTO ${"settings"} (${"key"}, ${"value"}) VALUES (?, ?)
                ON CONFLICT(${"key"}) DO UPDATE SET ${"value"} = excluded.${"value"}
            `).run(key, value);
        });
    }
    getMandskabPageInfo() {
        const result = this.prepare(`select value from ${"settings"} where ${"key"} = ?`).get("mandskab_page_info");
        return result?.value || "";
    }
    getParsedMandskabPageInfo() {
        const result = this.prepare(`select value from ${"settings"} where ${"key"} = ?`).get("parsed_mandskab_page_info");
        return result?.value || "";
    }
    getLocationRouteGraphLayout() {
        const result = this.prepare(`select value from ${"settings"} where ${"key"} = ?`).get("location_route_graph_layout");
        return result?.value || "";
    }
    setLocationRouteGraphLayout(layoutJson) {
        this.prepare(`
            INSERT INTO ${"settings"} (${"key"}, ${"value"}) VALUES (?, ?)
            ON CONFLICT(${"key"}) DO UPDATE SET ${"value"} = excluded.${"value"}
        `).run("location_route_graph_layout", layoutJson);
    }
}
exports.LocationService = LocationService;
//# sourceMappingURL=locationService.js.map