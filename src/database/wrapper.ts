// import { PatrolUpdate, PatrolUpdateType, Database, Patrol, Location } from "./generic";

// export class DatabaseWrapper implements Database {
//     private db: Database;
//     /** The id of the first post. */
//     private firstPostId: number = 1;

//     constructor(db: Database) {
//         this.db = db;
//         // this.initialize();
//     }

//     /**
//      * Add initial data to database.
//      */
//     // private initialize(): void {
//     //     const isInitialized = this.db.allCheckinIds().length !== 0;
//     //     if(isInitialized) {
//     //         return;
//     //     }
//     //     this.sendAllPatruljerTowardsFirstPost();
//     // }

//     /**
//      * Verifies that a patrol can be checkout out of a post.
//      *
//      * @param patrolId the id of the patrol to check out
//      * @param postId the id of the post to check out of
//      * @param detour `true` if the patrol is sent on a detour, `false` otherwise
//      * @return `true` if the patrol can be checked out, `false` otherwise
//      */

//     /** Verify whether an update is valid. It is only meant to be used on updates made by locations and NOT the master */
//     isPatrolUpdateValid(newUpdate: PatrolUpdate): boolean {
//         const lastUpdate = this.latestUpdateOfPatrol(newUpdate.patrolId);
//         const patrolInfo = this.db.patrolInfo(newUpdate.patrolId);
        
//         // If there is no previous updates, the patrol can go to any post
//         if(lastUpdate === undefined)
//             return true;

//         if(patrolInfo === undefined || patrolInfo?.udgået)
//             return false;

//         // The patrol must be at the same location as the update
//         if(lastUpdate.currentLocationId !== newUpdate.currentLocationId)
//             return false;


//         // Check-in
//         if(newUpdate.currentLocationId === newUpdate.targetLocationId){
//             const locationIsOpen = this.db.locationInfo(newUpdate.currentLocationId)?.open;
//             const patrolIsGoingToThisLocation = lastUpdate.targetLocationId == newUpdate.currentLocationId
//             return locationIsOpen && patrolIsGoingToThisLocation;
//         }
//         // Check-out
//         else{
//             const routeIsAvailable = this.db.isRouteAvailable(newUpdate.currentLocationId, newUpdate.targetLocationId);
//             return routeIsAvailable;
//         }
//     }

//     latestUpdateOfPatrol(patrolId: number): PatrolUpdate | undefined {
//         return this.db.latestUpdatesOfPatrol(patrolId, 1)[0];
//     }

//     /**
//      * Get list of patrols at a post.
//      * @param locationID the id of the post
//      * @returns the patrol ids of the patrols at the post. Patrols most recently checked in at are first.
//      */
//     patrolsOnLocation(locationID: number): number[] {
//         let updates = this.db.updatesAtLocation(locationID);
//         let patrolsAtLocation = updates
//             .filter((update) => update.targetLocationId == locationID)
//             .map(update => update.patrolId)
//             .filter((patrolId) => !this.db.patrolInfo(patrolId).udgået);

//         // Remove duplicates
//         return Array.from(new Set(patrolsAtLocation));
//     }

//     /**
//      * Get patrols on detour from post.
//      *
//      * @param postId the id of the post the patrol is on detour from.
//      * @return a list of patrol ids
//      */
//     patrolsTowardsLocation(locationID: number): number[] {
//         let updates = this.db.updatesAtLocation(locationID);
//         let patrolsTowardsLocation = updates
//             .filter((update) => update.targetLocationId == locationID)
//             .map(update => update.patrolId)
//             .filter((patrolId) => !this.db.patrolInfo(patrolId).udgået);

//         // Remove duplicates
//         return Array.from(new Set(patrolsTowardsLocation));
//     }

//     /**
//      * Get ids of patrols that are checked out of a post.
//      *
//      *
//      * @param postId the id of the post the patrols have leaved
//      * @returns a list of patrol ids
//      */
//     patrolsCheckedOut(postId: number): number[] {
//         return this.db.updatesAtLocation(postId)
//             .filter((checkin) => checkin.type !== PatrolUpdateType.CheckIn)
//             .map((checkin) => checkin.patrolId);
//     }

