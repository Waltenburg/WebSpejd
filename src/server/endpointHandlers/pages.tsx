import * as elements from 'typed-html';
import { LocationService, UpdateService, PatrolService } from "../databaseBarrel";
import { Endpoints } from "@shared/endpoints";
import * as responses from '../response';
import { getPatrolStatusTable } from './patrolStatusHandler';
import { getLocationStatusTable as getLocationStatusTable } from './locationStatusHandler';
import { getPatrolUpdatesTable } from './patrolUpdatesHandler';
import { getLocationConfigTable } from './LocationConfigHandler';
import { getRouteConfigTable } from './RouteConfigHandler';
import { getPatrolConfigTable } from './patrolConfigHandler';
import { anchorToAddPatrolUpdatePage } from './HTMLGeneral';
type Request = import('../request').Request;

// ========================== Endpoint Handler for Pages ==========================
export const mainMasterPage = async (request: Request, locationService: LocationService, updateService: UpdateService, patrolService: PatrolService): Promise<responses.Response> => {
    const [locationStatusRes, patrolStatusRes, patrolUpdatesRes] = await Promise.all([
        getLocationStatusTable(request, locationService),
        getPatrolStatusTable(request, locationService, patrolService, updateService),
        getPatrolUpdatesTable(request, updateService, locationService, patrolService)
    ]);

    const content = <div id="content">
        <h1>Status på lokationer</h1>
        {locationStatusRes.content}
        <a class="button" href={Endpoints.LocationRouteConfigPage}>Konfigurer Lokationer og Ruter</a>
        <h1>Status på patruljer</h1>
        {patrolStatusRes.content}
        <a class="button" href={Endpoints.PatrolConfigPage}>Konfigurer Patruljer</a>
        <h1>Seneste patruljeopdateringer</h1>
        {anchorToAddPatrolUpdatePage()}<br></br><br></br>
        {patrolUpdatesRes.content}
    </div>
    const html = renderMasterPage("Master Oversigt", content);
    return responses.ok(html);
}

export const locatonAndRouteConfigPage = async (request: Request, locationService: LocationService, updateService: UpdateService, patrolService: PatrolService): Promise<responses.Response> => {
    const [llocationConfigRes, routeConfigRes] = await Promise.all([
        getLocationConfigTable(request, locationService),
        getRouteConfigTable(request, locationService)
    ]);

    const content = <div id="content">
        <h1>Konfiguration af lokationer og ruter</h1>
        <h2>Lokationer</h2>
        {llocationConfigRes.content}
        For at en lokation kan slettes, må der ikke være nogle ruter til eller fra lokationen.
        <br />
        Derudover må der ikke være nogle check ind eller ud på lokationen.
        <br />
        Lokationen kan altid omdøbes, også selvom der er patruljer på lokationen.
        <h2>Ruter</h2>
        {routeConfigRes.content}
        Ruter kan altid slettes eller ændres, også selvom der er patruljer på ruten.
        <br />
        Lokationer kan kun tjekke patruljer ud imod de lokationer, der har en åben rute fra den.
    </div>;
    const html = renderMasterPage("Master Lokationer og Ruter", content);
    return responses.ok(html);
}

export const patrolConfigPage = async (request: Request, patrolService: PatrolService): Promise<responses.Response> => {
    const patrolConfigRes = await getPatrolConfigTable(request, patrolService);

    const content = <div id="content">
        <h1>Konfiguration af patruljer</h1>
        {patrolConfigRes.content}
        For at en patrulje kan slettes, skal alle patruljens check ind og ud slettes først.
    </div>;
    const html = renderMasterPage("Master Patruljer", content);
    return responses.ok(html);
}

