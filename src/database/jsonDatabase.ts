import * as fs from "fs";
import { CheckinType, Checkin, Database, Patrol, Post } from "./generic";

/** Database storing everything in a json file. */
export class JsonDatabase implements Database {
    readonly datafile: string;
    private data: Internal;
    private checkinCounter = 0;

    /**
     * Create new `JsonDatabase`.
     * @param datafile the json file to store data in
     */
    constructor(datafile: string) {
        this.datafile = datafile;
        if (fs.existsSync(datafile)) {
            // TODO error handling
            let content = fs.readFileSync(datafile, "utf-8");
            this.data = JSON.parse(content);
            this.data.posts.forEach((post) => {
                post.lastUpdate = new Date(post.lastUpdate);
            });
            this.checkinCounter = 1 + Math.max(
                ...this.data.checkins.map((checkin) => checkin.id)
            );
        } else {
            this.data = {
                checkins: [],
                patrols: [],
                posts: [],
            }
        }
        console.log(this.data);
    }

    /**
     * Write stored data to file.
     */
    write() {
        let content = JSON.stringify(this.data);
        fs.writeFile(this.datafile, content, () => {
            // TODO error handling
        });
    }

    patrolInfo(patrolId: number): Patrol {
        return this.data.patrols
            .find((patrol) => patrol.id === patrolId);
    }

    changePatrolStatus(patrolId: number, udgået: boolean): void {
        this.data.patrols[patrolId].udgået = udgået;
    }

    allPatrolIds(): number[] {
        return this.data.patrols.map((patrol) => patrol.id);
    }

    latestCheckinOfPatrol(patrol: number): Checkin | null {
        return this.data.checkins
            .filter((checkin) => checkin.patrolId === patrol)
            .reverse()[0];
    }

    postInfo(postId: number): Post {
        return this.data.posts
            .find((post) => post.id == postId);
    }

    changePostStatus(postId: number, open: boolean): void {
        let post = this.postInfo(postId);
        post.open = open;
        this.updatePost(postId);
    }

    allPostIds(): number[] {
        return this.data.posts
            .map((post) => post.id);
    }

    checkinsAtPost(postId: number): Checkin[] {
        return this.data.checkins
            .filter((checkin) => checkin.postId === postId)
    }

    checkin(checkin: Checkin): void {
        if(checkin.id === null) {
            checkin.id = this.checkinCounter;
            this.checkinCounter += 1;
        }
        this.data.checkins.push(checkin);
        this.updatePost(checkin.postId);
    }

    /**
     * Get checkin by id.
     *
     * @param checkinId the id of the checkin to get
     * @returns the checkin with the given id
     */
    checkinById(checkinId: number): Checkin {
        return this.data.checkins
            .find((checkin) => checkin.id === checkinId);
    }

    deleteCheckin(checkinId: number): void {
        this.data.checkins = this.data.checkins
            .filter((checkin) => checkin.id !== checkinId);
        let checkin = this.checkinById(checkinId);
        this.updatePost(checkin.postId);
    }

    reset(): void {
        this.data.checkins = [];
        this.data.posts.forEach((post) => {
            post.open = true;
        });
        this.data.patrols.forEach((patrol) => {
            patrol.udgået = false;
        });
    }

    /**
     * Set last update field of post to current time.
     *
     * @param postId the id of the post to update
     */
    updatePost(postId: number): void {
        let post = this.postInfo(postId);
        post.lastUpdate = new Date();
    }

}

interface Internal {
    patrols: Patrol[];
    checkins: Checkin[];
    posts: Post[];
}
