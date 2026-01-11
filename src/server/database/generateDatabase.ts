import { readFileSync } from "fs";
import SQLite from 'better-sqlite3';

const SQLPath = "./SQLite/dbSchema.sql";
const dbPath = "./SQLite/webspejd.db";

const schemaSQL = readFileSync(SQLPath, 'utf8');

export function runSchema(db: SQLite.Database) {
    db.exec(schemaSQL);
}

export function createDatabase(dbPath: string, masterPassword: string): SQLite.Database {
    const db = new SQLite(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    runSchema(db);

    db.prepare("INSERT INTO Settings (key, value) VALUES (?, ?)").run("master_password", masterPassword);

    return db;
}

createDatabase(dbPath, "master");