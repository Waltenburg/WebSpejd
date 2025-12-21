// import SQLite from 'better-sqlite3';
// import { PatrolUpdateType, PatrolUpdate, Database, Patrol, Location, Route, User} from "./generic";
// import { PatrolLocation, PatrolLocationType } from './wrapper';

// /** Same as `PatrolUpdate` except that it has `timeStr: string` instead of `time: Date`*/
// interface DatabasePatrolUpdate {
//     id: number;
//     patrolId: number;
//     currentLocationId: number;
//     targetLocationId: number;
//     timeStr: string; // String representation of the time in UTC
// }

// export class sqliteDB implements Database {
//     private readonly dbPath: string;
//     private db: SQLite.Database;

//     private timeZoneOffset: number; // Timezone offset in minutes

//     /** Creates a new SQLite database wrapper.
//      * @param dbPath the path to the SQLite database file. Value `:memory:` for in-memory database.
//      * @param resetCheckins if `true`, all checkins will be deleted from the database
//      */
//     constructor(dbPath: string, tempoary: boolean, resetCheckins: boolean = false) {
//         this.dbPath = dbPath;
//         this.timeZoneOffset = new Date().getTimezoneOffset(); // Get the timezone offset in minutes
        
//         // Temporary database in RAM
//         if(tempoary) {
//             const dbDisk = new SQLite(dbPath, { fileMustExist: true });
//             dbDisk.pragma('journal_mode = DELETE');
//             const buffer = dbDisk.serialize();
//             dbDisk.close();

//             // @ts-expect-error
//             this.db = SQLite(buffer);

//         }
//         else{
//             this.db = new SQLite(dbPath);
//         }

//         this.db.pragma('journal_mode = WAL');
//         this.db.pragma('foreign_keys = ON');

//         // Reset checkins if requested
//         if(resetCheckins) {
//             this.db.prepare("DELETE FROM PatrolUpdates").run();
//         }
//     }
//     /** Converts from local `Date()` object to UTC time ISO string ready to be stored in DB */
//     private toDataBaseTimeString(date: Date): string {
//         const utcDate = new Date(date.getTime() + this.timeZoneOffset * 60 * 1000);
//         return utcDate.toISOString();
//     }

//     /** Converts UTC time ISO string to local `Date()` object */
//     private toLocalDateObject(date: string): Date {
//         const localDate = new Date(new Date(date).getTime() - this.timeZoneOffset * 60 * 1000);
//         return localDate;
//     }

//     /** Converts from `DatabasePatrolUpdate` to `PatrolUpdate` as used in the rest of the application */
//     private convertFromDBPatrolUpdate(dbPatrolUpdate: DatabasePatrolUpdate[]): PatrolUpdate[] {
//         return dbPatrolUpdate.map((patrolUpdate) => {
//             return {
//                 id: patrolUpdate.id,
//                 patrolId: patrolUpdate.patrolId,
//                 currentLocationId: patrolUpdate.currentLocationId,
//                 targetLocationId: patrolUpdate.targetLocationId,
//                 time: this.toLocalDateObject(patrolUpdate.timeStr),
//             };
//         });
//     }

//     /**
//      * Find the latest `PatrolUpdates` of the specified patrol.
//      * @param patrol the patrol to get the latest `PatrolUpdates` of
//      * @return the latest `PatrolUpdates` of the patrol or `null` if none exist
//      */
//     latestUpdatesOfPatrol(patrol: number, amount: number): PatrolUpdate[]{
//         const patrolUpdates = this.db.prepare("SELECT * FROM PatrolUpdates WHERE patrolId = ? ORDER BY timeStr DESC LIMIT ?").all(patrol, amount) as DatabasePatrolUpdate[];
//         return this.convertFromDBPatrolUpdate(patrolUpdates);
//     }

//     /** Check patrol in or out of post.
//      * @param patrolUpdate the patrol update to add to the database
//      * @returns the id of the patrol update
//     */
//     updatePatrol(patrolUpdate: PatrolUpdate): number{
//         this.db.prepare("INSERT INTO PatrolUpdates (patrolId, currentLocationId, targetLocationId) VALUES (?, ?, ?)")
//         .run(patrolUpdate.patrolId, patrolUpdate.currentLocationId, patrolUpdate.targetLocationId);