//     /**
//      * Get id id of next post
//      * @param postId the id of current post
//      * @param detour `true` if allowed to include detours, `false` otherwise
//      * @returns the id of the next post
//      */
//     private nextPostId(postId: number, detour: boolean): number {
//         //Alt efter om patruljen skal på omvej og om den næste post er en omvej, er den næste post jo noget forskelligt
//         const post = this.db.locationInfo(postId + 1);
//         if(!detour && post !== undefined && post.detour) {
//             return postId + 2;
//         }
//         return postId + 1;
//     }

//     /**
//      * Reset database.
//      * * Remove all checkins
//      * * Set all posts to open
//      * * Remove "udgået" status from all patrols
//      */
//     reset() {
//         // Remove all checkins
//         this.db.allPatrolUpdatesIds().forEach((checkinId) => {
//             this.db.deleteUpdate(checkinId);
//         });

//         // Set all posts to open
//         this.db.allLocationIds().forEach((postId) => {
//             this.db.changeLocationStatus(postId, true);
//         });

//         // Remove "udgået" status from all patrols
//         this.db.allPatrolIds().forEach((patrolId) => {
//             this.db.changePatrolStatus(patrolId, false);
//         });
//     }

//     /**
//      * Get current location of patrol.
//      * 
//      * @param patrolId the id of the patrol
//      * @returns the location of the patrol
//      */
//     locationOfPatrol(patrolId: number): PatrolLocation {
//         if(this.db.patrolInfo(patrolId).udgået) {
//             return {
//                 type: PatrolLocationType.Udgået,
//                 locationId: -1,
//             };
//         }
//         let latestCheckin = this.latestUpdateOfPatrol(patrolId);
//         if(latestCheckin == null)
//             return {
//                 type: PatrolLocationType.GoingToLocation,
//                 locationId: this.firstPostId,
//             };
//         if(latestCheckin.type === PatrolUpdateType.CheckIn) {
//             return {
//                 type: PatrolLocationType.OnLocation,
//                 locationId: latestCheckin.postId
//             };
//         }
//         let isDetour = latestCheckin.type === PatrolUpdateType.Detour;
//         let nextPostId = this.nextPostId(latestCheckin.postId, isDetour);
//         return {
//             type: PatrolLocationType.GoingToLocation,
//             locationId: nextPostId
//         };
//     }

//     updatePatrol(checkin: PatrolUpdate): number {
//         return this.db.updatePatrol(checkin);
//     }

//     latestUpdatesOfPatrol(patrol: number, amount: number): PatrolUpdate[] {
//         return this.db.latestUpdatesOfPatrol(patrol, amount);
//     }

//     patrolInfo(patrolId: number): Patrol | undefined {
//         return this.db.patrolInfo(patrolId);
//     }

//     changePatrolStatus(patrolId: number, udgået: boolean): void {
//         this.db.changePatrolStatus(patrolId, udgået);
//     }

//     allPatrolIds(): number[] {
//         return this.db.allPatrolIds();
//     }

//     changeLocationStatus(postId: number, open: boolean): void {
//         this.db.changeLocationStatus(postId, open);
//     }

//     locationInfo(postId: number): Location | undefined {
//         return this.db.locationInfo(postId);
//     }

//     allLocationIds(): number[] {
//         return this.db.allLocationIds();
//     }

//     updatesAtLocation(postId: number): PatrolUpdate[] {
//         return this.db.updatesAtLocation(postId);
//     }

//     updateById(checkinId: number): PatrolUpdate | undefined {
//         return this.db.updateById(checkinId);
//     }

//     deleteUpdate(checkinId: number): void {
//         this.db.deleteUpdate(checkinId);
//     }

//     /**Delete all checkins from the database.
//      * Equivalent to sending all patrols to the first post.
//      */
//     deleteAllCheckins(): void {
//         this.db.allPatrolUpdatesIds().forEach(id => {
//             this.deleteUpdate(id);
//         });
//     }

//     lastUpdates(amount: number): PatrolUpdate[] {
//         return this.db.lastUpdates(amount);
//     }

//     allPatrolUpdatesIds(): number[] {
//         return this.db.allPatrolUpdatesIds();
//     }

//     authenticate(password: string): number | undefined {
//         return this.db.authenticate(password);
//     }

//     userIds(): number[] {
//         return this.db.userIds();
//     }

// }

// export interface PatrolLocation {
//     /** Is the patrol on a location or going to a location. */
//     type: PatrolLocationType,
//     /** Id of the location the patrol is going to or on */
//     locationId: number,
// }

// export enum PatrolLocationType {
//     OnLocation, GoingToLocation, Udgået
// }
