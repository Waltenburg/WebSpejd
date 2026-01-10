import * as elements from 'typed-html';
import { Endpoints } from '@shared/endpoints';
import * as responses from '../response';
import { parseForm } from '../request';
import type { Request } from '../request';
import { PatrolService } from '../databaseBarrel';
import { Patrol } from '@shared/types';
import { getElementById, addClassToElement, removeClassFromElement, isClassOnElement, hxTrigger } from './HTMLGeneral';

type Response = responses.Response;

// ========================== Endpoint Handlers for Patrols CRUD operations  ==========================

export const addPatrol = async (request: Request, patrolService: PatrolService): Promise<Response> => {
    const form = parseForm(request.body);
    const number = form["number"];
    const name = form["name"];

    if (!number || !name) {
        return responses.response_code(400);
    }

    const patrolId = patrolService.addPatrol(number, name);
    if (patrolId === null) {
        return responses.response_code(400);
    }
    return responses.ok();
}

export const changePatrolStatus = async (request: Request, patrolService: PatrolService): Promise<Response> => {
    const form = parseForm(request.body);
    const patrolId = Number.parseInt(form["patrolId"]);
    const udgået = form["udgået"] === "true";

    if (Number.isNaN(patrolId)) {
        return responses.response_code(400);
    }

    patrolService.changePatrolStatus(patrolId, udgået);
    return responses.ok();
}

export const deletePatrol = async (request: Request, patrolService: PatrolService): Promise<Response> => {
    const form = parseForm(request.body);
    const patrolId = Number.parseInt(form["patrolId"]);

    if (Number.isNaN(patrolId)) {
        return responses.response_code(400);
    }

    const success = patrolService.deletePatrol(patrolId);
    if (!success) {
        return responses.response_code(400);
    }
    return responses.ok();
}

export const alterPatrolNumberAndName = async (request: Request, patrolService: PatrolService): Promise<Response> => {
    const form = parseForm(request.body);
    const patrolId = Number.parseInt(form["patrolId"]);
    const number = form["number"];
    const name = form["name"];

    if (Number.isNaN(patrolId) || !number || !name) {
        return responses.response_code(400);
    }

    const success = patrolService.alterPatrolNumberAndName(patrolId, number, name);
    if (!success) {
        return responses.response_code(400);
    }
    return responses.ok();
}

// ========================== Getting HTML for Patrols ==========================

export const getPatrolConfigTableRow = async (request: Request, patrolService: PatrolService): Promise<Response> => {
    const form = parseForm(request.body);
    const patrolId = Number.parseInt(form["patrolId"]);

    if (Number.isNaN(patrolId)) {
        return responses.response_code(400);
    }

    const patrol = patrolService.patrolInfo(patrolId);
    if (!patrol) {
        return responses.response_code(400);
    }

    const tableHTML = row(patrol);
    return responses.ok(tableHTML);
}

export const getPatrolConfigTableBody = async (request: Request, patrolService: PatrolService): Promise<Response> => {
    const patrols = patrolService.allPatrolIds().map(id => patrolService.patrolInfo(id));
    const tableHTML = tableBody(patrolService, patrols);
    return responses.ok(tableHTML);
}

export const getPatrolConfigTable = async (request: Request, patrolService: PatrolService): Promise<Response> => {
    const patrols = patrolService.allPatrolIds().map(id => patrolService.patrolInfo(id));
    const tableHTML = table(patrolService, patrols);
    return responses.ok(tableHTML);
}

export const getRenamePatrolRow = async (request: Request, patrolService: PatrolService): Promise<Response> => {
    const form = parseForm(request.body);
    const patrolId = Number.parseInt(form["patrolId"]);

    if (Number.isNaN(patrolId)) {
        return responses.response_code(400);
    }

    const tableHTML = html_renamePatrolRow(patrolService, patrolId);
    return responses.ok(tableHTML);
}

// ========================== HTML Generators for Patrols ==========================
enum ids {
    table = "patrol-config-table",
    tableBody = "patrol-config-table-body",
}
enum classes {
    renaming = "renaming",
    deleting = "deleting"
}
enum hxTriggers {
    fetchPatrolRow = "fetchPatrolRow",
    fetchPatrolTable = "fetchPatrolTable"
}

/**
 * Columns:
 * - Patruljenummer
 * - Patruljenavn
 * - Status (Aktiv/ Udgået)
 * - Handlinger (Ændr navn/nummer, Slet patrulje, Skift status)
 */
