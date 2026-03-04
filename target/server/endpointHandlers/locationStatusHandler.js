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
exports.html_locationStatusTable = exports.getLocationStatusTable = void 0;
const elements = __importStar(require("typed-html"));
const HTMLGeneral_1 = require("./HTMLGeneral");
const responses = __importStar(require("../response"));
const getLocationStatusTable = async (request, locationService) => {
    const locationId = Number.parseInt(request.url.searchParams.get("locationId") ?? "");
    let locationIds;
    if (!Number.isNaN(locationId)) {
        locationIds = [locationId];
    }
    else
        locationIds = locationService.allLocationIds("TOPOLOGICAL");
    const searchParamStr = request.url.searchParams.toString();
    const tableHTML = (0, exports.html_locationStatusTable)(locationService, locationIds, searchParamStr);
    return responses.ok(tableHTML);
};
exports.getLocationStatusTable = getLocationStatusTable;
const locationWithPatrolCounts = (locationService, locationId) => {
    const location = locationService.locationInfo(locationId);
    if (!location)
        return null;
    return {
        ...location,
        patrolsOnTheirWay: locationService.patrolsTowardsLocation(locationId).length,
        patrolsOnPost: locationService.patrolsOnLocation(locationId).length,
        patrolsCheckedOut: locationService.patrolsCheckedOutFromLocation(locationId).length
    };
};
const html_locationRow = (locationService, locationId) => {
    const location = locationWithPatrolCounts(locationService, locationId);
    if (!location) {
        return elements.createElement("tr", { class: "hover-grey" },
            elements.createElement("td", { colspan: 4 }, "Ukendt lokation"));
    }
    return elements.createElement("tr", { class: "hover-grey" },
        elements.createElement("td", null, (0, HTMLGeneral_1.formatLocationAnchor)(location)),
        elements.createElement("td", null, location.patrolsOnTheirWay),
        elements.createElement("td", null, location.patrolsOnPost),
        elements.createElement("td", null, location.patrolsCheckedOut));
};
const html_locationStatusTable = (locationService, locationIds, searchParamStr) => {
    return elements.createElement("div", { class: "table-wrapper", id: "location-status-table", "hx-post": "/master/getLocationStatusTable" + "?" + searchParamStr, "hx-trigger": "every 10s", "hx-swap": "outerHTML", "hx-target": "this" },
        elements.createElement("table", null,
            elements.createElement("thead", null,
                elements.createElement("th", null, "Post"),
                elements.createElement("th", null, "P\u00E5 vej"),
                elements.createElement("th", null, "P\u00E5 post"),
                elements.createElement("th", null, "Forladt post")),
            elements.createElement("tbody", { id: "location-status-table-body" }, locationIds.map(locationId => html_locationRow(locationService, locationId)))));
};
exports.html_locationStatusTable = html_locationStatusTable;
//# sourceMappingURL=locationStatusHandler.js.map