import { Database, ServiceBase } from "./database.js";
export declare class AdminService extends ServiceBase {
    constructor(db: Database);
    /**
     * Get post id matching password.
     *
     * @param password the password to login with
     * @returns the post id of the post authenticated with
     */
    authenticate(password: string): number | undefined;
    addUser(locationId: number, password: string): number;
    deleteUser(userId: number): boolean;
    /**
     * Get list of all user ids.
     *
     * @returns list of user ids
     */
    userIds(): number[];
    /**
     * Get all passwords registered for a location.
     *
     * @param locationId the location to fetch passwords for
     * @returns list of { id, password } rows
     */
    passwordsForLocation(locationId: number): {
        id: number;
        password: string;
    }[];
    setMasterPassword(newPassword: string): void;
    /**
     * Get all settings as key-value pairs.
     *
     * @returns dictionary with all settings
     */
    private getAllSettings;
}
//# sourceMappingURL=adminService.d.ts.map