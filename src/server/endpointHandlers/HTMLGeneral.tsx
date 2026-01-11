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

export const clock = (date: Date): string => {
    return date.toTimeString().split(' ')[0]; // hh:mm:ss
};