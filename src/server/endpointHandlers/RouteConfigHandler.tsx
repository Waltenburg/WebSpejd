import * as elements from 'typed-html';
import { LocationService } from '../databaseBarrel';
import type { Route } from '@shared/types';
import { Endpoints } from '@shared/endpoints';
import { formatLocationAnchor } from './HTMLGeneral';
import * as responses from '../response';
import { parseForm } from '../request';
import { Request } from '../request';

type Response = responses.Response;

// ========================== Endpoint Handlers for Routes CRUD operations  ==========================

export const addRoute = async (request: Request, locationService: LocationService): Promise<Response> => {
    const form = parseForm(request.body);
    const fromId = Number.parseInt(form["fromLocationId"]);
    const toId = Number.parseInt(form["toLocationId"]);
    const open = form["open"] === "on" || form["open"] === "true";

    if (Number.isNaN(fromId) || Number.isNaN(toId)) {
        return responses.response_code(400);
    }

    if (locationService.addRoute(fromId, toId, open))
        return responses.ok();
    return responses.response_code(400);
}

export const changeRouteStatus = async (request: Request, locationService: LocationService): Promise<Response> => {
    const form = parseForm(request.body);
    const routeId = Number.parseInt(form["routeId"] ?? request.url.searchParams.get("id"));
    const open = (form["open"] ?? request.url.searchParams.get("open")) === "true";
    const showFrom = form["showFrom"] === "true" || request.url.searchParams.get("showFrom") === "true";
    const showTo = form["showTo"] === "true" || request.url.searchParams.get("showTo") === "true";

    if (!Number.isNaN(routeId)) {
        const result = locationService.changeRouteStatus(routeId, open);
        if (result)
            return responses.ok();
    }
    return responses.response_code(400);
}

export const deleteRoute = async (request: Request, locationService: LocationService): Promise<Response> => {
    const form = parseForm(request.body);
    const routeId = Number.parseInt(form["routeId"] ?? request.url.searchParams.get("id"));

    if (!Number.isNaN(routeId)) {
        locationService.deleteRoute(routeId);
        return responses.ok();
    }
    return responses.response_code(400);
}

// ========================== Getting HTML for Routes ==========================

export const getRouteConfigTableRow = async (request: Request, locationService: LocationService): Promise<Response> => {
    const form = parseForm(request.body);
    const routeId = Number.parseInt(form["routeId"] ?? request.url.searchParams.get("id"));
    const showFrom = form["showFrom"] === "true" || request.url.searchParams.get("showFrom") === "true";
    const showTo = form["showTo"] === "true" || request.url.searchParams.get("showTo") === "true";
    if (!Number.isNaN(routeId)) {
        const route = locationService.routeInfo(routeId);
        if (route)
            return responses.ok(row(locationService, route, !showFrom, !showTo));
    }
    return responses.response_code(400);
}

export const getRouteConfigTable = async (request: Request, locationService: LocationService): Promise<Response> => {
    const form = parseForm(request.body);
    
    let showFrom = form["showFrom"] === "true" || request.url.searchParams.get("showFrom") === "true";
    let showTo = form["showTo"] === "true" || request.url.searchParams.get("showTo") === "true";

    if(!showFrom && !showTo){
        showFrom = true;
        showTo = true;
    }

    const locationId = Number.parseInt(form["locationId"]);

    let routes: Route[] = [];

    if (!Number.isNaN(locationId)) {
        if (showFrom)
            routes = routes.concat(locationService.allRoutesToLocation(locationId));
        if (showTo)
            routes = routes.concat(locationService.allRoutesFromLocation(locationId));
    } else
        routes = locationService.allRoutes();

    // const routes = locationService.allRoutes();
    const tableHTML = table(locationService, routes, locationId, !showFrom, !showTo);
    return responses.ok(tableHTML);
}

