import * as elements from 'typed-html';
import { LocationService } from '../databaseBarrel';
import { Endpoints } from '@shared/endpoints';
import { formatLocationAnchor } from './HTMLGeneral';
import * as responses from '../response';
import { parseForm, Request } from '../request';

type Response = responses.Response;


// ========================== Endpoint Handler for Location Status ==========================
export const getLocationStatusTable = async (request: Request, locationService: LocationService): Promise<Response> => {
    const locationId = Number.parseInt(request.url.searchParams.get("locationId") ?? "");

    let locationIds: number[];
    if (!Number.isNaN(locationId)) {
        locationIds = [locationId];
    } else
        locationIds = locationService.allLocationIds();
    

    const searchParamStr = request.url.searchParams.toString();
    const tableHTML = html_locationStatusTable(locationService, locationIds, searchParamStr);
    return responses.ok(tableHTML);
};

// Helper function to get location with patrol counts
const locationWithPatrolCounts = (locationService: LocationService, locationId: number) => {
    const location = locationService.locationInfo(locationId);
    if (!location) return null;
    return {
        ...location,
        patrolsOnTheirWay: locationService.patrolsTowardsLocation(locationId).length,
        patrolsOnPost: locationService.patrolsOnLocation(locationId).length,
        patrolsCheckedOut: locationService.patrolsCheckedOutFromLocation(locationId).length
    };
};

// ========================== HTML Generation Functions ==========================
const enum ids {
    table = "location-status-table",
    tableBody = "location-status-table-body",
}
const enum classes {
    renaming = "renaming"
}
const enum hxTriggers {
    fetchLocationsRow = "fetchLocationStatusRow",
    fetchLocationTable = "fetchLocationStatusTable"
}

// Internal function for a single location row
const html_locationRow = (locationService: LocationService, locationId: number): string => {
    const location = locationWithPatrolCounts(locationService, locationId);
    if (!location) {
        return <tr class="hover-grey">
            <td colspan={4}
            >Ukendt lokation</td>
        </tr>;
    }

    return <tr class="hover-grey">
        <td>
            {formatLocationAnchor(location)}
        </td>
        <td>{location.patrolsOnTheirWay}</td>
        <td>{location.patrolsOnPost}</td>
        <td>{location.patrolsCheckedOut}</td>
    </tr>;
};

// Internal function for the locations table
export const html_locationStatusTable = (locationService: LocationService, locationIds: number[], searchParamStr: string): string => {
    return <table
        id={ids.table}
        hx-post={Endpoints.GetLocationStatusTable + "?" + searchParamStr}
        hx-trigger="every 10s"
        hx-swap="outerHTML"
        hx-target="this">
        <thead>
            <th>Post</th>
            <th>På vej</th>
            <th>På post</th>
            <th>Forladt post</th>
        </thead>
        <tbody id={ids.tableBody}>
            {locationIds.map(locationId => html_locationRow(locationService, locationId))}
        </tbody>
    </table>;
};
