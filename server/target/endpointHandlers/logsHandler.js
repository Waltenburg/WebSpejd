import { Response } from "../response.js";
export const getLogs = async (request, logService) => {
    const params = request.url.searchParams;
    const severity = params.get("severity") ?? undefined;
    const method = params.get("method") ?? undefined;
    const path = params.get("path") ?? undefined;
    const statusStr = params.get("status");
    const sinceStr = params.get("since");
    const untilStr = params.get("until");
    const limitStr = params.get("limit");
    const offsetStr = params.get("offset");
    const toNumber = (value) => {
        if (value === null)
            return undefined;
        const parsed = Number.parseInt(value, 10);
        return Number.isNaN(parsed) ? undefined : parsed;
    };
    const logs = logService.queryLogs({
        severity,
        method,
        path,
        status: toNumber(statusStr),
        since: toNumber(sinceStr),
        until: toNumber(untilStr),
        limit: toNumber(limitStr) ?? 100,
        offset: toNumber(offsetStr),
    });
    return Response.ok(JSON.stringify(logs))
        .setHeader("Content-Type", "application/json");
};
//# sourceMappingURL=logsHandler.js.map