//         const id = (this.db.prepare("SELECT last_insert_rowid() as id").get() as DatabasePatrolUpdate).id;
//         return id;
//     }

//     /**
//     * Get information about patrol.
//     * @param patrolId the id of the patrol to get information about
//     * @returns information about the patrol
//     */
//     patrolInfo(patrolId: number): Patrol | undefined{
//         return this.db.prepare("SELECT * FROM patrol WHERE id = ?").get(patrolId) as Patrol | undefined;
//     }

//     /**
//      * Change udgået status of patrol.
//      *
//      * @param patrolId the id of the patrol to change
//      * @param udgået `true` if the patrol id "udgået", `false` otherwise
//      */
//     changePatrolStatus(patrolId: number, udgået: boolean): void{
//         this.db.prepare("UPDATE patrol SET udgået = ? WHERE id = ?").run(udgået, patrolId);
//     }

//     /**
//      * Get list of patrols currently on a location.
//      * @param locationID the id of the location.
//      * @returns list of patrol ids currently on the location. Patrols most recently checked in at are first.
//      */
//     patrolsOnLocation(locationID: number): number[] {
//         const rows = this.db.prepare(
//             `SELECT lpu.patrolId
//             FROM LatestPatrolUpdates lpu
//             JOIN Patrol p ON lpu.PatrolId = p.idH
//             WHERE lpu.currentLocationId = ?
//             AND lpu.targetLocationId = lpu.currentLocationId
//             AND p.udgået = 0
//             ORDER BY lpu.timeStr DESC`
//         ).all(locationID) as { patrolId: number }[];

//         return rows.map((row) => row.patrolId);
//     }

//     /**
//      * Get patrols that are currently moving towards a location.
//      * @param locationID the id of the location.
//      * @returns a list of patrol ids currently moving towards the location. Patrols most recently checked out at are first.
//      */
//     patrolsTowardsLocation(locationID: number): number[] {
//         const rows = this.db.prepare(
//             `SELECT lpu.patrolId
//             FROM LatestPatrolUpdates lpu
//             JOIN Patrol p ON lpu.PatrolId = p.id
//             WHERE lpu.targetLocationId = ?
//             AND p.udgået = 0
//             ORDER BY lpu.timeStr DESC`
//         ).all(locationID) as { patrolId: number }[];

//         return rows.map((row) => row.patrolId);
//     }

//     /**
//      * Get ids of patrols that are checked out of a location.
//      *
//      *
//      * @param locationId the id of the location the patrols have leaved
//      * @returns a list of patrol ids
//      */
//     patrolsCheckedOutFromLocation(locationID: number): number[] {
//         const rows = this.db.prepare(
//             `SELECT DISTINCT patrolId
//             FROM PatrolUpdates
//             WHERE currentLocationId = ?
//             AND targetLocationId != ?;`
//         ).all(locationID, locationID) as { patrolId: number }[];
//         return rows.map((row) => row.patrolId);
//     }

//     /**
//      * Get current location of patrol.
//      * 
//      * @param patrolId the id of the patrol
//      * @returns the location as `PatrolLocation` object of the patrol or `undefined` if patrol does not exist.
//      * If the patrol is udgået, the locationId will be the last location that the patrol was at.
//      */
//     locationOfPatrol(patrolId: number): PatrolLocation | undefined {
//         // Check if patrol is udgået
//         const patrol = this.patrolInfo(patrolId);
        
//         const row = this.db.prepare(
//             `SELECT lpu.currentLocationId, lpu.targetLocationId
//             FROM LatestPatrolUpdates lpu
//             WHERE lpu.patrolId = ?`
//         ).get(patrolId) as { currentLocationId: number, targetLocationId: number } | undefined;

//         if(row == undefined || patrol == undefined) {
//             return undefined;
//         }

//         if(patrol.udgået) {
//             return {
//                 type: PatrolLocationType.Udgået,
//                 locationId: row.currentLocationId
//             };
//         }

//         if(row.currentLocationId === row.targetLocationId) {
//             return {
//                 type: PatrolLocationType.OnLocation,
//                 locationId: row.currentLocationId
//             };
//         }
//         else{
//             return {
//                 type: PatrolLocationType.GoingToLocation,
//                 locationId: row.targetLocationId
//             };
//         }
//     }

