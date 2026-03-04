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
exports.getPatrolUpdatesTable = void 0;
const elements = __importStar(require("typed-html"));
const HTMLGeneral_1 = require("./HTMLGeneral");
const responses = __importStar(require("../response"));
const getPatrolUpdatesTable = async (request, updateService, locationService, patrolService) => {
    const locationId = Number.parseInt(request.url.searchParams.get("locationId"));
    const patrolId = Number.parseInt(request.url.searchParams.get("patrolId"));
    const searchParamStr = request.url.searchParams.toString();
    let skipLocation = false;
    let skipPatrol = false;
    let updates;
    if (!Number.isNaN(locationId)) {
        updates = updateService.updatesAtLocation(locationId);
    }
    else if (!Number.isNaN(patrolId)) {
        updates = updateService.updatesOfPatrol(patrolId);
        skipPatrol = true;
    }
    else
        updates = updateService.lastUpdates(20);
    const html = PatrolUpdateTable(updates, searchParamStr, skipLocation, skipPatrol, locationService, patrolService);
    return responses.ok(html);
};
exports.getPatrolUpdatesTable = getPatrolUpdatesTable;
var ids;
(function (ids) {
    ids["table"] = "patrol-updates-table";
    ids["tableBody"] = "patrol-updates-table-body";
})(ids || (ids = {}));
var classes;
(function (classes) {
    classes["deletingRow"] = "deleting-patrol-update-row";
})(classes || (classes = {}));
const html_patrolUpdateRow = (update, skipLocation, skipPatrol, locationService, patrolService) => {
    if (!update) {
        return elements.createElement("tr", { class: "hover-grey" },
            elements.createElement("td", { colspan: 4 }, "Ukendt Patruljeopdatering"));
    }
    const datetime = update ? update.time.toISOString() : "";
    const ISO_UTCString = update ? update.time.toTimeString() : "-";
    return elements.createElement("tr", { class: "hover-grey" },
        skipPatrol ? null : elements.createElement("td", null, (0, HTMLGeneral_1.formatPatrol)(update.patrolId, patrolService)),
        skipLocation ? null : elements.createElement("td", null, (0, HTMLGeneral_1.formatUpdateLocation)(locationService, update)),
        elements.createElement("td", null,
            " ",
            elements.createElement("time", { class: "ts", datetime: datetime }, ISO_UTCString)),
        elements.createElement("td", null,
            elements.createElement("button", { class: "button button-danger small-button", "hx-post": "/master/deletePatrolUpdate", "hx-vals": `{"patrolUpdateId": ${update.id}}`, "hx-confirm": "Er du sikker p\u00E5, at du vil slette denne patruljeopdatering?", "hx-on--after-request": "console.log('Patrol update deleted');", "hx-target": "closest tr", "hx-swap": "delete" }, "Slet")));
};
const PatrolUpdateTable = (updates, searchParamStr, skipLocation, skipPatrol, locationService, patrolService) => {
    const cancelCondition = `if (event.detail.elt.id === this.id && isErrorDialogOpen()) {console.log("cancelled request"); event.preventDefault(); }`;
    return elements.createElement("div", { class: "table-wrapper", id: ids.table, "hx-post": "/master/patrolUpdatesTable" + "?" + searchParamStr, "hx-trigger": "every 10s", "hx-swap": "outerHTML", "hx-on--before-request": cancelCondition },
        elements.createElement("table", null,
            elements.createElement("thead", null,
                skipPatrol ? null : elements.createElement("th", null, "Patrulje"),
                skipLocation ? null : elements.createElement("th", null, "Lokation"),
                elements.createElement("th", null, "Tidspunkt"),
                elements.createElement("th", null, "Handling")),
            updates.map(update => html_patrolUpdateRow(update, skipLocation, skipPatrol, locationService, patrolService))));
};
//# sourceMappingURL=patrolUpdatesHandler.js.map