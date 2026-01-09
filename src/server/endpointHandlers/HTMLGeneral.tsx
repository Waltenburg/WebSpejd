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

    return <a href={`${Endpoints.MasterLocation}?id=${location.id}`}
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
    return `#${patrol.number} ${patrol.name}`;
};

export const locationName = (locationId: number, locationService: LocationService): string => {
    return locationService.locationInfo(locationId)?.name || "Ukendt lokation";
};

export const clock = (date: Date): string => {
    return date.toTimeString().split(' ')[0]; // hh:mm:ss
};