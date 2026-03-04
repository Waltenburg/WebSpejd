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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPatrolStatusTable = void 0;
const elements = __importStar(require("typed-html"));
const responses = __importStar(require("../response"));
const request_1 = require("../request");
const HTMLGeneral_1 = require("./HTMLGeneral");
const getPatrolStatusTable = async (request, locationService, patrolService, updateService) => {
    const form = (0, request_1.parseForm)(request.body);
    const includeInactivePatrols = form["includeInactivePatrols"] === "true" || form["includeInactivePatrols"] === "on";
    const patrolIds = patrolService.allPatrolIds();
    let patrols = patrolIds.map(id => {
        const patrol = patrolService.patrolInfo(id);
        const lastUpdate = updateService.latestUpdateOfPatrol(id);
        return { ...patrol, lastUpdate };
    });
    if (!includeInactivePatrols)
        patrols = patrols.filter(patrol => patrol.udgået === false);
    const html = html_patrolsStatusTable(patrols, includeInactivePatrols, locationService, patrolService);
    return responses.ok(html);
};
exports.getPatrolStatusTable = getPatrolStatusTable;
var ids;
(function (ids) {
    ids["table"] = "patrol-status-table";
    ids["tableBody"] = "patrol-status-table-body";
    ids["tableContainer"] = "patrol-status-table-container";
    ids["includeInactivePatrolsCheckbox"] = "include-inactive-patrols-checkbox";
})(ids || (ids = {}));
var triggers;
(function (triggers) {
    triggers["fetchPatrolsTable"] = "fetchPatrolStatusTable";
})(triggers || (triggers = {}));
const html_patrolRow = (patrol, includeInactivePatrols, locationService, patrolService) => {
    if (!patrol) {
        return elements.createElement("tr", { class: "hover-grey" },
            elements.createElement("td", null, "Ukendt patrulje"),
            elements.createElement("td", null, "-"),
            elements.createElement("td", null, "-"));
    }
    const datetime = patrol.lastUpdate ? patrol.lastUpdate.time.toISOString() : "";
    const ISO_UTCString = patrol.lastUpdate ? patrol.lastUpdate.time.toTimeString() : "-";
    return elements.createElement("tr", { class: "hover-grey" },
        elements.createElement("td", null, (0, HTMLGeneral_1.formatPatrol)(patrol.id, patrolService)),
        elements.createElement("td", null, patrol.lastUpdate ? (0, HTMLGeneral_1.formatUpdateLocation)(locationService, patrol.lastUpdate) : "Ikke startet løb."),
        includeInactivePatrols ? elements.createElement("td", null, patrol.udgået ? "Udgået" : "Aktiv") : null,
        elements.createElement("td", null,
            " ",
            elements.createElement("time", { class: "ts", datetime: datetime }, ISO_UTCString)));
};
const html_patrolsStatusTable = (patrols, includeInactivePatrols, locationService, patrolService) => {
    if (patrols.length === 0) {
        return elements.createElement("div", null, "Ingen patruljer");
    }
    return elements.createElement("div", { id: ids.tableContainer, "hx-post": "/master/patrolStatusTable", "hx-trigger": `every 10s, ${triggers.fetchPatrolsTable}`, "hx-swap": "outerHTML", "hx-include": `#${ids.includeInactivePatrolsCheckbox}` },
        elements.createElement("div", { class: "filter-bar" },
            elements.createElement("label", { for: ids.includeInactivePatrolsCheckbox, style: "font-weight: bold;" }, "Inkluder udg\u00E5ede patruljer"),
            elements.createElement("input", { type: "checkbox", id: ids.includeInactivePatrolsCheckbox, checked: includeInactivePatrols ? true : false, name: "includeInactivePatrols", "hx-on:change": `htmx.trigger(${(0, HTMLGeneral_1.getElementById)(ids.tableContainer)}, '${triggers.fetchPatrolsTable}')` })),
        elements.createElement("div", { class: "table-wrapper" },
            elements.createElement("table", { id: ids.table },
                elements.createElement("thead", null,
                    elements.createElement("th", null, "Patrulje"),
                    elements.createElement("th", null, "Lokation"),
                    includeInactivePatrols ? elements.createElement("th", null, "Status") : null,
                    elements.createElement("th", null, "Sidste \u00E6ndring")),
                patrols.map(patrol => html_patrolRow(patrol, includeInactivePatrols, locationService, patrolService)))));
};
//# sourceMappingURL=patrolStatusHandler.js.map