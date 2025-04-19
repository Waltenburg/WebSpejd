import SQLite from 'better-sqlite3';
import { CheckinType, Checkin, Database, Patrol, Post, User} from "./generic";
import fs from 'fs';
import { Database as SQLiteDB} from 'better-sqlite3';

/** Same as `Checkin` except that it has `timeStr: string` instead of `time: Date`*/
interface DatabaseCheckin {
    id: number;
    patrolId: number;
    postId: number;
    type: CheckinType;
    timeStr: string; // String representation of the time in UTC
}

export class sqliteDB implements Database {
    private readonly dbPath: string;
    private db: SQLite.Database;

    private timeZoneOffset: number; // Timezone offset in minutes

    /** Creates a new SQLite database wrapper.
     * @param dbPath the path to the SQLite database file. Value `:memory:` for in-memory database.
     * @param resetCheckins if `true`, all checkins will be deleted from the database
     */
    constructor(dbPath: string, tempoary: boolean, resetCheckins: boolean = false) {
        this.dbPath = dbPath;
        this.timeZoneOffset = new Date().getTimezoneOffset(); // Get the timezone offset in minutes
        
        // Temporary database
        if(tempoary) {
            const dbDisk = new SQLite(dbPath, { fileMustExist: true });
            dbDisk.pragma('journal_mode = DELETE');
            const buffer = dbDisk.serialize();
            dbDisk.close();

            // @ts-expect-error
            this.db = SQLite(buffer);

        }
        else{
            this.db = new SQLite(dbPath);
        }

        this.db.pragma('journal_mode = WAL');
        this.db.pragma('foreign_keys = ON');

        // Reset checkins if requested
        if(resetCheckins) {
            this.db.prepare("DELETE FROM checkin").run();
        }
    }
    /** Converts from local `Date()` object to UTC time ISO string ready to be stored in DB */
    private toDataBaseTimeString(date: Date): string {
        const utcDate = new Date(date.getTime() + this.timeZoneOffset * 60 * 1000);
        return utcDate.toISOString();
    }

    /** Converts  UTC time ISO string t0 local `Date()` object */
    private toLocalDateObject(date: string): Date {
        const localDate = new Date(new Date(date).getTime() - this.timeZoneOffset * 60 * 1000);
        return localDate;
    }

    /** Converts from checkin as stored in DB to checkin as used in the rest of the program */
    private databaseCheckinToCheckin(dbCheckin: DatabaseCheckin[]): Checkin[] {
        return dbCheckin.map((checkin) => {
            return {
                id: checkin.id,
                patrolId: checkin.patrolId,
                postId: checkin.postId,
                type: checkin.type,
                time: this.toLocalDateObject(checkin.timeStr),
            };
        });
    }

    /**
     * Find the latest checkin of the specified patrol. 'f'
     * @param patrol the patrol to get the latest checkin of
     * @return the latest checkin of the patrol or `null` if none exist
     */
    latestCheckinsOfPatrol(patrol: number, amount: number): Checkin[]{
        const checkins = this.db.prepare("SELECT * FROM checkin WHERE patrolId = ? ORDER BY timeStr DESC LIMIT ?").all(patrol, amount) as DatabaseCheckin[];
        return this.databaseCheckinToCheckin(checkins);
    }

    /** Check patrol in or out of post.
     * @param checkin the checkin to add to the database
     * @returns the id of the checkin
    */
    checkin(checkin: Checkin): number{
        this.db.prepare("INSERT INTO checkin (patrolId, postId, type, timeStr) VALUES (?, ?, ?, ?)")
        .run(checkin.patrolId, checkin.postId, checkin.type, this.toDataBaseTimeString(checkin.time));

        const id = (this.db.prepare("SELECT last_insert_rowid() as id").get() as DatabaseCheckin).id;
        return id;
    }

    /**
    * Get information about patrol.
    * @param patrolId the id of the patrol to get information about
    * @returns information about the patrol
    */
    patrolInfo(patrolId: number): Patrol | undefined{
        return this.db.prepare("SELECT * FROM patrol WHERE id = ?").get(patrolId) as Patrol | undefined;
    }

