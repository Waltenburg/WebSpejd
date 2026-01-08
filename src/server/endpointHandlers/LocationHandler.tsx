import * as elements from 'typed-html';
import { LocationService } from '../databaseBarrel';
import { Endpoints } from '@shared/endpoints';
import { formatLocationAnchor } from './HTMLGeneral';
import * as responses from '../response';
import { parseForm } from '../request';
import { Request } from '../request';

type Response = responses.Response;

// ========================== Endpoint Handlers for Locations CRUD operations  ==========================

export const addLocation = async (request: Request, locationService: LocationService): Promise<Response> => {
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
}

export const changeLocationStatus = async(request: Request, locationService: LocationService): Promise<Response> => {
        const form = parseForm(request.body);
        const locationId = Number.parseInt(form["locationId"])
        const openText = form["open"];
        const open = openText === "on" || openText === "true";

        if(Number.isNaN(locationId) || openText == null)
            return responses.response_code(400);

        const succes = locationService.changeLocationStatus(locationId, open);
        if(!succes)
            return responses.response_code(400);
        return responses.ok();
}

export const deleteLocation = async (request: Request, locationService: LocationService): Promise<Response> => {
    const form = parseForm(request.body);
    const locationId = Number.parseInt(form["locationId"]);
    if (Number.isNaN(locationId))
        return responses.response_code(400);

    const succes = locationService.deleteLocation(locationId);
    if (!succes)
        return responses.response_code(400);

    return responses.ok();
}

export const getLocationTableRow = async (request: Request, locationService: LocationService): Promise<Response> => {
    const form = parseForm(request.body);
    const locationId = Number.parseInt(form["locationId"]);

    if (Number.isNaN(locationId))
        return responses.response_code(400);

    const tableHTML = row(locationService, locationId);
    return responses.ok(tableHTML);
}

export const getLocationTable = async (request: Request, locationService: LocationService): Promise<Response> => {
    const locations = locationService.allLocationIds();
    const tableHTML = table(locationService, locations);
    return responses.ok(tableHTML);
}

export const getLocationTableBody = async (request: Request, locationService: LocationService): Promise<Response> => {
    const locations = locationService.allLocationIds();
    const tableHTML = tableBody(locationService, locations);
    return responses.ok(tableHTML);
}



// ========================== HTML Generation Functions ==========================

export const row = (locationService: LocationService, locationId: number): string => {
    const location = locationService.locationInfo(locationId);
    if (!location)
        return <tr><td colspan={4}>Lokation ikke fundet</td></tr>;

    // Prepare hx-vals for toggling location status
    const hxVals = JSON.stringify({
        locationId: location.id,
        open: !location.open
    });

    return <tr id={`location-row-${location.id}`}>
        <td>{formatLocationAnchor(location)}</td>
        <td>{location.team}</td>
        <td>{location.open ? "Åben" : "Lukket"}</td>
        <td>
            <button
                hx-post={`${Endpoints.ChangeLocationStatus}`}
                hx-on--after-request="htmx.trigger(this.nextElementSibling, 'fetchLocationsRow')"
                hx-swap="none"
                hx-vals={hxVals}>
                {location.open ? "Luk" : "Åbn"}
            </button>
            <span
                hx-trigger="fetchLocationsRow"
                hx-target="closest tr"
                hx-swap="outerHTML"
                hx-vals={hxVals}
                hx-post={`${Endpoints.GetLocationTableRow}`}>
            </span>

            <button hx-post={`${Endpoints.DeleteLocation}`} hx-target="closest tr" hx-swap="outerHTML" hx-vals={JSON.stringify({ locationId: location.id })}>
                Slet lokation
            </button>

            <button hx-get={`${Endpoints.RenameLocation}`} hx-target="closest tr" hx-swap="outerHTML" hx-vals={JSON.stringify({ locationId: location.id })}>
                Omdøb
            </button>
        </td>
    </tr>;
}

export const addRow = (): string => {
    return <tr id="add-location-row">
        <td><input required='true' type="text" name="name" placeholder="Navn" /></td>
        <td><input required='true' type="text" name="team" placeholder="Team" /></td>
        <td>
            <select required='true' name="open">
                <option value="true">Åben</option>
                <option value="false">Lukket</option>
            </select>
        </td>
        <td>
            <button type="button"
                hx-post={`${Endpoints.AddLocation}`}
                hx-include="closest tr"
                hx-on--after-request="htmx.trigger(this.nextElementSibling, 'fetchLocationTable')"
                hx-swap="none"
            >
                Tilføj lokation
            </button>
            <span
                hx-trigger="fetchLocationTable"
                hx-target="closest table"
                hx-swap="outerHTML"
                hx-post={`${Endpoints.GetLocationTable}`}>
            </span>
        </td>
    </tr>;
}

export const renameLocationRow = (locationService: LocationService, locationId: number): string => {
    const location = locationService.locationInfo(locationId);
    if (!location)
        return <tr><td colspan={4}>Lokation ikke fundet</td></tr>;

    return <tr id={`rename-location-row-${locationId}`}>
        <td><input required='true' type="text" name="name" placeholder={location.name} /></td>
        <td><input required='true' type="text" name="team" placeholder={location.team} /></td>
        <td> N/A </td>
        <td>
            <button type="button"
                hx-post={`${Endpoints.RenameLocation}`}
                hx-include="closest tr"
                hx-on--after-request="htmx.trigger(this.nextElementSibling, 'fetchLocationsRow')"
                hx-vals={JSON.stringify({ locationId: location.id })}
                hx-swap="none"
            >
                Omdøb lokation
            </button>
            <span
                hx-trigger="fetchLocationsRow"
                hx-target="closest tr"
                hx-swap="outerHTML"
                hx-vals={JSON.stringify({ locationId: location.id })}
                hx-post={`${Endpoints.GetLocationTableRow}`}>
            </span>

            <button type='button' hx-get={`${Endpoints.GetLocationTableRow}`} hx-vals={JSON.stringify({ locationId: location.id })} hx-target="closest tr" hx-swap="outerHTML">
                Annuller
            </button>
        </td>
    </tr>;
}

export const tableBody = (locationService: LocationService, locationIds: number[]): string => {
    return <tbody hx-ext="idiomorph" hx-get={`${Endpoints.GetLocationTableBody}`} hx-target="this" hx-swap="outerHTML" hx-trigger="every 10s">
        {locationIds.length === 0 ?
            <tr><td colspan={4}>Ingen lokationer</td></tr>
            : null}
        {locationIds.map(locationId => row(locationService, locationId))}
    </tbody>
}

export const table = (locationService: LocationService, locationIds: number[]): string => {
    return <table id="location-table">
        <thead>
            <th>Navn</th>
            <th>Team</th>
            <th>Status</th>
            <th>Handling</th>
        </thead>
        {tableBody(locationService, locationIds)}
        <tfoot>
            {addRow()}
        </tfoot>
    </table>
}