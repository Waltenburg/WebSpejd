import { Database, ServiceBase } from "./database";
export declare class AdminService extends ServiceBase {
    readonly settings: {
        [key: string]: string;
    };
    constructor(db: Database);
    /**
     * Get post id matching password.
     *
     * @param password the password to login with
     * @returns the post id of the post authenticated with
     */
    authenticate(password: string): number | undefined;
    /**
     * Get list of all user ids.
     *
     * @returns list of user ids
     */
    userIds(): number[];
    /**
     * Get all settings as key-value pairs.
     *
     * @returns dictionary with all settings
     */
    private getAllSettings;
}
