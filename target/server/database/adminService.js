"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const database_1 = require("./database");
class AdminService extends database_1.ServiceBase {
    constructor(db) {
        super(db);
        this.settings = this.getAllSettings();
    }
    authenticate(password) {
        const masterPassword = this.prepare("SELECT value FROM settings WHERE key = 'master_password'").get();
        if (masterPassword.value === password) {
            return Infinity;
        }
        const user = this.prepare("SELECT * FROM user WHERE password = ?").get(password);
        if (user?.locationId == undefined) {
            return undefined;
        }
        return user.locationId;
    }
    addUser(locationId, password) {
        const result = this.prepare("INSERT INTO user (locationId, password) VALUES (?, ?)").run(locationId, password);
        return result.lastInsertRowid;
    }
    deleteUser(userId) {
        const runResults = this.prepare("DELETE FROM user WHERE id = ?").run(userId);
        return runResults.changes > 0;
    }
    userIds() {
        const rows = this.prepare("SELECT id FROM user").all();
        return rows.map((row) => row.id);
    }
    passwordsForLocation(locationId) {
        const rows = this.prepare("SELECT id, password FROM user WHERE locationId = ? ORDER BY id")
            .all(locationId);
        return rows;
    }
    getAllSettings() {
        const rows = this.prepare(`SELECT * FROM ${"settings"}`).all();
        const settings = {};
        rows.forEach(row => {
            settings[row.key] = row.value;
        });
        return settings;
    }
}
exports.AdminService = AdminService;
//# sourceMappingURL=adminService.js.map