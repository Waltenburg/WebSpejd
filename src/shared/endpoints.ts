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
    GetData = "/getData",

    /**
     * Submit patrol update endpoint.\
     * Accessible to: Users logged in as Mandskab.\
     * Purpose: Records a patrol check-in or movement from current location to target location
     */
    SendUpdate = "/sendUpdate",

    /**
     * Delete check-in endpoint for Mandskab page.\
     * Accessible to: Users logged in as Mandskab.\
     * Purpose: Allows deletion of recent patrol updates from their own location
     */
    DeleteCheckin = "/deleteCheckin",

    /**
     * Master dashboard page.
     * Accessible to: Master administrators (UserType.Master)
     * Purpose: Displays the main master control panel with overview of all posts, patrols, and system status
     */
    Master = "/master",

    /**
     * Master check-in creation page.
     * Accessible to: Master administrators (UserType.Master)
     * Purpose: Displays interface for master users to manually create and record patrol check-ins
     */
    MasterAddPatrolUpdatePage = "/master/updatePage",

    /**
     * Master add check-in endpoint.
     * Accessible to: Master administrators (UserType.Master)
     * Purpose: Processes and saves manually created patrol check-ins from master administrators
     */
    MasterAddPatrolUpdate = "/master/addPatrolUpdate",

    /**
     * Master check-ins list page.
     * Accessible to: Master administrators (UserType.Master)
     * Purpose: Displays a comprehensive list of all patrol check-ins in the system with history and status
     */
    MasterPatrolUpdates = "/master/patrolUpdates",

    /**
     * Master posts (locations) list page.
     * Accessible to: Master administrators (UserType.Master)
     * Purpose: Displays all posts/locations in the system with their current status and occupancy information
     */
    MasterPosts = "/master/locations",

    /**
     * Master single post detail page.
     * Accessible to: Master administrators (UserType.Master)
     * Purpose: Displays detailed information about a specific post including patrols present and incoming
     */
    MasterPost = "/master/location",

    /**
     * Master patrols list page.
     * Accessible to: Master administrators (UserType.Master)
     * Purpose: Displays all patrols in the system with their current location, status, and activity history
     */
    MasterPatrols = "/master/patrols",

    /**
     * Master single patrol detail page.
     * Accessible to: Master administrators (UserType.Master)
     * Purpose: Displays detailed information about a specific patrol including location history and status timeline
     */
    MasterPatrol = "/master/patrol",

    /**
     * Master patrol status update endpoint.
     * Accessible to: Master administrators (UserType.Master)
     * Purpose: Allows master users to change patrol status between active (out) and inactive (in)
     */
    MasterPatrolStatus = "/master/patrolStatus",

    /**
     * Master delete check-in endpoint.
     * Accessible to: Master administrators (UserType.Master)
     * Purpose: Allows master administrators to delete any check-in record from the system
     */
    MasterDeletePatrolUpdate = "/master/deletePatrolUpdate",

    /**
     * Master analytics graph page.
     * Accessible to: Master administrators (UserType.Master)
     * Purpose: Displays visual analytics and graphs of patrol movements and location statistics
     */
    MasterGraph = "/master/graph",

    /**
     * Master post status update endpoint.
     * Accessible to: Master administrators (UserType.Master)
     * Purpose: Allows master users to change post status between open and closed
     */
    MasterPostStatus = "/master/locationStatus",

    MasterHeartbeat = "/master/heartbeat",
}