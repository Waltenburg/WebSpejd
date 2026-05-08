import * as elements from 'typed-html';
import { Response } from '../response.js';
import { parseForm } from '../request.js';
import { formatPatrol, formatUpdateLocation, getElementById } from './HTMLGeneral.js';
// ========================== Endpoint Handler for Patrol Status ==========================
export const getPatrolStatusTable = async (request, locationService, patrolService, updateService) => {
    if (request.body === undefined) {
        return Response.badRequest();
    }
    const form = parseForm(request.body);
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
    return Response.ok(html);
};
// =========================== HTML Generation Functions ==========================
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
        elements.createElement("td", null, formatPatrol(patrol.id, patrolService)),
        elements.createElement("td", null, patrol.lastUpdate ? formatUpdateLocation(locationService, patrol.lastUpdate) : "Ikke startet løb."),
        includeInactivePatrols ? elements.createElement("td", null, patrol.udgået ? "Udgået" : "Aktiv") : null,
        elements.createElement("td", null,
            " ",
            elements.createElement("time", { class: "ts", datetime: datetime }, ISO_UTCString)));
};
const html_patrolsStatusTable = (patrols, includeInactivePatrols, locationService, patrolService) => {
    if (patrols.length === 0) {
        return elements.createElement("div", null, "Ingen patruljer");
    }
    return elements.createElement("div", { id: ids.tableContainer, "hx-post": "/master/patrolStatusTable" /* Endpoints.GetPatrolStatusTable */, "hx-trigger": `every 10s, ${triggers.fetchPatrolsTable}`, "hx-swap": "outerHTML", "hx-include": `#${ids.includeInactivePatrolsCheckbox}` },
        elements.createElement("div", { class: "filter-bar" },
            elements.createElement("label", { for: ids.includeInactivePatrolsCheckbox, style: "font-weight: bold;" }, "Inkluder udg\u00E5ede patruljer"),
            elements.createElement("input", { type: "checkbox", id: ids.includeInactivePatrolsCheckbox, checked: includeInactivePatrols ? true : false, name: "includeInactivePatrols", "hx-on:change": `htmx.trigger(${getElementById(ids.tableContainer)}, '${triggers.fetchPatrolsTable}')` })),
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