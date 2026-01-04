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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Pages = void 0;
const response_1 = require("../response");
const nunjucks_1 = __importDefault(require("nunjucks"));
const location = __importStar(require("../database/location"));
const update = __importStar(require("../database/update"));
const zod = __importStar(require("zod"));
const MAIN = "master/main.html.njk";
const LOCATIONS = "master/locations.html.njk";
const LOCATION = "master/location.html.njk";
const PATROL_UPDATES = "master/patrolUpdates.html.njk";
const PATROL_UPDATE_PAGE = "master/patrolUpdate.html.njk";
const PATROLS = "master/patrols.html.njk";
const PATROL = "master/patrol.html.njk";
class Pages {
    db;
    locationService;
    patrolService;
    updateService;
    adminService;
    env;
    constructor(templateDir, db, cache, locationService, patrolService, updateService, adminService) {
        this.env = new nunjucks_1.default.Environment(new nunjucks_1.default.FileSystemLoader(templateDir), {
            autoescape: true,
            noCache: !cache
        });
        this.env.addFilter("clock", safeFilter(formatTime));
        this.env.addFilter("formatPatrolLocation", safeFilter(this.formatPatrolLocation));
        this.env.addFilter("formatCheckinLocation", safeFilter(this.formatCheckinLocation));
        this.env.addGlobal("patrolsUrl", patrolsUrl);
        this.db = db;
        this.locationService = locationService;
        this.patrolService = patrolService;
        this.updateService = updateService;
        this.adminService = adminService;
    }
    master = async () => {
        return this.response(MAIN, {
            locations: this.locationData(), //TODO: Change to `locations`
            updates: this.updateService.lastUpdates(10),
            patrols: this.patrolsData(),
        });
    };
    locations = async () => {
        return this.response(LOCATIONS, {
            locations: this.locationData(),
        });
    };
    location = async (request) => {
        const params = LocationParams.parse(request.url.searchParams);
        const locationId = params.id;
        let location = this.locationService.locationInfo(locationId);
        let patrolsOnTheirWayIDs = this.locationService.patrolsTowardsLocation(locationId);
        // if the location is the first location, include patrols that have no patrol update yet
        if (locationId === Number.parseInt(this.adminService.settings["first_location" /* SETTINGS_TABLE.SETTING_FIRST_LOCATION_ID */])) {
            const patrolsWithNoUpdates = this.patrolService.allPatrolsWithNoUpdates();
            patrolsOnTheirWayIDs = patrolsOnTheirWayIDs.concat(patrolsWithNoUpdates);
        }
        return this.response(LOCATION, {
            patrolsOnPost: this.patrolsData(this.locationService.patrolsOnLocation(locationId)),
            patrolsOnTheirWay: this.patrolsData(patrolsOnTheirWayIDs),
            patrolsCheckedOut: this.patrolsData(this.locationService.patrolsCheckedOutFromLocation(locationId)),
            location: location,
            updates: this.updateService.updatesAtLocation(locationId).reverse(),
        });
    };
    patrolUpdatePage = async (request) => {
        const params = request.url.searchParams;
        const patrolId = params.get("patrolId");
        const locationId = params.get("locationId");
        return this.response(PATROL_UPDATE_PAGE, {
            patrols: this.patrolService.allPatrolIds().map((patrolId) => this.patrolService.patrolInfo(patrolId)),
            locations: this.locationService.allLocationIds().map((locationId) => this.locationService.locationInfo(locationId)),
            selectedPatrol: patrolId,
            selectedPost: locationId,
        });
    };
    patrolUpdates = async (request) => {
        let patrolUpdates = undefined;
        const params = request.url.searchParams;
        let patrolId = params.get("patrolId");
        let locationId = params.get("locationId");
        if (patrolId != undefined) {
            patrolUpdates = this.updateService.latestUpdatesOfPatrol(Number.parseInt(patrolId), 0);
        }
        else if (locationId != undefined) {
            patrolUpdates = this.updateService.updatesAtLocation(Number.parseInt(locationId)).reverse();
        }
        if (patrolUpdates === undefined) {
            patrolUpdates = this.updateService.lastUpdates(20);
        }
        return this.response(PATROL_UPDATES, {
            updates: patrolUpdates,
        });
    };
    patrols = async (request) => {
        const { selection, locationId, sortBy } = PatrolsParams.parse(request.url.searchParams);
        let patrolIds = undefined;
        if (selection != null && locationId != null) {
            if (selection === "patrolsOnTheirWay") {
                patrolIds = this.locationService.patrolsTowardsLocation(locationId);
                // if the location is the first location, include patrols that have no patrol update yet
                if (locationId === Number.parseInt(this.adminService.settings["first_location" /* SETTINGS_TABLE.SETTING_FIRST_LOCATION_ID */])) {
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
        return this.response(PATROLS, {
            patrols: this.patrolsData(patrolIds, sortBy),
            sortBy: sortBy,
            locationId: locationId,
            selection: selection,
        });
    };
    patrol = async (request) => {
        const params = PatrolParam.parse(request.url.searchParams);
        return this.response(PATROL, {
            patrol: this.patrolService.patrolInfo(params.id),
            updates: this.updateService.latestUpdatesOfPatrol(params.id, 0),
        });
    };
    patrolsData = (patrolIds, sortBy) => {
        if (patrolIds === undefined) {
            patrolIds = this.patrolService.allPatrolIds();
        }
        return patrolIds
            .map((patrolId) => {
            let patrol = this.patrolService.patrolInfo(patrolId);
            let lastUpdate = update.latestUpdateOfPatrol(this.db, patrolId);
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
    locationData = () => {
        return location.allLocationIds(this.db)
            .map((locationId) => {
            let base = location.getLocation(this.db, locationId);
            return {
                patrolsOnPost: this.locationService.patrolsOnLocation(locationId).length,
                patrolsOnTheirWay: this.locationService.patrolsTowardsLocation(locationId).length,
                patrolsCheckedOut: this.locationService.patrolsCheckedOutFromLocation(locationId).length,
                ...base
            };
        });
    };
    /**
     * Render template.
     *
     * @param filename the path to the template file
     * @param data the data for the template
     * @returns the rendered template
     */
    render = (filename, data) => {
        const value = this.env.render(filename, data);
        return value;
    };
    /**
     * Render template and return response.
     *
     * @param filename the path to the template file
     * @param data the data for the template
     * @returns the rendered template
     */
    response = (filename, data) => {
        return response_1.Response.ok()
            .setContent(this.render(filename, data));
    };
    formatPatrolLocation = (latestUpdate) => {
        if (latestUpdate == undefined) {
            return "N/A";
        }
        const fromLocationName = location.getLocation(this.db, latestUpdate.currentLocationId).name;
        const toLocationName = location.getLocation(this.db, latestUpdate.targetLocationId).name;
        if (fromLocationName === toLocationName) {
            return `På ${fromLocationName}`;
        }
        else {
            return `Mellem ${fromLocationName} og ${toLocationName}`;
        }
    };
    formatCheckinLocation = (patrolUpdate) => {
        return location.getLocation(this.db, patrolUpdate.currentLocationId).name;
    };
}
exports.Pages = Pages;
function safeFilter(filterFunc, defaultError = "Ukendt", log = false) {
    return (item) => {
        try {
            return filterFunc(item);
        }
        catch (e) {
            if (log)
                console.error(e);
            return defaultError;
        }
    };
}
/**
 * Format time as a string in the format hour:minute:second.
 *
 * @param value the time value
 * @returns the time as a string
 */
function formatTime(value) {
    if (!(value instanceof Date)) {
        return "Tid ukendt";
    }
    let hour = value.getHours().toString().padStart(2, '0');
    let minute = value.getMinutes().toString().padStart(2, '0');
    let second = value.getSeconds().toString().padStart(2, '0');
    return `${hour}:${minute}:${second}`;
}
/**
 * Create url for patrol table.
 *
 * @param sortBy the method to sort patrols by
 * @param locationId the id of the location to get patrols of
 * @param selection
 * @returns the created url
 */
function patrolsUrl(sortBy, locationId, selection) {
    return createUrlPath("/master/patrols", {
        sortBy: sortBy,
        locationId: locationId,
        selection: selection,
    });
}
/**
 * Create a new url path with the given base url and parameters.
 *
 * @param base the base of the path
 * @param params the url paramters of the path
 * @returns the combined base and paramters
 */
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
const PatrolParam = zod.object({
    id: zod.string().pipe(zod.coerce.number()),
});
const PatrolsParams = zod.object({
    selection: zod.string(),
    locationId: zod.string().pipe(zod.coerce.number()),
    sortBy: zod.string().default("id"),
});
const LocationParams = zod.object({
    id: zod.string().pipe(zod.coerce.number()),
});
