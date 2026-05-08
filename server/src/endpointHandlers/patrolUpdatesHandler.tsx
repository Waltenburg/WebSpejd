import * as elements from "typed-html"
import type { PatrolUpdate } from "@webspejd/core/types.js"
import { PatrolService, LocationService, UpdateService } from "../databaseBarrel.js"
import { formatPatrol, formatUpdateLocation } from "./HTMLGeneral.js";
import { Endpoints } from "@webspejd/core/endpoints.js";
import { Request } from "../request.js";
import { Response } from '../response.js';
import * as zod from "zod";
import * as validation from "@webspejd/core/validation.js";

const PatrolUpdatesTableParams = zod.object({
    locationId: validation.AnyNumber,
    patrolId: validation.AnyNumber,
});

// =================================== Endpoint handler for Patrol Updates Table =======================================
export const getPatrolUpdatesTable = async (request: Request, updateService: UpdateService, locationService: LocationService, patrolService: PatrolService): Promise<Response> => {
    const { locationId, patrolId } = validation.parseUrlParams(PatrolUpdatesTableParams, request.url);
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
    return Response.ok().setContent(html);
}

// =================================== HTML Generation Functions =======================================
enum ids {
    table = "patrol-updates-table",
    tableBody = "patrol-updates-table-body"
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
