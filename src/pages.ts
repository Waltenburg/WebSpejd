import { CheckinType, DatabaseWrapper } from "./database";
import { PatrolLocation, PatrolLocationType } from "./database/wrapper";
import * as responses from "./response";
import nunjucks from "nunjucks";
import { Request } from "./request";
import { Post } from "./database/generic";

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
    private db: DatabaseWrapper;
    private env: nunjucks.Environment;

    constructor(templateDir: string, db: DatabaseWrapper, cache: boolean) {
        this.env = new nunjucks.Environment(
            new nunjucks.FileSystemLoader(templateDir),
            {
                autoescape: true,
                noCache: !cache
            }
        );
        this.env.addFilter("checkinName", checkinTypeToString);
        this.env.addFilter("clock", formatTime);
        this.env.addFilter("formatLocation", formatLocation);
        this.env.addGlobal("patrolsUrl", patrolsUrl);

        this.db = db;
    }

    master = async(): Promise<Response> => {
        return this.response(MAIN, {
            posts: this.postsData(),
            checkins: this.db.lastCheckins(10),
            patrols: this.patrolsData(),
            graph: this.graphData(),
        });
    }

    posts = async (): Promise<Response> => {
        return this.response(POSTS, {
            posts: this.postsData(),
        });
    }

    post = async (request: Request): Promise<Response> => {
        const postId = Number.parseInt(request.url.searchParams.get("id"));
        let post = this.db.postInfo(postId);
        return this.response(POST, {
            patrolsOnPost: this.patrolsData(this.db.patruljerPåPost(postId)),
            patrolsOnTheirWay: this.patrolsData(this.db.patruljerPåVej(postId)),
            patrolsCheckedOut: this.patrolsData(this.db.patrolsCheckedOut(postId)),
            post: post,
            checkins: this.db.checkinsAtPost(postId).reverse(),
        });
    }

    checkin = async (request: Request): Promise<Response> => {
        const params = request.url.searchParams;
        const patrolId = params.get("patrolId");
        const postId = params.get("postId");
        return this.response(CHECKIN, {
            patrols: this.db.allPatrolIds().map((patrolId) => this.db.patrolInfo(patrolId)),
            posts: this.db.allPostIds().map((postId) => this.db.postInfo(postId)),
            selectedPatrol: patrolId,
            selectedPost: postId,
        });
    }

    checkins = async (request: Request): Promise<Response> => {
        let checkins = undefined;
        const params = request.url.searchParams;

        let patrolId = params.get("patrolId");
        if(patrolId != undefined) {
            checkins = this.db.latestCheckinsOfPatrol(Number.parseInt(patrolId), 100);
        }

        let postId = params.get("postId");
        if(postId != undefined) {
            checkins = this.db.checkinsAtPost(Number.parseInt(postId)).reverse();
        }

        if(checkins === undefined){
            checkins = this.db.lastCheckins(20);
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
                patrolIds = this.db.patruljerPåVej(postId);
            } else if(selection === "patrolsOnPost") {
                patrolIds = this.db.patruljerPåPost(postId);
            } else if(selection === "patrolsCheckedOut") {
                patrolIds = this.db.patrolsCheckedOut(postId);
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
            patrol: this.db.patrolInfo(patrolId),
            checkins: this.db.latestCheckinsOfPatrol(patrolId, 100),
            location: this.db.locationOfPatrol(patrolId),
        });
    }

    graph = async(): Promise<Response> => {
        return this.response(GRAPH, {
            patrols: this.graphData()
        });
    }

    private graphData = (): any => {
        const amountOfPosts = this.db.allPostIds().length;
        const patrols = this.db.allPatrolIds()
            .map((patrolId) => {
                const postIds = this.db.latestCheckinsOfPatrol(patrolId, 1000)
                    .filter((checkin) => checkin.type === CheckinType.CheckIn)
                    .map((checkin) => checkin.postId);
                let posts = Array(amountOfPosts - 1).fill(false);
                for(let postId of postIds) {
                    if(postId === amountOfPosts) {
                        continue;
                    }
                    posts[postId] = true;
                }
                return { posts: posts, amount: Math.max(...postIds) };
            });
        return patrols;
    }

    private patrolsData = (patrolIds?: number[], sortBy?: string): any => {
        if(patrolIds === undefined) {
            patrolIds = this.db.allPatrolIds();
        }
        return patrolIds
            .map((patrolId) => {
                let patrol = this.db.patrolInfo(patrolId);
                let lastCheckin = this.db.latestCheckinOfPatrol(patrolId);
                return {
                    lastCheckin: lastCheckin,
                    location: this.db.locationOfPatrol(patrolId),
                    ...patrol
                };
            })
            .sort((a, b) => {
                if(sortBy === "time") {
                    return a.lastCheckin.time.getTime()
                        - b.lastCheckin.time.getTime();
                }
                if(sortBy === "post") {
                    return a.location.postId - b.location.postId;
                }
                return a.id - b.id;
            })
    }

    private postsData = (): postDataToMaster[] => {
         return this.db.allPostIds()
            .map((postId) => {
                let base = this.db.postInfo(postId);
                return {
                    patrolsOnPost: this.db.patruljerPåPost(postId).length,
                    patrolsOnTheirWay: this.db.patruljerPåVej(postId).length,
                    patrolsCheckedOut: this.db.patrolsCheckedOut(postId).length,
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

}

function checkinTypeToString(value: number): string {
    if(value === 0) {
        return "Check ind";
    } else if (value === 1) {
        return "Check ud";
    } else {
        return "Omvej";
    }
}

function formatLocation(location: PatrolLocation): string {
    if(location.type === PatrolLocationType.GoingToLocation) {
        return `Går mod post ${location.postId}`;
    } else if(location.type === PatrolLocationType.OnLocation) {
        return `På post ${location.postId}`;
    } else {
        return `Udgået`;
    }
}

function formatTime(value: Date) {
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

export interface postDataToMaster extends Post{
    patrolsOnPost: number;
    patrolsOnTheirWay: number;
    patrolsCheckedOut: number;
}
