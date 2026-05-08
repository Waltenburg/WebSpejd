import * as elements from 'typed-html';
import { Response } from '../response.js';
import { getPatrolStatusTable } from './patrolStatusHandler.js';
import { getLocationStatusTable as getLocationStatusTable } from './locationStatusHandler.js';
import { getPatrolUpdatesTable } from './patrolUpdatesHandler.js';
import { getLocationConfigTable } from './LocationConfigHandler.js';
import { getRouteConfigTable } from './RouteConfigHandler.js';
import { getPatrolConfigTable } from './patrolConfigHandler.js';
import { anchorToAddPatrolUpdatePage, multiSelectDropdown } from './HTMLGeneral.js';
import { table as html_RouteTable } from './RouteConfigHandler.js';
import { env } from 'process';
import * as zod from "zod";
import * as validation from "@webspejd/core/validation.js";
// ========================== Endpoint Handler for Pages ==========================
export const mainMasterPage = async (request, locationService, updateService, patrolService) => {
    const [locationStatusRes, patrolStatusRes, patrolUpdatesRes] = await Promise.all([
        getLocationStatusTable(request, locationService),
        getPatrolStatusTable(request, locationService, patrolService, updateService),
        getPatrolUpdatesTable(request, updateService, locationService, patrolService)
    ]);
    const content = elements.createElement("div", { id: "content" },
        elements.createElement("h1", null, "Status p\u00E5 lokationer"),
        locationStatusRes.content,
        elements.createElement("a", { class: "button", href: "/master/locationRouteGraph" /* Endpoints.LocationRouteGraphPage */ }, "Vis lokationsgraf"),
        elements.createElement("a", { class: "button", href: "/master/locationRouteConfig" /* Endpoints.LocationRouteConfigPage */ }, "Konfigurer Lokationer og Ruter"),
        elements.createElement("h1", null, "Status p\u00E5 patruljer"),
        patrolStatusRes.content,
        elements.createElement("a", { class: "button", href: "/master/patrolConfig" /* Endpoints.PatrolConfigPage */ }, "Konfigurer Patruljer"),
        elements.createElement("h1", null, "Seneste patruljeopdateringer"),
        anchorToAddPatrolUpdatePage(),
        elements.createElement("br", null),
        elements.createElement("br", null),
        patrolUpdatesRes.content);
    const html = renderMasterPage("Master Oversigt", content);
    return Response.ok(html);
};
export const locatonAndRouteConfigPage = async (request, locationService, updateService, patrolService) => {
    const [llocationConfigRes, routeConfigRes] = await Promise.all([
        getLocationConfigTable(request, locationService),
        getRouteConfigTable(request, locationService)
    ]);
    const content = elements.createElement("div", { id: "content" },
        elements.createElement("h1", null, "Konfiguration af lokationer og ruter"),
        elements.createElement("h2", null, "Information til alle lokationer"),
        elements.createElement("p", null, "Her kan du skrive tekst, der vises til alle lokationer. Anvend markdown-format. **Fed**, *kursiv*, # Overskrift"),
        elements.createElement("div", null,
            elements.createElement("form", { id: "set-mandskab-page-info-form" },
                elements.createElement("textarea", { name: "info", rows: '4', cols: '50' }, locationService.getMandskabPageInfo()),
                elements.createElement("input", { "hx-post": "/master/setMandskabPageInfo" /* Endpoints.SetInfoOnMandskabPage */, type: "button", value: "Opdater info p\u00E5 mandskabssider", class: "button button-primary", "hx-include": "#set-mandskab-page-info-form", "hx-on--after-request": "window.location.reload()" }))),
        elements.createElement("h2", null, "Lokationer"),
        elements.createElement("a", { class: "button", href: "/master/locationRouteGraph" /* Endpoints.LocationRouteGraphPage */ }, "\u00C5bn lokationsgraf"),
        elements.createElement("br", null),
        llocationConfigRes.content,
        "For at en lokation kan slettes, m\u00E5 der ikke v\u00E6re nogle:",
        elements.createElement("ul", null,
            elements.createElement("li", null, "Patruljeopdateringer p\u00E5 lokationen"),
            elements.createElement("li", null, "Ruter til eller fra lokationen."),
            elements.createElement("li", null, "Kodeord oprettet til lokationen")),
        "Lokationen kan altid omd\u00F8bes.",
        elements.createElement("h2", null, "Ruter"),
        routeConfigRes.content,
        "Ruter kan altid slettes eller \u00E6ndres, ogs\u00E5 selvom der er patruljer p\u00E5 ruten.",
        elements.createElement("br", null),
        "Lokationer kan kun tjekke patruljer ud imod de lokationer, der har en \u00E5ben rute fra den.");
    const html = renderMasterPage("Master Lokationer og Ruter", content);
    return Response.ok(html);
};
export const locationRouteGraphPage = async (_request) => {
    const content = elements.createElement("div", { id: "content" },
        elements.createElement("h1", null, "Lokationsgraf"),
        elements.createElement("p", null, "Dobbelklik p\u00E5 en lokation for at \u00E5bne lokationssiden. Tr\u00E6k lokationer rundt, s\u00E5 kortet passer til jeres behov."),
        elements.createElement("h2", null, "S\u00E5dan l\u00E6ses kortet"),
        elements.createElement("ul", null,
            elements.createElement("li", null, "Hver cirkel er en lokation, og hver pil en rute mellem to lokationer."),
            elements.createElement("li", null, "Jo flere patruljer p\u00E5 en lokation, jo st\u00F8rre er cirklen. Liges\u00E5 med ruter"),
            elements.createElement("li", null, "Lokation markeret som stjerne er start-lokationen."),
            elements.createElement("li", null, "Kantens farve p\u00E5 en lokation indikerer om lokationen er \u00E5ben eller lukket. Gr\u00F8n: \u00E5ben, gr\u00E5: lukket."),
            elements.createElement("li", null, "Fyldets farve p\u00E5 en lokation indikerer om der er patruljer checket ind p\u00E5 lokationen. Gr\u00F8n: ingen patruljer, gr\u00E5: en eller flere patruljer."),
            elements.createElement("li", null, "Stiplet pil betyder, at ruten ikke er oprettet som rute (men patruljer kan stadig v\u00E6re p\u00E5 den)."),
            elements.createElement("li", null, "Gr\u00F8n pil betyder, at ruten er \u00E5ben, mens orange pil betyder, at ruten er lukket.")),
        elements.createElement("div", { id: "location-route-graph-status" }),
        elements.createElement("div", { id: "location-route-graph", style: "height: 72vh; border: 1px solid #d1d5db;" }));
    const script = `
        <script src="https://unpkg.com/vis-network@9.1.9/standalone/umd/vis-network.min.js"></script>
        <script src="/js/master/locationRouteGraph.js" type="module"></script>
    `;
    const html = renderMasterPage("Lokationsgraf", content, script);
    return Response.ok(html);
};
export const patrolConfigPage = async (request, patrolService) => {
    const patrolConfigRes = await getPatrolConfigTable(request, patrolService);
    const content = elements.createElement("div", { id: "content" },
        elements.createElement("h1", null, "Konfiguration af patruljer"),
        patrolConfigRes.content,
        "For at en patrulje kan slettes, skal alle patruljens check ind og ud slettes f\u00F8rst.");
    const html = renderMasterPage("Master Patruljer", content);
    return Response.ok(html);
};
export const patrolPage = async (request, patrolService, locationService, updateService) => {
    const { patrolId } = validation.parseUrlParams(zod.object({ "patrolId": validation.AnyNumber }), request.url);
    if (Number.isNaN(patrolId)) {
        return Response.badRequest("Invalid patrol id");
    }
    const patrol = patrolService.patrolInfo(patrolId);
    if (!patrol) {
        return Response.notFound("Patrol not found");
    }
    const content = elements.createElement("div", { id: "content" },
        elements.createElement("h1", null,
            "Patrulje #",
            patrol.number,
            " ",
            patrol.name),
        elements.createElement("span", { class: `status-badge  ${patrol.udgået ? "status-out" : "status-active"}` }, patrol.udgået ? "Udgået" : "På løbet"),
        elements.createElement("div", { class: "button-group" },
            anchorToAddPatrolUpdatePage(patrol.id),
            elements.createElement("button", { "hx-post": "/master/patrolStatus" /* Endpoints.ChangePatrolStatus */, class: "button button-secondary", "hx-vals": JSON.stringify({ patrolId: patrol.id, udgået: !patrol.udgået }), "hx-swap": "none", "hx-on--after-request": `window.location.replace('${"/master/patrol_page" /* Endpoints.MasterPatrolPage */}?patrolId=${patrol.id}')` }, patrol.udgået ? "Genindgå" : "Udgå")),
        elements.createElement("h2", null, "Patruljeopdateringer"),
        elements.createElement("div", null, await getPatrolUpdatesTable(request, updateService, locationService, patrolService).then(res => res.content)));
    const html = renderMasterPage(`Patrulje #${patrol.number} ${patrol.name}`, content);
    return Response.ok(html);
};
export const addPatrolUpdatePage = async (request, patrolService, locationService) => {
    const { patrolId, locationId } = validation.parseUrlParams(zod.object({ "patrolId": validation.AnyNumber, "locationId": validation.AnyNumber }), request.url);
    const userCameFrom = request.headers["referer"] || "/master" /* Endpoints.MainMasterPage */;
    const patrolOptions = patrolService.allPatrolIds().map(id => {
        const patrol = patrolService.patrolInfo(id);
        const patrolStr = `#${patrol.number} ${patrol.name}`;
        if (patrol.id === patrolId) {
            // @ts-expect-error
            return elements.createElement("option", { value: patrol.id.toString(), selected: true }, patrolStr);
        }
        return elements.createElement("option", { value: patrol.id.toString() }, patrolStr);
    });
    const locationOptions = locationService.allLocations("TOPOLOGICAL" /* SortType.TOPOLOGICAL */).map(location => {
        if (location.id === locationId) {
            // @ts-expect-error
            return elements.createElement("option", { value: location.id.toString(), selected: true }, location.name);
        }
        return elements.createElement("option", { value: location.id.toString() }, location.name);
    });
    const content = elements.createElement("div", { id: "content" },
        elements.createElement("h1", null, "Tilf\u00F8j Patruljeopdatering"),
        elements.createElement("form", { id: "add-patrol-update-form" },
            elements.createElement("div", null,
                elements.createElement("label", null, "Patruljer:"),
                multiSelectDropdown({
                    id: "patrol-select",
                    name: 'patrolIds',
                    options: patrolService.allPatrolIds().map(id => {
                        const patrol = patrolService.patrolInfo(id);
                        return {
                            value: patrol.id.toString(),
                            label: `#${patrol.number} ${patrol.name}`
                        };
                    }),
                    placeholder: "Vælg patruljer..."
                })),
            elements.createElement("div", null,
                elements.createElement("label", null, "Type:"),
                elements.createElement("select", { name: "type", onchange: "toggle(this.value)" },
                    elements.createElement("option", { value: "checkin" }, "Check ind"),
                    elements.createElement("option", { value: "checkout" }, "Check ud"))),
            elements.createElement("div", { id: "singleLocation" },
                elements.createElement("label", null, "Check patrulje ind p\u00E5:"),
                elements.createElement("select", { name: "singleLocation" }, locationOptions)),
            elements.createElement("div", { id: "fromLocation" },
                elements.createElement("label", null, "Check patrulje ud fra:"),
                elements.createElement("select", { name: "fromLocation" }, locationOptions)),
            elements.createElement("div", { id: "toLocation" },
                elements.createElement("label", null, "Og imod:"),
                elements.createElement("select", { name: "toLocation" }, locationOptions)),
            elements.createElement("div", null,
                elements.createElement("label", null, "Dato:"),
                elements.createElement("input", { id: "date_local", type: "date", name: "date_local", required: "true", "hx-trigger": "load", "hx-target": "this", "hx-on": "htmx:load: this" })),
            elements.createElement("div", null,
                elements.createElement("label", null, "Tidspunkt:"),
                elements.createElement("input", { id: "time_local", type: "time", name: "time_local", required: "true" })),
            elements.createElement("input", { "hx-post": "/master/addPatrolUpdate" /* Endpoints.AddPatrolUpdate */, type: "button", value: "Tilf\u00F8j Opdatering", class: "button button-primary", "hx-include": "#add-patrol-update-form", "hx-on--after-request": "afterRequestHandler(event)", "hx-on--config-request": "\n                    const dateLocal = document.getElementById('date_local').value;\n                    const timeLocal = document.getElementById('time_local').value;\n                    const localDateTime = new Date(dateLocal + 'T' + timeLocal);\n                    event.detail.parameters['datetime'] = localDateTime.toISOString();\n                " }),
            elements.createElement("a", { href: userCameFrom, class: "button button-secondary" }, "Annuller")));
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

        const now = new Date();
        const date = now.getFullYear() + "-" + (now.getMonth() + 1).toString().padStart(2, '0') + "-" + now.getDate().toString().padStart(2, '0'); // yyyy-mm-dd
        const time = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0'); // HH:MM
        document.getElementById('date_local').value = date;
        document.getElementById('time_local').value = time;
    </script>`;
    const html = renderMasterPage("Tilføj Patruljeopdatering", content, script);
    return Response.ok(html);
};
export const locationPage = async (request, locationService, updateService, patrolService) => {
    const { locationId } = validation.parseUrlParams(validation.LocationId, request.url);
    if (Number.isNaN(locationId)) {
        return Response.badRequest("Invalid location id");
    }
    const location = locationService.locationInfo(locationId);
    const locationIsFirstLocation = locationService.getFirstLocationId() === locationId;
    if (!location) {
        return Response.notFound("Location not found");
    }
    const content = elements.createElement("div", { id: "content" },
        elements.createElement("h1", null,
            "Lokation: ",
            location.name),
        elements.createElement("span", { class: `status-badge  ${location.open ? "status-active" : "status-out"}` }, location.open ? "Åben" : "Lukket"),
        elements.createElement("span", { class: `status-badge  ${locationIsFirstLocation ? "status-active" : "status-out"}` }, locationIsFirstLocation ? "Første Lokation" : "Ikke Første Lokation"),
        elements.createElement("div", { class: "button-group" },
            anchorToAddPatrolUpdatePage(undefined, location.id),
            elements.createElement("button", { "hx-post": "/master/changeLocationStatus" /* Endpoints.ChangeLocationStatus */, class: "button button-secondary", "hx-vals": JSON.stringify({ locationId: location.id, open: !location.open }), "hx-swap": "none", "hx-on--after-request": `window.location.replace('${"/master/location_page" /* Endpoints.MasterLocationPage */}?locationId=${location.id}')` }, location.open ? "Luk post" : "Åben post"),
            locationIsFirstLocation ? null :
                elements.createElement("button", { "hx-post": "/master/makeLocationFirstLocation" /* Endpoints.MakeLocationFirstLocation */, class: "button button-secondary", "hx-vals": JSON.stringify({ locationId: location.id }), "hx-swap": "none", "hx-on--after-request": `window.location.replace('${"/master/location_page" /* Endpoints.MasterLocationPage */}?locationId=${location.id}')` }, "G\u00F8r til f\u00F8rste lokation")),
        elements.createElement("h2", null, "Status"),
        await getLocationStatusTable(request, locationService).then(res => res.content),
        elements.createElement("h2", null, "Ruter til lokationen"),
        elements.createElement("div", { class: "table-wrapper" }, html_RouteTable(locationService, locationService.allRoutesToLocation(location.id), location.id, false, true)),
        elements.createElement("h2", null, "Ruter fra lokationen"),
        elements.createElement("div", { class: "table-wrapper" }, html_RouteTable(locationService, locationService.allRoutesFromLocation(location.id), location.id, true, false)),
        elements.createElement("h2", null, "Patruljeopdateringer"),
        elements.createElement("div", null, await getPatrolUpdatesTable(request, updateService, locationService, patrolService).then(res => res.content)));
    const html = renderMasterPage(`Lokation: ${location.name}`, content);
    return Response.ok(html);
};
// ========================== HTML Generation Functions ==========================
export const patrolsUrl = (patrolId) => {
    return `${"/master/patrolUpdatesTable" /* Endpoints.GetPatrolUpdatesTable */}?patrolId=${patrolId}`;
};
const renderMasterPage = (title, content, script) => `
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
        <script src="/js/multipleSelectDropdown.js" type="module"></script>
        <link rel="stylesheet" href="/assets/css/master.css">
    </head>
    <body>
        <div id="header">
            <span class="brand-title">${env.COMPETITION_NAME + ' ⋅ WebSpejd' || "WebSpejd"}</span>
            <a href="/" class="header-link" title="Hjem">🏠</a>
            <a href="/master" class="header-link" title="Master">📊</a>
        </div>
        ${content}
        ${script ?? ""}
        <script src="https://unpkg.com/htmx.org@2.0.3"></script>
    </body>
</html>`;
//# sourceMappingURL=pages.js.map