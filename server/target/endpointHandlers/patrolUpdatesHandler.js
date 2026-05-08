import * as elements from "typed-html";
import { formatPatrol, formatUpdateLocation } from "./HTMLGeneral";
import * as responses from '../response';
// =================================== Endpoint handler for Patrol Updates Table =======================================
export const getPatrolUpdatesTable = async (request, updateService, locationService, patrolService) => {
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
// =================================== HTML Generation Functions =======================================
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
        skipPatrol ? null : elements.createElement("td", null, formatPatrol(update.patrolId, patrolService)),
        skipLocation ? null : elements.createElement("td", null, formatUpdateLocation(locationService, update)),
        elements.createElement("td", null,
            " ",
            elements.createElement("time", { class: "ts", datetime: datetime }, ISO_UTCString)),
        elements.createElement("td", null,
            elements.createElement("button", { class: "button button-danger small-button", "hx-post": "/master/deletePatrolUpdate" /* Endpoints.DeletePatrolUpdate */, "hx-vals": `{"patrolUpdateId": ${update.id}}`, "hx-confirm": "Er du sikker p\u00E5, at du vil slette denne patruljeopdatering?", "hx-on--after-request": "console.log('Patrol update deleted');", "hx-target": "closest tr", "hx-swap": "delete" }, "Slet")));
};
const PatrolUpdateTable = (updates, searchParamStr, skipLocation, skipPatrol, locationService, patrolService) => {
    const cancelCondition = `if (event.detail.elt.id === this.id && isErrorDialogOpen()) {console.log("cancelled request"); event.preventDefault(); }`;
    return elements.createElement("div", { class: "table-wrapper", id: ids.table, "hx-post": "/master/patrolUpdatesTable" /* Endpoints.GetPatrolUpdatesTable */ + "?" + searchParamStr, "hx-trigger": "every 10s", "hx-swap": "outerHTML", "hx-on--before-request": cancelCondition },
        elements.createElement("table", null,
            elements.createElement("thead", null,
                skipPatrol ? null : elements.createElement("th", null, "Patrulje"),
                skipLocation ? null : elements.createElement("th", null, "Lokation"),
                elements.createElement("th", null, "Tidspunkt"),
                elements.createElement("th", null, "Handling")),
            updates.map(update => html_patrolUpdateRow(update, skipLocation, skipPatrol, locationService, patrolService))));
};
//# sourceMappingURL=patrolUpdatesHandler.js.map