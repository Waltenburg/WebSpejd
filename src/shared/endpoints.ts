/**
 * API endpoints for the WebSpejd application.
 * 
 * This enum defines all available routes in the application, organized by user type and functionality.
 * Each endpoint serves specific user roles:
 * - None: Accessible without authentication (login/logout)
 * - Post: Accessible by post (location) administrators
 * - Master: Accessible by master administrators only
 * 
 * The endpoints are used by the router to handle HTTP requests and determine appropriate access control
 * and response handlers based on the user's permissions and role.
 */
export const enum Endpoints {
    /**
     * User authentication endpoint.\
     * Accessible to: Unauthenticated users.\
     * Purpose: Authenticates users by validating password.
     */
    Login = "/login",

    /**
     * User logout endpoint.
     * Accessible to: All authenticated users
     * Purpose: Clears user session and redirects to home page
     */
    Logout = "/logout",

    /**
     * Fetch complete data endpoint for mandskab users.
     * Accessible to: Users logged in as Mandskab.
     * Purpose: Returns comprehensive data about patrols at location, patrols en route, location name, and available routes
     */
    GetMandskabData = "/getData",

    // =============================== Pages Endpoints (returning entire pages) ================================
    /**
     * Master dashboard page.
     * Accessible to: Master administrators (UserType.Master)
     * Purpose: Displays the main master control panel with overview of all posts, patrols, and system status
     */
    MainMasterPage = "/master",

    LocationRouteConfigPage = "/master/locationRouteConfig",

    PatrolConfigPage = "/master/patrolConfig",

    /**
     * Master check-in creation page.
     * Accessible to: Master administrators (UserType.Master)
     * Purpose: Displays interface for master users to manually create and record patrol check-ins
     */
    MasterAddPatrolUpdatePage = "/master/updatePage",


    /**
     * Master single location detail page.
     * Accessible to: Master administrators (UserType.Master)
     * Purpose: Displays detailed information about a specific location including patrols present and incoming
     */
    MasterLocationPage = "/master/location_page",

    /**
     * Master single patrol detail page.
     * Accessible to: Master administrators (UserType.Master)
     * Purpose: Displays detailed information about a specific patrol including location history and status timeline
     */
    MasterPatrolPage = "/master/patrol_page",

    /**
     * Home page - public landing page.\
     * Accessible to: All users\
     * Purpose: Displays the main welcome page of the application
     */
    Home = "/",

    /**
     * Home page alias - alternative route to home.\
     * Accessible to: All users\
     * Purpose: Provides an alternative URL path to access the home page
     */
    HomeAlias = "/home",

    /**
     * Mandskab (crew/patrol) page - patrol status and check-in interface.\
     * Accessible to: All users. Users not logged in as Mandskab will be redirected to login page\
     * Purpose: Displays patrol information and allows patrols to manage their current location
     */
    Mandskab = "/mandskab",

    /**
     * Contact page - contact information.\
     * Accessible to: All users\
     * Purpose: Provides contact details.
     */
    Contact = "/contact",

    
    // ================================ Master page utility Endpoints ================================
    MasterHeartbeat = "/master/heartbeat",
    
    // ================================ Patrol Update management Endpoints ================================
    /**
     * Master add check-in endpoint.
     * Accessible to: Master administrators (UserType.Master)
     * Purpose: Processes and saves manually created patrol check-ins from master administrators
     */
    AddPatrolUpdate = "/master/addPatrolUpdate",

    /**
     * Master delete check-in endpoint.
     * Accessible to: Master administrators (UserType.Master)
     * Purpose: Allows master administrators to delete any check-in record from the system
     */
    DeletePatrolUpdate = "/master/deletePatrolUpdate",

    /**
     * Delete check-in endpoint for Mandskab page.\
     * Accessible to: Users logged in as Mandskab.\
     * Purpose: Allows deletion of recent patrol updates from their own location
     */
    MandskabDeletePatrolUpdate = "/deletePatrolUpdateMandskab",

    /**
     * Submit patrol update endpoint.\
     * Accessible to: Users logged in as Mandskab.\
     * Purpose: Records a patrol check-in or movement from current location to target location
     */
    MandskabSendPatrolUpdate = "/sendPatrolUpdateMandskab",

    // =============================== Patrol Updates table and Management Endpoints ================================
    GetPatrolUpdatesTable = "/master/patrolUpdatesTable",


    // ================================ Patrol config Endpoints ================================
    AddPatrol = "/master/addPatrol",

    DeletePatrol = "/master/deletePatrol",

    AlterPatrol = "/master/renamePatrol",

    GetPatrolConfigTable = "/master/getPatrolConfigTable",

    GetPatrolConfigTableBody = "/master/getPatrolConfigTableBody",

    GetPatrolConfigTableRow = "/master/getPatrolConfigTableRow",

    GetPatrolConfigTableRenameRow = "/master/getPatrolConfigTableRenameRow",

    /**
     * Master patrol status update endpoint.
     * Accessible to: Master administrators (UserType.Master)
     * Purpose: Allows master users to change patrol status between active (out) and inactive (in)
     */
    ChangePatrolStatus = "/master/patrolStatus",

    // ================================ Patrol status table Endpoints =====================================
    
    /**
     * Master patrols list page.
     * Accessible to: Master administrators (UserType.Master)
     * Purpose: Displays all patrols in the system with their current location, status, and activity history
     */
    GetPatrolStatusTable = "/master/patrolStatusTable",
    

    // ================================ Location Config Endpoints ============================
    AddLocation = "/master/addLocation",

    DeleteLocation = "/master/deleteLocation",

    RenameLocation = "/master/renameLocation",
    
    ChangeLocationStatus = "/master/changeLocationStatus",

    MakeLocationFirstLocation = "/master/makeLocationFirstLocation",
    
    // ================================ Location config table Endpoints ================================
    GetRenameLocationRow = "/master/renameLocationRow",

    GetLocationConfigTableRow = "/master/getLocationTableRow",
    
    GetLocationConfigTable = "/master/getLocationsTable",

    GetLocationConfigTableBody = "/master/getLocationsTableBody",

    // ================================ Location password Endpoints ================================
    GetLocationPasswords = "/master/getLocationPasswords",

    AddLocationPassword = "/master/addLocationPassword",

    DeleteLocationPassword = "/master/deleteLocationPassword",

    // ================================ Location status table Endpoints ================================
    GetLocationStatusTableRow = "/master/getLocationStatusTableRow",
    
    GetLocationStatusTable = "/master/getLocationStatusTable",

    // ================================ Route Management Endpoints ================================
    
    AddRoute = "/master/addRoute",

    DeleteRoute = "/master/deleteRoute",

    ChangeRouteStatus = "/master/changeRouteStatus",

    // ================================ Route table Endpoints ================================
    GetRouteTableRow = "/master/getRouteTableRow",
    
    GetRoutesTable = "/master/getRoutesTable",

    // ================================ Logs Endpoints ================================
    GetLogs = "/master/getLogs",

}