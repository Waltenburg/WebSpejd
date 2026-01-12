"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLogs = void 0;
const responses = __importStar(require("../response"));
const getLogs = async (request, logService) => {
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
    return responses.ok(JSON.stringify(logs), {
        "Content-Type": "application/json",
    });
};
exports.getLogs = getLogs;
//# sourceMappingURL=logsHandler.js.map