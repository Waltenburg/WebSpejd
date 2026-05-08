import SQLite from 'better-sqlite3';
/**
 * Base class for services that need database access.
 *
 * Provides acces to `prepare` and `transaction` methods of the database.
 */
export class ServiceBase {
    constructor(db) {
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
    /** Creates a new SQLite database wrapper.
     * @param dbPath the path to the SQLite database file. Value `:memory:` for in-memory database.
     * @param resetCheckins if `true`, all checkins will be deleted from the database
    */
    constructor(dbPath, tempoary, resetCheckins = false) {
        // Temporary database in RAM
        if (tempoary) {
            const dbDisk = new SQLite(dbPath, { fileMustExist: true });
            dbDisk.pragma('journal_mode = DELETE');
            const buffer = dbDisk.serialize();
            dbDisk.close();
            // @ts-expect-error
            this.db = SQLite(buffer);
        }
        else {
            this.db = new SQLite(dbPath);
        }
        this.db.pragma('journal_mode = WAL');
        this.db.pragma('foreign_keys = ON');
        // Reset checkins if requested
        if (resetCheckins) {
            this.db.prepare("DELETE FROM PatrolUpdates").run();
        }
    }
    /** Get the database `prepare` and `transaction` methods for executing queries and transactions.
     * @return tuple where the first element is the `prepare` method and the second is the `transaction` method
     */
    getConnection() {
        return [this.db.prepare.bind(this.db), this.db.transaction.bind(this.db)];
    }
    /** Converts local `Date` object to string in UTC YYYY-MM-DD HH:mm:ss format
     * @param date local `Date` object
     * @return string in YYYY-MM-DD HH:mm:ss UTC format
     */
    toUTCString(date) {
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
//# sourceMappingURL=database.js.map