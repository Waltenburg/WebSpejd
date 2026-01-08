import * as elements from 'typed-html';

import { Location, PatrolUpdate } from "@shared/types"
import { LocationService } from "../databaseBarrel"
import { Endpoints } from '@shared/endpoints';

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