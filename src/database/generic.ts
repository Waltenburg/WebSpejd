export enum CheckinType {
    CheckIn, CheckOut, Detour
}

/** Information about a patrol checkin or checkout. */
export interface Checkin {
    /** Id of the checkin. */
    id?: number;
    /** The id of the patrol that checked in. */
    patrolId: number;
    /** The id of the post the patrol was checked in at. */
    postId: number;
    /** The type of checkin. */
    type: CheckinType;
    /** The time the patrol was checked in. */
    time: Date;
}

/** Information about a patrol. */
export interface Patrol {
    id: number;
    name: string;
    udgået: boolean;
}

/** Information about a post. */
export interface Post {
    id: number;
    name: string;
    team: number;
    detour: boolean;
    open: boolean;
    lastUpdate: Date;
    // startTime: Date;
    // endTime: Date;
}

export interface Database {
    /**
     * Find the latest checkin of the specified patrol.
     * @param patrol the patrol to get the latest checkin of
     * @return the latest checkin of the patrol or `null` if none exist
     */
    latestCheckinOfPatrol(patrol: number): Checkin | null;

    /** Check patrol in or out of post. */
    checkin(checkin: Checkin): void;

    /**
    * Get information about patrol.
    * @param patrolId the id of the patrol to get information about
    * @returns information about the patrol
    */
    patrolInfo(patrolId: number): Patrol;

    /**
     * Change udgået status of patrol.
     *
     * @param patrolId the id of the patrol to change
     * @param udgået `true` if the patrol id "udgået", `false` otherwise
     */
    changePatrolStatus(patrolId: number, udgået: boolean): void;

    /**
     * Get list of all patrol ids.
     *
     * @returns a list of all patrol ids
     */
    allPatrolIds(): number[];

    /**
     * Get information about a post.
     * @param postId the id of the post
     * @return information about the post
     */
    postInfo(postId: number): Post;

    /**
     * Change status of post.
     *
     * @param postId the id of the post to change
     * @param open `true` if the post should be open, `false` otherwise
     */
    changePostStatus(postId: number, open: boolean): void;

    /**
     * Get all ids of posts.
     *
     * @returns list of post ids
     */
    allPostIds(): number[];

    /**
     * Get all checkins at post
     * @param postId the id of the post
     * @returns the checkins at the post
     */
    checkinsAtPost(postId: number): Checkin[];

    /**
     * Delete checkin from database.
     *
     * @param checkinId the id of the checkin to delete
     */
    deleteCheckin(checkinId: number): void;

    /**
     * Reset database.
     * * Remove all checkins
     * * Set all posts to open
     * * Remove "udgået" status from all patrols
     */
    reset(): void;
}
