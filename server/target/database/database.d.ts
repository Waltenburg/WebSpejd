import SQLite from 'better-sqlite3';
/**
 * Base class for services that need database access.
 *
 * Provides acces to `prepare` and `transaction` methods of the database.
 */
export declare abstract class ServiceBase {
    protected readonly db: Database;
    protected readonly prepare: SQLite.Database['prepare'];
    protected readonly transaction: SQLite.Database['transaction'];
    constructor(db: Database);
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
export declare class Database {
    private readonly db;
    /** Creates a new SQLite database wrapper.
     * @param dbPath the path to the SQLite database file. Value `:memory:` for in-memory database.
     * @param resetCheckins if `true`, all checkins will be deleted from the database
    */
    constructor(dbPath: string, tempoary: boolean, resetCheckins?: boolean);
    /** Get the database `prepare` and `transaction` methods for executing queries and transactions.
     * @return tuple where the first element is the `prepare` method and the second is the `transaction` method
     */
    getConnection(): [SQLite.Database['prepare'], SQLite.Database['transaction']];
    /** Converts local `Date` object to string in UTC YYYY-MM-DD HH:mm:ss format
     * @param date local `Date` object
     * @return string in YYYY-MM-DD HH:mm:ss UTC format
     */
    toUTCString(date: Date): string;
}
export declare const enum PATROL_UPDATE_TABLE {
    TABLE_NAME = "PatrolUpdates",
    ID = "id",
    PATROL_ID = "patrolId",
    CURRENT_LOCATION_ID = "currentLocationId",
    TARGET_LOCATION_ID = "targetLocationId",
    TIME_STR = "timeStr",
    LATEST_UPDATE_VIEW = "LatestPatrolUpdates"
}
export declare const enum LOCATION_TABLE {
    TABLE_NAME = "Location",
    ID = "id",
    NAME = "name",
    TEAM = "team",
    OPEN = "open"
}
export declare const enum ROUTE_TABLE {
    TABLE_NAME = "Route",
    ID = "id",
    FROM_LOCATION_ID = "fromLocationId",
    TO_LOCATION_ID = "toLocationId",
    IS_OPEN = "is_open",
    DISTANCE = "distance"
}
export declare const enum PATROL_TABLE {
    TABLE_NAME = "Patrol",
    ID = "id",
    NAME = "name",
    UDGAET = "udg\u00E5et"
}
export declare const enum USER_TABLE {
    TABLE_NAME = "User",
    ID = "id",
    LOCATION_ID = "locationId",
    PASSWORD = "password"
}
export declare const enum SETTINGS_TABLE {
    TABLE_NAME = "settings",
    KEY = "key",
    VALUE = "value",
    SETTING_MASTER_PASSWORD = "master_password",
    SETTING_FIRST_LOCATION_ID = "first_location",
    SETTING_MANDSKAB_PAGE_INFO = "mandskab_page_info",
    SETTING_PARSED_MANDSKAB_PAGE_INFO = "parsed_mandskab_page_info",
    SETTING_LOCATION_ROUTE_GRAPH_LAYOUT = "location_route_graph_layout"
}
//# sourceMappingURL=database.d.ts.map