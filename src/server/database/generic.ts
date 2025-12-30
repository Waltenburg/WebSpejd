// export enum PatrolUpdateType {
//     CheckIn, CheckOut
// }

// /** Information about a patrol checkin or checkout. */
// export interface PatrolUpdate {
//     /** Id of the checkin. */
//     id?: number;
//     /** The id of the patrol that checked in. */
//     patrolId: number;
//     /** The id of the post the patrol is currently at. */
//     currentLocationId: number;
//     /** The id of the post the patrol is moving towards or checking into. */
//     targetLocationId: number;
//     /** The time the patrol was checked in. */
//     time: Date;
// }

// /** Information about a patrol. */
// export interface Patrol {
//     id: number;
//     name: string;
//     udgået: boolean;
// }

// /** Information about a location. */
// export interface Location {
//     id: number;
//     name: string;
//     team: number;
//     open: boolean;
//     lastUpdate: Date;
// }

// export interface Route{
//     id: number;
//     fromLocation: number;
//     toLocation: number;
//     open: boolean;
//     distance?: number;
// }

// /** Information about a user as it is stored in the database */
// export interface User{
//     id: number;
//     postId: number;
//     password: string;
// }

// export interface Database {
//     /**
//      * Find the latest checkin of the specified patrol.
//      * @param patrol the patrol to get the latest checkin of
//      * @return the latest checkin of the patrol or `null` if none exist
//      */
//     latestUpdatesOfPatrol(patrol: number, amount: number): PatrolUpdate[];

//     /** Check patrol in or out of post.
//      * @param update the checkin to add to the database
//      * @returns the id of the checkin
//     */
//     updatePatrol(update: PatrolUpdate): number;

//     /**
//     * Get information about patrol.
//     * @param patrolId the id of the patrol to get information about
//     * @returns information about the patrol
//     */
//     patrolInfo(patrolId: number): Patrol | undefined;

//     /**
//      * Change udgået status of patrol.
//      *
//      * @param patrolId the id of the patrol to change
//      * @param udgået `true` if the patrol id "udgået", `false` otherwise
//      */
//     changePatrolStatus(patrolId: number, udgået: boolean): void;

//     /**
//      * Get list of all patrol ids.
//      *
//      * @returns a list of all patrol ids
//      */
//     allPatrolIds(): number[];

//     /**
//      * Get a list of all routes.
//      *
//      * @returns a list of all routes
//      */
//     allRoutes(): Route[];

//     /**
//      * Check if route between two locations is available. A route is available if it exists and is open.
//      *
//      * @param currentLocationId the id of the current location
//      * @param targetLocationId the id of the target location
//      * @returns `true` if the route is available, `false` otherwise
//      */
//     isRouteAvailable(currentLocationId: number, targetLocationId: number): boolean;

//     /**
//      * Get a list of all routes from a location.
//      *
//      * @param locationId the id of the location
//      * @returns a list of all routes from the location
//      */
//     allRoutesFromLocation(locationId: number): Route[];

//     /**
//      * Get a list of all routes to a location.
//      *
//      * @param locationId the id of the location
//      * @returns a list of all routes to the location
//      */
//     allRoutesToLocation(locationId: number): Route[];

//     /**
//      * Get information about a post.
//      * @param postId the id of the post
//      * @return information about the post
//      */
//     locationInfo(locationId: number): Location | undefined;

//     /**
//      * Change status of post.
//      *
//      * @param postId the id of the post to change
//      * @param open `true` if the post should be open, `false` otherwise
//      */
//     changeLocationStatus(locationId: number, open: boolean): void;

//     /**
//      * Get all ids of posts.
//      *
//      * @returns list of post ids
//      */
//     allLocationIds(): number[];

//     /**
//      * Get all checkins at post
//      * @param postId the id of the post
//      * @returns the checkins at the post
//      */
//     updatesAtLocation(locationId: number): PatrolUpdate[];

//     /**
//      * Get checkin by id.
//      *
//      * @param updateId the id of the update
//      * @returns the update with the id or `undefined` if update does not exist
//      */
//     updateById(updateId: number): PatrolUpdate | undefined

//     /**
//      * Delete checkin from database.
//      *
//      * @param updateId the id of the checkin to delete
//      */
//     deleteUpdate(updateId: number): void;

//     /**
//      * Get the last x checkins.
//      *
//      * @param amount the amount of checkins to get
//      * @returns the last x checkins
//      */
//     lastUpdates(amount: number): PatrolUpdate[];

//     /**
//      * Get all ids of checkins.
//      *
//      * @returns list of checkin ids
//      */
//     allPatrolUpdatesIds(): number[];

//     /**
//      * Get post id matching password.
//      *
//      * @param password the password to login with
//      * @returns the post id of the post authenticated with
//      */
//     authenticate(password: string): number | undefined;

//     /**
//      * Get list of all user ids.
//      * 
//      * @returns list of user ids
//      */
//     userIds(): number[];
// }
