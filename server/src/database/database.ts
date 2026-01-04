import * as fs from 'fs';
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
 * - provide time conversion helpers `toDataBaseTimeString` and
 *   `toLocalDateObject` so timestamps are handled consistently
 *
 * Intended usage: create a single `Database` instance at application
 * startup and pass it to service classes (via `ServiceBase`) which should
 * be the only code that executes SQL queries directly.
 */
export class Database {
    public readonly db: SQLite.Database;
    public readonly prepare: SQLite.Database['prepare'];
    public readonly transaction: SQLite.Database['transaction'];

    /** Timezone offset in minutes */
    private timeZoneOffset: number;

    /**
     * Creates a new SQLite database wrapper.
     * @param path the path to the SQLite database file. Value `:memory:` for in-memory database.
     * @param schemaPath to the schema of the database
    */
   constructor(path: string, schemaPath: string) {
        this.timeZoneOffset = new Date().getTimezoneOffset(); // Get the timezone offset in minutes

        const databaseIsInitalized = path !== ":memory:" && fs.existsSync(path);

        this.db = new SQLite(path);
        this.prepare = this.db.prepare.bind(this.db);
        this.transaction = this.db.transaction.bind(this.db);

        if(!databaseIsInitalized) {
            this.initializeTables(schemaPath);
        }

        this.db.pragma('journal_mode = WAL');
        this.db.pragma('foreign_keys = ON');
    }

    /**
     * Create new in-memory database.
     *
     * @param schemaPath the path of the schema of the database
     * @returns a new in-memory database
     */
    public static createInMemoryDatabase(schemaPath: string): Database {
        return new Database(":memory:", schemaPath);
    }

    /**
     * Initialize tables for the database.
     *
     * @param schemaPath the path of the schema of the database
     */
    private initializeTables(schemaPath: string) {
        // TODO
    }

    /**
     * Get the database `prepare` and `transaction` methods for executing
     * queries and transactions.
     *
     * @return tuple where the first element is the `prepare` method and the
     * second is the `transaction` method
     */
    public getConnection(): [SQLite.Database['prepare'], SQLite.Database['transaction']] {
        return [this.db.prepare.bind(this.db), this.db.transaction.bind(this.db)];
    }

    /**
     * Converts from local `Date()` object to UTC time ISO string ready to be
     * stored in DB
     */
    public toDataBaseTimeString(date: Date): string {
        const utcDate = new Date(date.getTime() + this.timeZoneOffset * 60 * 1000);
        return utcDate.toISOString();
    }

    /** Converts UTC time ISO string to local `Date()` object */
    public toLocalDateObject(date: string): Date {
        const localDate = new Date(new Date(date).getTime() - this.timeZoneOffset * 60 * 1000);
        return localDate;
    }
}

/**
 * Reset all checkins for the database.
 *
 * @param database the database to reset
 */
export function resetCheckins(database: Database): void {
    database.prepare("DELETE FROM PatrolUpdates")
        .run();
}
