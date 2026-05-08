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
export declare class LogService extends ServiceBase {
    constructor(db: any);
    addLog(row: Omit<LogRow, "id">): number;
    queryLogs(filter?: LogFilter): LogRow[];
}
//# sourceMappingURL=logService.d.ts.map