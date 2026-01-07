import * as elements from 'typed-html';
import { Route } from '@shared/types';
import { Database, LocationService } from '../databaseBarrel';
import { Endpoints } from '@shared/endpoints';


export class HTMLLocationTableGenerator {
    private locationService: LocationService;

    constructor(locationService: LocationService) {
        this.locationService = locationService;
    }

    public row = (locationId: number): string => {
        const location = this.locationService.locationInfo(locationId);
        if (!location)
            return <tr><td colspan={4}>Lokation ikke fundet</td></tr>;

        // Prepare hx-vals for toggling location status
        const hxVals = JSON.stringify({
            locationId: location.id,
            open: !location.open});

        return <tr id={`location-row-${location.id}`}>
            <td>{location.name}</td>
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
            </td>
        </tr>;
    }

    public addRow = (): string => {
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

    public tableBody(locationIds: number[]): string {
        return <tbody hx-ext="idiomorph" hx-get={`${Endpoints.GetLocationTableBody}`} hx-target="this" hx-swap="outerHTML" hx-trigger="every 10s">
                {locationIds.length === 0 ?
                    <tr><td colspan={4}>Ingen lokationer</td></tr>
                    : null}
                {locationIds.map(locationId => this.row(locationId))}
            </tbody>
    }

    public table = (locationIds: number[]): string => {
        return <table id="location-table">
            <thead>
                <th>Navn</th>
                <th>Team</th>
                <th>Status</th>
                <th>Handling</th>
            </thead>
            {this.tableBody(locationIds)}
            <tfoot>
                {this.addRow()}
            </tfoot>
        </table>
    }
}