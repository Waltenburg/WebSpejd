import * as elements from 'typed-html';
export const getElementById = (id) => {
    return `document.getElementById('${id}')`;
};
export const addClassToElement = (element, className) => {
    return `${element}.classList.add('${className}')`;
};
export const removeClassFromElement = (element, className) => {
    return `${element}.classList.remove('${className}')`;
};
export const isClassOnElement = (element, className) => {
    return `${element}.classList.contains('${className}')`;
};
export const hxTrigger = (element, triggerName) => {
    return `htmx.trigger(${element}, '${triggerName}')`;
};
export const formatLocationAnchor = (location) => {
    if (location === undefined) {
        return "Ukendt lokation";
    }
    return elements.createElement("a", { href: `${"/master/location_page" /* Endpoints.MasterLocationPage */}?locationId=${location.id}`, class: "hover-underline" }, location.name);
};
export const formatUpdateLocation = (locationService, update) => {
    if (update == null) {
        return "Ukendt lokation";
    }
    if (update.currentLocationId === update.targetLocationId) {
        return elements.createElement("span", null,
            "P\u00E5 ",
            formatLocationAnchor(locationService.locationInfo(update.currentLocationId)));
    }
    else {
        return elements.createElement("span", null,
            "Mellem ",
            formatLocationAnchor(locationService.locationInfo(update.currentLocationId)),
            "og ",
            formatLocationAnchor(locationService.locationInfo(update.targetLocationId)));
    }
};
export const formatPatrol = (patrolId, patrolService) => {
    const patrol = patrolService.patrolInfo(patrolId);
    return elements.createElement("a", { href: `${"/master/patrol_page" /* Endpoints.MasterPatrolPage */}?patrolId=${patrol.id}`, class: "hover-underline" }, `#${patrol.number} ${patrol.name}`);
};
export const anchorToAddPatrolUpdatePage = (patrolId, locationId) => {
    const params = new URLSearchParams();
    if (patrolId != undefined)
        params.append("patrolId", patrolId.toString());
    if (locationId != undefined)
        params.append("locationId", locationId.toString());
    return elements.createElement("a", { href: `${"/master/updatePage" /* Endpoints.MasterAddPatrolUpdatePage */}?${params.toString()}`, class: "button", onclick: "document.setCookie('referer', window.location.href, 1);" }, "Lav patruljeopdatering");
};
export const multiSelectDropdown = (props) => {
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
                // color: hasSelected ? '#2c3e50' : '#95a5a6',
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
                    elements.createElement("input", { type: "checkbox", 
                        // name={name}
                        value: option.value, checked: isChecked, onchange: `window.multiSelectDropdown.updateDisplay('${id}')`, style: "margin-right: 10px;" }),
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
//# sourceMappingURL=HTMLGeneral.js.map