export const patrolPage = async (request: Request, patrolService: PatrolService, locationService: LocationService, updateService: UpdateService): Promise<responses.Response> => {
    const patrolId = Number.parseInt(request.url.searchParams.get("patrolId"));
    if (Number.isNaN(patrolId)) {
        return responses.response_code(400, "Invalid patrol id");
    }
    const patrol = patrolService.patrolInfo(patrolId);
    if (!patrol) {
        return responses.not_found("Patrol not found");
    }

    const content = <div id="content">
        <h1>Patrulje #{patrol.number} {patrol.name}</h1>
        <span class={`status-badge  ${patrol.udgået ? "status-out" : "status-active"}`}>
            {patrol.udgået ? "Udgået" : "På løbet"}
        </span>
        <div class="button-group">
            {anchorToAddPatrolUpdatePage(patrol.id)}
            <button hx-post={Endpoints.ChangePatrolStatus} class="button button-secondary"
                hx-vals={JSON.stringify({ patrolId: patrol.id, udgået: !patrol.udgået })}
                hx-swap="none"
                hx-on--after-request={`window.location.replace('${Endpoints.MasterPatrolPage}?patrolId=${patrol.id}')`}>
                {patrol.udgået ? "Genindgå" : "Udgå"}
            </button>

        </div>
        <h2>Patruljeopdateringer</h2>
        <div>
            {await getPatrolUpdatesTable(request, updateService, locationService, patrolService).then(res => res.content)}
        </div>
    </div>

    const html = renderMasterPage(`Patrulje #${patrol.number} ${patrol.name}`, content);
    return responses.ok(html);
}

export const addPatrolUpdatePage = async (request: Request, patrolService: PatrolService, locationService: LocationService): Promise<responses.Response> => {
    const patrolId = Number.parseInt(request.url.searchParams.get("patrolId"));
    const locationId = Number.parseInt(request.url.searchParams.get("locationId"));
    const userCameFrom = request.headers["referer"] || Endpoints.MainMasterPage;

    const patrolOptions = patrolService.allPatrolIds().map(id => {
        const patrol = patrolService.patrolInfo(id);
        if (patrol.id === patrolId) {
            // @ts-expect-error
            return <option value={patrol.id.toString()} selected>{`#${patrol.number} ${patrol.name}`}</option>;
        }
        return <option value={patrol.id.toString()}>{`#${patrol.number} ${patrol.name}`}</option>;
    });

    const locationOptions = locationService.allLocationIds().map(id => {
        const location = locationService.locationInfo(id);
        return <option value={location.id.toString()} selected={location.id === locationId ? "true" : "false"}>
            {location.name}
        </option>;
    });

    const now = new Date()
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().split(' ')[0].substring(0, 5); // hh:mm

    const content = <div id="content">
        <h1>Tilføj Patruljeopdatering</h1>
        <form id="add-patrol-update-form">
            <div>
                <label>Patrulje:</label>
                <select name="patrol">{patrolOptions}</select>
            </div>
            <div>
                <label>Type:</label>
                {/* @ts-ignore */}
                <select name="type" onchange="toggle(this.value)">
                    <option value="checkin">Check ind</option>
                    <option value="checkout">Check ud</option>
                </select>
            </div>

            <div id="singleLocation">
                <label>Check patrulje ind på:</label>
                <select name="singleLocation">{locationOptions}</select>
            </div>

            <div id="fromLocation">
                <label>Check patrulje ud fra:</label>
                <select name="fromLocation">{locationOptions}</select>
            </div>

            <div id="toLocation">
                <label>Og imod:</label>
                <select name="toLocation">{locationOptions}</select>
            </div>

            <div>
                <label>Dato:</label>
                <input type="date" name="date" value={date} required="true" />
            </div>
            <div>
                <label>Tidspunkt:</label>
                <input type="time" name="time" value={time} required="true" />
            </div>

            <input hx-post={Endpoints.AddPatrolUpdate} type="button" value="Tilføj Opdatering" class="button button-primary"
                hx-include="#add-patrol-update-form"
                hx-on--after-request="afterRequestHandler(event)"></input>
            <a href={userCameFrom} class="button button-secondary">Annuller</a>
        </form>
    </div>

    const script = `<script>
        function toggle(type) {
            document.getElementById('singleLocation').style.display = type === 'checkout' ? 'none' : 'block';
            document.getElementById('fromLocation').style.display = type === 'checkin' ? 'none' : 'block';
            document.getElementById('toLocation').style.display = type === 'checkin' ? 'none' : 'block';
        }
        function afterRequestHandler(evt) {
            console.log(evt);
            if (evt.detail.successful) {
                window.showDialog('Patruljeopdatering tilføjet succesfuldt.', ['OK', () => window.location.replace('${userCameFrom}')]);
            }else {
                window.showDialog('Der opstod en fejl ved tilføjelse af patruljeopdatering.', ['OK', () => {}]);
            }
        }
        toggle('checkin');
    </script>`;

    const html = renderMasterPage("Tilføj Patruljeopdatering", content, script);
    return responses.ok(html);
}


