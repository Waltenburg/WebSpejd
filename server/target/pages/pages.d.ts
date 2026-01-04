import { Response } from "../response";
import { Request } from "../request";
import { AdminService, Database, LocationService, PatrolService, UpdateService } from "../databaseBarrel";
import { PatrolUpdate, Location } from "@/shared/types";
export declare class Pages {
    private db;
    private locationService;
    private patrolService;
    private updateService;
    private adminService;
    private env;
    constructor(templateDir: string, db: Database, cache: boolean, locationService: LocationService, patrolService: PatrolService, updateService: UpdateService, adminService: AdminService);
    master: () => Promise<Response>;
    locations: () => Promise<Response>;
    location: (request: Request) => Promise<Response>;
    patrolUpdatePage: (request: Request) => Promise<Response>;
    patrolUpdates: (request: Request) => Promise<Response>;
    patrols: (request: Request) => Promise<Response>;
    patrol: (request: Request) => Promise<Response>;
    private patrolsData;
    private locationData;
    /**
     * Render template.
     *
     * @param filename the path to the template file
     * @param data the data for the template
     * @returns the rendered template
     */
    render: (filename: string, data: any) => string;
    /**
     * Render template and return response.
     *
     * @param filename the path to the template file
     * @param data the data for the template
     * @returns the rendered template
     */
    response: (filename: string, data: any) => Response;
    formatPatrolLocation: (latestUpdate: PatrolUpdate) => string;
    formatCheckinLocation: (patrolUpdate: PatrolUpdate) => string;
}
export interface LocationDataToMaster extends Location {
    patrolsOnPost: number;
    patrolsOnTheirWay: number;
    patrolsCheckedOut: number;
}
