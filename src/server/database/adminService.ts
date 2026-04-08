import { Database, ServiceBase, SETTINGS_TABLE } from "./database";
import { User } from "@shared/types";

export class AdminService extends ServiceBase {
    // public readonly settings: { [key: string]: string };
    
    constructor(db: Database) {
        super(db);
        // this.settings = this.getAllSettings();
    }
    
    
    /**
     * Get post id matching password.
     *
     * @param password the password to login with
     * @returns the post id of the post authenticated with
     */
    authenticate(password: string): number | undefined{
        // Check if the password is the master password
        const masterPassword = this.prepare("SELECT value FROM settings WHERE key = 'master_password'").get() as { value: string };
        if(masterPassword.value === password) {
            return Infinity;
        }

        // Check if the password is a post password
        const user = this.prepare("SELECT * FROM user WHERE password = ?").get(password) as User | undefined;
        if(user?.locationId == undefined) {
            return undefined;
        }
        return user.locationId;
    }

    addUser(locationId: number, password: string): number {
        const result = this.prepare("INSERT INTO user (locationId, password) VALUES (?, ?)").run(locationId, password);
        return result.lastInsertRowid as number;
    }

    deleteUser(userId: number): boolean {
        const runResults = this.prepare("DELETE FROM user WHERE id = ?").run(userId);
        return runResults.changes > 0;
    }

    /**
     * Get list of all user ids.
     * 
     * @returns list of user ids
     */
    userIds(): number[]{
        const rows = this.prepare("SELECT id FROM user").all() as { id: number }[];
        return rows.map((row) => row.id);
    }

    /**
     * Get all passwords registered for a location.
     *
     * @param locationId the location to fetch passwords for
     * @returns list of { id, password } rows
     */
    passwordsForLocation(locationId: number): { id: number, password: string }[] {
        const rows = this.prepare("SELECT id, password FROM user WHERE locationId = ? ORDER BY id")
            .all(locationId) as { id: number, password: string }[];
        return rows;
    }

    setMasterPassword(newPassword: string): void {
        this.prepare("UPDATE settings SET value = ? WHERE key = 'master_password'").run(newPassword);
        // this.settings["master_password"] = newPassword;
    }

    /**
     * Get all settings as key-value pairs.
     *
     * @returns dictionary with all settings
     */
    private getAllSettings(): { [key: string]: string } {
        const rows = this.prepare(`SELECT * FROM ${SETTINGS_TABLE.TABLE_NAME}`).all() as { key: string, value: string }[];
        const settings: { [key: string]: string } = {};
        rows.forEach(row => {
            settings[row.key] = row.value;
        });
        return settings;
    }
}