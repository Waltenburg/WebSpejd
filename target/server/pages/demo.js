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
exports.HTMLLocationTableGenerator = void 0;
const elements = __importStar(require("typed-html"));
class HTMLLocationTableGenerator {
    constructor(locationService) {
        this.renderRouteRow = (route, skipFrom, skipTo) => {
            const hxVals = JSON.stringify({
                routeId: route.id,
                showFrom: !skipFrom,
                showTo: !skipTo,
                open: !route.is_open
            });
            return elements.createElement("tr", null,
                skipFrom ? null :
                    elements.createElement("td", null,
                        elements.createElement("a", { href: `${"/master/location"}?locationId=${route.fromLocationId}` }, this.locationService.locationInfo(route.fromLocationId)?.name)),
                skipTo ? null :
                    elements.createElement("td", null,
                        elements.createElement("a", { href: `${"/master/location"}?locationId=${route.toLocationId}` }, this.locationService.locationInfo(route.toLocationId)?.name)),
                elements.createElement("td", null, route.is_open ? "Åben" : "Lukket"),
                elements.createElement("td", null,
                    elements.createElement("button", { "hx-post": `${"/master/changeRouteStatus"}`, "hx-on--after-request": "htmx.trigger(this.nextElementSibling, 'fetchRouteRow')", "hx-swap": "none", "hx-vals": hxVals }, route.is_open ? "Luk" : "Åbn"),
                    elements.createElement("span", { "hx-trigger": "fetchRouteRow", "hx-target": "closest tr", "hx-swap": "outerHTML", "hx-vals": hxVals, "hx-post": `${"/master/getRouteTableRow"}` }),
                    elements.createElement("button", { "hx-post": `${"/master/deleteRoute"}`, "hx-target": "closest tr", "hx-swap": "outerHTML", "hx-vals": JSON.stringify({ routeId: route.id }) }, "Slet rute")));
        };
        this.renderAddRouteRow = (locationId, skipFrom, skipTo) => {
            let locationsTemp = this.locationService.allLocationIds().map(id => this.locationService.locationInfo(id));
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
        this.renderRoutesTable = (routes, locationId, skipFrom, skipTo) => {
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
                    routes.map(route => this.renderRouteRow(route, skipFrom, skipTo)),
                    this.renderAddRouteRow(locationId, skipFrom, skipTo)));
        };
        this.renderLocationRow = (locationId) => {
            const location = this.locationService.locationInfo(locationId);
            if (!location)
                return elements.createElement("tr", null,
                    elements.createElement("td", { colspan: 4 }, "Lokation ikke fundet"));
            const hxVals = JSON.stringify({
                locationId: location.id,
                open: !location.open
            });
            return elements.createElement("tr", { id: `location-row-${location.id}` },
                elements.createElement("td", null, location.name),
                elements.createElement("td", null, location.team),
                elements.createElement("td", null, location.open ? "Åben" : "Lukket"),
                elements.createElement("td", null,
                    elements.createElement("button", { "hx-post": `${"/master/changeLocationStatus"}`, "hx-on--after-request": "htmx.trigger(this.nextElementSibling, 'fetchLocationsRow')", "hx-swap": "none", "hx-vals": hxVals }, location.open ? "Luk" : "Åbn"),
                    elements.createElement("span", { "hx-trigger": "fetchLocationsRow", "hx-target": "closest tr", "hx-swap": "outerHTML", "hx-vals": hxVals, "hx-post": `${"/master/getLocationTableRow"}` }),
                    elements.createElement("button", { "hx-post": `${"/master/deleteLocation"}`, "hx-target": "closest tr", "hx-swap": "outerHTML", "hx-vals": JSON.stringify({ locationId: location.id }) }, "Slet lokation")));
        };
        this.renderAddLocationRow = () => {
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
        this.renderLocationTable = (locationIds) => {
            return elements.createElement("table", { id: "location-table" },
                elements.createElement("thead", null,
                    elements.createElement("th", null, "Navn"),
                    elements.createElement("th", null, "Team"),
                    elements.createElement("th", null, "Status"),
                    elements.createElement("th", null, "Handling")),
                this.renderLocationTableBody(locationIds),
                elements.createElement("tfoot", null, this.renderAddLocationRow()));
        };
        this.locationService = locationService;
    }
    renderLocationTableBody(locationIds) {
        return elements.createElement("tbody", { "hx-ext": "idiomorph", "hx-get": `${"/master/getLocationsTableBody"}`, "hx-target": "this", "hx-swap": "outerHTML", "hx-trigger": "every 10s" },
            locationIds.length === 0 ?
                elements.createElement("tr", null,
                    elements.createElement("td", { colspan: 4 }, "Ingen lokationer"))
                : null,
            locationIds.map(locationId => this.renderLocationRow(locationId)));
    }
}
exports.HTMLLocationTableGenerator = HTMLLocationTableGenerator;
//# sourceMappingURL=demo.js.map