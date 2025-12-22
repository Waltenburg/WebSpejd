import { ServiceBase } from "./database";
import { User } from "./types";

export class AdminService extends ServiceBase {
    /**
     * Get post id matching password.
     *
     * @param password the password to login with
     * @returns the post id of the post authenticated with
     */
    authenticate(password: string): number | undefined{
        // Check if the password is the master password
        const masterPassword = this.prepare("SELECT value FROM settings WHERE key = 'master_password'").get() as { value: string };
        if(masterPassword.value === password) {
            return Infinity;
        }

        // Check if the password is a post password
        const user = this.prepare("SELECT * FROM user WHERE password = ?").get(password) as User | undefined;
        if(user?.locationId == undefined) {
            return undefined;
        }
        return user.locationId;
    }

    /**
     * Get list of all user ids.
     * 
     * @returns list of user ids
     */
    userIds(): number[]{
        const rows = this.prepare("SELECT id FROM user").all() as { id: number }[];
        return rows.map((row) => row.id);
    }
}