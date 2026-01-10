import * as elements from "typed-html"
import type { Patrol, PatrolUpdate } from "@shared/types"
import { PatrolService, LocationService, UpdateService } from "../databaseBarrel"
import { clock, formatPatrol, formatUpdateLocation } from "./HTMLGeneral";
import { Endpoints } from "@shared/endpoints";

type Request = import('../request').Request;
import * as responses from '../response';
// =================================== Endpoint handler for Patrol Updates Table =======================================
export const getPatrolUpdatesTable = async (request: Request, updateService: UpdateService, locationService: LocationService, patrolService: PatrolService): Promise<responses.Response> => {
    const updates: PatrolUpdate[] = updateService.lastUpdates(20);
    const html = PatrolUpdateTable(updates, locationService, patrolService);
    return responses.ok(html);
}

// =================================== HTML Generation Functions =======================================
enum ids {
    table = "patrol-updates-table",
    tableBody = "patrol-updates-table-body"
}


const html_patrolUpdateRow = (update: PatrolUpdate, locationService: LocationService, patrolService: PatrolService): string => {
    if (!update) {
        return <tr class="hover-grey">
            <td colspan={3}>Ukendt Patruljeopdatering</td>
        </tr>;
    }

    return <tr class="hover-grey">
        <td>{formatPatrol(update.patrolId, patrolService)}</td>
        <td>{formatUpdateLocation(locationService, update)}</td>
        <td>{clock(update.time)}</td>
    </tr>;
}

const PatrolUpdateTable = (updates: PatrolUpdate[], locationService: LocationService, patrolService: PatrolService): string => {
    return <table id={ids.table}
        hx-post={Endpoints.GetPatrolUpdatesTable}
        hx-trigger="every 5s"
        hx-swap="outerHTML">

        <thead>
            <th>Patrulje</th>
            <th>Lokation</th>
            <th>Tidspunkt</th>
        </thead>
        {updates.map(update => html_patrolUpdateRow(update, locationService, patrolService))}
    </table>;
}