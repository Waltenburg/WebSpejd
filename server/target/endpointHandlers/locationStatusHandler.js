import * as elements from 'typed-html';
import { formatLocationAnchor } from './HTMLGeneral';
import * as responses from '../response';
// ========================== Endpoint Handler for Location Status ==========================
export const getLocationStatusTable = async (request, locationService) => {
    const locationId = Number.parseInt(request.url.searchParams.get("locationId") ?? "");
    let locationIds;
    if (!Number.isNaN(locationId)) {
        locationIds = [locationId];
    }
    else
        locationIds = locationService.allLocationIds("TOPOLOGICAL" /* SortType.TOPOLOGICAL */);
    const searchParamStr = request.url.searchParams.toString();
    const tableHTML = html_locationStatusTable(locationService, locationIds, searchParamStr);
    return responses.ok(tableHTML);
};
// Helper function to get location with patrol counts
const locationWithPatrolCounts = (locationService, locationId) => {
    const location = locationService.locationInfo(locationId);
    if (!location)
        return null;
    return {
        ...location,
        patrolsOnTheirWay: locationService.patrolsTowardsLocation(locationId).length,
        patrolsOnPost: locationService.patrolsOnLocation(locationId).length,
        patrolsCheckedOut: locationService.patrolsCheckedOutFromLocation(locationId).length
    };
};
// Internal function for a single location row
const html_locationRow = (locationService, locationId) => {
    const location = locationWithPatrolCounts(locationService, locationId);
    if (!location) {
        return elements.createElement("tr", { class: "hover-grey" },
            elements.createElement("td", { colspan: 4 }, "Ukendt lokation"));
    }
    return elements.createElement("tr", { class: "hover-grey" },
        elements.createElement("td", null, formatLocationAnchor(location)),
        elements.createElement("td", null, location.patrolsOnTheirWay),
        elements.createElement("td", null, location.patrolsOnPost),
        elements.createElement("td", null, location.patrolsCheckedOut));
};
// Internal function for the locations table
export const html_locationStatusTable = (locationService, locationIds, searchParamStr) => {
    return elements.createElement("div", { class: "table-wrapper", id: "location-status-table" /* ids.table */, "hx-post": "/master/getLocationStatusTable" /* Endpoints.GetLocationStatusTable */ + "?" + searchParamStr, "hx-trigger": "every 10s", "hx-swap": "outerHTML", "hx-target": "this" },
        elements.createElement("table", null,
            elements.createElement("thead", null,
                elements.createElement("th", null, "Post"),
                elements.createElement("th", null, "P\u00E5 vej"),
                elements.createElement("th", null, "P\u00E5 post"),
                elements.createElement("th", null, "Forladt post")),
            elements.createElement("tbody", { id: "location-status-table-body" /* ids.tableBody */ }, locationIds.map(locationId => html_locationRow(locationService, locationId)))));
};
//# sourceMappingURL=locationStatusHandler.js.map