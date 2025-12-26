import * as responses from "../response";
import nunjucks from "nunjucks";
import { Request } from "../request";
import { AdminService, Database, LocationService, PatrolService, UpdateService } from "../databaseBarrel";
import { PatrolUpdate, Location } from "../database/types";
import { SETTINGS_TABLE } from "../database/database";

type Response = responses.Response;

export const MAIN: string = "master/main.html.njk";
export const GRAPH: string = "master/graph.html.njk";
export const POSTS: string = "master/posts.html.njk";
export const POST: string = "master/post.html.njk";
export const CHECKINS: string = "master/checkins.html.njk";
export const CHECKIN: string = "master/checkin.html.njk";
export const PATROLS: string = "master/patrols.html.njk";
export const PATROL: string = "master/patrol.html.njk";

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
        this.env.addFilter("checkinName", safeFilter(checkinTypeToString));
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



    master = async(): Promise<Response> => {
        return this.response(MAIN, {
            posts: this.locationData(),
            checkins: this.updateService.lastUpdates(10),
            patrols: this.patrolsData(),
            graph: this.graphData(),
        });
    }

    posts = async (): Promise<Response> => {
        return this.response(POSTS, {
            posts: this.locationData(),
        });
    }

    post = async (request: Request): Promise<Response> => {
        const locationId = Number.parseInt(request.url.searchParams.get("id"));
        let post = this.locationService.locationInfo(locationId);

        let patrolsOnTheirWayIDs = this.locationService.patrolsTowardsLocation(locationId);
        
        // if the location is the first location, include patrols that have no patrol update yet
        if(locationId === Number.parseInt(this.adminService.settings[SETTINGS_TABLE.SETTING_FIRST_LOCATION_ID])) {
            const patrolsWithNoUpdates = this.patrolService.allPatrolsWithNoUpdates();
            patrolsOnTheirWayIDs = patrolsOnTheirWayIDs.concat(patrolsWithNoUpdates);
        }

        return this.response(POST, {
            patrolsOnPost: this.patrolsData(this.locationService.patrolsOnLocation(locationId)),
            patrolsOnTheirWay: this.patrolsData(patrolsOnTheirWayIDs),
            patrolsCheckedOut: this.patrolsData(this.locationService.patrolsCheckedOutFromLocation(locationId)),
            post: post,
            checkins: this.updateService.updatesAtLocation(locationId).reverse(),
        });
    }

    checkin = async (request: Request): Promise<Response> => {
        const params = request.url.searchParams;
        const patrolId = params.get("patrolId");
        const locationId = params.get("locationId");
        return this.response(CHECKIN, {
            patrols: this.patrolService.allPatrolIds().map((patrolId) => this.patrolService.patrolInfo(patrolId)),
            posts: this.locationService.allLocationIds().map((locationId) => this.locationService.locationInfo(locationId)),
            selectedPatrol: patrolId,
            selectedPost: locationId,
        });
    }

    checkins = async (request: Request): Promise<Response> => {
        let patrolUpdates = undefined;
        const params = request.url.searchParams;

        let patrolId = params.get("patrolId");
        let locationId = params.get("locationId");
        if(patrolId != undefined) {
            patrolUpdates = this.updateService.latestUpdatesOfPatrol(Number.parseInt(patrolId), 0);
        }
        else if(locationId != undefined) {
            patrolUpdates = this.updateService.updatesAtLocation(Number.parseInt(locationId)).reverse();
        }

        if(patrolUpdates === undefined){
            patrolUpdates = this.updateService.lastUpdates(20);
        }

        return this.response(CHECKINS, {
            checkins: patrolUpdates,
        });
    }

    patrols = async (request: Request): Promise<Response> => {
        let patrolIds = undefined;
        let locationId = undefined;
        let selection = undefined
        const params = request.url.searchParams;

        const postIdStr = params.get("locationId");
        if(postIdStr != undefined) {
            locationId = Number.parseInt(postIdStr);
            selection = params.get("selection");
            if(selection === "patrolsOnTheirWay") {
                patrolIds = this.locationService.patrolsTowardsLocation(locationId);
            } else if(selection === "patrolsOnPost") {
                patrolIds = this.locationService.patrolsOnLocation(locationId);
            } else if(selection === "patrolsCheckedOut") {
                patrolIds = this.locationService.patrolsCheckedOutFromLocation(locationId);
            }
        }

        const sortBy = params.get("sortBy") || "id";

        return this.response(PATROLS, {
            patrols: this.patrolsData(patrolIds, sortBy),
            sortBy: sortBy,
            locationId: locationId,
            selection: selection,
        });
    }

    patrol = async (request: Request): Promise<Response> => {
        const patrolId = Number.parseInt(request.url.searchParams.get("id"));
        return this.response(PATROL, {
            patrol: this.patrolService.patrolInfo(patrolId),
            checkins: this.updateService.latestUpdatesOfPatrol(patrolId, 0),
            //location: this.patrolService.locationOfPatrol(patrolId),
        });
    }

    graph = async(): Promise<Response> => {
        return this.response(GRAPH, {
            patrols: this.graphData()
        });
    }

    // TODO: Update this to use new location route system
    private graphData = (): any => {
        // const amountOfPosts = this.locationService.allLocationIds().length;
        // const patrols = this.patrolService.allPatrolIds()
        //     .map((patrolId) => {
        //         const postIds = this.updateService.latestUpdatesOfPatrol(patrolId, 1000)
        //             .filter((checkin) => checkin.type === CheckinType.CheckIn)
        //             .map((checkin) => checkin.locationId);
        //         let posts = Array(amountOfPosts - 1).fill(false);
        //         for(let locationId of postIds) {
        //             if(locationId === amountOfPosts) {
        //                 continue;
        //             }
        //             posts[locationId] = true;
        //         }
        //         return { posts: posts, amount: Math.max(...postIds) };
        //     });
        // return patrols;
        return {};
    }

    private patrolsData = (patrolIds?: number[], sortBy?: string): any => {
        if(patrolIds === undefined) {
            patrolIds = this.patrolService.allPatrolIds();
        }
        return patrolIds
            .map((patrolId) => {
                let patrol = this.patrolService.patrolInfo(patrolId);
                let lastCheckin = this.updateService.latestUpdateOfPatrol(patrolId);
                return {
                    lastCheckin: lastCheckin,
                    //location: this.patrolService.locationOfPatrol(patrolId),
                    ...patrol
                };
            })
            .sort((a, b) => {
                if(sortBy === "time") {
                    return a.lastCheckin.time.getTime()
                        - b.lastCheckin.time.getTime();
                }
                if(sortBy === "post") {
                    return (a.lastCheckin.currentLocationId + a.lastCheckin.targetLocationId)
                        - (b.lastCheckin.currentLocationId + b.lastCheckin.targetLocationId);
                }
                return a.id - b.id;
            })
    }

    private locationData = (): postDataToMaster[] => {
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
        return responses.ok(this.render(filename, data));
    }


    formatPatrolLocation = (latestUpdate: PatrolUpdate): string => {
        const fromLocationName = this.locationService.locationInfo(latestUpdate.currentLocationId).name;
        const toLocationName = this.locationService.locationInfo(latestUpdate.targetLocationId).name;
        if(fromLocationName === toLocationName)
            return `På ${fromLocationName}`;
        else
            return `Mellem ${fromLocationName} og ${toLocationName}`;
    }

    formatCheckinLocation = (patrolUpdate: PatrolUpdate): string => {
        const location = this.locationService.locationInfo(patrolUpdate.currentLocationId);
        return location.name;
    }
}

