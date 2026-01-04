"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const database_1 = require("./database");
class AdminService extends database_1.ServiceBase {
    settings;
    constructor(db) {
        super(db);
        this.settings = this.getAllSettings();
    }
    /**
     * Get post id matching password.
     *
     * @param password the password to login with
     * @returns the post id of the post authenticated with
     */
    authenticate(password) {
        // Check if the password is the master password
        const masterPassword = this.prepare("SELECT value FROM settings WHERE key = 'master_password'").get();
        if (masterPassword.value === password) {
            return Infinity;
        }
        // Check if the password is a post password
        const user = this.prepare("SELECT * FROM user WHERE password = ?").get(password);
        if (user?.locationId == undefined) {
            return undefined;
        }
        return user.locationId;
    }
    /**
     * Get list of all user ids.
     *
     * @returns list of user ids
     */
    userIds() {
        const rows = this.prepare("SELECT id FROM user").all();
        return rows.map((row) => row.id);
    }
    /**
     * Get all settings as key-value pairs.
     *
     * @returns dictionary with all settings
     */
    getAllSettings() {
        const rows = this.prepare(`SELECT * FROM ${"settings" /* SETTINGS_TABLE.TABLE_NAME */}`).all();
        const settings = {};
        rows.forEach(row => {
            settings[row.key] = row.value;
        });
        return settings;
    }
}
exports.AdminService = AdminService;