//     /**
//      * Get list of all patrol ids.
//      *
//      * @returns a list of all patrol ids
//      */
//     allPatrolIds(): number[]{
//         const rows = this.db.prepare("SELECT id FROM patrol").all() as { id: number }[];
//         return rows.map((row) => row.id);
//     }

//     allRoutes(): Route[] {
//         const routes = this.db.prepare("SELECT * FROM Route").all() as Route[];
//         return routes;
//     }

//     isRouteAvailable(currentLocationId: number, targetLocationId: number): boolean{
//         const route = this.db.prepare("SELECT * FROM Route WHERE fromLocationId = ? AND toLocationId = ? AND is_open = 1").get(currentLocationId, targetLocationId);
//         return route != undefined;
//     }

//     allRoutesFromLocation(locationId: number): Route[] {
//         const routes = this.db.prepare("SELECT * FROM Route WHERE fromLocationId = ?").all(locationId) as Route[];
//         return routes;
//     }

//     allRoutesToLocation(locationId: number): Route[] {
//         const routes = this.db.prepare("SELECT * FROM Route WHERE toLocationId = ?").all(locationId) as Route[];
//         return routes;
//     }

//     /**
//      * Get information about a location.
//      * @param locationId the id of the location
//      * @return information about the location or `undefined` if not found
//      */
//     locationInfo(locationId: number): Location | undefined{
//         return this.db.prepare("SELECT * FROM Location WHERE id = ?").get(locationId) as Location | undefined;
//     }

//     /**
//      * Change status of location.
//      *
//      * @param locationId the id of the location to change
//      * @param open `true` if the location should be open, `false` otherwise
//      */
//     changeLocationStatus(locationId: number, open: boolean): void{
//         this.db.prepare("UPDATE Location SET open = ? WHERE id = ?").run(open, locationId);
//     }

//     /**
//      * Get all ids of locations.
//      *
//      * @returns list of location ids
//      */
//     allLocationIds(): number[]{
//         const rows = this.db.prepare("SELECT id FROM Location").all() as { id: number }[];
//         return rows.map((row) => row.id);
//     }

//     /**
//      * Get all patrol updates at location
//      * @param locationId the id of the location
//      * @returns the patrol updates at the location
//      */
//     updatesAtLocation(locationId: number): PatrolUpdate[]{
//         const patrolUpdates = this.db.prepare("SELECT * FROM PatrolUpdates WHERE currentLocationId = ? ORDER BY timeStr DESC").all(locationId) as DatabasePatrolUpdate[];
//         return this.convertFromDBPatrolUpdate(patrolUpdates);
//     }

//     /**
//      * Get patrol update by id.
//      *
//      * @param updateId the id of the patrol update
//      * @returns the patrol update with the id or `undefined` if patrol update does not exist
//      */
//     updateById(patrolUpdateId: number): PatrolUpdate | undefined{
//         const dbPatrolUpdate = this.db.prepare("SELECT * FROM PatrolUpdates WHERE id = ?").get(patrolUpdateId) as DatabasePatrolUpdate | undefined;
//         if(dbPatrolUpdate == undefined) {
//             return undefined;
//         }
//         return this.convertFromDBPatrolUpdate([dbPatrolUpdate])[0];
//     }

//     /**
//      * Delete patrol update from database.
//      *
//      * @param patrolUpdateId the id of the patrol update to delete
//      */
//     deleteUpdate(patrolUpdateId: number): void{
//         this.db.prepare("DELETE FROM PatrolUpdates WHERE id = ?").run(patrolUpdateId);
//     }

//     /**
//      * Get the last n patrol updates.
//      *
//      * @param amount the amount of patrol updates to get
//      * @returns the last n patrol updates
//      */
//     lastUpdates(amount: number): PatrolUpdate[]{
//         const patrolUpdates = this.db.prepare("SELECT * FROM PatrolUpdates ORDER BY timeStr DESC LIMIT ?").all(amount) as DatabasePatrolUpdate[];
//         return this.convertFromDBPatrolUpdate(patrolUpdates);
//     }

//     /**
//      * Get all ids of patrol updates.
//      *
//      * @returns list of patrol update ids
//      */
//     allPatrolUpdatesIds(): number[]{
//         const rows = this.db.prepare("SELECT id FROM PatrolUpdates").all() as { id: number }[];
//         return rows.map((row) => row.id);
//     }
// }