    /**
     * Change udgået status of patrol.
     *
     * @param patrolId the id of the patrol to change
     * @param udgået `true` if the patrol id "udgået", `false` otherwise
     */
    changePatrolStatus(patrolId: number, udgået: boolean): void{
        this.db.prepare("UPDATE patrol SET udgået = ? WHERE id = ?").run(udgået, patrolId);
    }

    /**
     * Get list of all patrol ids.
     *
     * @returns a list of all patrol ids
     */
    allPatrolIds(): number[]{
        const rows = this.db.prepare("SELECT id FROM patrol").all() as { id: number }[];
        return rows.map((row) => row.id);
    }

    /**
     * Get information about a post.
     * @param postId the id of the post
     * @return information about the post
     */
    postInfo(postId: number): Post | undefined{
        return this.db.prepare("SELECT * FROM post WHERE id = ?").get(postId) as Post | undefined;
    }

    /**
     * Change status of post.
     *
     * @param postId the id of the post to change
     * @param open `true` if the post should be open, `false` otherwise
     */
    changePostStatus(postId: number, open: boolean): void{
        this.db.prepare("UPDATE post SET open = ? WHERE id = ?").run(open, postId);
    }

    /**
     * Get all ids of posts.
     *
     * @returns list of post ids
     */
    allPostIds(): number[]{
        const rows = this.db.prepare("SELECT id FROM post").all() as { id: number }[];
        return rows.map((row) => row.id);
    }

    /**
     * Get all checkins at post
     * @param postId the id of the post
     * @returns the checkins at the post
     */
    checkinsAtPost(postId: number): Checkin[]{
        const checkins = this.db.prepare("SELECT * FROM checkin WHERE postId = ?").all(postId) as DatabaseCheckin[];
        return this.databaseCheckinToCheckin(checkins);
    }

    /**
     * Get checkin by id.
     *
     * @param checkinId the id of the checkin
     * @returns the checkin with the id or `undefined` if checkin does not exist
     */
    checkinById(checkinId: number): Checkin | undefined{
        const dbCheckin = this.db.prepare("SELECT * FROM checkin WHERE id = ?").get(checkinId) as DatabaseCheckin | undefined;
        if(dbCheckin == undefined) {
            return undefined;
        }
        return this.databaseCheckinToCheckin([dbCheckin])[0];
    }

    /**
     * Delete checkin from database.
     *
     * @param checkinId the id of the checkin to delete
     */
    deleteCheckin(checkinId: number): void{
        this.db.prepare("DELETE FROM checkin WHERE id = ?").run(checkinId);
    }

    /**
     * Get the last x checkins.
     *
     * @param amount the amount of checkins to get
     * @returns the last x checkins
     */
    lastCheckins(amount: number): Checkin[]{
        const checkins = this.db.prepare("SELECT * FROM checkin ORDER BY timeStr DESC LIMIT ?").all(amount) as DatabaseCheckin[];
        return this.databaseCheckinToCheckin(checkins);
    }

    /**
     * Get all ids of checkins.
     *
     * @returns list of checkin ids
     */
    allCheckinIds(): number[]{
        const rows = this.db.prepare("SELECT id FROM checkin").all() as { id: number }[];
        return rows.map((row) => row.id);
    }

    /**
     * Get post id matching password.
     *
     * @param password the password to login with
     * @returns the post id of the post authenticated with
     */
    authenticate(password: string): number | undefined{
        // Check if the password is the master password
        const masterPassword = this.db.prepare("SELECT value FROM settings WHERE key = 'master_password'").get() as { value: string };
        if(masterPassword.value === password) {
            return Infinity;
        }

        // Check if the password is a post password
        const user = this.db.prepare("SELECT * FROM user WHERE password = ?").get(password) as User | undefined;
        if(user?.postId == undefined) {
            return undefined;
        }
        return user.postId;
    }

    /**
     * Get list of all user ids.
     * 
     * @returns list of user ids
     */
    userIds(): number[]{
        const rows = this.db.prepare("SELECT id FROM user").all() as { id: number }[];
        return rows.map((row) => row.id);
    }
}