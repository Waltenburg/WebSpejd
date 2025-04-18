import SQLite from 'better-sqlite3';
import { CheckinType, Checkin, Database, Patrol, Post, User} from "./generic";
import fs from 'fs';

export class sqliteDB implements Database {
    private readonly datafile: string;
    private db: SQLite.Database;

    constructor(datafile: string) {
        this.datafile = datafile;

        // // Delete the database file if it exists
        // if (fs.existsSync(this.datafile)) {
        //     fs.unlinkSync(this.datafile);
        // }
        // this.initialize();

        this.db = new SQLite(this.datafile/*, { verbose: console.log } */);
    }

    /**
     * Add initial data to database.
     */
    private initialize(): void {
        //Create the database file
        this.db = new SQLite(this.datafile/*, { verbose: console.log } */);
        //Create the tables
        this.db.exec(fs.readFileSync("src/database/dbSchema.sql", "utf8"));

        const patrols = ['Elg', 'Rådyr', 'Hare', 'Fasan', 'Kylling', 'And'];
        const posts = ['Start', 'Post1', 'Omvej1', 'Post3', 'Omvej2', 'Post5'];
        const isDetour = [0, 0, 1, 0, 1, 0];
        const isOpen = [1, 1, 1, 1, 1, 1];
        const isActive = [1, 1, 1, 1, 1, 1];
        const passwords = posts;

        //Populate patrols
        for (let i = 0; i < patrols.length; i++) {
            this.db.prepare("INSERT INTO patrol (name) VALUES (?)").run(patrols[i]);
        }
        //Populate posts
        for (let i = 0; i < posts.length; i++) {
            this.db.prepare("INSERT INTO post (name, detour , open) VALUES (?, ?, ?)").run(posts[i], isDetour[i], isOpen[i]);
        }
        //Populate users
        for (let i = 0; i < posts.length; i++) {
            this.db.prepare("INSERT INTO user (postId, password) VALUES (?, ?)").run(i + 1, passwords[i]);
        }
        //Add master password
        this.db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run("master_password", "lukmigind");
    }


    /**
     * Find the latest checkin of the specified patrol. 'f'
     * @param patrol the patrol to get the latest checkin of
     * @return the latest checkin of the patrol or `null` if none exist
     */
    latestCheckinsOfPatrol(patrol: number, amount: number): Checkin[]{
        const checkins = this.db.prepare("SELECT * FROM checkin WHERE patrolId = ? ORDER BY time DESC LIMIT ?").all(patrol, amount) as Checkin[];
        checkins.forEach((checkin) => {
            checkin.time = new Date(checkin.time);
        });
        return checkins;
    }

    /** Check patrol in or out of post.
     * @param checkin the checkin to add to the database
     * @returns the id of the checkin
    */
    checkin(checkin: Checkin): number{
        this.db.prepare("INSERT INTO checkin (patrolId, postId, type) VALUES (?, ?, ?)").run(checkin.patrolId, checkin.postId, checkin.type);
        const id = (this.db.prepare("SELECT last_insert_rowid() as id").get() as Checkin).id;
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
        const checkins = this.db.prepare("SELECT * FROM checkin WHERE postId = ?").all(postId) as Checkin[];
        checkins.forEach((checkin) => {
            checkin.time = new Date(checkin.time);
        });
        return checkins;
    }

    /**
     * Get checkin by id.
     *
     * @param checkinId the id of the checkin
     * @returns the checkin with the id or `undefined` if checkin does not exist
     */
    checkinById(checkinId: number): Checkin | undefined{
        return this.db.prepare("SELECT * FROM checkin WHERE id = ?").get(checkinId) as Checkin | undefined;
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
        const checkins = this.db.prepare("SELECT * FROM checkin ORDER BY time DESC LIMIT ?").all(amount) as Checkin[];
        checkins.forEach((checkin) => {
            checkin.time = new Date(checkin.time);
        });
        return checkins;
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