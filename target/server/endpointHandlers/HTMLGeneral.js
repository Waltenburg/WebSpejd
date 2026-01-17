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
exports.anchorToAddPatrolUpdatePage = exports.formatPatrol = exports.formatUpdateLocation = exports.formatLocationAnchor = exports.hxTrigger = exports.isClassOnElement = exports.removeClassFromElement = exports.addClassToElement = exports.getElementById = void 0;
const elements = __importStar(require("typed-html"));
const getElementById = (id) => {
    return `document.getElementById('${id}')`;
};
exports.getElementById = getElementById;
const addClassToElement = (element, className) => {
    return `${element}.classList.add('${className}')`;
};
exports.addClassToElement = addClassToElement;
const removeClassFromElement = (element, className) => {
    return `${element}.classList.remove('${className}')`;
};
exports.removeClassFromElement = removeClassFromElement;
const isClassOnElement = (element, className) => {
    return `${element}.classList.contains('${className}')`;
};
exports.isClassOnElement = isClassOnElement;
const hxTrigger = (element, triggerName) => {
    return `htmx.trigger(${element}, '${triggerName}')`;
};
exports.hxTrigger = hxTrigger;
const formatLocationAnchor = (location) => {
    if (location == null)
        return "Ukendt lokation";
    return elements.createElement("a", { href: `${"/master/location_page"}?locationId=${location.id}`, class: "hover-underline" }, location.name);
};
exports.formatLocationAnchor = formatLocationAnchor;
const formatUpdateLocation = (locationService, update) => {
    if (update == null)
        return "Ukendt lokation";
    if (update.currentLocationId === update.targetLocationId) {
        return elements.createElement("span", null,
            "P\u00E5 ",
            (0, exports.formatLocationAnchor)(locationService.locationInfo(update.currentLocationId)));
    }
    else {
        return elements.createElement("span", null,
            "Mellem ",
            (0, exports.formatLocationAnchor)(locationService.locationInfo(update.currentLocationId)),
            "og ",
            (0, exports.formatLocationAnchor)(locationService.locationInfo(update.targetLocationId)));
    }
};
exports.formatUpdateLocation = formatUpdateLocation;
const formatPatrol = (patrolId, patrolService) => {
    const patrol = patrolService.patrolInfo(patrolId);
    return elements.createElement("a", { href: `${"/master/patrol_page"}?patrolId=${patrol.id}`, class: "hover-underline" }, `#${patrol.number} ${patrol.name}`);
};
exports.formatPatrol = formatPatrol;
const anchorToAddPatrolUpdatePage = (patrolId, locationId) => {
    const params = new URLSearchParams();
    if (patrolId != undefined)
        params.append("patrolId", patrolId.toString());
    if (locationId != undefined)
        params.append("locationId", locationId.toString());
    return elements.createElement("a", { href: `${"/master/updatePage"}?${params.toString()}`, class: "button", onclick: "document.setCookie('referer', window.location.href, 1);" }, "Lav patruljeopdatering");
};
exports.anchorToAddPatrolUpdatePage = anchorToAddPatrolUpdatePage;
//# sourceMappingURL=HTMLGeneral.js.map