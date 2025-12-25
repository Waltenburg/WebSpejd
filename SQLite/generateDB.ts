import fs from 'fs';
import SQLite from 'better-sqlite3';
import { Command } from 'commander';
import { inspect } from 'util';
import { LOCATION_TABLE, PATROL_TABLE, ROUTE_TABLE, USER_TABLE, SETTINGS_TABLE } from '../src/database/database';

const createDatabaseFromCSV = (csvPath: string, dbPath: string, schemaPath: string, verbose: boolean) => {
    if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);
    }
    let rows;
    if (fs.existsSync(csvPath)) {
        const csvData = fs.readFileSync(csvPath, 'utf8');
        rows = csvData.split('\n').map(row => row.split('\t')); // Split by tab character
    }else
        throw new Error(`CSV datafile not found: ${csvPath}`);

    if (!fs.existsSync(schemaPath))
        throw new Error(`SQLite schema file not found: ${schemaPath}`);

    const db = new SQLite(dbPath, { verbose: verbose ? console.log : undefined });
    // db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    db.exec(fs.readFileSync(schemaPath, 'utf8'));
    
    // Delete the first two rows (headers)
    const NUMBER_OF_HEADER_ROWS = 2;
    rows.splice(0, NUMBER_OF_HEADER_ROWS);

    const addPatrolStmt = db.prepare(`INSERT INTO ${PATROL_TABLE.TABLE_NAME} (${PATROL_TABLE.NAME}) VALUES (?)`);
    const addLocationStmt = db.prepare(`INSERT INTO ${LOCATION_TABLE.TABLE_NAME} (${LOCATION_TABLE.NAME}, ${LOCATION_TABLE.TEAM}, ${LOCATION_TABLE.OPEN}) VALUES (?, ?, ?)`);
    const addUserStmt = db.prepare(`INSERT INTO ${USER_TABLE.TABLE_NAME} (${USER_TABLE.LOCATION_ID}, ${USER_TABLE.PASSWORD}) VALUES (?, ?)`);
    const addSettingStmt = db.prepare(`INSERT INTO ${SETTINGS_TABLE.TABLE_NAME} (${SETTINGS_TABLE.KEY}, ${SETTINGS_TABLE.VALUE}) VALUES (?, ?)`);
    const addRouteStmt = db.prepare(`INSERT INTO ${ROUTE_TABLE.TABLE_NAME} (${ROUTE_TABLE.FROM_LOCATION_ID}, ${ROUTE_TABLE.TO_LOCATION_ID}, ${ROUTE_TABLE.IS_OPEN}, ${ROUTE_TABLE.DISTANCE}) VALUES (?, ?, ?, ?)`);
    enum columnNumer {
        patrolName,
        locationName,
        routesTo,
        team,
        open,
        password,
        settingKey,
        settingValue
    }

    

    for(let i = 0; i < rows.length; i++) {
        const row = rows[i];

        const patrolName = row[columnNumer.patrolName].trim();
        const postName = row[columnNumer.locationName].trim();
        const team = row[columnNumer.team].trim();
        const open = row[columnNumer.open].trim().toLowerCase() === 'TRUE' ? 1 : 0;
        const password = row[columnNumer.password].trim();
        const settingKey = row[columnNumer.settingKey].trim();
        const settingValue = row[columnNumer.settingValue].trim();

        try{
            if(patrolName !== '')
                addPatrolStmt.run(patrolName);
            if(postName !== ''){
                addLocationStmt.run(postName, team, open);
                //Get locationId from the last insert
                const locationId = (db.prepare('SELECT last_insert_rowid() as id').get() as { id: number }).id;
                addUserStmt.run(locationId, password);
            }
            if(settingKey !== '' && settingValue !== ''){
                addSettingStmt.run(settingKey, settingValue);
            }
        }catch(err){
            throw new Error(`Error adding patrol, location, user or setting in row ${i + NUMBER_OF_HEADER_ROWS + 1}: ${err}`);
        }
    }
    // Second pass to add routes (after all locations have been added)
    for(let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const allLocationIds = db.prepare(`SELECT id, name FROM ${LOCATION_TABLE.TABLE_NAME}`).all() as { id: number, name: string }[];
        const fromLocationName = row[columnNumer.locationName].trim();
        const routesTo = row[columnNumer.routesTo].split(',').map(name => name.trim()).filter(name => name !== '');

        if(fromLocationName !== ''){
            const fromLocationId = allLocationIds.find(loc => loc.name === fromLocationName)?.id;
            if(fromLocationId === undefined){
                throw new Error(`Error adding routes in row ${i + NUMBER_OF_HEADER_ROWS + 1}: Location not found: ${fromLocationName}`);
            }
            routesTo.forEach(toLocationName => {
                const toLocationId = allLocationIds.find(loc => loc.name === toLocationName)?.id;
                if(toLocationId === undefined){
                    throw new Error(`Error adding routes in row ${i + NUMBER_OF_HEADER_ROWS + 1}: Location not found: ${toLocationName}`);
                }
                addRouteStmt.run(fromLocationId, toLocationId, 1, 0);
            });
        }
    }
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
const csvPath = args.csv || 'SQLite/data.tsv';
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