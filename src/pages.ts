import { DatabaseWrapper } from "./database";
import * as responses from "./response";
import nunjucks from "nunjucks";

type Response = responses.Response;

export const MAIN: string = "master/main.html.njk";
export const POSTS: string = "master/posts.html.njk";
export const POST: string = "master/post.html.njk";
export const CHECKINS: string = "master/checkins.html.njk";
export const PATROLS: string = "master/patrols.html.njk";
export const PATROL: string = "master/patrol.html.njk";

export class Pages {
    private db: DatabaseWrapper;
    private env: nunjucks.Environment;

    constructor(db: DatabaseWrapper) {
        this.env = new nunjucks.Environment(
            new nunjucks.FileSystemLoader('assets/html'),
            { autoescape: true }
        );
        this.env.addFilter("checkinName", checkinTypeToString);
        this.env.addFilter("clock", clock);

        this.db = db;
    }

    master(): Response {
        return this.response(MAIN, {
            posts: this.postsData(),
            checkins: this.db.lastCheckins(10),
            patrols: this.patrolsData(),
        });
    }

    posts(): Response {
        return this.response(POSTS, {
            posts: this.postsData(),
        });
    }

    post(postId: number): Response {
        let post = this.db.postInfo(postId);
        return this.response(POST, post);
    }

    checkins(): Response {
        return this.response(CHECKINS, {
            checkins: this.db.lastCheckins(10),
        })
    }

    patrols(): Response {
        return this.response(PATROLS, {
            patrols: this.patrolsData(),
        });
    }

    patrol(patrolId: number): Response {
        return this.response(PATROL, {
            patrol: this.db.patrolInfo(patrolId),
            checkins: this.db.latestCheckinsOfPatrol(patrolId, 100),
        });
    }

    private patrolsData(): any {
        return this.db.allPatrolIds()
            .map((patrolId) => {
                let patrol = this.db.patrolInfo(patrolId);
                let lastCheckin = this.db.latestCheckinOfPatrol(patrolId);
                return {
                    lastCheckin: lastCheckin,
                    ...patrol
                }
            })
    }

    private postsData(): any {
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
    render(filename: string, data: any): string {
        return this.env.render(filename, data);
    }

    /**
     * Render template and return response.
     *
     * @param filename the path to the template file
     * @param data the data for the template
     * @returns the rendered template
     */
    response(filename: string, data: any): responses.Response {
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

function clock(value: Date) {
    let hour = value.getHours();
    let minute = value.getMinutes();
    let second = value.getSeconds();
    return `${hour}:${minute}:${second}`;
}
