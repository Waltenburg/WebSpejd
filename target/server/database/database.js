"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Database = exports.ServiceBase = void 0;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
class ServiceBase {
    constructor(db) {
        this.db = db;
        [this.prepare, this.transaction] = db.getConnection();
    }
}
exports.ServiceBase = ServiceBase;
class Database {
    constructor(dbPath, tempoary, resetCheckins = false) {
        this.timeZoneOffset = new Date().getTimezoneOffset();
        if (tempoary) {
            const dbDisk = new better_sqlite3_1.default(dbPath, { fileMustExist: true });
            dbDisk.pragma('journal_mode = DELETE');
            const buffer = dbDisk.serialize();
            dbDisk.close();
            this.db = (0, better_sqlite3_1.default)(buffer);
        }
        else {
            this.db = new better_sqlite3_1.default(dbPath);
        }
        this.db.pragma('journal_mode = WAL');
        this.db.pragma('foreign_keys = ON');
        if (resetCheckins) {
            this.db.prepare("DELETE FROM PatrolUpdates").run();
        }
    }
    getConnection() {
        return [this.db.prepare.bind(this.db), this.db.transaction.bind(this.db)];
    }
    toDataBaseTimeString(date) {
        const utcDate = new Date(date.getTime() + this.timeZoneOffset * 60 * 1000);
        return utcDate.toISOString();
    }
    toLocalDateObject(date) {
        const localDate = new Date(new Date(date).getTime() - this.timeZoneOffset * 60 * 1000);
        return localDate;
    }
    toUTCString(date) {
        const utcDate = new Date(date.getTime() + this.timeZoneOffset * 60 * 1000);
        return utcDate.toISOString();
    }
}
exports.Database = Database;
//# sourceMappingURL=database.js.map