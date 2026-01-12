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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Pages = exports.ROUTES = exports.PATROL = exports.PATROLS = exports.PATROL_UPDATE_PAGE = exports.PATROL_UPDATES = exports.LOCATION = exports.LOCATIONS = exports.GRAPH = exports.MAIN = void 0;
const responses = __importStar(require("../response"));
const nunjucks_1 = __importDefault(require("nunjucks"));
exports.MAIN = "master/main.html.njk";
exports.GRAPH = "master/graph.html.njk";
exports.LOCATIONS = "master/locations.html.njk";
exports.LOCATION = "master/location.html.njk";
exports.PATROL_UPDATES = "master/patrolUpdates.html.njk";
exports.PATROL_UPDATE_PAGE = "master/patrolUpdate.html.njk";
exports.PATROLS = "master/patrols.html.njk";
exports.PATROL = "master/patrol.html.njk";
exports.ROUTES = "master/routes.html.njk";
class Pages {
    constructor(templateDir, db, cache, locationService, patrolService, updateService, adminService) {
        this.master = async () => {
            return this.response(exports.MAIN, {
                locations: this.locationData(),
                updates: this.updateService.lastUpdates(10),
                patrols: this.patrolsData(),
            });
        };
        this.locations = async () => {
            return this.response(exports.LOCATIONS, {
                locations: this.locationData(),
            });
        };
        this.routes = async () => {
            const routes = this.locationService.allRoutes().map(route => {
                return {
                    ...route,
                    from: this.locationService.locationInfo(route.fromLocationId),
                    to: this.locationService.locationInfo(route.toLocationId)
                };
            });
            return this.response(exports.ROUTES, {
                routes: routes,
                locations: this.locationData()
            });
        };
        this.locationPage = async (request) => {
            const locationId = Number.parseInt(request.url.searchParams.get("id"));
            let location = this.locationService.locationInfo(locationId);
            let patrolsOnTheirWayIDs = this.locationService.patrolsTowardsLocation(locationId);
            if (locationId === Number.parseInt(this.adminService.settings["first_location"])) {
                const patrolsWithNoUpdates = this.patrolService.allPatrolsWithNoUpdates();
                patrolsOnTheirWayIDs = patrolsOnTheirWayIDs.concat(patrolsWithNoUpdates);
            }
            const routesToLocation = this.locationService.allRoutesToLocation(locationId);
            const routesFromLocation = this.locationService.allRoutesFromLocation(locationId);
            return this.response(exports.LOCATION, {
                patrolsOnPost: this.patrolsData(this.locationService.patrolsOnLocation(locationId)),
                patrolsOnTheirWay: this.patrolsData(patrolsOnTheirWayIDs),
                patrolsCheckedOut: this.patrolsData(this.locationService.patrolsCheckedOutFromLocation(locationId)),
                location: location,
                updates: this.updateService.updatesAtLocation(locationId).reverse(),
                routesToLocation: routesToLocation,
                routesFromLocation: routesFromLocation,
            });
        };
        this.patrolUpdatePage = async (request) => {
            const params = request.url.searchParams;
            const patrolId = params.get("patrolId");
            const locationId = params.get("locationId");
            return this.response(exports.PATROL_UPDATE_PAGE, {
                patrols: this.patrolService.allPatrolIds().map((patrolId) => this.patrolService.patrolInfo(patrolId)),
                locations: this.locationService.allLocationIds().map((locationId) => this.locationService.locationInfo(locationId)),
                selectedPatrol: patrolId,
                selectedPost: locationId,
            });
        };
        this.patrolUpdates = async (request) => {
            let patrolUpdates;
            const params = request.url.searchParams;
            let patrolId = params.get("patrolId");
            let locationId = params.get("locationId");
            if (patrolId != undefined) {
                patrolUpdates = this.updateService.updatesOfPatrol(Number.parseInt(patrolId), 0);
            }
            else if (locationId != undefined) {
                patrolUpdates = this.updateService.updatesAtLocation(Number.parseInt(locationId)).reverse();
            }
            if (patrolUpdates === undefined) {
                patrolUpdates = this.updateService.lastUpdates(20);
            }
            return this.response(exports.PATROL_UPDATES, {
                updates: patrolUpdates,
            });
        };
        this.patrols = async (request) => {
            const params = request.url.searchParams;
            const selection = params.get("selection");
            const locationId = Number.parseInt(params.get("locationId"));
            let patrolIds;
            if (selection != null && locationId != null) {
                if (selection === "patrolsOnTheirWay") {
                    patrolIds = this.locationService.patrolsTowardsLocation(locationId);
                    if (locationId === Number.parseInt(this.adminService.settings["first_location"])) {
                        const patrolsWithNoUpdates = this.patrolService.allPatrolsWithNoUpdates();
                        patrolIds = patrolIds.concat(patrolsWithNoUpdates);
                    }
                }
                else if (selection === "patrolsOnPost") {
                    patrolIds = this.locationService.patrolsOnLocation(locationId);
                }
                else if (selection === "patrolsCheckedOut") {
                    patrolIds = this.locationService.patrolsCheckedOutFromLocation(locationId);
                }
            }
            ;
            const sortBy = params.get("sortBy") || "id";
            return this.response(exports.PATROLS, {
                patrols: this.patrolsData(patrolIds, sortBy),
                sortBy: sortBy,
                locationId: locationId,
                selection: selection,
            });
        };
        this.patrol = async (request) => {
            const patrolId = Number.parseInt(request.url.searchParams.get("id"));
            return this.response(exports.PATROL, {
                patrol: this.patrolService.patrolInfo(patrolId),
                updates: this.updateService.updatesOfPatrol(patrolId, 0),
            });
        };
        this.patrolsData = (patrolIds, sortBy) => {
            if (patrolIds === undefined) {
                patrolIds = this.patrolService.allPatrolIds();
            }
            return patrolIds
                .map((patrolId) => {
                let patrol = this.patrolService.patrolInfo(patrolId);
                let lastUpdate = this.updateService.latestUpdateOfPatrol(patrolId);
                return {
                    lastUpdate: lastUpdate,
                    ...patrol
                };
            })
                .sort((a, b) => {
                if (sortBy === "time") {
                    return a.lastUpdate?.time.getTime()
                        - b.lastUpdate?.time.getTime();
                }
                if (sortBy === "location") {
                    return (a.lastUpdate?.currentLocationId + a.lastUpdate?.targetLocationId)
                        - (b.lastUpdate?.currentLocationId + b.lastUpdate?.targetLocationId);
                }
                return a.id - b.id;
            });
        };
        this.locationData = () => {
            return this.locationService.allLocationIds()
                .map((locationId) => {
                let base = this.locationService.locationInfo(locationId);
                return {
                    patrolsOnPost: this.locationService.patrolsOnLocation(locationId).length,
                    patrolsOnTheirWay: this.locationService.patrolsTowardsLocation(locationId).length,
                    patrolsCheckedOut: this.locationService.patrolsCheckedOutFromLocation(locationId).length,
                    ...base
                };
            });
        };
        this.render = (filename, data) => {
            const value = this.env.render(filename, data);
            return value;
        };
        this.response = (filename, data) => {
            return responses.ok(this.render(filename, data));
        };
        this.formatPatrolLocation = (latestUpdate) => {
            if (latestUpdate == undefined)
                return "N/A";
            const fromLocationName = this.locationService.locationInfo(latestUpdate.currentLocationId).name;
            const toLocationName = this.locationService.locationInfo(latestUpdate.targetLocationId).name;
            if (fromLocationName === toLocationName)
                return `På ${fromLocationName}`;
            else
                return `Mellem ${fromLocationName} og ${toLocationName}`;
        };
        this.formatCheckinLocation = (patrolUpdate) => {
            const location = this.locationService.locationInfo(patrolUpdate.currentLocationId);
            return location.name;
        };
        this.formatPatrol = (patrolId) => {
            const patrol = this.patrolService.patrolInfo(patrolId);
            return `#${patrol.number} ${patrol.name}`;
        };
        this.env = new nunjucks_1.default.Environment(new nunjucks_1.default.FileSystemLoader(templateDir), {
            autoescape: true,
            noCache: !cache
        });
        this.env.addFilter("clock", safeFilter(formatTime, "Tid ukendt"));
        this.env.addFilter("formatPatrolLocation", safeFilter(this.formatPatrolLocation, "Ukendt lokation"));
        this.env.addFilter("formatCheckinLocation", safeFilter(this.formatCheckinLocation, "Ukendt lokation"));
        this.env.addFilter("locationName", safeFilter((locationId) => this.locationService.locationInfo(locationId).name, "Ukendt lokation"));
        this.env.addFilter("formatPatrol", safeFilter(this.formatPatrol, "Ukendt patrulje"));
        this.env.addGlobal("patrolsUrl", patrolsUrl);
        this.env.addGlobal("JSON", JSON);
        this.db = db;
        this.locationService = locationService;
        this.patrolService = patrolService;
        this.updateService = updateService;
        this.adminService = adminService;
    }
}
exports.Pages = Pages;
function safeFilter(filterFunc, defaultError = "Ukendt", log = false) {
    return (item) => {
        try {
            const value = filterFunc(item);
            return value ?? defaultError;
        }
        catch (e) {
            if (log)
                console.error(e);
            return defaultError;
        }
    };
}
function formatTime(value) {
    if (!(value instanceof Date)) {
        return "Tid ukendt";
    }
    let hour = value.getHours().toString().padStart(2, '0');
    let minute = value.getMinutes().toString().padStart(2, '0');
    let second = value.getSeconds().toString().padStart(2, '0');
    return `${hour}:${minute}:${second}`;
}
function patrolsUrl(sortBy = undefined, locationId = undefined, selection = undefined) {
    return createUrlPath("/master/patrols", {
        sortBy: sortBy,
        locationId: locationId,
        selection: selection,
    });
}
function createUrlPath(base, params) {
    let path = base;
    let symbol = "?";
    for (let key in params) {
        const value = params[key];
        if (value == undefined || value === "") {
            continue;
        }
        path = `${path}${symbol}${key}=${value}`;
        symbol = "&";
    }
    return path;
}
//# sourceMappingURL=pages.js.map