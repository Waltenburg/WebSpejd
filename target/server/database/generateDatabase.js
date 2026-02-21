"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDatabase = exports.runSchema = void 0;
const fs_1 = require("fs");
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const readline_1 = __importDefault(require("readline"));
if (!(0, fs_1.existsSync)('./server.config.json')) {
    console.error('Missing server.config.json. Please create it from the sample or provide a valid configuration file.');
    process.exit(1);
}
const config = JSON.parse((0, fs_1.readFileSync)('./server.config.json', 'utf-8'));
console.log(__dirname);
const SQLPath = "./SQLite/dbSchema.sql";
const dbPath = config["databasePath"];
const schemaSQL = (0, fs_1.readFileSync)(SQLPath, 'utf8');
const defaultMasterPassword = "master";
const masterPassword = config["master_password"];
const masterPasswordSet = typeof masterPassword === "string" && masterPassword.length > 0;
function runSchema(db) {
    db.exec(schemaSQL);
}
exports.runSchema = runSchema;
function askYesNo(question) {
    const rl = readline_1.default.createInterface({
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
async function createDatabase(dbPath, masterPassword) {
    if ((0, fs_1.existsSync)(dbPath)) {
        const answer = await askYesNo(`Database file ${dbPath} already exists. Overwrite? (y/n): `);
        if (answer !== 'y') {
            console.log('Aborted.');
            process.exit(0);
        }
        (0, fs_1.unlinkSync)(dbPath);
    }
    const db = new better_sqlite3_1.default(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    runSchema(db);
    db.prepare("INSERT INTO Settings (key, value) VALUES (?, ?)").run("master_password", masterPassword);
    return db;
}
exports.createDatabase = createDatabase;
createDatabase(dbPath, masterPasswordSet ? masterPassword : defaultMasterPassword).then(() => {
    console.log("Database created at " + dbPath);
    if (!masterPasswordSet)
        console.warn(`Default master password is ${defaultMasterPassword}. Please set it in server.config.json!`);
    process.exit(0);
}).catch((err) => {
    console.error("Error creating database:", err);
    process.exit(1);
});
//# sourceMappingURL=generateDatabase.js.map