import { LocationService } from "./locationService";
import { PatrolService } from "./patrolService";
import { UpdateService } from "./updateService";

const delimiter = ';'

const headers = [
    'Id',
    'Type',
    'Dato',
    'Tid',
    'Patrulje',
    'Fra',
    'Til',
]

export function toCSVString(updateService: UpdateService, patrolService: PatrolService, locationService: LocationService): string {
    const updates = updateService.allPatrolUpdatesIds().map(id => updateService.updateById(id));
    const patrolNames = patrolService.allPatrolIds().map(id => patrolService.patrolInfo(id).name);
    const locationNames = locationService.allLocationIds().map(id => locationService.locationInfo(id).name);

    const csvContent = [
        headers.join(delimiter),
        ...updates.map(update => {
            return [
                update.id,
                update.currentLocationId === update.targetLocationId ? 'Check ind' : 'Check ud',
                update.time.toLocaleDateString().replace(new RegExp('\\.', 'g'), '/'),
                update.time.toLocaleTimeString().replace(new RegExp('\\.', 'g'), ':'),
                patrolNames[update.patrolId],
                locationNames[update.currentLocationId],
                locationNames[update.targetLocationId]
            ].join(delimiter);
        })
    ].join('\n');

    return csvContent;
}