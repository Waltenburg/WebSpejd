import type { Location, PatrolUpdate } from "@webspejd/core/types";
import type { LocationService, PatrolService } from "../databaseBarrel";
export declare const getElementById: (id: string) => string;
export declare const addClassToElement: (element: string, className: string) => string;
export declare const removeClassFromElement: (element: string, className: string) => string;
export declare const isClassOnElement: (element: string, className: string) => string;
export declare const hxTrigger: (element: string, triggerName: string) => string;
export declare const formatLocationAnchor: (location: Location | undefined) => string;
export declare const formatUpdateLocation: (locationService: LocationService, update: PatrolUpdate) => string;
export declare const formatPatrol: (patrolId: number, patrolService: PatrolService) => string;
export declare const anchorToAddPatrolUpdatePage: (patrolId?: number, locationId?: number) => string;
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
export declare const multiSelectDropdown: (props: MultiSelectDropdownProps) => string;
//# sourceMappingURL=HTMLGeneral.d.ts.map