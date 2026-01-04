"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Database = exports.ServiceBase = void 0;
exports.resetCheckins = resetCheckins;
const fs = __importStar(require("fs"));
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
/**
 * Base class for services that need database access.
 *
 * Provides acces to `prepare` and `transaction` methods of the database.
 */
class ServiceBase {
    db;
    prepare;
    transaction;
    constructor(db) {
        this.db = db;
        [this.prepare, this.transaction] = db.getConnection();
    }
}
exports.ServiceBase = ServiceBase;
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
class Database {
    db;
    prepare;
    transaction;
    /** Timezone offset in minutes */
    timeZoneOffset;
    /**
     * Creates a new SQLite database wrapper.
     * @param path the path to the SQLite database file. Value `:memory:` for in-memory database.
     * @param schemaPath to the schema of the database
    */
    constructor(path, schemaPath) {
        this.timeZoneOffset = new Date().getTimezoneOffset(); // Get the timezone offset in minutes
        const databaseIsInitalized = path !== ":memory:" && fs.existsSync(path);
        this.db = new better_sqlite3_1.default(path);
        this.prepare = this.db.prepare.bind(this.db);
        this.transaction = this.db.transaction.bind(this.db);
        if (!databaseIsInitalized) {
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
    static createInMemoryDatabase(schemaPath) {
        return new Database(":memory:", schemaPath);
    }
    /**
     * Initialize tables for the database.
     *
     * @param schemaPath the path of the schema of the database
     */
    initializeTables(schemaPath) {
        // TODO
    }
    /**
     * Get the database `prepare` and `transaction` methods for executing
     * queries and transactions.
     *
     * @return tuple where the first element is the `prepare` method and the
     * second is the `transaction` method
     */
    getConnection() {
        return [this.db.prepare.bind(this.db), this.db.transaction.bind(this.db)];
    }
    /**
     * Converts from local `Date()` object to UTC time ISO string ready to be
     * stored in DB
     */
    toDataBaseTimeString(date) {
        const utcDate = new Date(date.getTime() + this.timeZoneOffset * 60 * 1000);
        return utcDate.toISOString();
    }
    /** Converts UTC time ISO string to local `Date()` object */
    toLocalDateObject(date) {
        const localDate = new Date(new Date(date).getTime() - this.timeZoneOffset * 60 * 1000);
        return localDate;
    }
}
exports.Database = Database;
/**
 * Reset all checkins for the database.
 *
 * @param database the database to reset
 */
function resetCheckins(database) {
    database.prepare("DELETE FROM PatrolUpdates")
        .run();
}
