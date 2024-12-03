import * as fs from "fs";
import { Checkin, CheckinType, Database, Patrol, Post } from "./generic";

/** Database storing everything in a json file. */
export class JsonDatabase implements Database {
    readonly datafile: string;
    private data: Internal;
    private inMemory: boolean;
    private checkinCounter = 0;

    /**
     * Create new `JsonDatabase`.
     *
     * @param datafile the json file to store data in
     * @param inMemory will not save data to disk if `true`
     */
    constructor(datafile: string, inMemory = false) {
        this.datafile = datafile;
        this.inMemory = inMemory;
        if (fs.existsSync(datafile)) {
            // TODO error handling
            let content = fs.readFileSync(datafile, "utf-8");
            this.data = JSON.parse(content);
            this.data.posts.forEach((post) => {
                post.lastUpdate = new Date(post.lastUpdate);
            });
            this.checkinCounter = 1 + Math.max(
                ...this.data.checkins.map((checkin) => checkin.id || 0)
            );
        } else {
            this.data = {
                checkins: [],
                patrols: [],
                posts: [],
                users: []
            }
        }
        console.log(this.data);
    }

    /**
     * Write stored data to file.
     */
    write() {
        if(this.inMemory) {
            return;
        }
        let content = JSON.stringify(this.data);
        fs.writeFileSync(this.datafile, content);
    }

    patrolInfo(patrolId: number): Patrol | undefined {
        return this.data.patrols
            .find((patrol) => patrol.id === patrolId);
    }

    changePatrolStatus(patrolId: number, udgået: boolean): void {
        this.data.patrols[patrolId].udgået = udgået;
    }

    allPatrolIds(): number[] {
        return this.data.patrols.map((patrol) => patrol.id);
    }

    latestCheckinsOfPatrol(patrol: number, amount: number): Checkin[] {
        let checkins = this.data.checkins
            .filter((checkin) => checkin.patrolId === patrol);
        return takeLast(checkins, amount);
    }

    postInfo(postId: number): Post | undefined {
        return this.data.posts
            .find((post) => post.id == postId);
    }

    changePostStatus(postId: number, open: boolean): void {
        let post = this.postInfo(postId);
        if(post === undefined) {
            return;
        }
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
        this.data.checkins.push({
            id: checkin.id || this.checkinCounter++,
            ...checkin
        });
        this.updatePost(checkin.postId);
    }

    /**
     * Get checkin by id.
     *
     * @param checkinId the id of the checkin to get
     * @returns the checkin with the given id
     */
    checkinById(checkinId: number): Checkin | undefined {
        return this.data.checkins
            .find((checkin) => checkin.id === checkinId);
    }

    deleteCheckin(checkinId: number): void {
        this.data.checkins = this.data.checkins
            .filter((checkin) => checkin.id !== checkinId);
        let checkin = this.checkinById(checkinId);
        if(checkin === undefined) {
            return;
        }
        this.updatePost(checkin.postId);
    }

    lastCheckins(amount: number): Checkin[] {
        return takeLast(this.data.checkins, amount);
    }

    allCheckinIds(): number[] {
        return this.data.checkins
            .map((checkin) => checkin.id);
    }

    /**
     * Set last update field of post to current time.
     *
     * @param postId the id of the post to update
     */
    updatePost(postId: number): void {
        let post = this.postInfo(postId);
        if(post === undefined) {
            return;
        }
        post.lastUpdate = new Date();
    }

    authenticate(password: string): number | undefined {
        return this.data.users
            .find((user) => user.password === password)
            .postId;
    }

    userIds(): number[] {
        let counter = 0;
        return this.data.users
            .map((_user) => counter++);
    }

}

interface Internal {
    patrols: Patrol[];
    checkins: StoredCheckin[];
    posts: Post[];
    users: User[];
}

interface StoredCheckin {
    /** Id of the checkin. */
    id: number;
    /** The id of the patrol that checked in. */
    patrolId: number;
    /** The id of the post the patrol was checked in at. */
    postId: number;
    /** The type of checkin. */
    type: CheckinType;
    /** The time the patrol was checked in. */
    time: Date;
}

interface User {
    password: string;
    postId: number
}

function takeLast<T>(l: T[], amount: number): T[] {
    return l.slice(Math.max(l.length - amount, 0))
        .reverse();
}
