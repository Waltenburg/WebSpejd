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
exports.formatUpdateLocation = exports.formatLocationAnchor = void 0;
const elements = __importStar(require("typed-html"));
const formatLocationAnchor = (location) => {
    if (location == null)
        return "Ukendt lokation";
    return elements.createElement("a", { href: `${"/master/location"}?id=${location.id}`, class: "hover-underline" }, location.name);
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
//# sourceMappingURL=HTMLGeneral.js.map