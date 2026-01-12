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
exports.getPatrolsTable = void 0;
const elements = __importStar(require("typed-html"));
const responses = __importStar(require("../response"));
const request_1 = require("../request");
const HTMLGeneral_1 = require("./HTMLGeneral");
const patrolRow = (patrol, locationService, patrolService) => {
    if (!patrol) {
        return elements.createElement("tr", { class: "hover-grey" },
            elements.createElement("td", null, "Ukendt patrulje"),
            elements.createElement("td", null, "-"),
            elements.createElement("td", null, "-"));
    }
    return elements.createElement("tr", { class: "hover-grey" },
        elements.createElement("td", null,
            elements.createElement("a", { href: `${"/master/patrol"}?id=${patrol.id}`, class: "hover-underline" }, (0, HTMLGeneral_1.formatPatrol)(patrol.id, patrolService))),
        elements.createElement("td", null, patrol.lastUpdate ? (0, HTMLGeneral_1.formatUpdateLocation)(locationService, patrol.lastUpdate) : "Ikke startet løb."),
        elements.createElement("td", null, patrol.lastUpdate ? (0, HTMLGeneral_1.clock)(patrol.lastUpdate.time) : "-"));
};
const patrolsTable = (patrols, locationService, patrolService) => {
    if (patrols.length === 0) {
        return elements.createElement("div", { class: "patrols" }, "Ingen patruljer");
    }
    return elements.createElement("div", { class: "patrols", "hx-get": "/master/patrols", "hx-trigger": "every 5s", "hx-swap": "outerHTML" },
        elements.createElement("table", { id: "patrol-table" },
            elements.createElement("thead", null,
                elements.createElement("td", null, "Patrulje"),
                elements.createElement("td", null, "Lokation"),
                elements.createElement("td", null, "Sidste \u00E6ndring")),
            patrols.map(patrol => patrolRow(patrol, locationService, patrolService))));
};
const getPatrolsTable = async (request, locationService, patrolService, updateService) => {
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
    const html = patrolsTable(patrols, locationService, patrolService);
    return responses.ok(html);
};
exports.getPatrolsTable = getPatrolsTable;
//# sourceMappingURL=patrolHandler.js.map