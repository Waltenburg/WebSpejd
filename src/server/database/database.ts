import SQLite from 'better-sqlite3';

/**
 * Base class for services that need database access.
 * 
 * Provides acces to `prepare` and `transaction` methods of the database.
 */
export abstract class ServiceBase {
    protected readonly db: Database;
    protected readonly prepare: SQLite.Database['prepare'];
    protected readonly transaction: SQLite.Database['transaction'];

    constructor(db: Database) {
        this.db = db;
        [this.prepare, this.transaction] = db.getConnection();
    }
}

/**
 * Database — SQLite initialization and helpers
 *
 * This class is responsible for opening and configuring the underlying
 * SQLite connection and for providing a small set of helper utilities that
 * the rest of the application uses:
 *
 * - initialize the database file or an in-memory DB (temporary)
 * - configure pragmas and perform optional schema reset/migrations
 * - expose a typed connection (see `getConnection`) for services to run
 *   prepared statements and transactions without exposing the entire
 *   raw SQLite instance everywhere
 *
 * Intended usage: create a single `Database` instance at application
 * startup and pass it to service classes (via `ServiceBase`) which should
 * be the only code that executes SQL queries directly.
 */
export class Database {
    // private readonly dbPath: string;
    private readonly db: SQLite.Database;
    
    /** Creates a new SQLite database wrapper.
     * @param dbPath the path to the SQLite database file. Value `:memory:` for in-memory database.
     * @param resetCheckins if `true`, all checkins will be deleted from the database
    */
   constructor(dbPath: string, tempoary: boolean, resetCheckins: boolean = false) {
       // Temporary database in RAM
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
            this.db.prepare("DELETE FROM PatrolUpdates").run();
        }
    }

    /** Get the database `prepare` and `transaction` methods for executing queries and transactions.
     * @return tuple where the first element is the `prepare` method and the second is the `transaction` method
     */
    public getConnection(): [SQLite.Database['prepare'], SQLite.Database['transaction']] {
        return [this.db.prepare.bind(this.db), this.db.transaction.bind(this.db)];
    }

    /** Converts local `Date` object to string in UTC YYYY-MM-DD HH:mm:ss format
     * @param date local `Date` object
     * @return string in YYYY-MM-DD HH:mm:ss UTC format
     */
    public toUTCString(date: Date): string {
        // const utcDate = new Date(date.getTime() + this.timeZoneOffset * 60 * 1000);
        const utcDate = new Date(date.getTime());
        const year = utcDate.getUTCFullYear();
        const month = String(utcDate.getUTCMonth() + 1).padStart(2, '0');
        const day = String(utcDate.getUTCDate()).padStart(2, '0');
        const hours = String(utcDate.getUTCHours()).padStart(2, '0');
        const minutes = String(utcDate.getUTCMinutes()).padStart(2, '0');
        const seconds = String(utcDate.getUTCSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }
}


export const enum PATROL_UPDATE_TABLE {
    TABLE_NAME = "PatrolUpdates",
    ID = "id",
    PATROL_ID = "patrolId",
    CURRENT_LOCATION_ID = "currentLocationId",
    TARGET_LOCATION_ID = "targetLocationId",
    TIME_STR = "timeStr",
    LATEST_UPDATE_VIEW = "LatestPatrolUpdates"
}

export const enum LOCATION_TABLE {
    TABLE_NAME = "Location",
    ID = "id",
    NAME = "name",
    TEAM = "team",
    OPEN = "open"
}

export const enum ROUTE_TABLE {
    TABLE_NAME = "Route",
    ID = "id",
    FROM_LOCATION_ID = "fromLocationId",
    TO_LOCATION_ID = "toLocationId",
    IS_OPEN = "is_open",
    DISTANCE = "distance"
}

export const enum PATROL_TABLE {
    TABLE_NAME = "Patrol",
    ID = "id",
    NAME = "name",
    UDGAET = "udgået"
}

export const enum USER_TABLE {
    TABLE_NAME = "User",
    ID = "id",
    LOCATION_ID = "locationId",
    PASSWORD = "password"
}

export const enum SETTINGS_TABLE {
    TABLE_NAME = "settings",
    KEY = "key",
    VALUE = "value",

    SETTING_MASTER_PASSWORD = "master_password",
    SETTING_FIRST_LOCATION_ID = 'first_location',
    SETTING_MANDSKAB_PAGE_INFO = 'mandskab_page_info',
    SETTING_PARSED_MANDSKAB_PAGE_INFO = 'parsed_mandskab_page_info'
}