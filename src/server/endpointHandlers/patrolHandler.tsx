import * as elements from 'typed-html';
import type { LocationService, PatrolService, UpdateService } from "../databaseBarrel";
import type { Patrol, PatrolUpdate } from "@shared/types";
import { Endpoints } from "@shared/endpoints";
import * as responses from '../response';
import { Request } from '../request';


import { formatLocationAnchor, formatPatrol, formatUpdateLocation, clock } from './HTMLGeneral';

const patrolRow = (patrol: Patrol & { lastUpdate: PatrolUpdate | null }, locationService: LocationService, patrolService: PatrolService): string => {
    if (!patrol) {
        return <tr class="hover-grey">
            <td>Ukendt patrulje</td>
            <td>-</td>
            <td>-</td>
        </tr>;
    }

    return <tr class="hover-grey">
        <td>
            <a href={`${Endpoints.SinglePatrolPage}?id=${patrol.id}`} class="hover-underline">
                {formatPatrol(patrol.id, patrolService)}
            </a>
        </td>
        <td>
            {patrol.lastUpdate ? formatUpdateLocation(locationService, patrol.lastUpdate) : "Ikke startet løb."}
        </td>
        <td>{patrol.lastUpdate ? clock(patrol.lastUpdate.time) : "-"}</td>
    </tr>;
};

const patrolsTable = (patrols: (Patrol & { lastUpdate: PatrolUpdate | null })[], locationService: LocationService, patrolService: PatrolService): string => {
    if (patrols.length === 0) {
        return <div class="patrols">Ingen patruljer</div>;
    }

    return <div class="patrols" hx-get={Endpoints.GetPatrolStatusTable} hx-trigger="every 5s" hx-swap="outerHTML">
        <table id="patrol-table">
            <thead>
                <td>Patrulje</td>
                <td>Lokation</td>
                <td>Sidste ændring</td>
            </thead>
            {patrols.map(patrol => patrolRow(patrol, locationService, patrolService))}
        </table>
    </div>;
};

export const getPatrolsTable = async (request: Request, locationService: LocationService, patrolService: PatrolService, updateService: UpdateService): Promise<responses.Response> => {
    const patrolIds = patrolService.allPatrolIds();
    const patrols: (Patrol & { lastUpdate: PatrolUpdate | null })[] = patrolIds.map(id => {
        const patrol = patrolService.patrolInfo(id);
        const lastUpdate = updateService.latestUpdateOfPatrol(id);
        return { ...patrol, lastUpdate };
    });

    const html = patrolsTable(patrols, locationService, patrolService);
    return responses.ok(html);
};