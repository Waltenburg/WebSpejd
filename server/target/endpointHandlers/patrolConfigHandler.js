import * as elements from 'typed-html';
import * as responses from '../response';
import { parseForm } from '../request';
import { getElementById, addClassToElement, removeClassFromElement, isClassOnElement, hxTrigger } from './HTMLGeneral';
// ========================== Endpoint Handlers for Patrols CRUD operations  ==========================
export const addPatrol = async (request, patrolService) => {
    const form = parseForm(request.body);
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
export const changePatrolStatus = async (request, patrolService) => {
    const form = parseForm(request.body);
    const patrolId = Number.parseInt(form["patrolId"]);
    const udgået = form["udgået"] === "true";
    if (Number.isNaN(patrolId)) {
        return responses.response_code(400);
    }
    patrolService.changePatrolStatus(patrolId, udgået);
    return responses.ok();
};
export const deletePatrol = async (request, patrolService) => {
    const form = parseForm(request.body);
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
export const alterPatrolNumberAndName = async (request, patrolService) => {
    const form = parseForm(request.body);
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
// ========================== Getting HTML for Patrols ==========================
export const getPatrolConfigTableRow = async (request, patrolService) => {
    const form = parseForm(request.body);
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
export const getPatrolConfigTableBody = async (request, patrolService) => {
    const patrols = patrolService.allPatrolIds().map(id => patrolService.patrolInfo(id));
    const tableHTML = tableBody(patrolService, patrols);
    return responses.ok(tableHTML);
};
export const getPatrolConfigTable = async (request, patrolService) => {
    const patrols = patrolService.allPatrolIds().map(id => patrolService.patrolInfo(id));
    const tableHTML = table(patrolService, patrols);
    return responses.ok(tableHTML);
};
export const getRenamePatrolRow = async (request, patrolService) => {
    const form = parseForm(request.body);
    const patrolId = Number.parseInt(form["patrolId"]);
    if (Number.isNaN(patrolId)) {
        return responses.response_code(400);
    }
    const tableHTML = html_renamePatrolRow(patrolService, patrolId);
    return responses.ok(tableHTML);
};
// ========================== HTML Generators for Patrols ==========================
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
/**
 * Columns:
 * - Patruljenummer
 * - Patruljenavn
 * - Status (Aktiv/ Udgået)
 * - Handlinger (Ændr navn/nummer, Slet patrulje, Skift status)
 */
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
            elements.createElement("button", { "hx-post": `${"/master/patrolStatus" /* Endpoints.ChangePatrolStatus */}`, "hx-on--after-request": `htmx.trigger(this.nextElementSibling, '${hxTriggers.fetchPatrolRow}')`, "hx-swap": "none", "hx-vals": hxVals }, patrol.udgået ? "Aktivér" : "Udgå"),
            elements.createElement("span", { "hx-trigger": hxTriggers.fetchPatrolRow, "hx-target": "closest tr", "hx-swap": "outerHTML", "hx-vals": hxVals, "hx-post": `${"/master/getPatrolConfigTableRow" /* Endpoints.GetPatrolConfigTableRow */}` }),
            elements.createElement("button", { "hx-post": `${"/master/deletePatrol" /* Endpoints.DeletePatrol */}`, "hx-target": "closest tr", "hx-swap": "outerHTML", "hx-vals": JSON.stringify({ patrolId: patrol.id }), "hx-confirm": `Er du sikker på, at du vil slette patruljen "${patrol.name}"? Dette kan ikke fortrydes.` }, "Slet patrulje"),
            elements.createElement("button", { "hx-post": `${"/master/getPatrolConfigTableRenameRow" /* Endpoints.GetPatrolConfigTableRenameRow */}`, "hx-target": "closest tr", "hx-swap": "outerHTML", "hx-vals": JSON.stringify({ patrolId: patrol.id }), "hx-on--before-request": addClassToElement(getElementById(ids.table), classes.renaming) }, "\u00C6ndr navn/nummer")));
};
const addRow = () => {
    return elements.createElement("tr", { id: "add-patrol-row" },
        elements.createElement("td", null,
            elements.createElement("input", { required: 'true', type: "text", name: "number", placeholder: "Nummer" })),
        elements.createElement("td", null,
            elements.createElement("input", { required: 'true', type: "text", name: "name", placeholder: "Navn" })),
        elements.createElement("td", null, "N/A"),
        elements.createElement("td", null,
            elements.createElement("button", { type: "button", "hx-post": `${"/master/addPatrol" /* Endpoints.AddPatrol */}`, "hx-include": "closest tr", "hx-on--after-request": `htmx.trigger(this.nextElementSibling, '${hxTriggers.fetchPatrolTable}')`, "hx-swap": "none" }, "Tilf\u00F8j patrulje"),
            elements.createElement("span", { "hx-trigger": hxTriggers.fetchPatrolTable, "hx-target": "closest table", "hx-swap": "outerHTML", "hx-post": `${"/master/getPatrolConfigTable" /* Endpoints.GetPatrolConfigTable */}` })));
};
const html_renamePatrolRow = (patrolService, patrolId) => {
    const patrol = patrolService.patrolInfo(patrolId);
    if (!patrol)
        return elements.createElement("tr", null,
            elements.createElement("td", { colspan: 4 }, "Patrulje ikke fundet"));
    const removeRenamingClassScript = removeClassFromElement(getElementById(ids.table), classes.renaming);
    return elements.createElement("tr", { id: `rename-patrol-row-${patrolId}` },
        elements.createElement("td", null,
            elements.createElement("input", { required: 'true', type: "text", name: "number", value: patrol.number })),
        elements.createElement("td", null,
            elements.createElement("input", { required: 'true', type: "text", name: "name", value: patrol.name })),
        elements.createElement("td", null, "N/A"),
        elements.createElement("td", null,
            elements.createElement("button", { type: "button", "hx-post": `${"/master/renamePatrol" /* Endpoints.AlterPatrol */}`, "hx-include": "closest tr", "hx-on--before-request": removeRenamingClassScript, "hx-on--after-request": hxTrigger("this.nextElementSibling", hxTriggers.fetchPatrolRow), "hx-vals": JSON.stringify({ patrolId: patrol.id }), "hx-swap": "none" }, "\u00C6ndr patrulje"),
            elements.createElement("span", { "hx-trigger": hxTriggers.fetchPatrolRow, "hx-target": "closest tr", "hx-swap": "outerHTML", "hx-vals": JSON.stringify({ patrolId: patrol.id }), "hx-post": `${"/master/getPatrolConfigTableRow" /* Endpoints.GetPatrolConfigTableRow */}` }),
            elements.createElement("button", { type: 'button', "hx-post": `${"/master/getPatrolConfigTableRow" /* Endpoints.GetPatrolConfigTableRow */}`, "hx-vals": JSON.stringify({ patrolId: patrol.id }), "hx-target": "closest tr", "hx-swap": "outerHTML", "hx-on--before-request": removeRenamingClassScript }, "Annuller")));
};
const tableBody = (patrolService, patrols) => {
    const cancelCondition = `if (event.detail.elt.id === this.id && (isErrorDialogOpen() || ${isClassOnElement(getElementById(ids.table), classes.deleting)})) {console.log("cancelled request"); event.preventDefault(); }`;
    return elements.createElement("tbody", { id: ids.tableBody, "hx-ext": "idiomorph", "hx-get": `${"/master/getPatrolConfigTableBody" /* Endpoints.GetPatrolConfigTableBody */}`, "hx-target": "this", "hx-swap": "outerHTML", "hx-trigger": "every 30s", "hx-on--before-request": cancelCondition },
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