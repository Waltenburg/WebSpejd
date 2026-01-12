"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDatabase = exports.runSchema = void 0;
const fs_1 = require("fs");
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const SQLPath = "./dbSchema.sql";
const dbPath = "webspejd.db";
const schemaSQL = (0, fs_1.readFileSync)(SQLPath, 'utf8');
function runSchema(db) {
    db.exec(schemaSQL);
}
exports.runSchema = runSchema;
function createDatabase(dbPath) {
    const db = new better_sqlite3_1.default;
    runSchema(db);
    return db;
}
exports.createDatabase = createDatabase;
//# sourceMappingURL=runSchema.js.map