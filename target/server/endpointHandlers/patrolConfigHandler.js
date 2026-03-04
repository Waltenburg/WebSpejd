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
exports.getRenamePatrolRow = exports.getPatrolConfigTable = exports.getPatrolConfigTableBody = exports.getPatrolConfigTableRow = exports.alterPatrolNumberAndName = exports.deletePatrol = exports.changePatrolStatus = exports.addPatrol = void 0;
const elements = __importStar(require("typed-html"));
const responses = __importStar(require("../response"));
const request_1 = require("../request");
const HTMLGeneral_1 = require("./HTMLGeneral");
const addPatrol = async (request, patrolService) => {
    const form = (0, request_1.parseForm)(request.body);
    const number = form["number"];
    const name = form["name"];
    if (!number || !name) {
        return responses.response_code(400);
    }
    const patrolId = patrolService.addPatrol(number, name);
    if (patrolId === null) {
        return responses.response_code(400);
    }
    return responses.ok();
};
exports.addPatrol = addPatrol;
const changePatrolStatus = async (request, patrolService) => {
    const form = (0, request_1.parseForm)(request.body);
    const patrolId = Number.parseInt(form["patrolId"]);
    const udgået = form["udgået"] === "true";
    if (Number.isNaN(patrolId)) {
        return responses.response_code(400);
    }
    patrolService.changePatrolStatus(patrolId, udgået);
    return responses.ok();
};
exports.changePatrolStatus = changePatrolStatus;
const deletePatrol = async (request, patrolService) => {
    const form = (0, request_1.parseForm)(request.body);
    const patrolId = Number.parseInt(form["patrolId"]);
    if (Number.isNaN(patrolId)) {
        return responses.response_code(400);
    }
    const success = patrolService.deletePatrol(patrolId);
    if (!success) {
        return responses.response_code(400);
    }
    return responses.ok();
};
exports.deletePatrol = deletePatrol;
const alterPatrolNumberAndName = async (request, patrolService) => {
    const form = (0, request_1.parseForm)(request.body);
    const patrolId = Number.parseInt(form["patrolId"]);
    const number = form["number"];
    const name = form["name"];
    if (Number.isNaN(patrolId) || !number || !name) {
        return responses.response_code(400);
    }
    const success = patrolService.alterPatrolNumberAndName(patrolId, number, name);
    if (!success) {
        return responses.response_code(400);
    }
    return responses.ok();
};
exports.alterPatrolNumberAndName = alterPatrolNumberAndName;
const getPatrolConfigTableRow = async (request, patrolService) => {
    const form = (0, request_1.parseForm)(request.body);
    const patrolId = Number.parseInt(form["patrolId"]);
    if (Number.isNaN(patrolId)) {
        return responses.response_code(400);
    }
    const patrol = patrolService.patrolInfo(patrolId);
    if (!patrol) {
        return responses.response_code(400);
    }
    const tableHTML = row(patrol);
    return responses.ok(tableHTML);
};
exports.getPatrolConfigTableRow = getPatrolConfigTableRow;
const getPatrolConfigTableBody = async (request, patrolService) => {
    const patrols = patrolService.allPatrolIds().map(id => patrolService.patrolInfo(id));
    const tableHTML = tableBody(patrolService, patrols);
    return responses.ok(tableHTML);
};
exports.getPatrolConfigTableBody = getPatrolConfigTableBody;
const getPatrolConfigTable = async (request, patrolService) => {
    const patrols = patrolService.allPatrolIds().map(id => patrolService.patrolInfo(id));
    const tableHTML = table(patrolService, patrols);
    return responses.ok(tableHTML);
};
exports.getPatrolConfigTable = getPatrolConfigTable;
const getRenamePatrolRow = async (request, patrolService) => {
    const form = (0, request_1.parseForm)(request.body);
    const patrolId = Number.parseInt(form["patrolId"]);
    if (Number.isNaN(patrolId)) {
        return responses.response_code(400);
    }
    const tableHTML = html_renamePatrolRow(patrolService, patrolId);
    return responses.ok(tableHTML);
};
exports.getRenamePatrolRow = getRenamePatrolRow;
var ids;
(function (ids) {
    ids["table"] = "patrol-config-table";
    ids["tableBody"] = "patrol-config-table-body";
})(ids || (ids = {}));
var classes;
(function (classes) {
    classes["renaming"] = "renaming";
    classes["deleting"] = "deleting";
})(classes || (classes = {}));
var hxTriggers;
(function (hxTriggers) {
    hxTriggers["fetchPatrolRow"] = "fetchPatrolRow";
    hxTriggers["fetchPatrolTable"] = "fetchPatrolTable";
})(hxTriggers || (hxTriggers = {}));
const row = (patrol) => {
    const hxVals = JSON.stringify({
        patrolId: patrol.id,
        udgået: !patrol.udgået
    });
    return elements.createElement("tr", { id: `patrol-row-${patrol.id}` },
        elements.createElement("td", null, patrol.number),
        elements.createElement("td", null, patrol.name),
        elements.createElement("td", null, patrol.udgået ? "Udgået" : "Aktiv"),
        elements.createElement("td", null,
            elements.createElement("button", { "hx-post": `${"/master/patrolStatus"}`, "hx-on--after-request": `htmx.trigger(this.nextElementSibling, '${hxTriggers.fetchPatrolRow}')`, "hx-swap": "none", "hx-vals": hxVals }, patrol.udgået ? "Aktivér" : "Udgå"),
            elements.createElement("span", { "hx-trigger": hxTriggers.fetchPatrolRow, "hx-target": "closest tr", "hx-swap": "outerHTML", "hx-vals": hxVals, "hx-post": `${"/master/getPatrolConfigTableRow"}` }),
            elements.createElement("button", { "hx-post": `${"/master/deletePatrol"}`, "hx-target": "closest tr", "hx-swap": "outerHTML", "hx-vals": JSON.stringify({ patrolId: patrol.id }), "hx-confirm": `Er du sikker på, at du vil slette patruljen "${patrol.name}"? Dette kan ikke fortrydes.` }, "Slet patrulje"),
            elements.createElement("button", { "hx-post": `${"/master/getPatrolConfigTableRenameRow"}`, "hx-target": "closest tr", "hx-swap": "outerHTML", "hx-vals": JSON.stringify({ patrolId: patrol.id }), "hx-on--before-request": (0, HTMLGeneral_1.addClassToElement)((0, HTMLGeneral_1.getElementById)(ids.table), classes.renaming) }, "\u00C6ndr navn/nummer")));
};
const addRow = () => {
    return elements.createElement("tr", { id: "add-patrol-row" },
        elements.createElement("td", null,
            elements.createElement("input", { required: 'true', type: "text", name: "number", placeholder: "Nummer" })),
        elements.createElement("td", null,
            elements.createElement("input", { required: 'true', type: "text", name: "name", placeholder: "Navn" })),
        elements.createElement("td", null, "N/A"),
        elements.createElement("td", null,
            elements.createElement("button", { type: "button", "hx-post": `${"/master/addPatrol"}`, "hx-include": "closest tr", "hx-on--after-request": `htmx.trigger(this.nextElementSibling, '${hxTriggers.fetchPatrolTable}')`, "hx-swap": "none" }, "Tilf\u00F8j patrulje"),
            elements.createElement("span", { "hx-trigger": hxTriggers.fetchPatrolTable, "hx-target": "closest table", "hx-swap": "outerHTML", "hx-post": `${"/master/getPatrolConfigTable"}` })));
};
const html_renamePatrolRow = (patrolService, patrolId) => {
    const patrol = patrolService.patrolInfo(patrolId);
    if (!patrol)
        return elements.createElement("tr", null,
            elements.createElement("td", { colspan: 4 }, "Patrulje ikke fundet"));
    const removeRenamingClassScript = (0, HTMLGeneral_1.removeClassFromElement)((0, HTMLGeneral_1.getElementById)(ids.table), classes.renaming);
    return elements.createElement("tr", { id: `rename-patrol-row-${patrolId}` },
        elements.createElement("td", null,
            elements.createElement("input", { required: 'true', type: "text", name: "number", value: patrol.number })),
        elements.createElement("td", null,
            elements.createElement("input", { required: 'true', type: "text", name: "name", value: patrol.name })),
        elements.createElement("td", null, "N/A"),
        elements.createElement("td", null,
            elements.createElement("button", { type: "button", "hx-post": `${"/master/renamePatrol"}`, "hx-include": "closest tr", "hx-on--before-request": removeRenamingClassScript, "hx-on--after-request": (0, HTMLGeneral_1.hxTrigger)("this.nextElementSibling", hxTriggers.fetchPatrolRow), "hx-vals": JSON.stringify({ patrolId: patrol.id }), "hx-swap": "none" }, "\u00C6ndr patrulje"),
            elements.createElement("span", { "hx-trigger": hxTriggers.fetchPatrolRow, "hx-target": "closest tr", "hx-swap": "outerHTML", "hx-vals": JSON.stringify({ patrolId: patrol.id }), "hx-post": `${"/master/getPatrolConfigTableRow"}` }),
            elements.createElement("button", { type: 'button', "hx-post": `${"/master/getPatrolConfigTableRow"}`, "hx-vals": JSON.stringify({ patrolId: patrol.id }), "hx-target": "closest tr", "hx-swap": "outerHTML", "hx-on--before-request": removeRenamingClassScript }, "Annuller")));
};
const tableBody = (patrolService, patrols) => {
    const cancelCondition = `if (event.detail.elt.id === this.id && (isErrorDialogOpen() || ${(0, HTMLGeneral_1.isClassOnElement)((0, HTMLGeneral_1.getElementById)(ids.table), classes.deleting)})) {console.log("cancelled request"); event.preventDefault(); }`;
    return elements.createElement("tbody", { id: ids.tableBody, "hx-ext": "idiomorph", "hx-get": `${"/master/getPatrolConfigTableBody"}`, "hx-target": "this", "hx-swap": "outerHTML", "hx-trigger": "every 30s", "hx-on--before-request": cancelCondition },
        patrols.length === 0 ?
            elements.createElement("tr", null,
                elements.createElement("td", { colspan: 4 }, "Ingen patruljer"))
            : null,
        patrols.map(patrol => row(patrol)));
};
const table = (patrolService, patrols) => {
    return elements.createElement("div", { class: "table-wrapper" },
        elements.createElement("table", { id: ids.table },
            elements.createElement("thead", null,
                elements.createElement("th", null, "Patruljenummer"),
                elements.createElement("th", null, "Patruljenavn"),
                elements.createElement("th", null, "Status"),
                elements.createElement("th", null, "Handling")),
            tableBody(patrolService, patrols),
            elements.createElement("tfoot", null, addRow())));
};
//# sourceMappingURL=patrolConfigHandler.js.map