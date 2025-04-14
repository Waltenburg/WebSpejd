import { Checkin, CheckinType, Database, Patrol, Post, PostChange } from "./generic";

export class DatabaseWrapper implements Database {
    private db: Database;

    constructor(db: Database) {
        this.db = db;
    }

    /**
     * Change detour from open to closed or closed to open.
     *
     * @param postId the id of the post to change
     * @returns `true` if status changed, `false` otherwise
     */
    changeDetourStatus(postId: number, open: boolean): boolean {
        this.db.changePost(postId, {open: open});
        return true;
    }

    /**
     * Check all patrols in at post 0.
     */
    sendAllPatruljerTowardsFirstPost() {
        console.log("Sending all patrols to first post");
        let time = new Date();
        this.db.allPatrolIds().forEach((patrolId) => {
            this.db.checkin({
                patrolId: patrolId,
                postId: 0,
                type: CheckinType.CheckIn,
                time: time,
            });
        });
    }

    /**
     * Verifies that a patrol can be checkout out of a post.
     *
     * @param patrolId the id of the patrol to check out
     * @param postId the id of the post to check out of
     * @param detour `true` if the patrol is sent on a detour, `false` otherwise
     * @return `true` if the patrol can be checked out, `false` otherwise
     */
    canPatruljeBeCheckedUd(patrolId: number, postId: number, detour: boolean): boolean {
        const post = this.db.postInfo(postId);
        if(post === undefined) {
            return false;
        }

        const lastCheckin = this.latestCheckinOfPatrol(patrolId);
        const patrolInfo = this.db.patrolInfo(patrolId);
        const hasDetour = post.detour !== undefined;

        return lastCheckin !== undefined
            && patrolInfo !== undefined
            && lastCheckin.postId === postId
            && lastCheckin.type === CheckinType.CheckIn
            && !patrolInfo.udgået
            && (detour ? hasDetour : true);
    }

    /**
     * Check if a patrol can be checked in at a post.
     *
     * @param patrolId the id of the patrol
     * @param postId the id of the post
     * @return `true` if the patrol can be checked in, `false` otherwise
     */
    canPaltrolBeCheckedIn(patrolId: number, postId: number): boolean {
        const lastCheckin = this.latestCheckinOfPatrol(patrolId);
        if(lastCheckin === undefined) {
            return postId === 0;
        }

        const patrolIsOnDetour = lastCheckin.type == CheckinType.Detour;
        const patrolInfo = this.db.patrolInfo(patrolId);

        return patrolInfo !== undefined
            && lastCheckin.type !== CheckinType.CheckIn
            && this.nextPostId(lastCheckin.postId, patrolIsOnDetour) === postId
            && !patrolInfo.udgået;
    }

    latestCheckinOfPatrol(patrolId: number): Checkin | undefined {
        return this.db.latestCheckinsOfPatrol(patrolId, 1)[0];
    }

    /**
     * Get list of patrols at a post.
     * @param postId the id of the post
     * @returns the patrol ids of the patrols at the post
     */
    patrolsAtPost(postId: number): number[] {
        let checkins = this.db.checkinsAtPost(postId);

        let patrolsCheckedOut = checkins
            .filter((checkin) => checkin.type !== CheckinType.CheckIn)
            .map((checkin) => checkin.patrolId);

        let patrolsAtPost = checkins
            .filter((checkin) => {
                return checkin.type === CheckinType.CheckIn
                    && !patrolsCheckedOut.includes(checkin.patrolId)
            })
            .map((checkin) => checkin.patrolId)
            .filter((patrolId) => !(this.db.patrolInfo(patrolId)?.udgået || true));

        return patrolsAtPost;
    }

    /**
     * Get patrols on their way to a post
     *
     * @param postId the id of the post the patrols are on their way to
     * @return a list of patrol ids
     */
    patrolsOnTheirWay(postId: number): number[] {
        return this.db.allPatrolIds()
            .filter((patrolId) => this.canPaltrolBeCheckedIn(patrolId, postId));
    }

    /**
     * Get ids of patrols that are checked out of a post.
     *
     *
     * @param postId the id of the post the patrols have leaved
     * @returns a list of patrol ids
     */
    patrolsCheckedOut(postId: number): number[] {
        return this.db.checkinsAtPost(postId)
            .filter((checkin) => checkin.type !== CheckinType.CheckIn)
            .map((checkin) => checkin.patrolId);
    }

    /**
     * Get id id of next post
     * @param postId the id of current post
     * @param detour `true` if allowed to include detours, `false` otherwise
     * @returns the id of the next post
     */
    private nextPostId(postId: number, detour: boolean): number {
        const post = this.db.postInfo(postId);
        if(post === undefined) {
            return -1;
        }
        if(detour && post.detour !== undefined) {
            return post.detour;
        } else {
            return post.next_post;
        }
    }

