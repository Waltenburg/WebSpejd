import * as elements from 'typed-html';
import { Route } from '@shared/types';
import { LocationService } from '../databaseBarrel';
import { Endpoints } from '@shared/endpoints';

export class HTMLRouteTableGenerator {
    private locationService: LocationService;
    constructor(locationService: LocationService) {
        this.locationService = locationService;
    }
    public row = (route: Route, skipFrom?: boolean, skipTo?: boolean): string => {
        const hxVals = JSON.stringify({
            routeId: route.id,
            showFrom: !skipFrom,
            showTo: !skipTo,
            open: !route.is_open
        });

        return <tr>
            {skipFrom ? null :
                <td><a href={`${Endpoints.MasterLocation}?locationId=${route.fromLocationId}`}>
                    {this.locationService.locationInfo(route.fromLocationId)?.name}
                </a></td>}

            {skipTo ? null :
                <td><a href={`${Endpoints.MasterLocation}?locationId=${route.toLocationId}`}>
                    {this.locationService.locationInfo(route.toLocationId)?.name}
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

    private addRow = (locationId?: number, skipFrom?: boolean, skipTo?: boolean): string => {
        let locationsTemp = this.locationService.allLocationIds().map(id => this.locationService.locationInfo(id)!);
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
    public table = (routes: Route[], locationId?: number, skipFrom?: boolean, skipTo?: boolean): string => {
        return <table>
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
                {routes.map(route => this.row(route, skipFrom, skipTo))}
                {this.addRow(locationId, skipFrom, skipTo)}
            </tbody>
        </table>
    }
}