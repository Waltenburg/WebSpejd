import * as elements from 'typed-html';

import type { Location, PatrolUpdate } from "@shared/types"
import type { LocationService, PatrolService } from "../databaseBarrel"
import { Endpoints } from '@shared/endpoints';

export const getElementById = (id: string): string => {
    return `document.getElementById('${id}')`;
}

export const addClassToElement = (element: string, className: string): string => {
    return `${element}.classList.add('${className}')`;
}

export const removeClassFromElement = (element: string, className: string): string => {
    return `${element}.classList.remove('${className}')`;
}

export const isClassOnElement = (element: string, className: string): string => {
    return `${element}.classList.contains('${className}')`;
}

export const hxTrigger = (element: string, triggerName: string): string => {
    return `htmx.trigger(${element}, '${triggerName}')`;
}

export const formatLocationAnchor = (location: Location | null): string => {
    if (location == null)
        return "Ukendt lokation";

    return <a href={`${Endpoints.MasterLocationPage}?locationId=${location.id}`}
        class="hover-underline">
        {location.name}
    </a>;
}

export const formatUpdateLocation = (locationService: LocationService, update: PatrolUpdate): string => {
    if (update == null)
        return "Ukendt lokation";
    
    if(update.currentLocationId === update.targetLocationId){
        return <span>
            På {formatLocationAnchor(locationService.locationInfo(update.currentLocationId))}
        </span>;
    }else {
        return <span>
            Mellem {formatLocationAnchor(locationService.locationInfo(update.currentLocationId))}
            og {formatLocationAnchor(locationService.locationInfo(update.targetLocationId))}
        </span>;
    }      
}

export const formatPatrol = (patrolId: number, patrolService: PatrolService): string => {
    const patrol = patrolService.patrolInfo(patrolId);
    return <a href={`${Endpoints.MasterPatrolPage}?patrolId=${patrol.id}`} class="hover-underline">
        {`#${patrol.number} ${patrol.name}`}
    </a>
};

export const anchorToAddPatrolUpdatePage = (patrolId?: number, locationId?: number): string => {
    const params = new URLSearchParams();
    if (patrolId != undefined)
        params.append("patrolId", patrolId.toString());
    if (locationId != undefined)
        params.append("locationId", locationId.toString());
    return <a
        href={`${Endpoints.MasterAddPatrolUpdatePage}?${params.toString()}`} class="button"
        onclick="document.setCookie('referer', window.location.href, 1);">
        Lav patruljeopdatering
    </a>
}

export interface MultiSelectOption {
    value: string;
    label: string;
}

export interface MultiSelectDropdownProps {
    id: string;
    name: string;
    options: MultiSelectOption[];
    placeholder?: string;
    selectedValues?: string[];
}

export const multiSelectDropdown = (props: MultiSelectDropdownProps): string => {
    const { id, name, options, placeholder = "Vælg...", selectedValues = [] } = props;
    const selectedSet = new Set(selectedValues.map(v => String(v)));
    
    return <div class="multi-select-container" style="position: relative; min-width: 200px;">
        <input type="hidden" id={`${id}-hidden`} name={name} value="" />
        <div 
            id={`${id}-display`}
            class="multi-select-display"
            onclick={`window.multiSelectDropdown.toggleDropdown('${id}')`}
            style={JSON.stringify({
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
            })}>
            <span style="margin-left: 10px; display: inline-block;">▼</span>
        </div>
        
        <div 
            id={`${id}-dropdown`}
            class="multi-select-dropdown"
            style={`
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
            `}>
            
            <div style="padding: 10px; border-bottom: 1px solid #ecf0f1;">
                <button 
                    type="button"
                    class="button"
                    onclick={`window.multiSelectDropdown.selectAll('${id}')`}
                    style="width: 100%; padding: 8px; font-size: 14px;">
                    Vælg alle / Fravælg alle
                </button>
            </div>
            
            <div style="padding: 5px;">
                {options.map(option => {
                    const isChecked = selectedSet.has(String(option.value));
                    return <label 
                        style={`
                            display: flex;
                            align-items: center;
                            padding: 8px 10px;
                            cursor: pointer;
                            transition: background-color 0.2s ease
                        `}
                        onmouseover="this.style.backgroundColor='#ecf0f1'"
                        onmouseout="this.style.backgroundColor='transparent'">
                        <input 
                            type="checkbox" 
                            // name={name}
                            value={option.value}
                            checked={isChecked}
                            onchange={`window.multiSelectDropdown.updateDisplay('${id}')`}
                            style="margin-right: 10px;" />
                        <span style="flex: 1;">{option.label}</span>
                    </label>;
                })}
            </div>
        </div>
        
        <script>
            {`
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
            `}
        </script>
    </div>;
}