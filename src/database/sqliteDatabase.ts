// import * as fs from "fs";
// import * as sqlite3 from "sqlite3";
// import * as sqlite from "sqlite";
// import { CheckinType, Checkin, Database, Patrol, Post } from "./generic";

// export class SqliteDatabase implements Database {
//     private readonly datafile: string;
//     private database: sqlite.Database;

//     /**
//      * Create new `SqliteDatabase` from file.
//      * @param datafile the sqlite file to store data in
//      */
//     private constructor(datafile: string, database: sqlite.Database) {
//         this.datafile = datafile;
//         this.database = database;
//     }

//     static async open(datafile: string): Promise<SqliteDatabase> {
//         let initialized = fs.existsSync(datafile);
//         let database = await sqlite.open({
//             filename: datafile,
//             driver: sqlite3.Database
//         });
//         if(!initialized) {
//             await database.exec(`
//                 CREATE TABLE patrols {
//                     id INTEGER PRIMARAY KEY AUTOINCREMENT,
//                     name TEXT NOT NULL,
//                     udgået BOOLEAN NOT NULL
//                 };

//                 CREATE TABLE posts {
//                     id INTEGER PRIMARY KEY AUTOINCREMENT,
//                     name TEXT NOT NULL,
//                     team INTEGER NOT NULL,
//                     detour BOOLEAN NOT NULL,
//                     open BOOLEAN NOT NULL,
//                     lastUpdate INTEGER NOT NULL
//                 };

//                 CREATE TABLE checkins {
//                     id INTEGER PRIMARY KEY AUTOINCREMENT,
//                     patrolId INTEGER NOT NULL,
//                     postId INTEGER NOT NULL,
//                     type INTEGER NOT NULL,
//                     time INTEGER NOT NULL,
//                     FOREIGN KEY (patrolId) REFERENCES patrols(id)
//                     FOREIGN KEY (postId) REFERENCES posts(id)
//                 };
//             `);
//         }
//         return new SqliteDatabase(datafile, database);
//     }

//     latestCheckinOfPatrol(patrol: number): Checkin {
//         throw new Error("Method not implemented.");
//     }
//     checkin(checkin: Checkin): void {
//         throw new Error("Method not implemented.");
//     }
//     patrolInfo(patrolId: number): Patrol {
//         throw new Error("Method not implemented.");
//     }
//     changePatrolStatus(patrolId: number, udgået: boolean): void {
//         throw new Error("Method not implemented.");
//     }
//     allPatrolIds(): number[] {
//         throw new Error("Method not implemented.");
//     }
//     postInfo(postId: number): Post {
//         throw new Error("Method not implemented.");
//     }
//     changePostStatus(postId: number, open: boolean): void {
//         throw new Error("Method not implemented.");
//     }
//     allPostIds(): number[] {
//         throw new Error("Method not implemented.");
//     }
//     checkinsAtPost(postId: number): Checkin[] {
//         throw new Error("Method not implemented.");
//     }
//     deleteCheckin(checkinId: number): void {
//         throw new Error("Method not implemented.");
//     }
//     reset(): void {
//         throw new Error("Method not implemented.");
//     }

// }
