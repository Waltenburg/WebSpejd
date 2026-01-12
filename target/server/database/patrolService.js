"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatrolService = void 0;
const error_1 = require("../error");
const database_1 = require("./database");
class PatrolService extends database_1.ServiceBase {
    patrolInfo(patrolId) {
        const patrol = this.prepare("SELECT * FROM patrol WHERE id = ?").get(patrolId);
        if (!patrol)
            throw new error_1.PatrolNotFoundError(patrolId);
        patrol.udgået = patrol.udgået === 1;
        return patrol;
    }
    changePatrolStatus(patrolId, udgået) {
        const result = this.prepare("UPDATE patrol SET udgået = ? WHERE id = ?").run(udgået ? 1 : 0, patrolId);
        if (result.changes === 0)
            throw new error_1.PatrolNotFoundError(patrolId);
    }
    addPatrol(number, name) {
        const result = this.prepare("INSERT INTO patrol (number, name, udgået) VALUES (?, ?, 0)").run(number, name);
        return result.lastInsertRowid;
    }
    deletePatrol(patrolId) {
        const result = this.prepare("DELETE FROM patrol WHERE id = ?").run(patrolId);
        return result.changes > 0;
    }
    alterPatrolNumberAndName(patrolId, number, name) {
        let result;
        if (number && name)
            result = this.prepare("UPDATE patrol SET number = ?, name = ? WHERE id = ?").run(number, name, patrolId);
        else if (number)
            result = this.prepare("UPDATE patrol SET number = ? WHERE id = ?").run(number, patrolId);
        else if (name)
            result = this.prepare("UPDATE patrol SET name = ? WHERE id = ?").run(name, patrolId);
        else
            return false;
        return result.changes > 0;
    }
    allPatrolIds() {
        const rows = this.prepare("SELECT id FROM patrol ORDER BY number").all();
        return rows.map((row) => row.id);
    }
    allPatrolsWithNoUpdates() {
        const rows = this.prepare(`SELECT p.id
            FROM patrol p
            LEFT JOIN ${"LatestPatrolUpdates"} lu ON p.id = lu.patrolId
            WHERE lu.patrolId IS NULL`).all();
        return rows.map((row) => row.id);
    }
}
exports.PatrolService = PatrolService;
//# sourceMappingURL=patrolService.js.map