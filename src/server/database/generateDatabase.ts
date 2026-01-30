import { readFileSync, existsSync, unlinkSync } from "fs";
import SQLite from 'better-sqlite3';
import readline from "readline";
import { SETTINGS_TABLE } from './database';

const config = JSON.parse(readFileSync(`./server.config.json`, 'utf-8'));
console.log(__dirname);

const SQLPath = "./SQLite/dbSchema.sql";
const dbPath = config["databasePath"] as string;
const schemaSQL = readFileSync(SQLPath, 'utf8');
const defaultMasterPassword = "master";
const masterPassword = config[SETTINGS_TABLE.SETTING_MASTER_PASSWORD] as string;
const masterPasswordSet = typeof masterPassword === "string" && masterPassword.length > 0;

export function runSchema(db: SQLite.Database) {
    db.exec(schemaSQL);
}

function askYesNo(question: string): Promise<string> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise(resolve => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer.trim().toLowerCase());
        });
    });
}

export async function createDatabase(dbPath: string, masterPassword: string): Promise<SQLite.Database> {
    if (existsSync(dbPath)) {
        const answer = await askYesNo(`Database file ${dbPath} already exists. Overwrite? (y/n): `);
        if (answer !== 'y') {
            console.log('Aborted.');
            process.exit(0);
        }
        unlinkSync(dbPath);
    }

    
    const db = new SQLite(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    runSchema(db);

    db.prepare("INSERT INTO Settings (key, value) VALUES (?, ?)").run("master_password", masterPassword);

    return db;
}

createDatabase(dbPath, masterPasswordSet ? masterPassword : defaultMasterPassword).then(() => {
    console.log("Database created at " + dbPath);
    if (!masterPasswordSet)
        console.warn(`Default master password is ${defaultMasterPassword}. Please set it in server.config.json!`);
    process.exit(0);
}).catch((err) => {
    console.error("Error creating database:", err);
    process.exit(1);
});