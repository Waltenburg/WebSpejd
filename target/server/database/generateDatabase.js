"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDatabase = exports.runSchema = void 0;
const fs_1 = require("fs");
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const SQLPath = "./SQLite/dbSchema.sql";
const dbPath = "./SQLite/webspejd.db";
const schemaSQL = (0, fs_1.readFileSync)(SQLPath, 'utf8');
function runSchema(db) {
    db.exec(schemaSQL);
}
exports.runSchema = runSchema;
function createDatabase(dbPath, masterPassword) {
    const db = new better_sqlite3_1.default(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    runSchema(db);
    db.prepare("INSERT INTO Settings (key, value) VALUES (?, ?)").run("master_password", masterPassword);
    return db;
}
exports.createDatabase = createDatabase;
createDatabase(dbPath, "master");
console.log("Database created at " + dbPath);
console.warn("Default master password is 'master'. Please change it in server.config.json!");
//# sourceMappingURL=generateDatabase.js.map