import * as elements from 'typed-html';
import { LocationService, UpdateService } from "../databaseBarrel";

const renderMasterPage = (title: string, content: string) => `
<!DOCTYPE html>
<html>
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <script src="/js/master/base.js" type="module"></script>
        <script src="/js/dialog.js" type="module"></script>
        <link rel="stylesheet" href="/assets/css/master.css">
    </head>
    <body>
        <div id="header">
            <span class="brand-title">CCMR Part XXIX · WebSpejd</span>
            <a href="/" class="header-link" title="Hjem">🏠</a>
            <a href="/master" class="header-link" title="Master">📊</a>
        </div>
        ${content}
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