const row = (patrol: Patrol): string => {
    const hxVals = JSON.stringify({
        patrolId: patrol.id,
        udgået: !patrol.udgået
    });

    return <tr id={`patrol-row-${patrol.id}`}>
        <td>{patrol.number}</td>
        <td>{patrol.name}</td>
        <td>{patrol.udgået ? "Udgået" : "Aktiv"}</td>
        <td>
            <button
                hx-post={`${Endpoints.ChangePatrolStatus}`}
                hx-on--after-request={`htmx.trigger(this.nextElementSibling, '${hxTriggers.fetchPatrolRow}')`}
                hx-swap="none"
                hx-vals={hxVals}>
                {patrol.udgået ? "Aktivér" : "Udgå"}
            </button>
            <span
                hx-trigger={hxTriggers.fetchPatrolRow}
                hx-target="closest tr"
                hx-swap="outerHTML"
                hx-vals={hxVals}
                hx-post={`${Endpoints.GetPatrolConfigTableRow}`}>
            </span>

            <button hx-post={`${Endpoints.DeletePatrol}`} hx-target="closest tr"
                hx-swap="outerHTML" hx-vals={JSON.stringify({ patrolId: patrol.id })}
                // hx-on:click={addClassToElement(getElementById(ids.table), classes.deleting)}
                // hx-on--htmx:afterRequest={removeClassFromElement(getElementById(ids.table), classes.deleting)}
                hx-confirm={`Er du sikker på, at du vil slette patruljen "${patrol.name}"? Dette kan ikke fortrydes.`}>
                Slet patrulje
            </button>

            <button hx-post={`${Endpoints.GetPatrolConfigTableRenameRow}`} hx-target="closest tr"
                hx-swap="outerHTML" hx-vals={JSON.stringify({ patrolId: patrol.id })}
                hx-on--before-request={addClassToElement(getElementById(ids.table), classes.renaming)}>
                Ændr navn/nummer
            </button>
        </td>
    </tr>;
}

const addRow = (): string => {
    return <tr id="add-patrol-row">
        <td><input required='true' type="text" name="number" placeholder="Nummer" /></td>
        <td><input required='true' type="text" name="name" placeholder="Navn" /></td>
        <td>N/A</td>
        <td>
            <button type="button"
                hx-post={`${Endpoints.AddPatrol}`}
                hx-include="closest tr"
                hx-on--after-request={`htmx.trigger(this.nextElementSibling, '${hxTriggers.fetchPatrolTable}')`}
                hx-swap="none"
            >
                Tilføj patrulje
            </button>
            <span
                hx-trigger={hxTriggers.fetchPatrolTable}
                hx-target="closest table"
                hx-swap="outerHTML"
                hx-post={`${Endpoints.GetPatrolConfigTable}`}>
            </span>
        </td>
    </tr>;
}

const html_renamePatrolRow = (patrolService: PatrolService, patrolId: number): string => {
    const patrol = patrolService.patrolInfo(patrolId);
    if (!patrol)
        return <tr><td colspan={4}>Patrulje ikke fundet</td></tr>;

    const removeRenamingClassScript = removeClassFromElement(getElementById(ids.table), classes.renaming);

    return <tr id={`rename-patrol-row-${patrolId}`}>
        <td><input required='true' type="text" name="number" value={patrol.number} /></td>
        <td><input required='true' type="text" name="name" value={patrol.name} /></td>
        <td>N/A</td>
        <td>
            <button type="button"
                hx-post={`${Endpoints.AlterPatrol}`}
                hx-include="closest tr"
                hx-on--before-request={removeRenamingClassScript}
                hx-on--after-request={hxTrigger("this.nextElementSibling", hxTriggers.fetchPatrolRow)}
                hx-vals={JSON.stringify({ patrolId: patrol.id })}
                hx-swap="none"
            >
                Ændr patrulje
            </button>
            <span
                hx-trigger={hxTriggers.fetchPatrolRow}
                hx-target="closest tr"
                hx-swap="outerHTML"
                hx-vals={JSON.stringify({ patrolId: patrol.id })}
                hx-post={`${Endpoints.GetPatrolConfigTableRow}`}>
            </span>

            <button type='button'
                hx-post={`${Endpoints.GetPatrolConfigTableRow}`}
                hx-vals={JSON.stringify({ patrolId: patrol.id })}
                hx-target="closest tr"
                hx-swap="outerHTML"
                hx-on--before-request={removeRenamingClassScript}
                >
                Annuller
            </button>
        </td>
    </tr>;
}

const tableBody = (patrolService: PatrolService, patrols: Patrol[]): string => {
    const cancelCondition = `if (event.detail.elt.id === this.id && (isErrorDialogOpen() || ${isClassOnElement(getElementById(ids.table), classes.deleting)})) {console.log("cancelled request"); event.preventDefault(); }`;
    
    return <tbody id={ids.tableBody}
            hx-ext="idiomorph"
            hx-get={`${Endpoints.GetPatrolConfigTableBody}`}
            hx-target="this"
            hx-swap="outerHTML"
            hx-trigger="every 1s"
            hx-on--before-request={cancelCondition}>
            {patrols.length === 0 ?
                <tr><td colspan={4}>Ingen patruljer</td></tr>
                : null}
            {patrols.map(patrol => row(patrol))}
        </tbody>
}

const table = (patrolService: PatrolService, patrols: Patrol[]): string => {
    return <table id={ids.table}>
        <thead>
            <th>Patruljenummer</th>
            <th>Patruljenavn</th>
            <th>Status</th>
            <th>Handling</th>
        </thead>
        {tableBody(patrolService, patrols)}
        <tfoot>
            {addRow()}
        </tfoot>
    </table>
}