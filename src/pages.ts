import * as responses from "./response";
import nunjucks from "nunjucks";
import { Request } from "./request";
import { Database, LocationService, PatrolService, UpdateService } from "./databaseBarrel";
import { PatrolLocation, PatrolUpdateType, PatrolLocationType, PatrolUpdate, Location } from "./database/types";

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

    private env: nunjucks.Environment;


    constructor(templateDir: string, db: Database, cache: boolean,
        locationService: LocationService, patrolService: PatrolService, updateService: UpdateService 
    ) {
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
        const postId = Number.parseInt(request.url.searchParams.get("id"));
        let post = this.locationService.locationInfo(postId);
        return this.response(POST, {
            patrolsOnPost: this.patrolsData(this.locationService.patrolsOnLocation(postId)),
            patrolsOnTheirWay: this.patrolsData(this.locationService.patrolsTowardsLocation(postId)),
            patrolsCheckedOut: this.patrolsData(this.locationService.patrolsCheckedOutFromLocation(postId)),
            post: post,
            checkins: this.updateService.updatesAtLocation(postId).reverse(),
        });
    }

    checkin = async (request: Request): Promise<Response> => {
        const params = request.url.searchParams;
        const patrolId = params.get("patrolId");
        const postId = params.get("postId");
        return this.response(CHECKIN, {
            patrols: this.patrolService.allPatrolIds().map((patrolId) => this.patrolService.patrolInfo(patrolId)),
            posts: this.locationService.allLocationIds().map((postId) => this.locationService.locationInfo(postId)),
            selectedPatrol: patrolId,
            selectedPost: postId,
        });
    }

    checkins = async (request: Request): Promise<Response> => {
        let checkins = undefined;
        const params = request.url.searchParams;

        let patrolId = params.get("patrolId");
        if(patrolId != undefined) {
            checkins = this.updateService.latestUpdatesOfPatrol(Number.parseInt(patrolId), 100);
        }

        let postId = params.get("postId");
        if(postId != undefined) {
            checkins = this.updateService.updatesAtLocation(Number.parseInt(postId)).reverse();
        }

        if(checkins === undefined){
            checkins = this.updateService.lastUpdates(20);
        }

        return this.response(CHECKINS, {
            checkins: checkins,
        });
    }

    patrols = async (request: Request): Promise<Response> => {
        let patrolIds = undefined;
        let postId = undefined;
        let selection = undefined
        const params = request.url.searchParams;

        const postIdStr = params.get("postId");
        if(postIdStr != undefined) {
            postId = Number.parseInt(postIdStr);
            selection = params.get("selection");
            if(selection === "patrolsOnTheirWay") {
                patrolIds = this.locationService.patrolsTowardsLocation(postId);
            } else if(selection === "patrolsOnPost") {
                patrolIds = this.locationService.patrolsOnLocation(postId);
            } else if(selection === "patrolsCheckedOut") {
                patrolIds = this.locationService.patrolsCheckedOutFromLocation(postId);
            }
        }

        const sortBy = params.get("sortBy") || "id";

        return this.response(PATROLS, {
            patrols: this.patrolsData(patrolIds, sortBy),
            sortBy: sortBy,
            postId: postId,
            selection: selection,
        });
    }

    patrol = async (request: Request): Promise<Response> => {
        const patrolId = Number.parseInt(request.url.searchParams.get("id"));
        return this.response(PATROL, {
            patrol: this.patrolService.patrolInfo(patrolId),
            checkins: this.updateService.latestUpdatesOfPatrol(patrolId, 100),
            location: this.patrolService.locationOfPatrol(patrolId),
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
        //             .map((checkin) => checkin.postId);
        //         let posts = Array(amountOfPosts - 1).fill(false);
        //         for(let postId of postIds) {
        //             if(postId === amountOfPosts) {
        //                 continue;
        //             }
        //             posts[postId] = true;
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
                    location: this.patrolService.locationOfPatrol(patrolId),
                    ...patrol
                };
            })
            .sort((a, b) => {
                if(sortBy === "time") {
                    return a.lastCheckin.time.getTime()
                        - b.lastCheckin.time.getTime();
                }
                if(sortBy === "post") {
                    return a.location.locationId - b.location.locationId;
                }
                return a.id - b.id;
            })
    }

    private locationData = (): postDataToMaster[] => {
         return this.locationService.allLocationIds()
            .map((postId) => {
                let base = this.locationService.locationInfo(postId);
                return {
                    patrolsOnPost: this.locationService.patrolsOnLocation(postId).length,
                    patrolsOnTheirWay: this.locationService.patrolsTowardsLocation(postId).length,
                    patrolsCheckedOut: this.locationService.patrolsCheckedOutFromLocation(postId).length,
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


    formatPatrolLocation = (location: PatrolLocation): string => {
        const locationInfo = this.locationService.locationInfo(location.locationId);
        if(location.type === PatrolLocationType.GoingToLocation) {
            return `Går mod ${locationInfo.name}`;
            // return `Går mod ${post.name}`;
        } else if(location.type === PatrolLocationType.OnLocation) {
            return `På post ${locationInfo.name}`;
        } else {
            return `Udgået`;
        }
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

function patrolsUrl(sortBy: string =undefined, postId: string = undefined, selection: string = undefined): string {
    return createUrlPath("/master/patrols", {
        sortBy: sortBy,
        postId: postId,
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
