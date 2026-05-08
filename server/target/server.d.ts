import 'source-map-support/register';
import { Request } from "./request";
import { UpdateService, AdminService, PatrolService, LocationService, Database } from "./databaseBarrel";
import * as responses from "./response";
export type { Server };
type Response = responses.Response;
declare class Server {
    private db;
    private adminService;
    private locationService;
    private patrolService;
    private updateService;
    private logService;
    private users;
    private router;
    /**
     * Create new server.
    */
    constructor(address: string, port: number, assets: string, db: Database, adminService: AdminService, locationService: LocationService, patrolService: PatrolService, updateService: UpdateService);
    private createRouter;
    /**
     * Cleanup server.
     *
     * @param options ?
     * @param event the event that caused the cleanup
     */
    cleanup(_options: any, event: string): void;
    /**
     * Handle login request.
     */
    login: (req: Request) => Promise<Response>;
    logout: (_request: Request) => Promise<Response>;
    /**
     * Get information about post.
     */
    locationDataForMandskab: (req: Request) => Promise<Response>;
    infoForMandskab: (_req: Request) => Promise<Response>;
    tryGet<In, Out>(input: In, map: (input: In) => Out | undefined, errorHandler?: (error: Error) => void): Out | undefined;
    /**
     * End point for checking in or out at a location
     *
     * @param req the http request
     * @return Promise of a response to send to client
     */
    makePatrolUpdate: (request: Request) => Promise<Response>;
    makeMasterBulkPatrolUpdates: (request: Request) => Promise<Response>;
    masterDeletePatrolUpdate: (request: Request) => Promise<Response>;
    mandskabDeleteUpdate: (request: Request) => Promise<Response>;
    masterHeartbeat: (_request: Request) => Promise<Response>;
}
//# sourceMappingURL=server.d.ts.map