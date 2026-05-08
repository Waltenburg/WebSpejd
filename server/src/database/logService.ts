import { ServiceBase } from "./database";

export interface LogRow {
    id?: number;
    time: number;
    method: string;
    path: string;
    headers: string;
    duration: number;
    status: number;
    severity: string;
    message?: string | null;
}

export interface LogFilter {
    severity?: string;
    method?: string;
    path?: string;
    status?: number;
    since?: number;
    until?: number;
    limit?: number;
    offset?: number;
}

export class LogService extends ServiceBase {
    constructor(db: any) {
        super(db);
    }

    addLog(row: Omit<LogRow, "id">): number {
        const stmt = this.prepare(
            "INSERT INTO Logs (time, method, path, headers, duration, status, severity, message) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
        );
        const result = stmt.run(
            row.time,
            row.method,
            row.path,
            row.headers,
            row.duration,
            row.status,
            row.severity,
            row.message ?? null
        );
        return result.lastInsertRowid as number;
    }

    queryLogs(filter: LogFilter = {}): LogRow[] {
        const where: string[] = [];
        const params: any[] = [];

        if (filter.severity) {
            where.push("severity = ?");
            params.push(filter.severity);
        }
        if (filter.method) {
            where.push("method = ?");
            params.push(filter.method);
        }
        if (filter.path) {
            where.push("path LIKE ?");
            params.push(`%${filter.path}%`);
        }
        if (typeof filter.status === "number") {
            where.push("status = ?");
            params.push(filter.status);
        }
        if (typeof filter.since === "number") {
            where.push("time >= ?");
            params.push(filter.since);
        }
        if (typeof filter.until === "number") {
            where.push("time <= ?");
            params.push(filter.until);
        }

        const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";
        const limitClause = typeof filter.limit === "number" ? `LIMIT ${Number(filter.limit)}` : "";
        const offsetClause = typeof filter.offset === "number" ? `OFFSET ${Number(filter.offset)}` : "";

        const rows = this.prepare(
            `SELECT * FROM Logs ${whereClause} ORDER BY time DESC ${limitClause} ${offsetClause}`
        ).all(...params) as LogRow[];

        return rows;
    }
}
