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
exports.getRenameLocationRow = exports.getLocationConfigTableBody = exports.getLocationConfigTable = exports.getLocationConfigTableRow = exports.setInfoOnMandskabPage = exports.makeLocationFirstLocation = exports.deleteLocation = exports.renameLocation = exports.changeLocationStatus = exports.addLocation = void 0;
const elements = __importStar(require("typed-html"));
const HTMLGeneral_1 = require("./HTMLGeneral");
const responses = __importStar(require("../response"));
const request_1 = require("../request");
const addLocation = async (request, locationService) => {
    const form = (0, request_1.parseForm)(request.body);
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
exports.addLocation = addLocation;
const changeLocationStatus = async (request, locationService) => {
    const form = (0, request_1.parseForm)(request.body);
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
exports.changeLocationStatus = changeLocationStatus;
const renameLocation = async (request, locationService) => {
    const form = (0, request_1.parseForm)(request.body);
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
exports.renameLocation = renameLocation;
const deleteLocation = async (request, locationService) => {
    const form = (0, request_1.parseForm)(request.body);
    const locationId = Number.parseInt(form["locationId"]);
    if (Number.isNaN(locationId))
        return responses.response_code(400);
    const succes = locationService.deleteLocation(locationId);
    if (!succes)
        return responses.response_code(400);
    return responses.ok();
};
exports.deleteLocation = deleteLocation;
const makeLocationFirstLocation = async (request, locationService) => {
    const form = (0, request_1.parseForm)(request.body);
    const locationId = Number.parseInt(form["locationId"]);
    if (Number.isNaN(locationId))
        return responses.response_code(400);
    locationService.setFirstLocationId(locationId);
    return responses.ok();
};
exports.makeLocationFirstLocation = makeLocationFirstLocation;
const setInfoOnMandskabPage = async (request, locationService) => {
    const form = (0, request_1.parseForm)(request.body);
    const info = form["info"];
    if (info == null)
        return responses.response_code(400);
    locationService.setMandskabPageInfo(info);
    return responses.ok();
};
exports.setInfoOnMandskabPage = setInfoOnMandskabPage;
const getLocationConfigTableRow = async (request, locationService) => {
    const form = (0, request_1.parseForm)(request.body);
    const locationId = Number.parseInt(form["locationId"]);
    if (Number.isNaN(locationId))
        return responses.response_code(400);
    const tableHTML = html_row(locationService, locationId);
    return responses.ok(tableHTML);
};
exports.getLocationConfigTableRow = getLocationConfigTableRow;
const getLocationConfigTable = async (request, locationService) => {
    const locations = locationService.allLocationIds("TOPOLOGICAL");
    const tableHTML = html_table(locationService, locations);
    return responses.ok(tableHTML);
};
exports.getLocationConfigTable = getLocationConfigTable;
const getLocationConfigTableBody = async (request, locationService) => {
    const locations = locationService.allLocationIds("TOPOLOGICAL");
    const tableHTML = html_tableBody(locationService, locations);
    return responses.ok(tableHTML);
};
exports.getLocationConfigTableBody = getLocationConfigTableBody;
const getRenameLocationRow = async (request, locationService) => {
    const form = (0, request_1.parseForm)(request.body);
    const locationId = Number.parseInt(form["locationId"]);
    if (Number.isNaN(locationId)) {
        return responses.response_code(400);
    }
    const tableHTML = html_renameLocationRow(locationService, locationId);
    return responses.ok(tableHTML);
};
exports.getRenameLocationRow = getRenameLocationRow;
const html_row = (locationService, locationId) => {
    const location = locationService.locationInfo(locationId);
    if (!location)
        return elements.createElement("tr", null,
            elements.createElement("td", { colspan: 4 }, "Lokation ikke fundet"));
    const hxVals = JSON.stringify({
        locationId: location.id,
        open: !location.open
    });
    return elements.createElement("tr", { id: `location-row-${location.id}` },
        elements.createElement("td", null, (0, HTMLGeneral_1.formatLocationAnchor)(location)),
        elements.createElement("td", null, location.team),
        elements.createElement("td", null, location.open ? "Åben" : "Lukket"),
        elements.createElement("td", null,
            elements.createElement("button", { "hx-post": `${"/master/changeLocationStatus"}`, "hx-on--after-request": `htmx.trigger(this.nextElementSibling, '${"fetchLocationsRow"}')`, "hx-swap": "none", "hx-vals": hxVals }, location.open ? "Luk" : "Åbn"),
            elements.createElement("button", { type: "button", class: "button location-passwords-button", "data-location-id": location.id, "data-location-name": location.name, "data-location-team": location.team }, "Kodeord"),
            elements.createElement("span", { "hx-trigger": "fetchLocationsRow", "hx-target": "closest tr", "hx-swap": "outerHTML", "hx-vals": hxVals, "hx-post": `${"/master/getLocationTableRow"}` }),
            elements.createElement("button", { "hx-post": `${"/master/deleteLocation"}`, "hx-target": "closest tr", "hx-swap": "outerHTML", "hx-vals": JSON.stringify({ locationId: location.id }), "hx-confirm": `Er du sikker på, at du vil slette lokationen "${location.name}"? Dette kan ikke fortrydes.\nHvis der er ruter til/fra denne lokation, eller patruljer der er checket imod/ind/ud fra denne lokation, kan lokationen ikke slettes.` }, "Slet"),
            elements.createElement("button", { "hx-post": `${"/master/renameLocationRow"}`, "hx-target": "closest tr", "hx-swap": "outerHTML", "hx-vals": JSON.stringify({ locationId: location.id }), "hx-on--before-request": (0, HTMLGeneral_1.addClassToElement)((0, HTMLGeneral_1.getElementById)("location-config-table"), "renaming") }, "Omd\u00F8b")));
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
            elements.createElement("button", { type: "button", "hx-post": `${"/master/addLocation"}`, "hx-include": "closest tr", "hx-on--after-request": `htmx.trigger(this.nextElementSibling, '${"fetchLocationTable"}')`, "hx-swap": "none" }, "Tilf\u00F8j lokation"),
            elements.createElement("span", { "hx-trigger": "fetchLocationTable", "hx-target": "closest table", "hx-swap": "outerHTML", "hx-post": `${"/master/getLocationsTable"}` })));
};
const html_renameLocationRow = (locationService, locationId) => {
    const location = locationService.locationInfo(locationId);
    if (!location)
        return elements.createElement("tr", null,
            elements.createElement("td", { colspan: 4 }, "Lokation ikke fundet"));
    const removeRenamingClassScript = (0, HTMLGeneral_1.removeClassFromElement)((0, HTMLGeneral_1.getElementById)("location-config-table"), "renaming");
    return elements.createElement("tr", { id: `rename-location-row-${locationId}` },
        elements.createElement("td", null,
            elements.createElement("input", { required: 'true', type: "text", name: "name", value: location.name })),
        elements.createElement("td", null,
            elements.createElement("input", { required: 'true', type: "text", name: "team", value: location.team })),
        elements.createElement("td", null, " N/A "),
        elements.createElement("td", null,
            elements.createElement("button", { type: "button", "hx-post": `${"/master/renameLocation"}`, "hx-include": "closest tr", "hx-on--before-request": removeRenamingClassScript, "hx-on--after-request": (0, HTMLGeneral_1.hxTrigger)("this.nextElementSibling", "fetchLocationsRow"), "hx-vals": JSON.stringify({ locationId: location.id }), "hx-swap": "none" }, "Omd\u00F8b lokation"),
            elements.createElement("span", { "hx-trigger": "fetchLocationsRow", "hx-target": "closest tr", "hx-swap": "outerHTML", "hx-vals": JSON.stringify({ locationId: location.id }), "hx-post": `${"/master/getLocationTableRow"}` }),
            elements.createElement("button", { type: 'button', "hx-post": `${"/master/getLocationTableRow"}`, "hx-vals": JSON.stringify({ locationId: location.id }), "hx-target": "closest tr", "hx-swap": "outerHTML", "hx-on--before-request": removeRenamingClassScript }, "Annuller")));
};
const html_tableBody = (locationService, locationIds) => {
    return elements.createElement("tbody", { id: "location-config-table-body", "hx-ext": "idiomorph", "hx-get": `${"/master/getLocationsTableBody"}`, "hx-target": "this", "hx-swap": "outerHTML", "hx-trigger": "every 30s", "hx-on--before-request": `if (event.detail.elt.id === this.id && ${(0, HTMLGeneral_1.isClassOnElement)((0, HTMLGeneral_1.getElementById)("location-config-table"), "renaming")} || isErrorDialogOpen()) {console.log("cancelled request"); event.preventDefault(); }` },
        locationIds.length === 0 ?
            elements.createElement("tr", null,
                elements.createElement("td", { colspan: 4 }, "Ingen lokationer"))
            : null,
        locationIds.map(locationId => html_row(locationService, locationId)));
};
const html_table = (locationService, locationIds) => {
    return elements.createElement("div", { class: "table-wrapper" },
        elements.createElement("table", { id: "location-config-table" },
            elements.createElement("thead", null,
                elements.createElement("th", null, "Navn"),
                elements.createElement("th", null, "Team"),
                elements.createElement("th", null, "Status"),
                elements.createElement("th", null, "Handling")),
            html_tableBody(locationService, locationIds),
            elements.createElement("tfoot", null, html_addRow())));
};
//# sourceMappingURL=LocationConfigHandler.js.map