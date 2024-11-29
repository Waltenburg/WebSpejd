import { Checkin, CheckinType, Database, Patrol, Post } from "./generic";
import { JsonDatabase } from "./jsonDatabase";

export class DatabaseWrapper implements Database {
    private db: Database;

    constructor(db: Database) {
        this.db = db;
    }

    /**
     * Add initial data to database.
     */
    initialize(): void {
        const isInitialized = this.db.allCheckinIds().length === 0;
        if(isInitialized) {
            return;
        }

        this.sendAllPatruljerTowardsFirstPost();
    }

    /**
     * Change detour from open to closed or closed to open.
     *
     * @param postId the id of the post to change
     * @returns `true` if status changed, `false` otherwise
     */
    changeDetourStatus(postId: number, open: boolean): boolean {
        let post = this.db.postInfo(postId);
        if (!post?.detour || post.open === open) {
            return false;
        }
        this.db.changePostStatus(postId, open);
        return true;
    }

    /**
     * Check all patrols in at post 0.
     */
    sendAllPatruljerTowardsFirstPost() {
        console.log("Sending all patrols to first post");
        let time = new Date();
        this.db.allPatrolIds().forEach((patrolId) => {
            this.checkin({
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
        const lastCheckin = this.db.latestCheckinOfPatrol(patrolId);
        const patrolInfo = this.db.patrolInfo(patrolId);
        const nextPostIsDetour = this.db.postInfo(postId + 1)?.detour || false;

        return lastCheckin !== undefined
            && patrolInfo !== undefined
            && lastCheckin.postId === postId
            && lastCheckin.type === CheckinType.CheckIn
            && !patrolInfo.udgået
            && (detour ? nextPostIsDetour : true);
    }

    /**
     * Check if a patrol can be checked in at a post.
     *
     * @param patrolId the id of the patrol
     * @param postId the id of the post
     * @return `true` if the patrol can be checked in, `false` otherwise
     */
    canPaltrolBeCheckedIn(patrolId: number, postId: number): boolean {
        const lastCheckin = this.db.latestCheckinOfPatrol(patrolId);
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

    /**
     * Get list of patrols at a post.
     * @param postId the id of the post
     * @returns the patrol ids of the patrols at the post
     */
    patruljerPåPost(postId: number): number[] {
        let checkins = this.db.checkinsAtPost(postId);
        let patrolsCheckedOut = checkins
            .filter((checkin) => checkin.type !== CheckinType.CheckIn)
            .map((checkin) => checkin.patrolId);
        let patrolsAtPost = checkins
            .filter((checkin) => {
                return checkin.type === CheckinType.CheckIn
                    && !patrolsCheckedOut.includes(checkin.patrolId)
            })
            .map((checkin) => checkin.patrolId);
        return patrolsAtPost;
    }

    /**
     * Get patrols on detour from post.
     *
     * @param postId the id of the post the patrol is on detour from.
     * @return a list of patrol ids
     */
    patruljerPåVej(postId: number): number[] {
        return this.db.allPatrolIds()
            .filter((patrolId) => this.canPaltrolBeCheckedIn(patrolId, postId));
    }

    /**
     * Get id id of next post
     * @param postId the id of current post
     * @param detour `true` if allowed to include detours, `false` otherwise
     * @returns the id of the next post
     */
    private nextPostId(postId: number, detour: boolean): number {
        //Alt efter om patruljen skal på omvej og om den næste post er en omvej, er den næste post jo noget forskelligt
        const post = this.db.postInfo(postId + 1);
        if(!detour && post !== undefined && post.detour) {
            return postId + 2;
        }
        return postId + 1;
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
            this.db.changePostStatus(postId, true);
        });

        // Remove "udgået" status from all patrols
        this.db.allPatrolIds().forEach((patrolId) => {
            this.db.changePatrolStatus(patrolId, false);
        });
    }

    checkin(checkin: Checkin) {
        this.db.checkin(checkin);
    }

    latestCheckinOfPatrol(patrol: number): Checkin | undefined {
        return this.db.latestCheckinOfPatrol(patrol);
    }

    patrolInfo(patrolId: number): Patrol | undefined {
        return this.db.patrolInfo(patrolId);
    }

    changePatrolStatus(patrolId: number, udgået: boolean): void {
        this.db.changePostStatus(patrolId, udgået);
    }

    allPatrolIds(): number[] {
        return this.db.allPatrolIds();
    }

    changePostStatus(postId: number, open: boolean): void {
        this.db.changePostStatus(postId, open);
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

    deleteCheckin(checkinId: number): void {
        this.db.deleteCheckin(checkinId);
    }

    allCheckinIds(): number[] {
        return this.db.allCheckinIds();
    }

}
