import * as elements from 'typed-html';
import { LocationService } from '../databaseBarrel';
import { Endpoints } from '@shared/endpoints';
import { formatLocationAnchor, getElementById, addClassToElement, removeClassFromElement, isClassOnElement, hxTrigger } from './HTMLGeneral';
import * as responses from '../response';
import { parseForm } from '../request';
import { Request } from '../request';
import { table } from 'console';

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

export const renameLocation = async (request: Request, locationService: LocationService): Promise<Response> => {
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

export const makeLocationFirstLocation = async (request: Request, locationService: LocationService): Promise<Response> => {
    const form = parseForm(request.body);
    const locationId = Number.parseInt(form["locationId"]);
    if (Number.isNaN(locationId))
        return responses.response_code(400);
    locationService.setFirstLocationId(locationId);
    return responses.ok();
}
// ========================== Getting HTML for Locations ==========================

export const getLocationConfigTableRow = async (request: Request, locationService: LocationService): Promise<Response> => {
    const form = parseForm(request.body);
    const locationId = Number.parseInt(form["locationId"]);

    if (Number.isNaN(locationId))
        return responses.response_code(400);

    const tableHTML = html_row(locationService, locationId);
    return responses.ok(tableHTML);
}

export const getLocationConfigTable = async (request: Request, locationService: LocationService): Promise<Response> => {
    const locations = locationService.allLocationIds();
    const tableHTML = html_table(locationService, locations);
    return responses.ok(tableHTML);
}

export const getLocationConfigTableBody = async (request: Request, locationService: LocationService): Promise<Response> => {
    const locations = locationService.allLocationIds();
    const tableHTML = html_tableBody(locationService, locations);
    return responses.ok(tableHTML);
}

export const getRenameLocationRow = async (request: Request, locationService: LocationService): Promise<Response> => {
    const form = parseForm(request.body);
    const locationId = Number.parseInt(form["locationId"]);
    if (Number.isNaN(locationId)) {
        return responses.response_code(400);
    }
    const tableHTML = html_renameLocationRow(locationService, locationId);
    return responses.ok(tableHTML);
}


// ========================== HTML Generation Functions ==========================
const enum ids {
    configTable = "location-config-table",
    configTableBody = "location-config-table-body",
}
const enum classes {
    renaming = "renaming"
}
const enum hxTriggers {
    fetchLocationsRow = "fetchLocationsRow",
    fetchLocationTable = "fetchLocationTable"
}

const html_row = (locationService: LocationService, locationId: number): string => {
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
                hx-on--after-request={`htmx.trigger(this.nextElementSibling, '${hxTriggers.fetchLocationsRow}')`}
                hx-swap="none"
                hx-vals={hxVals}>
                {location.open ? "Luk" : "Åbn"}
            </button>
            <button
                type="button"
                class="location-passwords-button"
                data-location-id={location.id}
                data-location-name={location.name}
                data-location-team={location.team}>
                Kodeord
            </button>
            <span
                hx-trigger={hxTriggers.fetchLocationsRow}
                hx-target="closest tr"
                hx-swap="outerHTML"
                hx-vals={hxVals}
                hx-post={`${Endpoints.GetLocationConfigTableRow}`}>
            </span>

            <button hx-post={`${Endpoints.DeleteLocation}`} hx-target="closest tr"
                hx-swap="outerHTML" hx-vals={JSON.stringify({ locationId: location.id })}
                hx-confirm={`Er du sikker på, at du vil slette lokationen "${location.name}"? Dette kan ikke fortrydes.\nHvis der er ruter til/fra denne lokation, eller patruljer der er checket imod/ind/ud fra denne lokation, kan lokationen ikke slettes.`}>
                Slet lokation
            </button>

            <button hx-post={`${Endpoints.GetRenameLocationRow}`} hx-target="closest tr"
                hx-swap="outerHTML" hx-vals={JSON.stringify({ locationId: location.id })}
                hx-on--before-request={addClassToElement(getElementById(ids.configTable), classes.renaming)}>
                {/* hx-on--before-request="console.log('Got clicked!');"> */}
                Omdøb
            </button>
        </td>
    </tr>;
}

const html_addRow = (): string => {
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
                hx-on--after-request={`htmx.trigger(this.nextElementSibling, '${hxTriggers.fetchLocationTable}')`}
                hx-swap="none"
            >
                Tilføj lokation
            </button>
            <span
                hx-trigger={hxTriggers.fetchLocationTable}
                hx-target="closest table"
                hx-swap="outerHTML"
                hx-post={`${Endpoints.GetLocationConfigTable}`}>
            </span>
        </td>
    </tr>;
}

const html_renameLocationRow = (locationService: LocationService, locationId: number): string => {
    const location = locationService.locationInfo(locationId);
    if (!location)
        return <tr><td colspan={4}>Lokation ikke fundet</td></tr>;

    const removeRenamingClassScript = removeClassFromElement(getElementById(ids.configTable), classes.renaming);

    return <tr id={`rename-location-row-${locationId}`}>
        <td><input required='true' type="text" name="name" value={location.name} /></td>
        <td><input required='true' type="text" name="team" value={location.team} /></td>
        <td> N/A </td>
        <td>
            <button type="button"
                hx-post={`${Endpoints.RenameLocation}`}
                hx-include="closest tr"
                hx-on--before-request={removeRenamingClassScript}
                hx-on--after-request={hxTrigger("this.nextElementSibling", hxTriggers.fetchLocationsRow)}
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
                hx-post={`${Endpoints.GetLocationConfigTableRow}`}>
            </span>

            <button type='button'
                hx-post={`${Endpoints.GetLocationConfigTableRow}`}
                hx-vals={JSON.stringify({ locationId: location.id })}
                hx-target="closest tr"
                hx-swap="outerHTML"
                hx-on--before-request={removeRenamingClassScript}
                >
                Annuller
            </button>
        </td>
    </tr>;
}

const html_tableBody = (locationService: LocationService, locationIds: number[]): string => {
    return <tbody
        id={ids.configTableBody}
        hx-ext="idiomorph"
        hx-get={`${Endpoints.GetLocationConfigTableBody}`}
        hx-target="this"
        hx-swap="outerHTML"
        hx-trigger="every 30s"   
        // hx-on--before-request="console.log(this.id, event.detail.elt.id)">
        hx-on--before-request={`if (event.detail.elt.id === this.id && ${isClassOnElement(getElementById(ids.configTable), classes.renaming)} || isErrorDialogOpen()) {console.log("cancelled request"); event.preventDefault(); }`}>
        {locationIds.length === 0 ?
            <tr><td colspan={4}>Ingen lokationer</td></tr>
            : null}
        {locationIds.map(locationId => html_row(locationService, locationId))}
    </tbody>
}

const html_table = (locationService: LocationService, locationIds: number[]): string => {
    return <table id={ids.configTable}>
        <thead>
            <th>Navn</th>
            <th>Team</th>
            <th>Status</th>
            <th>Handling</th>
        </thead>
        {html_tableBody(locationService, locationIds)}
        <tfoot>
            {html_addRow()}
        </tfoot>
    </table>
}