import { Response } from "../response";
import nunjucks from "nunjucks";
import { Request } from "../request";
import { AdminService, Database, LocationService, PatrolService, UpdateService } from "../databaseBarrel";
import { PatrolUpdate, Location } from "@/shared/types";
import { SETTINGS_TABLE } from "../database/tables";

import * as location from "../database/location";
import * as update from "../database/update";
import * as zod from "zod";

const MAIN: string = "master/main.html.njk";
const LOCATIONS: string = "master/locations.html.njk";
const LOCATION: string = "master/location.html.njk";
const PATROL_UPDATES: string = "master/patrolUpdates.html.njk";
const PATROL_UPDATE_PAGE: string = "master/patrolUpdate.html.njk";
const PATROLS: string = "master/patrols.html.njk";
const PATROL: string = "master/patrol.html.njk";

export class Pages {
    private db: Database;
    private locationService: LocationService;
    private patrolService: PatrolService;
    private updateService: UpdateService;
    private adminService: AdminService;

    private env: nunjucks.Environment;


    constructor(templateDir: string, db: Database, cache: boolean,
        locationService: LocationService, patrolService: PatrolService,
        updateService: UpdateService, adminService: AdminService) {
        this.env = new nunjucks.Environment(
            new nunjucks.FileSystemLoader(templateDir),
            {
                autoescape: true,
                noCache: !cache
            }
        );
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



    master = async (): Promise<Response> => {
        return this.response(MAIN, {
            locations: this.locationData(), //TODO: Change to `locations`
            updates: this.updateService.lastUpdates(10),
            patrols: this.patrolsData(),
        });
    }

    locations = async (): Promise<Response> => {
        return this.response(LOCATIONS, {
            locations: this.locationData(),
        });
    }

    location = async (request: Request): Promise<Response> => {
        const params = LocationParams.parse(request.url.searchParams);
        const locationId = params.id;
        let location = this.locationService.locationInfo(locationId);

        let patrolsOnTheirWayIDs = this.locationService.patrolsTowardsLocation(locationId);

        // if the location is the first location, include patrols that have no patrol update yet
        if (locationId === Number.parseInt(this.adminService.settings[SETTINGS_TABLE.SETTING_FIRST_LOCATION_ID])) {
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
    }

    patrolUpdatePage = async (request: Request): Promise<Response> => {
        const params = request.url.searchParams;
        const patrolId = params.get("patrolId");
        const locationId = params.get("locationId");
        return this.response(PATROL_UPDATE_PAGE, {
            patrols: this.patrolService.allPatrolIds().map((patrolId) => this.patrolService.patrolInfo(patrolId)),
            locations: this.locationService.allLocationIds().map((locationId) => this.locationService.locationInfo(locationId)),
            selectedPatrol: patrolId,
            selectedPost: locationId,
        });
    }

    patrolUpdates = async (request: Request): Promise<Response> => {
        let patrolUpdates: PatrolUpdate[] | undefined = undefined;
        const params = request.url.searchParams;

        let patrolId = params.get("patrolId");
        let locationId = params.get("locationId");
        if (patrolId != undefined) {
            patrolUpdates = this.updateService.latestUpdatesOfPatrol(Number.parseInt(patrolId), 0);
        } else if (locationId != undefined) {
            patrolUpdates = this.updateService.updatesAtLocation(Number.parseInt(locationId)).reverse();
        }

        if (patrolUpdates === undefined) {
            patrolUpdates = this.updateService.lastUpdates(20);
        }

        return this.response(PATROL_UPDATES, {
            updates: patrolUpdates,
        });
    }

    patrols = async (request: Request): Promise<Response> => {
        const { selection, locationId, sortBy } = PatrolsParams.parse(request.url.searchParams);

        let patrolIds: number[] | undefined = undefined;

        if (selection != null && locationId != null) {
            if (selection === "patrolsOnTheirWay") {
                patrolIds = this.locationService.patrolsTowardsLocation(locationId);

                // if the location is the first location, include patrols that have no patrol update yet
                if (locationId === Number.parseInt(this.adminService.settings[SETTINGS_TABLE.SETTING_FIRST_LOCATION_ID])) {
                    const patrolsWithNoUpdates = this.patrolService.allPatrolsWithNoUpdates();
                    patrolIds = patrolIds.concat(patrolsWithNoUpdates);
                }
            } else if (selection === "patrolsOnPost") {
                patrolIds = this.locationService.patrolsOnLocation(locationId);
            } else if (selection === "patrolsCheckedOut") {
                patrolIds = this.locationService.patrolsCheckedOutFromLocation(locationId);
            }
        };

        return this.response(PATROLS, {
            patrols: this.patrolsData(patrolIds, sortBy),
            sortBy: sortBy,
            locationId: locationId,
            selection: selection,
        });
    }

    patrol = async (request: Request): Promise<Response> => {
        const params = PatrolParam.parse(request.url.searchParams);
        return this.response(PATROL, {
            patrol: this.patrolService.patrolInfo(params.id),
            updates: this.updateService.latestUpdatesOfPatrol(params.id, 0),
        });
    }

    private patrolsData = (patrolIds?: number[], sortBy?: string): any => {
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
            })
    }

    private locationData = (): LocationDataToMaster[] => {
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
    }
    /**
     * Render template.
     *
     * @param filename the path to the template file
     * @param data the data for the template
     * @returns the rendered template
     */
    render = (filename: string, data: any): string => {
        const value = this.env.render(filename, data);
        return value;
    }

    /**
     * Render template and return response.
     *
     * @param filename the path to the template file
     * @param data the data for the template
     * @returns the rendered template
     */
    response = (filename: string, data: any): Response => {
        return Response.ok()
            .setContent(this.render(filename, data));
    }


    formatPatrolLocation = (latestUpdate: PatrolUpdate): string => {
        if (latestUpdate == undefined) {
            return "N/A";
        }

        const fromLocationName = location.getLocation(this.db, latestUpdate.currentLocationId).name;
        const toLocationName = location.getLocation(this.db, latestUpdate.targetLocationId).name;
        if (fromLocationName === toLocationName) {
            return `På ${fromLocationName}`;
        } else {
            return `Mellem ${fromLocationName} og ${toLocationName}`;
        }
    }

    formatCheckinLocation = (patrolUpdate: PatrolUpdate): string => {
        return location.getLocation(this.db, patrolUpdate.currentLocationId).name;
    }
}

function safeFilter<T>(
    filterFunc: (item: T) => string,
    defaultError: string = "Ukendt",
    log: boolean = false
): (item: T) => string {
    return (item: T): string => {
        try {
            return filterFunc(item);
        } catch (e) {
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
function formatTime(value: Date): string {
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
function patrolsUrl(sortBy?: string, locationId?: string, selection?: string): string {
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
function createUrlPath(base: string, params: { [key: string]: string | undefined }): string {
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

export interface LocationDataToMaster extends Location {
    patrolsOnPost: number;
    patrolsOnTheirWay: number;
    patrolsCheckedOut: number;
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