// ========================== HTML Generation Functions ==========================

export const patrolsUrl = (patrolId: number): string => {
    return `${Endpoints.GetPatrolUpdatesTable}?patrolId=${patrolId}`;
}

const renderMasterPage = (title: string, content: string, script?: string) => `
<!DOCTYPE html>
<html>
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <script src="/js/master/base.js" type="module"></script>
        <script src="/js/master/locationPasswords.js" type="module"></script>
        <script src="/js/dialog.js" type="module"></script>
        <script src="/js/cookie.js" type="module"></script>
        <link rel="stylesheet" href="/assets/css/master.css">
    </head>
    <body>
        <div id="header">
            <span class="brand-title">CCMR Part XXIX · WebSpejd</span>
            <a href="/" class="header-link" title="Hjem">🏠</a>
            <a href="/master" class="header-link" title="Master">📊</a>
        </div>
        ${content}
        ${script ?? ""}
        <script src="https://unpkg.com/htmx.org@2.0.3"></script>
    </body>
</html>`;

// export const locationPage = (locationService: LocationService, updateService: UpdateService, locationId: number): string => {
//     const patrolsOnTheirWay = locationService.patrolsTowardsLocation(locationId);
//     const patrolsOnLocation = locationService.patrolsOnLocation(locationId);
//     const patrolsCheckedOut = locationService.patrolsCheckedOutFromLocation(locationId);
//     const updates = updateService.updatesAtLocation(locationId);
//     const location = locationService.locationInfo(locationId);

//     const body = <div id="content">
//         <h1>{location.name}</h1>
//         <h2>Team: {location.team}</h2>
//         {/* <a class="button" href={`/master/updatePage?locationId=${location.id}`}>Check ind</a> */}
//         {location.open ?
//             <a class="button"
//                 href="/master/locationStatus?location={{location.id}}&status=close">Luk post</a>
//             :
//             <a class="button"
//                 href="/master/locationStatus?location={{location.id}}&status=open">Åben post</a>
//         }
//         <h2>Går mod post</h2>

//     </div>;
// }

//     {{ utils.patrols(patrolsOnTheirWay, locationId=location.id, selection="patrolsOnTheirWay") }}
//     <h2>På post</h2>
//     {{ utils.patrols(patrolsOnPost, locationId=location.id, selection="patrolsOnPost") }}
//     <h2>Har forladt post</h2>
//     {{ utils.patrols(patrolsCheckedOut, locationId=location.id, selection="patrolsCheckedOut") }}
//     <h2>Patruljeopdateringer</h2>
//     <div hx-get="/master/patrolUpdates?locationId={{location.id}}" hx-trigger="every 5s">
//         {{ utils.updates(updates) }}
//     </div>

//     <h2>Ruter til denne post</h2>
//     {{utils.routes(location.id, showFrom=true, showTo=false)}}
//     <h2>Ruter fra denne post</h2>
//     {{utils.routes(location.id, showFrom=false, showTo=true)}}

// }