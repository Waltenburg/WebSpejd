import fs from 'fs';
import SQLite from 'better-sqlite3';
import { Command } from 'commander';
import { inspect } from 'util';

const createDatabaseFromCSV = (csvPath: string, dbPath: string, schemaPath: string, verbose: boolean) => {
    if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);
    }
    let rows;
    if (fs.existsSync(csvPath)) {
        const csvData = fs.readFileSync(csvPath, 'utf8');
        rows = csvData.split('\n').map(row => row.split(','));
    }else
        throw new Error(`CSV datafile not found: ${csvPath}`);

    if (!fs.existsSync(schemaPath))
        throw new Error(`SQLite schema file not found: ${schemaPath}`);

    const db = new SQLite(dbPath, { verbose: verbose ? console.log : undefined });
    // db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    db.exec(fs.readFileSync(schemaPath, 'utf8'));
    
    // Delete the first two rows (headers)
    rows.splice(0, 2);

    const addPatrolStmt = db.prepare('INSERT INTO patrol (name) VALUES (?)');
    const addPostStmt = db.prepare('INSERT INTO post (name, detour, team, open) VALUES (?, ?, ?, ?)');
    const addUserStmt = db.prepare('INSERT INTO user (postId, password) VALUES (?, ?)');
    const addSettingStmt = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');

    rows.forEach(row => {
        const patrolName = row[0].trim();
        const postName = row[1].trim();
        const detour = row[2].trim() === 'TRUE' ? 1 : 0;
        const team = row[3].trim();
        const open = row[4].trim() === 'TRUE' ? 1 : 0;
        const password = row[5].trim();
        const settingKey = row[6].trim();
        const settingValue = row[7].trim();

        if(patrolName !== '')
            addPatrolStmt.run(patrolName);
        if(postName !== ''){
            addPostStmt.run(postName, detour, team, open);
            //Get postId from the last insert
            const postId = (db.prepare('SELECT last_insert_rowid() as id').get() as { id: number }).id;
            addUserStmt.run(postId, password);
        }
        if(settingKey !== '' && settingValue !== ''){
            addSettingStmt.run(settingKey, settingValue);
        }
    })
}

const readArguments = (): Command => {
    let command = new Command()
        .option('-c, --csv <path>', 'Path to the CSV file')
        .option('-d, --db <path>', 'Path to the SQLite database file')
        .option('-s, --schema <path>', 'Path to the database schema file')
        .option('-v, --verbose', 'Enable verbose output')
        .option('-h, --help', 'Show help message')
    command.parse();
    return command;
};

const command = readArguments();
const args = command.opts();

const csvPath = args.csv || 'SQLite/data.csv';
const dbPath = args.db || 'SQLite/webspejd.db';
const schemaPath = args.schema || 'SQLite/dbSchema.sql';
const verbose = args.verbose || false;

console.log('Creating database with settings:', inspect({
    csvPath,
    dbPath,
    schemaPath,
    verbose
}, { depth: null
, colors: true
}));
createDatabaseFromCSV(csvPath, dbPath, schemaPath, verbose);
console.log('Database created successfully!');