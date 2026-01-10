import * as elements from 'typed-html';
import { Endpoints } from '@shared/endpoints';
import * as responses from '../response';
import { parseForm } from '../request';
import type { Request } from '../request';
import { PatrolService } from '../databaseBarrel';
import { Patrol } from '@shared/types';

type Response = responses.Response;

// ========================== Endpoint Handlers for Patrols CRUD operations  ==========================

export const addPatrol = async (request: Request, patrolService: PatrolService): Promise<Response> => {
    const form = parseForm(request.body);

}

export const changePatrolStatus = async (request: Request, patrolService: PatrolService): Promise<Response> => {
    const params = request.url.searchParams;
    const patrolId = Number.parseInt(params.get("patrolId"));
    const status = params.get("status");
    const isOut = status === "out";
    patrolService.changePatrolStatus(patrolId, isOut);
    return responses.redirect(`/master/patrol?id=${patrolId}`);
}

export const deletePatrol = async (request: Request, patrolService: PatrolService): Promise<Response> => {

}

export const alterPatrolNumberAndName = async (request: Request, patrolService: PatrolService): Promise<Response> => {

}

// ========================== Getting HTML for Patrols ==========================

export const getPatrolConfigTableRow = async (request: Request, patrolService: PatrolService): Promise<Response> => {

}

export const getPatrolConfigTable = async (request: Request, patrolService: PatrolService): Promise<Response> => {

}

// ========================== HTML Generators for Patrols ==========================
enum ids {
    table = "patrol-config-table",
    tableBody = "patrol-config-table-body",
}
/**
 * Columns:
 * - Patruljenummer
 * - Patruljenavn
 * - Status (Aktiv/ Udgået)
 * - Handlinger (Ændr navn/nummer, Slet patrulje, Skift status)
 */
const row = (patrol: Patrol): string => {

}

const addRow = (patrol: Patrol): string => {


}

const table = (patrolIds: number[]): string => {

}