// ========================== HTML Generators for Routes ==========================
const row = (locationService: LocationService, route: Route, skipFrom?: boolean, skipTo?: boolean): string => {
    const hxVals = JSON.stringify({
        routeId: route.id,
        showFrom: !skipFrom,
        showTo: !skipTo,
        open: !route.is_open
    });

    return <tr>
        {skipFrom ? null :
            <td><a href={`${Endpoints.MasterLocationPage}?locationId=${route.fromLocationId}`}>
                {locationService.locationInfo(route.fromLocationId)?.name}
            </a></td>}

        {skipTo ? null :
            <td><a href={`${Endpoints.MasterLocationPage}?locationId=${route.toLocationId}`}>
                {locationService.locationInfo(route.toLocationId)?.name}
            </a></td>}
        <td>{route.is_open ? "Åben" : "Lukket"}</td>
        <td>
            <button
                hx-post={`${Endpoints.ChangeRouteStatus}`}
                hx-on--after-request="htmx.trigger(this.nextElementSibling, 'fetchRouteRow')"
                hx-swap="none"
                hx-vals={hxVals}>
                {route.is_open ? "Luk" : "Åbn"}
            </button>
            <span
                hx-trigger="fetchRouteRow"
                hx-target="closest tr"
                hx-swap="outerHTML"
                hx-vals={hxVals}
                hx-post={`${Endpoints.GetRouteTableRow}`}>
            </span>

            <button hx-post={`${Endpoints.DeleteRoute}`} hx-target="closest tr" hx-swap="outerHTML" hx-vals={JSON.stringify({ routeId: route.id })}>
                Slet rute
            </button>
        </td>
    </tr>
}

const addRow = (locationService: LocationService, locationId?: number, skipFrom?: boolean, skipTo?: boolean): string => {
    let locationsTemp = locationService.allLocationIds().map(id => locationService.locationInfo(id)!);
    if (locationId)
        locationsTemp = locationsTemp.filter(locationsTemp => locationsTemp.id !== locationId);
    const locations = locationsTemp;

    let locationIdObj: { fromLocationId?: string, toLocationId?: string } = {};

    if (skipFrom && skipTo)
        return "Can't skip both from and to";
    if ((skipFrom || skipTo) && locationId == null)
        return "LocationId must be provided when skipping from or to";

    if (skipFrom)
        locationIdObj.fromLocationId = locationId!.toString();
    if (skipTo)
        locationIdObj.toLocationId = locationId!.toString();


    return <tr>
        {skipFrom ? null :
            <td>
                <select required='true' name="fromLocationId">
                    <option value="" disabled='true' selected='true'>Vælg post</option>
                    {locations.map(location =>
                        <option value={location.id.toString()}>{location.name}</option>
                    )}
                </select>
            </td>}

        {skipTo ? null :
            <td>
                <select required='true' name="toLocationId">
                    <option value="" disabled='true' selected='true'>Vælg post</option>
                    {locations.map(location =>
                        <option value={location.id.toString()}>{location.name}</option>
                    )}
                </select>
            </td>}
        <td>
            <select required='true' name="isOpen">
                <option value="true">Åben</option>
                <option value="false">Lukket</option>
            </select>
        </td>
        <td>
            <button type="button"
                hx-post={`${Endpoints.AddRoute}`}
                hx-include="closest tr"
                hx-vals={JSON.stringify(locationIdObj)}
                hx-on--after-request="htmx.trigger(this.nextElementSibling, 'fetchRouteTable')"
                // hx-target="closest table"
                // hx-swap="outerHTML"
                hx-swap="none"
            >

                Tilføj rute
            </button>
            <span
                hx-trigger="fetchRouteTable"
                hx-target="closest table"
                hx-swap="outerHTML"
                hx-vals={JSON.stringify({
                    locationId: locationId,
                    showFrom: !skipFrom,
                    showTo: !skipTo
                })}
                hx-post={`${Endpoints.GetRoutesTable}`}>
            </span>
        </td>
    </tr>;

}

export const table = (locationService: LocationService, routes: Route[], locationId?: number, skipFrom?: boolean, skipTo?: boolean): string => {
    return <table
        hx-post={Endpoints.GetRoutesTable}
        hx-trigger="every 30s"
        hx-swap="outerHTML">
        <thead>
            {skipFrom ? null : <th>Fra</th>}
            {skipTo ? null : <th>Til</th>}
            <th>Status</th>
            <th>Handling</th>
        </thead>
        <tbody>
            {routes.length === 0 ?
                <tr><td colspan={skipFrom || skipTo ? 3 : 4}>Ingen ruter</td></tr>
                : null}
            {routes.map(route => row(locationService, route, skipFrom, skipTo))}
            {addRow(locationService, locationId, skipFrom, skipTo)}
        </tbody>
    </table>
}