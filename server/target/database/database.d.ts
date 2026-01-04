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
 * - provide time conversion helpers `toDataBaseTimeString` and
 *   `toLocalDateObject` so timestamps are handled consistently
 *
 * Intended usage: create a single `Database` instance at application
 * startup and pass it to service classes (via `ServiceBase`) which should
 * be the only code that executes SQL queries directly.
 */
export declare class Database {
    readonly db: SQLite.Database;
    readonly prepare: SQLite.Database['prepare'];
    readonly transaction: SQLite.Database['transaction'];
    /** Timezone offset in minutes */
    private timeZoneOffset;
    /**
     * Creates a new SQLite database wrapper.
     * @param path the path to the SQLite database file. Value `:memory:` for in-memory database.
     * @param schemaPath to the schema of the database
    */
    constructor(path: string, schemaPath: string);
    /**
     * Create new in-memory database.
     *
     * @param schemaPath the path of the schema of the database
     * @returns a new in-memory database
     */
    static createInMemoryDatabase(schemaPath: string): Database;
    /**
     * Initialize tables for the database.
     *
     * @param schemaPath the path of the schema of the database
     */
    private initializeTables;
    /**
     * Get the database `prepare` and `transaction` methods for executing
     * queries and transactions.
     *
     * @return tuple where the first element is the `prepare` method and the
     * second is the `transaction` method
     */
    getConnection(): [SQLite.Database['prepare'], SQLite.Database['transaction']];
    /**
     * Converts from local `Date()` object to UTC time ISO string ready to be
     * stored in DB
     */
    toDataBaseTimeString(date: Date): string;
    /** Converts UTC time ISO string to local `Date()` object */
    toLocalDateObject(date: string): Date;
}
/**
 * Reset all checkins for the database.
 *
 * @param database the database to reset
 */
export declare function resetCheckins(database: Database): void;
