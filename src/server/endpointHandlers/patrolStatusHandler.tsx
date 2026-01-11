import * as elements from 'typed-html';
import type { LocationService, PatrolService, UpdateService } from "../databaseBarrel";
import type { Patrol, PatrolUpdate } from "@shared/types";
import { Endpoints } from "@shared/endpoints";
import * as responses from '../response';
import { parseForm, Request } from '../request';

import { formatPatrol, formatUpdateLocation, clock, getElementById } from './HTMLGeneral';

// ========================== Endpoint Handler for Patrol Status ==========================
export const getPatrolStatusTable = async (request: Request, locationService: LocationService, patrolService: PatrolService, updateService: UpdateService): Promise<responses.Response> => {
    const form = parseForm(request.body);
    const includeInactivePatrols = form["includeInactivePatrols"] === "true" || form["includeInactivePatrols"] === "on";

    const patrolIds = patrolService.allPatrolIds();
    let patrols: (Patrol & { lastUpdate: PatrolUpdate | null })[] = patrolIds.map(id => {
        const patrol = patrolService.patrolInfo(id);
        const lastUpdate = updateService.latestUpdateOfPatrol(id);
        return { ...patrol, lastUpdate };
    });

    if (!includeInactivePatrols)
        patrols = patrols.filter(patrol => patrol.udgået === false);

    const html = html_patrolsStatusTable(patrols, includeInactivePatrols, locationService, patrolService);
    return responses.ok(html);
};


// =========================== HTML Generation Functions ==========================
enum ids {
    table = "patrol-status-table",
    tableBody = "patrol-status-table-body",
    tableContainer = "patrol-status-table-container",
    includeInactivePatrolsCheckbox = "include-inactive-patrols-checkbox"
}

enum triggers {
    fetchPatrolsTable = "fetchPatrolStatusTable"
}

const html_patrolRow = (patrol: Patrol & { lastUpdate: PatrolUpdate | null }, includeInactivePatrols: boolean, locationService: LocationService, patrolService: PatrolService): string => {
    if (!patrol) {
        return <tr class="hover-grey">
            <td>Ukendt patrulje</td>
            <td>-</td>
            <td>-</td>
        </tr>;
    }

    return <tr class="hover-grey">
        <td>
            {formatPatrol(patrol.id, patrolService)}
        </td>
        <td>
            {patrol.lastUpdate ? formatUpdateLocation(locationService, patrol.lastUpdate) : "Ikke startet løb."}
        </td>
        {includeInactivePatrols ? <td>{patrol.udgået ? "Udgået" : "Aktiv"}</td> : null}
        <td>{patrol.lastUpdate ? clock(patrol.lastUpdate.time) : "-"}</td>
    </tr>;
};

const html_patrolsStatusTable = (patrols: (Patrol & { lastUpdate: PatrolUpdate | null })[], includeInactivePatrols: boolean, locationService: LocationService, patrolService: PatrolService): string => {
    if (patrols.length === 0) {
        return <div>Ingen patruljer</div>;
    }

    return <div id ={ids.tableContainer}
                hx-post={Endpoints.GetPatrolStatusTable}
                hx-trigger={`every 10s, ${triggers.fetchPatrolsTable}`}
                hx-swap="outerHTML"
                hx-include={`#${ids.includeInactivePatrolsCheckbox}`}>

        <div style="display: flex; align-items: center; justify-content: flex-start; margin-bottom: 1rem;">
            <label for={ids.includeInactivePatrolsCheckbox} style="font-weight: bold; margin-right: 0.5rem;">Inkluder udgåede patruljer</label>
            <input  type="checkbox" 
                    id={ids.includeInactivePatrolsCheckbox}
                    checked={includeInactivePatrols ? true : false}
                    name="includeInactivePatrols"
                    hx-on:change={`htmx.trigger(${getElementById(ids.tableContainer)}, '${triggers.fetchPatrolsTable}')`}/>
        </div>
        <table id={ids.table}>
            <thead>
                <th>Patrulje</th>
                <th>Lokation</th>
                {includeInactivePatrols ? <th>Status</th> : null}
                <th>Sidste ændring</th>
            </thead>
            {patrols.map(patrol => html_patrolRow(patrol, includeInactivePatrols, locationService, patrolService))}
        </table>
    </div>;
};