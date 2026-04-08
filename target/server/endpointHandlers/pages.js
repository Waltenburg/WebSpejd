"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.patrolsUrl = exports.locationPage = exports.addPatrolUpdatePage = exports.patrolPage = exports.patrolConfigPage = exports.locationRouteGraphPage = exports.locatonAndRouteConfigPage = exports.mainMasterPage = void 0;
const elements = __importStar(require("typed-html"));
const responses = __importStar(require("../response"));
const patrolStatusHandler_1 = require("./patrolStatusHandler");
const locationStatusHandler_1 = require("./locationStatusHandler");
const patrolUpdatesHandler_1 = require("./patrolUpdatesHandler");
const LocationConfigHandler_1 = require("./LocationConfigHandler");
const RouteConfigHandler_1 = require("./RouteConfigHandler");
const patrolConfigHandler_1 = require("./patrolConfigHandler");
const HTMLGeneral_1 = require("./HTMLGeneral");
const RouteConfigHandler_2 = require("./RouteConfigHandler");
const process_1 = require("process");
const mainMasterPage = async (request, locationService, updateService, patrolService) => {
    const [locationStatusRes, patrolStatusRes, patrolUpdatesRes] = await Promise.all([
        (0, locationStatusHandler_1.getLocationStatusTable)(request, locationService),
        (0, patrolStatusHandler_1.getPatrolStatusTable)(request, locationService, patrolService, updateService),
        (0, patrolUpdatesHandler_1.getPatrolUpdatesTable)(request, updateService, locationService, patrolService)
    ]);
    const content = elements.createElement("div", { id: "content" },
        elements.createElement("h1", null, "Status p\u00E5 lokationer"),
        locationStatusRes.content,
        elements.createElement("a", { class: "button", href: "/master/locationRouteGraph" }, "Vis lokationsgraf"),
        elements.createElement("a", { class: "button", href: "/master/locationRouteConfig" }, "Konfigurer Lokationer og Ruter"),
        elements.createElement("h1", null, "Status p\u00E5 patruljer"),
        patrolStatusRes.content,
        elements.createElement("a", { class: "button", href: "/master/patrolConfig" }, "Konfigurer Patruljer"),
        elements.createElement("h1", null, "Seneste patruljeopdateringer"),
        (0, HTMLGeneral_1.anchorToAddPatrolUpdatePage)(),
        elements.createElement("br", null),
        elements.createElement("br", null),
        patrolUpdatesRes.content);
    const html = renderMasterPage("Master Oversigt", content);
    return responses.ok(html);
};
exports.mainMasterPage = mainMasterPage;
const locatonAndRouteConfigPage = async (request, locationService, updateService, patrolService) => {
    const [llocationConfigRes, routeConfigRes] = await Promise.all([
        (0, LocationConfigHandler_1.getLocationConfigTable)(request, locationService),
        (0, RouteConfigHandler_1.getRouteConfigTable)(request, locationService)
    ]);
    const content = elements.createElement("div", { id: "content" },
        elements.createElement("h1", null, "Konfiguration af lokationer og ruter"),
        elements.createElement("h2", null, "Information til alle lokationer"),
        elements.createElement("p", null, "Her kan du skrive tekst, der vises til alle lokationer. Anvend markdown-format. **Fed**, *kursiv*, # Overskrift"),
        elements.createElement("div", null,
            elements.createElement("form", { id: "set-mandskab-page-info-form" },
                elements.createElement("textarea", { name: "info", rows: '4', cols: '50' }, locationService.getMandskabPageInfo()),
                elements.createElement("input", { "hx-post": "/master/setMandskabPageInfo", type: "button", value: "Opdater info p\u00E5 mandskabssider", class: "button button-primary", "hx-include": "#set-mandskab-page-info-form", "hx-on--after-request": "window.location.reload()" }))),
        elements.createElement("h2", null, "Lokationer"),
        elements.createElement("a", { class: "button", href: "/master/locationRouteGraph" }, "\u00C5bn lokationsgraf"),
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
    return responses.ok(html);
};
exports.locatonAndRouteConfigPage = locatonAndRouteConfigPage;
const locationRouteGraphPage = async (_request) => {
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
    return responses.ok(html);
};
exports.locationRouteGraphPage = locationRouteGraphPage;
const patrolConfigPage = async (request, patrolService) => {
    const patrolConfigRes = await (0, patrolConfigHandler_1.getPatrolConfigTable)(request, patrolService);
    const content = elements.createElement("div", { id: "content" },
        elements.createElement("h1", null, "Konfiguration af patruljer"),
        patrolConfigRes.content,
        "For at en patrulje kan slettes, skal alle patruljens check ind og ud slettes f\u00F8rst.");
    const html = renderMasterPage("Master Patruljer", content);
    return responses.ok(html);
};
exports.patrolConfigPage = patrolConfigPage;
const patrolPage = async (request, patrolService, locationService, updateService) => {
    const patrolId = Number.parseInt(request.url.searchParams.get("patrolId"));
    if (Number.isNaN(patrolId)) {
        return responses.response_code(400, "Invalid patrol id");
    }
    const patrol = patrolService.patrolInfo(patrolId);
    if (!patrol) {
        return responses.not_found("Patrol not found");
    }
    const content = elements.createElement("div", { id: "content" },
        elements.createElement("h1", null,
            "Patrulje #",
            patrol.number,
            " ",
            patrol.name),
        elements.createElement("span", { class: `status-badge  ${patrol.udgået ? "status-out" : "status-active"}` }, patrol.udgået ? "Udgået" : "På løbet"),
        elements.createElement("div", { class: "button-group" },
            (0, HTMLGeneral_1.anchorToAddPatrolUpdatePage)(patrol.id),
            elements.createElement("button", { "hx-post": "/master/patrolStatus", class: "button button-secondary", "hx-vals": JSON.stringify({ patrolId: patrol.id, udgået: !patrol.udgået }), "hx-swap": "none", "hx-on--after-request": `window.location.replace('${"/master/patrol_page"}?patrolId=${patrol.id}')` }, patrol.udgået ? "Genindgå" : "Udgå")),
        elements.createElement("h2", null, "Patruljeopdateringer"),
        elements.createElement("div", null, await (0, patrolUpdatesHandler_1.getPatrolUpdatesTable)(request, updateService, locationService, patrolService).then(res => res.content)));
    const html = renderMasterPage(`Patrulje #${patrol.number} ${patrol.name}`, content);
    return responses.ok(html);
};
exports.patrolPage = patrolPage;
const addPatrolUpdatePage = async (request, patrolService, locationService) => {
    const patrolId = Number.parseInt(request.url.searchParams.get("patrolId"));
    const locationId = Number.parseInt(request.url.searchParams.get("locationId"));
    const userCameFrom = request.headers["referer"] || "/master";
    const patrolOptions = patrolService.allPatrolIds().map(id => {
        const patrol = patrolService.patrolInfo(id);
        const patrolStr = `#${patrol.number} ${patrol.name}`;
        if (patrol.id === patrolId) {
            return elements.createElement("option", { value: patrol.id.toString(), selected: true }, patrolStr);
        }
        return elements.createElement("option", { value: patrol.id.toString() }, patrolStr);
    });
    const locationOptions = locationService.allLocationIds("TOPOLOGICAL").map(id => {
        const location = locationService.locationInfo(id);
        if (location.id === locationId) {
            return elements.createElement("option", { value: location.id.toString(), selected: true }, location.name);
        }
        return elements.createElement("option", { value: location.id.toString() }, location.name);
    });
    const content = elements.createElement("div", { id: "content" },
        elements.createElement("h1", null, "Tilf\u00F8j Patruljeopdatering"),
        elements.createElement("form", { id: "add-patrol-update-form" },
            elements.createElement("div", null,
                elements.createElement("label", null, "Patruljer:"),
                (0, HTMLGeneral_1.multiSelectDropdown)({
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
            elements.createElement("input", { "hx-post": "/master/addPatrolUpdate", type: "button", value: "Tilf\u00F8j Opdatering", class: "button button-primary", "hx-include": "#add-patrol-update-form", "hx-on--after-request": "afterRequestHandler(event)", "hx-on--config-request": "\r\n                    const dateLocal = document.getElementById('date_local').value;\r\n                    const timeLocal = document.getElementById('time_local').value;\r\n                    const localDateTime = new Date(dateLocal + 'T' + timeLocal);\r\n                    event.detail.parameters['datetime'] = localDateTime.toISOString();\r\n                " }),
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
    return responses.ok(html);
};
exports.addPatrolUpdatePage = addPatrolUpdatePage;
const locationPage = async (request, locationService, updateService, patrolService) => {
    const locationId = Number.parseInt(request.url.searchParams.get("locationId"));
    if (Number.isNaN(locationId))
        return responses.response_code(400, "Invalid location id");
    const location = locationService.locationInfo(locationId);
    const locationIsFirstLocation = locationService.getFirstLocationId() === locationId;
    if (!location)
        return responses.not_found("Location not found");
    const content = elements.createElement("div", { id: "content" },
        elements.createElement("h1", null,
            "Lokation: ",
            location.name),
        elements.createElement("span", { class: `status-badge  ${location.open ? "status-active" : "status-out"}` }, location.open ? "Åben" : "Lukket"),
        elements.createElement("span", { class: `status-badge  ${locationIsFirstLocation ? "status-active" : "status-out"}` }, locationIsFirstLocation ? "Første Lokation" : "Ikke Første Lokation"),
        elements.createElement("div", { class: "button-group" },
            (0, HTMLGeneral_1.anchorToAddPatrolUpdatePage)(null, location.id),
            elements.createElement("button", { "hx-post": "/master/changeLocationStatus", class: "button button-secondary", "hx-vals": JSON.stringify({ locationId: location.id, open: !location.open }), "hx-swap": "none", "hx-on--after-request": `window.location.replace('${"/master/location_page"}?locationId=${location.id}')` }, location.open ? "Luk post" : "Åben post"),
            locationIsFirstLocation ? null :
                elements.createElement("button", { "hx-post": "/master/makeLocationFirstLocation", class: "button button-secondary", "hx-vals": JSON.stringify({ locationId: location.id }), "hx-swap": "none", "hx-on--after-request": `window.location.replace('${"/master/location_page"}?locationId=${location.id}')` }, "G\u00F8r til f\u00F8rste lokation")),
        elements.createElement("h2", null, "Status"),
        await (0, locationStatusHandler_1.getLocationStatusTable)(request, locationService).then(res => res.content),
        elements.createElement("h2", null, "Ruter til lokationen"),
        elements.createElement("div", { class: "table-wrapper" }, (0, RouteConfigHandler_2.table)(locationService, locationService.allRoutesToLocation(location.id), location.id, false, true)),
        elements.createElement("h2", null, "Ruter fra lokationen"),
        elements.createElement("div", { class: "table-wrapper" }, (0, RouteConfigHandler_2.table)(locationService, locationService.allRoutesFromLocation(location.id), location.id, true, false)),
        elements.createElement("h2", null, "Patruljeopdateringer"),
        elements.createElement("div", null, await (0, patrolUpdatesHandler_1.getPatrolUpdatesTable)(request, updateService, locationService, patrolService).then(res => res.content)));
    const html = renderMasterPage(`Lokation: ${location.name}`, content);
    return responses.ok(html);
};
exports.locationPage = locationPage;
const patrolsUrl = (patrolId) => {
    return `${"/master/patrolUpdatesTable"}?patrolId=${patrolId}`;
};
exports.patrolsUrl = patrolsUrl;
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
            <span class="brand-title">${process_1.env.COMPETITION_NAME + ' ⋅ WebSpejd' || "WebSpejd"}</span>
            <a href="/" class="header-link" title="Hjem">🏠</a>
            <a href="/master" class="header-link" title="Master">📊</a>
        </div>
        ${content}
        ${script ?? ""}
        <script src="https://unpkg.com/htmx.org@2.0.3"></script>
    </body>
</html>`;
//# sourceMappingURL=pages.js.map