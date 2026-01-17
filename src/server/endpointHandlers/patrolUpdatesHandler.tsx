import * as elements from "typed-html"
import type { Patrol, PatrolUpdate } from "@shared/types"
import { PatrolService, LocationService, UpdateService } from "../databaseBarrel"
import { addClassToElement, formatPatrol, formatUpdateLocation, getElementById, isClassOnElement } from "./HTMLGeneral";
import { Endpoints } from "@shared/endpoints";

type Request = import('../request').Request;
import * as responses from '../response';
// =================================== Endpoint handler for Patrol Updates Table =======================================
export const getPatrolUpdatesTable = async (request: Request, updateService: UpdateService, locationService: LocationService, patrolService: PatrolService): Promise<responses.Response> => {
    const locationId = Number.parseInt(request.url.searchParams.get("locationId"));
    const patrolId = Number.parseInt(request.url.searchParams.get("patrolId"));
    const searchParamStr = request.url.searchParams.toString();

    let skipLocation: boolean = false;
    let skipPatrol: boolean = false;
    let updates: PatrolUpdate[];

    if (!Number.isNaN(locationId)) {
        updates = updateService.updatesAtLocation(locationId);
    }
    else if (!Number.isNaN(patrolId)) {
        updates = updateService.updatesOfPatrol(patrolId);
        skipPatrol = true;
    }
    else
        updates = updateService.lastUpdates(20);

    const html = PatrolUpdateTable(updates, searchParamStr, skipLocation, skipPatrol, locationService, patrolService);
    return responses.ok(html);
}

// =================================== HTML Generation Functions =======================================
enum ids {
    table = "patrol-updates-table",
    tableBody = "patrol-updates-table-body"
}

enum classes {
    deletingRow = "deleting-patrol-update-row"
}


const html_patrolUpdateRow = (update: PatrolUpdate, skipLocation: boolean, skipPatrol: boolean, locationService: LocationService, patrolService: PatrolService): string => {
    if (!update) {
        return <tr class="hover-grey">
            <td colspan={4}>Ukendt Patruljeopdatering</td>
        </tr>;
    }

    const datetime = update ? update.time.toISOString() : "";
    const ISO_UTCString = update ? update.time.toTimeString() : "-";

    return <tr class="hover-grey">
        {skipPatrol ? null : <td>{formatPatrol(update.patrolId, patrolService)}</td>}
        {skipLocation ? null : <td>{formatUpdateLocation(locationService, update)}</td>}
        <td> <time class="ts" datetime={datetime}>{ISO_UTCString}</time></td>
        <td>
            <button class="button button-danger small-button"
                hx-post={Endpoints.DeletePatrolUpdate}
                hx-vals={`{"patrolUpdateId": ${update.id}}`}
                hx-confirm="Er du sikker på, at du vil slette denne patruljeopdatering?"
                hx-on--after-request="console.log('Patrol update deleted');"
                hx-target="closest tr"
                // hx-on--before-request={addClassToElement(getElementById(ids.table), classes.deletingRow)}
                hx-swap="delete">
                Slet
            </button>
        </td>
    </tr>;
}

const PatrolUpdateTable = (updates: PatrolUpdate[], searchParamStr: string, skipLocation: boolean, skipPatrol: boolean, locationService: LocationService, patrolService: PatrolService): string => {
    const cancelCondition = `if (event.detail.elt.id === this.id && isErrorDialogOpen()) {console.log("cancelled request"); event.preventDefault(); }`;
    
    return <div
        class="table-wrapper"
        id={ids.table}
        hx-post={Endpoints.GetPatrolUpdatesTable + "?" + searchParamStr}
        hx-trigger="every 10s"
        hx-swap="outerHTML"
        hx-on--before-request={cancelCondition}>
        <table>
            <thead>
                {skipPatrol ? null : <th>Patrulje</th>}
                {skipLocation ? null : <th>Lokation</th>}
                <th>Tidspunkt</th>
                <th>Handling</th>
            </thead>
            {updates.map(update => html_patrolUpdateRow(update, skipLocation, skipPatrol, locationService, patrolService))}
        </table>
    </div>;
}