import * as elements from 'typed-html';
import { Response } from '../response.js';
import { parseForm } from '../request.js';
// ========================== Endpoint Handlers for Routes CRUD operations  ==========================
export const addRoute = async (request, locationService) => {
    if (request.body === undefined) {
        return Response.badRequest();
    }
    const form = parseForm(request.body);
    const fromId = Number.parseInt(form["fromLocationId"]);
    const toId = Number.parseInt(form["toLocationId"]);
    const open = form["isOpen"] === "on" || form["isOpen"] === "true";
    if (Number.isNaN(fromId) || Number.isNaN(toId) || fromId === toId) {
        return Response.badRequest();
    }
    const success = locationService.addRoute(fromId, toId, open);
    if (!success) {
        return Response.badRequest();
    }
    return Response.ok();
};
export const changeRouteStatus = async (request, locationService) => {
    if (request.body === undefined) {
        return Response.badRequest();
    }
    const form = parseForm(request.body);
    const routeId = Number.parseInt(form["routeId"] ?? request.url.searchParams.get("id"));
    const open = (form["open"] ?? request.url.searchParams.get("open")) === "true";
    if (Number.isNaN(routeId)) {
        return Response.badRequest();
    }
    const result = locationService.changeRouteStatus(routeId, open);
    if (!result) {
        return Response.badRequest();
    }
    return Response.ok();
};
export const deleteRoute = async (request, locationService) => {
    if (request.body === undefined) {
        return Response.badRequest();
    }
    const form = parseForm(request.body);
    const routeId = Number.parseInt(form["routeId"] ?? request.url.searchParams.get("id"));
    if (Number.isNaN(routeId)) {
        return Response.badRequest();
    }
    locationService.deleteRoute(routeId);
    return Response.ok();
};
// ========================== Getting HTML for Routes ==========================
export const getRouteConfigTableRow = async (request, locationService) => {
    if (request.body === undefined) {
        return Response.badRequest();
    }
    const form = parseForm(request.body);
    const routeId = Number.parseInt(form["routeId"] ?? request.url.searchParams.get("id"));
    const showFrom = form["showFrom"] === "true" || request.url.searchParams.get("showFrom") === "true";
    const showTo = form["showTo"] === "true" || request.url.searchParams.get("showTo") === "true";
    if (Number.isNaN(routeId)) {
        return Response.badRequest();
    }
    const route = locationService.routeInfo(routeId);
    if (!route) {
        return Response.badRequest();
    }
    return Response.ok(row(locationService, route, !showFrom, !showTo));
};
export const getRouteConfigTable = async (request, locationService) => {
    if (request.body === undefined) {
        return Response.badRequest();
    }
    const form = parseForm(request.body);
    let showFrom = form["showFrom"] === "true" || request.url.searchParams.get("showFrom") === "true";
    let showTo = form["showTo"] === "true" || request.url.searchParams.get("showTo") === "true";
    const selectedFrom = Number.parseInt(form["fromLocationId"]);
    const selectedTo = Number.parseInt(form["toLocationId"]);
    if (!showFrom && !showTo) {
        showFrom = true;
        showTo = true;
    }
    const locationId = Number.parseInt(form["locationId"] ?? request.url.searchParams.get("locationId"));
    let routes = [];
    if (!Number.isNaN(locationId)) {
        if (showFrom)
            routes = routes.concat(locationService.allRoutesToLocation(locationId));
        if (showTo)
            routes = routes.concat(locationService.allRoutesFromLocation(locationId));
    }
    else
        routes = locationService.allRoutes();
    // const routes = locationService.allRoutes();
    const tableHTML = table(locationService, routes, locationId, !showFrom, !showTo, selectedFrom, selectedTo);
    return Response.ok(tableHTML);
};
// ========================== HTML Generators for Routes ==========================
var ids;
(function (ids) {
    ids["addRouteRow"] = "addRouteRow";
})(ids || (ids = {}));
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
                elements.createElement("a", { href: `${"/master/location_page" /* Endpoints.MasterLocationPage */}?locationId=${route.fromLocationId}` }, locationService.locationInfo(route.fromLocationId)?.name)),
        skipTo ? null :
            elements.createElement("td", null,
                elements.createElement("a", { href: `${"/master/location_page" /* Endpoints.MasterLocationPage */}?locationId=${route.toLocationId}` }, locationService.locationInfo(route.toLocationId)?.name)),
        elements.createElement("td", null, route.is_open ? "Åben" : "Lukket"),
        elements.createElement("td", null,
            elements.createElement("button", { "hx-post": `${"/master/changeRouteStatus" /* Endpoints.ChangeRouteStatus */}`, "hx-on--after-request": "htmx.trigger(this.nextElementSibling, 'fetchRouteRow')", "hx-swap": "none", "hx-vals": hxVals }, route.is_open ? "Luk" : "Åbn"),
            elements.createElement("span", { "hx-trigger": "fetchRouteRow", "hx-target": "closest tr", "hx-swap": "outerHTML", "hx-vals": hxVals, "hx-post": `${"/master/getRouteTableRow" /* Endpoints.GetRouteTableRow */}` }),
            elements.createElement("button", { "hx-post": `${"/master/deleteRoute" /* Endpoints.DeleteRoute */}`, "hx-target": "closest tr", "hx-swap": "outerHTML", "hx-vals": JSON.stringify({ routeId: route.id }) }, "Slet rute")));
};
const addRow = (locationService, locationId, skipFrom, skipTo, selectedFrom, selectedTo) => {
    let locationsTemp = locationService.allLocationIds("TOPOLOGICAL" /* SortType.TOPOLOGICAL */).map(id => locationService.locationInfo(id));
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
    const fromLocationsOptions = locations.map(location => {
        if (selectedFrom && selectedFrom === location.id) {
            // @ts-expect-error
            return elements.createElement("option", { value: location.id.toString(), selected: true }, location.name);
        }
        return elements.createElement("option", { value: location.id.toString() }, location.name);
    });
    const toLocationsOptions = locations.map(location => {
        if (selectedTo && selectedTo === location.id) {
            // @ts-expect-error
            return elements.createElement("option", { value: location.id.toString(), selected: true }, location.name);
        }
        return elements.createElement("option", { value: location.id.toString() }, location.name);
    });
    return elements.createElement("tr", { id: ids.addRouteRow },
        skipFrom ? null :
            elements.createElement("td", null,
                elements.createElement("select", { required: 'true', name: "fromLocationId" },
                    elements.createElement("option", { value: "", disabled: 'true', selected: 'true' }, "V\u00E6lg post"),
                    fromLocationsOptions)),
        skipTo ? null :
            elements.createElement("td", null,
                elements.createElement("select", { required: 'true', name: "toLocationId" },
                    elements.createElement("option", { value: "", disabled: 'true', selected: 'true' }, "V\u00E6lg post"),
                    toLocationsOptions)),
        elements.createElement("td", null,
            elements.createElement("select", { required: 'true', name: "isOpen" },
                elements.createElement("option", { value: "true" }, "\u00C5ben"),
                elements.createElement("option", { value: "false" }, "Lukket"))),
        elements.createElement("td", null,
            elements.createElement("button", { type: "button", "hx-post": `${"/master/addRoute" /* Endpoints.AddRoute */}`, "hx-include": "closest tr", "hx-vals": JSON.stringify(locationIdObj), "hx-on--after-request": "htmx.trigger(this.nextElementSibling, 'fetchRouteTable')", "hx-swap": "none" }, "Tilf\u00F8j rute"),
            elements.createElement("span", { "hx-trigger": "fetchRouteTable", "hx-target": "closest table", "hx-swap": "outerHTML", "hx-vals": JSON.stringify({
                    locationId: locationId,
                    showFrom: !skipFrom,
                    showTo: !skipTo
                }), "hx-post": `${"/master/getRoutesTable" /* Endpoints.GetRoutesTable */}` })));
};
export const table = (locationService, routes, locationId, skipFrom, skipTo, selectedFrom, selectedTo) => {
    const hxVals = JSON.stringify({
        locationId: locationId,
        showFrom: !skipFrom,
        showTo: !skipTo
    });
    return elements.createElement("table", { "hx-post": "/master/getRoutesTable" /* Endpoints.GetRoutesTable */, "hx-trigger": "every 30s", "hx-vals": hxVals, "hx-include": `#${ids.addRouteRow}`, "hx-swap": "outerHTML" },
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
            routes.map(route => row(locationService, route, skipFrom, skipTo)),
            addRow(locationService, locationId, skipFrom, skipTo, selectedFrom, selectedTo)));
};
//# sourceMappingURL=RouteConfigHandler.js.map