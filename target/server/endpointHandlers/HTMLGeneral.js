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
exports.multiSelectDropdown = exports.anchorToAddPatrolUpdatePage = exports.formatPatrol = exports.formatUpdateLocation = exports.formatLocationAnchor = exports.hxTrigger = exports.isClassOnElement = exports.removeClassFromElement = exports.addClassToElement = exports.getElementById = void 0;
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
const multiSelectDropdown = (props) => {
    const { id, name, options, placeholder = "Vælg...", selectedValues = [] } = props;
    const selectedSet = new Set(selectedValues.map(v => String(v)));
    return elements.createElement("div", { class: "multi-select-container", style: "position: relative; min-width: 200px;" },
        elements.createElement("input", { type: "hidden", id: `${id}-hidden`, name: name, value: "" }),
        elements.createElement("div", { id: `${id}-display`, class: "multi-select-display", onclick: `window.multiSelectDropdown.toggleDropdown('${id}')`, style: JSON.stringify({
                padding: '10px 15px',
                border: '2px solid #3498db',
                borderRadius: '8px',
                backgroundColor: '#fff',
                cursor: 'pointer',
                userSelect: 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'all 0.3s ease'
            }) },
            elements.createElement("span", { style: "margin-left: 10px; display: inline-block;" }, "\u25BC")),
        elements.createElement("div", { id: `${id}-dropdown`, class: "multi-select-dropdown", style: `
                display: none;
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                margin-top: 5px;
                background-color: #fff;
                border: 2px solid #3498db;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                z-index: 1000;
                max-height: 300px;
                overflow-y: auto
            ` },
            elements.createElement("div", { style: "padding: 10px; border-bottom: 1px solid #ecf0f1;" },
                elements.createElement("button", { type: "button", class: "button", onclick: `window.multiSelectDropdown.selectAll('${id}')`, style: "width: 100%; padding: 8px; font-size: 14px;" }, "V\u00E6lg alle / Frav\u00E6lg alle")),
            elements.createElement("div", { style: "padding: 5px;" }, options.map(option => {
                const isChecked = selectedSet.has(String(option.value));
                return elements.createElement("label", { style: `
                            display: flex;
                            align-items: center;
                            padding: 8px 10px;
                            cursor: pointer;
                            transition: background-color 0.2s ease
                        `, onmouseover: "this.style.backgroundColor='#ecf0f1'", onmouseout: "this.style.backgroundColor='transparent'" },
                    elements.createElement("input", { type: "checkbox", value: option.value, checked: isChecked, onchange: `window.multiSelectDropdown.updateDisplay('${id}')`, style: "margin-right: 10px;" }),
                    elements.createElement("span", { style: "flex: 1;" }, option.label));
            }))),
        elements.createElement("script", null, `
                document.addEventListener('DOMContentLoaded', () => {
                    window.multiSelectDropdown.updateDisplay('${id}', '${placeholder}');
                    // window.multiSelectDropdown.toggleDropdown('${id}');
                });
                // Close dropdown when clicking outside
                document.addEventListener('click', function(event) {
                    const container = document.getElementById('${id}-display').parentElement;
                    if (!container.contains(event.target)) {
                        document.getElementById('${id}-dropdown').style.display = 'none';
                    }
                });
            `));
};
exports.multiSelectDropdown = multiSelectDropdown;
//# sourceMappingURL=HTMLGeneral.js.map