import * as elements from 'typed-html';
import { formatLocationAnchor, getElementById, addClassToElement, removeClassFromElement, isClassOnElement, hxTrigger } from './HTMLGeneral';
import * as responses from '../response';
import { parseForm } from '../request';
// ========================== Endpoint Handlers for Locations CRUD operations  ==========================
export const addLocation = async (request, locationService) => {
    const form = parseForm(request.body);
    const name = form["name"];
    const team = form["team"];
    const openText = form["open"];
    const open = openText === "on" || openText === "true";
    if (!name || !team || !openText) {
        return responses.response_code(400);
    }
    const locationId = locationService.addLocation(name, team, open);
    if (locationId === null) {
        return responses.response_code(400);
    }
    return responses.ok();
};
export const changeLocationStatus = async (request, locationService) => {
    const form = parseForm(request.body);
    const locationId = Number.parseInt(form["locationId"]);
    const openText = form["open"];
    const open = openText === "on" || openText === "true";
    if (Number.isNaN(locationId) || openText == null)
        return responses.response_code(400);
    const succes = locationService.changeLocationStatus(locationId, open);
    if (!succes)
        return responses.response_code(400);
    return responses.ok();
};
export const renameLocation = async (request, locationService) => {
    const form = parseForm(request.body);
    const locationId = Number.parseInt(form["locationId"]);
    const name = form["name"];
    const team = form["team"];
    if (Number.isNaN(locationId) || (!name && !team)) {
        return responses.response_code(400);
    }
    const succes = locationService.renameLocation(locationId, name, team);
    if (!succes) {
        return responses.response_code(400);
    }
    return responses.ok();
};
export const deleteLocation = async (request, locationService) => {
    const form = parseForm(request.body);
    const locationId = Number.parseInt(form["locationId"]);
    if (Number.isNaN(locationId))
        return responses.response_code(400);
    const succes = locationService.deleteLocation(locationId);
    if (!succes)
        return responses.response_code(400);
    return responses.ok();
};
export const makeLocationFirstLocation = async (request, locationService) => {
    const form = parseForm(request.body);
    const locationId = Number.parseInt(form["locationId"]);
    if (Number.isNaN(locationId))
        return responses.response_code(400);
    locationService.setFirstLocationId(locationId);
    return responses.ok();
};
export const setInfoOnMandskabPage = async (request, locationService) => {
    const form = parseForm(request.body);
    const info = form["info"];
    if (info == null)
        return responses.response_code(400);
    locationService.setMandskabPageInfo(info);
    return responses.ok();
};
// ========================== Getting HTML for Locations ==========================
export const getLocationConfigTableRow = async (request, locationService) => {
    const form = parseForm(request.body);
    const locationId = Number.parseInt(form["locationId"]);
    if (Number.isNaN(locationId))
        return responses.response_code(400);
    const tableHTML = html_row(locationService, locationId);
    return responses.ok(tableHTML);
};
export const getLocationConfigTable = async (request, locationService) => {
    const locations = locationService.allLocationIds("TOPOLOGICAL" /* SortType.TOPOLOGICAL */);
    const tableHTML = html_table(locationService, locations);
    return responses.ok(tableHTML);
};
export const getLocationConfigTableBody = async (request, locationService) => {
    const locations = locationService.allLocationIds("TOPOLOGICAL" /* SortType.TOPOLOGICAL */);
    const tableHTML = html_tableBody(locationService, locations);
    return responses.ok(tableHTML);
};
export const getRenameLocationRow = async (request, locationService) => {
    const form = parseForm(request.body);
    const locationId = Number.parseInt(form["locationId"]);
    if (Number.isNaN(locationId)) {
        return responses.response_code(400);
    }
    const tableHTML = html_renameLocationRow(locationService, locationId);
    return responses.ok(tableHTML);
};
const html_row = (locationService, locationId) => {
    const location = locationService.locationInfo(locationId);
    if (!location)
        return elements.createElement("tr", null,
            elements.createElement("td", { colspan: 4 }, "Lokation ikke fundet"));
    // Prepare hx-vals for toggling location status
    const hxVals = JSON.stringify({
        locationId: location.id,
        open: !location.open
    });
    return elements.createElement("tr", { id: `location-row-${location.id}` },
        elements.createElement("td", null, formatLocationAnchor(location)),
        elements.createElement("td", null, location.team),
        elements.createElement("td", null, location.open ? "Åben" : "Lukket"),
        elements.createElement("td", null,
            elements.createElement("button", { "hx-post": `${"/master/changeLocationStatus" /* Endpoints.ChangeLocationStatus */}`, "hx-on--after-request": `htmx.trigger(this.nextElementSibling, '${"fetchLocationsRow" /* hxTriggers.fetchLocationsRow */}')`, "hx-swap": "none", "hx-vals": hxVals }, location.open ? "Luk" : "Åbn"),
            elements.createElement("button", { type: "button", class: "button location-passwords-button", "data-location-id": location.id, "data-location-name": location.name, "data-location-team": location.team }, "Kodeord"),
            elements.createElement("span", { "hx-trigger": "fetchLocationsRow" /* hxTriggers.fetchLocationsRow */, "hx-target": "closest tr", "hx-swap": "outerHTML", "hx-vals": hxVals, "hx-post": `${"/master/getLocationTableRow" /* Endpoints.GetLocationConfigTableRow */}` }),
            elements.createElement("button", { "hx-post": `${"/master/deleteLocation" /* Endpoints.DeleteLocation */}`, "hx-target": "closest tr", "hx-swap": "outerHTML", "hx-vals": JSON.stringify({ locationId: location.id }), "hx-confirm": `Er du sikker på, at du vil slette lokationen "${location.name}"? Dette kan ikke fortrydes.\nHvis der er ruter til/fra denne lokation, eller patruljer der er checket imod/ind/ud fra denne lokation, kan lokationen ikke slettes.` }, "Slet"),
            elements.createElement("button", { "hx-post": `${"/master/renameLocationRow" /* Endpoints.GetRenameLocationRow */}`, "hx-target": "closest tr", "hx-swap": "outerHTML", "hx-vals": JSON.stringify({ locationId: location.id }), "hx-on--before-request": addClassToElement(getElementById("location-config-table" /* ids.configTable */), "renaming" /* classes.renaming */) }, "Omd\u00F8b")));
};
const html_addRow = () => {
    return elements.createElement("tr", { id: "add-location-row" },
        elements.createElement("td", null,
            elements.createElement("input", { required: 'true', type: "text", name: "name", placeholder: "Navn" })),
        elements.createElement("td", null,
            elements.createElement("input", { required: 'true', type: "text", name: "team", placeholder: "Team" })),
        elements.createElement("td", null,
            elements.createElement("select", { required: 'true', name: "open" },
                elements.createElement("option", { value: "true" }, "\u00C5ben"),
                elements.createElement("option", { value: "false" }, "Lukket"))),
        elements.createElement("td", null,
            elements.createElement("button", { type: "button", "hx-post": `${"/master/addLocation" /* Endpoints.AddLocation */}`, "hx-include": "closest tr", "hx-on--after-request": `htmx.trigger(this.nextElementSibling, '${"fetchLocationTable" /* hxTriggers.fetchLocationTable */}')`, "hx-swap": "none" }, "Tilf\u00F8j lokation"),
            elements.createElement("span", { "hx-trigger": "fetchLocationTable" /* hxTriggers.fetchLocationTable */, "hx-target": "closest table", "hx-swap": "outerHTML", "hx-post": `${"/master/getLocationsTable" /* Endpoints.GetLocationConfigTable */}` })));
};
const html_renameLocationRow = (locationService, locationId) => {
    const location = locationService.locationInfo(locationId);
    if (!location)
        return elements.createElement("tr", null,
            elements.createElement("td", { colspan: 4 }, "Lokation ikke fundet"));
    const removeRenamingClassScript = removeClassFromElement(getElementById("location-config-table" /* ids.configTable */), "renaming" /* classes.renaming */);
    return elements.createElement("tr", { id: `rename-location-row-${locationId}` },
        elements.createElement("td", null,
            elements.createElement("input", { required: 'true', type: "text", name: "name", value: location.name })),
        elements.createElement("td", null,
            elements.createElement("input", { required: 'true', type: "text", name: "team", value: location.team })),
        elements.createElement("td", null, " N/A "),
        elements.createElement("td", null,
            elements.createElement("button", { type: "button", "hx-post": `${"/master/renameLocation" /* Endpoints.RenameLocation */}`, "hx-include": "closest tr", "hx-on--before-request": removeRenamingClassScript, "hx-on--after-request": hxTrigger("this.nextElementSibling", "fetchLocationsRow" /* hxTriggers.fetchLocationsRow */), "hx-vals": JSON.stringify({ locationId: location.id }), "hx-swap": "none" }, "Omd\u00F8b lokation"),
            elements.createElement("span", { "hx-trigger": "fetchLocationsRow", "hx-target": "closest tr", "hx-swap": "outerHTML", "hx-vals": JSON.stringify({ locationId: location.id }), "hx-post": `${"/master/getLocationTableRow" /* Endpoints.GetLocationConfigTableRow */}` }),
            elements.createElement("button", { type: 'button', "hx-post": `${"/master/getLocationTableRow" /* Endpoints.GetLocationConfigTableRow */}`, "hx-vals": JSON.stringify({ locationId: location.id }), "hx-target": "closest tr", "hx-swap": "outerHTML", "hx-on--before-request": removeRenamingClassScript }, "Annuller")));
};
const html_tableBody = (locationService, locationIds) => {
    return elements.createElement("tbody", { id: "location-config-table-body" /* ids.configTableBody */, "hx-ext": "idiomorph", "hx-get": `${"/master/getLocationsTableBody" /* Endpoints.GetLocationConfigTableBody */}`, "hx-target": "this", "hx-swap": "outerHTML", "hx-trigger": "every 30s", "hx-on--before-request": `if (event.detail.elt.id === this.id && ${isClassOnElement(getElementById("location-config-table" /* ids.configTable */), "renaming" /* classes.renaming */)} || isErrorDialogOpen()) {console.log("cancelled request"); event.preventDefault(); }` },
        locationIds.length === 0 ?
            elements.createElement("tr", null,
                elements.createElement("td", { colspan: 4 }, "Ingen lokationer"))
            : null,
        locationIds.map(locationId => html_row(locationService, locationId)));
};
const html_table = (locationService, locationIds) => {
    return elements.createElement("div", { class: "table-wrapper" },
        elements.createElement("table", { id: "location-config-table" /* ids.configTable */ },
            elements.createElement("thead", null,
                elements.createElement("th", null, "Navn"),
                elements.createElement("th", null, "Team"),
                elements.createElement("th", null, "Status"),
                elements.createElement("th", null, "Handling")),
            html_tableBody(locationService, locationIds),
            elements.createElement("tfoot", null, html_addRow())));
};
//# sourceMappingURL=LocationConfigHandler.js.map