    /**
     * Verify a checkin is valid.
     *
     * @param checkin the checkin to verify
     * @returns `true` if checkin is valid, `false` otherwise
     */
    isCheckinValid(checkin: Checkin): boolean {
        if(checkin.type === CheckinType.CheckIn) {
            return this.canPaltrolBeCheckedIn(checkin.patrolId, checkin.postId);
        } else {
            const detour = checkin.type === CheckinType.Detour;
            return this.canPatruljeBeCheckedUd(checkin.patrolId, checkin.postId, detour);
        }
    }

    /**
     * Reset database.
     * * Remove all checkins
     * * Set all posts to open
     * * Remove "udgået" status from all patrols
     */
    reset() {
        // Remove all checkins
        this.db.allCheckinIds().forEach((checkinId) => {
            this.db.deleteCheckin(checkinId);
        });

        // Set all posts to open
        this.db.allPostIds().forEach((postId) => {
            this.db.changePost(postId, {open: true});
        });

        // Remove "udgået" status from all patrols
        this.db.allPatrolIds().forEach((patrolId) => {
            this.db.changePatrolStatus(patrolId, false);
        });
    }

    /**
     * Get current location of patrol.
     * 
     * @param patrolId the id of the patrol
     * @returns the location of the patrol
     */
    locationOfPatrol(patrolId: number): PatrolLocation {
        const patrol = this.db.patrolInfo(patrolId);
        if(patrol === undefined) {
            return {
                type: PatrolLocationType.Unknown,
                postId: -1,
            };
        }
        if(patrol.udgået) {
            return {
                type: PatrolLocationType.Udgået,
                postId: -1,
            };
        }
        let latestCheckin = this.latestCheckinOfPatrol(patrolId);
        if(latestCheckin === undefined) {
            return {
                type: PatrolLocationType.GoingToLocation,
                postId: 0
            }
        }
        if(latestCheckin.type === CheckinType.CheckIn) {
            return {
                type: PatrolLocationType.OnLocation,
                postId: latestCheckin.postId
            };
        }
        let isDetour = latestCheckin.type === CheckinType.Detour;
        let nextPostId = this.nextPostId(latestCheckin.postId, isDetour);
        return {
            type: PatrolLocationType.GoingToLocation,
            postId: nextPostId
        };
    }

    checkin(checkin: Checkin): number {
        return this.db.checkin(checkin);
    }

    latestCheckinsOfPatrol(patrol: number, amount: number): Checkin[] {
        return this.db.latestCheckinsOfPatrol(patrol, amount);
    }

    createPatrol(name: string): number {
        return this.db.createPatrol(name);
    }

    patrolInfo(patrolId: number): Patrol | undefined {
        return this.db.patrolInfo(patrolId);
    }

    changePatrolStatus(patrolId: number, udgået: boolean): void {
        this.db.changePatrolStatus(patrolId, udgået);
    }

    changePatrol(patrolId: number, patrol: Patrol): void {
        this.db.changePatrol(patrolId, patrol);
    }

    allPatrolIds(): number[] {
        return this.db.allPatrolIds();
    }

    createPost(post: Post): void {
        this.db.createPost(post);
    }

    changePost(postId: number, change: PostChange) {
        this.db.changePost(postId, change);
    }

    postInfo(postId: number): Post | undefined {
        return this.db.postInfo(postId);
    }

    allPostIds(): number[] {
        return this.db.allPostIds();
    }

    checkinsAtPost(postId: number): Checkin[] {
        return this.db.checkinsAtPost(postId);
    }

    checkinById(checkinId: number): Checkin | undefined {
        return this.db.checkinById(checkinId);
    }

    deleteCheckin(checkinId: number): void {
        this.db.deleteCheckin(checkinId);
    }

    deleteAllCheckins(): void {
        this.db.allCheckinIds().forEach(id => {
            this.deleteCheckin(id);
        });
    }

    lastCheckins(amount: number): Checkin[] {
        return this.db.lastCheckins(amount);
    }

    allCheckinIds(): number[] {
        return this.db.allCheckinIds();
    }

    authenticate(password: string): number | undefined {
        return this.db.authenticate(password);
    }

    userIds(): number[] {
        return this.db.userIds();
    }

}

export interface PatrolLocation {
    /** Is the patrol on a location or going to a location. */
    type: PatrolLocationType,
    /** Id of the post thåe patrol is going to or on */
    postId: number,
}

export enum PatrolLocationType {
    OnLocation, GoingToLocation, Udgået, Unknown
}
