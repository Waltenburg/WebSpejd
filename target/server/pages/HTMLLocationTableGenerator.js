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
exports.table = exports.tableBody = exports.renameLocationRow = exports.addRow = exports.row = void 0;
const elements = __importStar(require("typed-html"));
const HTMLGeneral_1 = require("./HTMLGeneral");
const row = (locationService, locationId) => {
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
            elements.createElement("button", { "hx-post": `${"/master/changeLocationStatus"}`, "hx-on--after-request": "htmx.trigger(this.nextElementSibling, 'fetchLocationsRow')", "hx-swap": "none", "hx-vals": hxVals }, location.open ? "Luk" : "Åbn"),
            elements.createElement("span", { "hx-trigger": "fetchLocationsRow", "hx-target": "closest tr", "hx-swap": "outerHTML", "hx-vals": hxVals, "hx-post": `${"/master/getLocationTableRow"}` }),
            elements.createElement("button", { "hx-post": `${"/master/deleteLocation"}`, "hx-target": "closest tr", "hx-swap": "outerHTML", "hx-vals": JSON.stringify({ locationId: location.id }) }, "Slet lokation"),
            elements.createElement("button", { "hx-get": `${"/master/renameLocation"}`, "hx-target": "closest tr", "hx-swap": "outerHTML", "hx-vals": JSON.stringify({ locationId: location.id }) }, "Omd\u00F8b")));
};
exports.row = row;
const addRow = () => {
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
            elements.createElement("button", { type: "button", "hx-post": `${"/master/addLocation"}`, "hx-include": "closest tr", "hx-on--after-request": "htmx.trigger(this.nextElementSibling, 'fetchLocationTable')", "hx-swap": "none" }, "Tilf\u00F8j lokation"),
            elements.createElement("span", { "hx-trigger": "fetchLocationTable", "hx-target": "closest table", "hx-swap": "outerHTML", "hx-post": `${"/master/getLocationsTable"}` })));
};
exports.addRow = addRow;
const renameLocationRow = (locationService, locationId) => {
    const location = locationService.locationInfo(locationId);
    if (!location)
        return elements.createElement("tr", null,
            elements.createElement("td", { colspan: 4 }, "Lokation ikke fundet"));
    return elements.createElement("tr", { id: `rename-location-row-${locationId}` },
        elements.createElement("td", null,
            elements.createElement("input", { required: 'true', type: "text", name: "name", placeholder: location.name })),
        elements.createElement("td", null,
            elements.createElement("input", { required: 'true', type: "text", name: "team", placeholder: location.team })),
        elements.createElement("td", null, " N/A "),
        elements.createElement("td", null,
            elements.createElement("button", { type: "button", "hx-post": `${"/master/renameLocation"}`, "hx-include": "closest tr", "hx-on--after-request": "htmx.trigger(this.nextElementSibling, 'fetchLocationsRow')", "hx-vals": JSON.stringify({ locationId: location.id }), "hx-swap": "none" }, "Omd\u00F8b lokation"),
            elements.createElement("span", { "hx-trigger": "fetchLocationsRow", "hx-target": "closest tr", "hx-swap": "outerHTML", "hx-vals": JSON.stringify({ locationId: location.id }), "hx-post": `${"/master/getLocationTableRow"}` }),
            elements.createElement("button", { type: 'button', "hx-get": `${"/master/getLocationTableRow"}`, "hx-vals": JSON.stringify({ locationId: location.id }), "hx-target": "closest tr", "hx-swap": "outerHTML" }, "Annuller")));
};
exports.renameLocationRow = renameLocationRow;
const tableBody = (locationService, locationIds) => {
    return elements.createElement("tbody", { "hx-ext": "idiomorph", "hx-get": `${"/master/getLocationsTableBody"}`, "hx-target": "this", "hx-swap": "outerHTML", "hx-trigger": "every 10s" },
        locationIds.length === 0 ?
            elements.createElement("tr", null,
                elements.createElement("td", { colspan: 4 }, "Ingen lokationer"))
            : null,
        locationIds.map(locationId => (0, exports.row)(locationService, locationId)));
};
exports.tableBody = tableBody;
const table = (locationService, locationIds) => {
    return elements.createElement("table", { id: "location-table" },
        elements.createElement("thead", null,
            elements.createElement("th", null, "Navn"),
            elements.createElement("th", null, "Team"),
            elements.createElement("th", null, "Status"),
            elements.createElement("th", null, "Handling")),
        (0, exports.tableBody)(locationService, locationIds),
        elements.createElement("tfoot", null, (0, exports.addRow)()));
};
exports.table = table;
//# sourceMappingURL=HTMLLocationTableGenerator.js.map