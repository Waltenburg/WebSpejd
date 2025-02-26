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
    latestCheckinsOfPatrol(patrol: number, amount: number): Checkin[];

    /** Check patrol in or out of post.
     * @param checkin the checkin to add to the database
     * @returns the id of the checkin
    */
    checkin(checkin: Checkin): number;

    /**
     * Create new patrl
     *
     * @param name the name of the new patrol
     * @returns the new patrol id
     */
    createPatrol(name: string): number;

    /**
    * Get information about patrol.
    * @param patrolId the id of the patrol to get information about
    * @returns information about the patrol
    */
    patrolInfo(patrolId: number): Patrol | undefined;

    /**
     * Change udgået status of patrol.
     *
     * @param patrolId the id of the patrol to change
     * @param udgået `true` if the patrol id "udgået", `false` otherwise
     */
    changePatrolStatus(patrolId: number, udgået: boolean): void;

    /**
     * Change information about patrol
     *
     * @param patrolId the id of the patrol to change
     * @param patrol the new patrol info
     */
    changePatrol(patrolId: number, patrol: Patrol): void;

    /**
     * Get list of all patrol ids.
     *
     * @returns a list of all patrol ids
     */
    allPatrolIds(): number[];

    /**
     * Create new post in database
     *
     * @param post the new post
     */
    createPost(post: Post): void;

    /**
     * Get information about a post.
     * @param postId the id of the post
     * @return information about the post
     */
    postInfo(postId: number): Post | undefined;

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
     * Get checkin by id.
     *
     * @param checkinId the id of the checkin
     * @returns the checkin with the id or `undefined` if checkin does not exist
     */
    checkinById(checkinId: number): Checkin | undefined

    /**
     * Delete checkin from database.
     *
     * @param checkinId the id of the checkin to delete
     */
    deleteCheckin(checkinId: number): void;

    /**
     * Get the last x checkins.
     *
     * @param amount the amount of checkins to get
     * @returns the last x checkins
     */
    lastCheckins(amount: number): Checkin[];

    /**
     * Get all ids of checkins.
     *
     * @returns list of checkin ids
     */
    allCheckinIds(): number[];

    /**
     * Get post id matching password.
     *
     * @param password the password to login with
     * @returns the post id of the post authenticated with
     */
    authenticate(password: string): number | undefined;

    /**
     * Get list of all user ids.
     * 
     * @returns list of user ids
     */
    userIds(): number[];
}
