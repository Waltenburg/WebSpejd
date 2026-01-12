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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLocationsTable = void 0;
const elements = __importStar(require("typed-html"));
const responses = __importStar(require("../response"));
const getLocationWithCounts = (locationService, locationId) => {
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
const locationRow = (locationService, locationId) => {
    const location = getLocationWithCounts(locationService, locationId);
    if (!location) {
        return elements.createElement("tr", { class: "hover-grey" },
            elements.createElement("td", { colspan: 4 }, "Ukendt lokation"));
    }
    return elements.createElement("tr", { class: "hover-grey" },
        elements.createElement("td", null,
            elements.createElement("a", { href: `${"/master/location"}?id=${location.id}`, class: "hover-underline" }, location.name)),
        elements.createElement("td", null,
            "P\u00E5 vej: ",
            location.patrolsOnTheirWay),
        elements.createElement("td", null,
            "P\u00E5 post: ",
            location.patrolsOnPost),
        elements.createElement("td", null,
            "Forladt post: ",
            location.patrolsCheckedOut));
};
const locationsTable = (locationService, locationIds) => {
    return elements.createElement("table", { id: "location-table", "hx-post": true },
        elements.createElement("thead", null,
            elements.createElement("td", { class: "bold" }, "Post"),
            elements.createElement("td", { class: "bold" }, "P\u00E5 vej"),
            elements.createElement("td", { class: "bold" }, "P\u00E5 post"),
            elements.createElement("td", { class: "bold" }, "Forladt post")),
        elements.createElement("tbody", { id: "location-table-body" }, locationIds.map(locationId => locationRow(locationService, locationId))));
};
const getLocationsTable = async (request, locationService) => {
    const locationIds = locationService.allLocationIds();
    const tableHTML = locationsTable(locationService, locationIds);
    return responses.ok(tableHTML);
};
exports.getLocationsTable = getLocationsTable;
//# sourceMappingURL=locationTableHandler.js.map