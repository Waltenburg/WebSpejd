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
exports.table = exports.addRow = exports.row = void 0;
const elements = __importStar(require("typed-html"));
const row = (locationService, route, skipFrom, skipTo) => {
    const hxVals = JSON.stringify({
        routeId: route.id,
        showFrom: !skipFrom,
        showTo: !skipTo,
        open: !route.is_open
    });
    return elements.createElement("tr", null,
        skipFrom ? null :
            elements.createElement("td", null,
                elements.createElement("a", { href: `${"/master/location"}?locationId=${route.fromLocationId}` }, locationService.locationInfo(route.fromLocationId)?.name)),
        skipTo ? null :
            elements.createElement("td", null,
                elements.createElement("a", { href: `${"/master/location"}?locationId=${route.toLocationId}` }, locationService.locationInfo(route.toLocationId)?.name)),
        elements.createElement("td", null, route.is_open ? "Åben" : "Lukket"),
        elements.createElement("td", null,
            elements.createElement("button", { "hx-post": `${"/master/changeRouteStatus"}`, "hx-on--after-request": "htmx.trigger(this.nextElementSibling, 'fetchRouteRow')", "hx-swap": "none", "hx-vals": hxVals }, route.is_open ? "Luk" : "Åbn"),
            elements.createElement("span", { "hx-trigger": "fetchRouteRow", "hx-target": "closest tr", "hx-swap": "outerHTML", "hx-vals": hxVals, "hx-post": `${"/master/getRouteTableRow"}` }),
            elements.createElement("button", { "hx-post": `${"/master/deleteRoute"}`, "hx-target": "closest tr", "hx-swap": "outerHTML", "hx-vals": JSON.stringify({ routeId: route.id }) }, "Slet rute")));
};
exports.row = row;
const addRow = (locationService, locationId, skipFrom, skipTo) => {
    let locationsTemp = locationService.allLocationIds().map(id => locationService.locationInfo(id));
    if (locationId)
        locationsTemp = locationsTemp.filter(locationsTemp => locationsTemp.id !== locationId);
    const locations = locationsTemp;
    let locationIdObj = {};
    if (skipFrom && skipTo)
        return "Can't skip both from and to";
    if ((skipFrom || skipTo) && locationId == null)
        return "LocationId must be provided when skipping from or to";
    if (skipFrom)
        locationIdObj.fromLocationId = locationId.toString();
    if (skipTo)
        locationIdObj.toLocationId = locationId.toString();
    return elements.createElement("tr", null,
        skipFrom ? null :
            elements.createElement("td", null,
                elements.createElement("select", { required: 'true', name: "fromLocationId" },
                    elements.createElement("option", { value: "", disabled: 'true', selected: 'true' }, "V\u00E6lg post"),
                    locations.map(location => elements.createElement("option", { value: location.id.toString() }, location.name)))),
        skipTo ? null :
            elements.createElement("td", null,
                elements.createElement("select", { required: 'true', name: "toLocationId" },
                    elements.createElement("option", { value: "", disabled: 'true', selected: 'true' }, "V\u00E6lg post"),
                    locations.map(location => elements.createElement("option", { value: location.id.toString() }, location.name)))),
        elements.createElement("td", null,
            elements.createElement("select", { required: 'true', name: "isOpen" },
                elements.createElement("option", { value: "true" }, "\u00C5ben"),
                elements.createElement("option", { value: "false" }, "Lukket"))),
        elements.createElement("td", null,
            elements.createElement("button", { type: "button", "hx-post": `${"/master/addRoute"}`, "hx-include": "closest tr", "hx-vals": JSON.stringify(locationIdObj), "hx-on--after-request": "htmx.trigger(this.nextElementSibling, 'fetchRouteTable')", "hx-swap": "none" }, "Tilf\u00F8j rute"),
            elements.createElement("span", { "hx-trigger": "fetchRouteTable", "hx-target": "closest table", "hx-swap": "outerHTML", "hx-vals": JSON.stringify({
                    locationId: locationId,
                    showFrom: !skipFrom,
                    showTo: !skipTo
                }), "hx-post": `${"/master/getRoutesTable"}` })));
};
exports.addRow = addRow;
const table = (locationService, routes, locationId, skipFrom, skipTo) => {
    return elements.createElement("table", null,
        elements.createElement("thead", null,
            skipFrom ? null : elements.createElement("th", null, "Fra"),
            skipTo ? null : elements.createElement("th", null, "Til"),
            elements.createElement("th", null, "Status"),
            elements.createElement("th", null, "Handling")),
        elements.createElement("tbody", null,
            routes.length === 0 ?
                elements.createElement("tr", null,
                    elements.createElement("td", { colspan: skipFrom || skipTo ? 3 : 4 }, "Ingen ruter"))
                : null,
            routes.map(route => (0, exports.row)(locationService, route, skipFrom, skipTo)),
            (0, exports.addRow)(locationService, locationId, skipFrom, skipTo)));
};
exports.table = table;
//# sourceMappingURL=RouteTable.js.map