function safeFilter<T>(filterFunc: (item: T) => string, defaultError: string = "Ukendt", log: boolean = false): (item: T) => string {
    return (item: T): string => {
        try {
            return filterFunc(item);
        } catch(e) {
            if(log)
                console.error(e);
            return defaultError;
        }
    };
}

function checkinTypeToString(value: number): string {
    if(value === 0) {
        return "Check ind";
    } else if (value === 1) {
        return "Check ud mod post";
    } else {
        return "Check ud mod omvej";
    }
}

function formatTime(value: Date) {
    if(!(value instanceof Date)) {
        return "Tid ukendt";
    }
    let hour = value.getHours().toString().padStart(2, '0');
    let minute = value.getMinutes().toString().padStart(2, '0');
    let second = value.getSeconds().toString().padStart(2, '0');
    return `${hour}:${minute}:${second}`;
}

function patrolsUrl(sortBy: string =undefined, locationId: string = undefined, selection: string = undefined): string {
    return createUrlPath("/master/patrols", {
        sortBy: sortBy,
        locationId: locationId,
        selection: selection,
    });
}

function createUrlPath(base: string, params: { [key: string]: string | undefined }): string {
    let path = base;
    let symbol = "?";
    for(let key in params) {
        const value = params[key];
        if(value == undefined || value === "") {
            continue;
        }
        path = `${path}${symbol}${key}=${value}`;
        symbol = "&";
    }
    return path;
}

export interface postDataToMaster extends Location{
    patrolsOnPost: number;
    patrolsOnTheirWay: number;
    patrolsCheckedOut: number;
}
