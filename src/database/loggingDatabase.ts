import { Checkin, CheckinType, Database, Patrol, Post } from "./generic";
import * as logging from "../logging";
import { nextPostId } from "../utils";

export class LoggingDatabase implements Database {
    private inner: Database;

    constructor(inner: Database) {
        this.inner = inner;
    }

    latestCheckinOfPatrol(patrol: number): Checkin | null {
        return this.inner.latestCheckinOfPatrol(patrol);
    }

    checkin(checkin: Checkin): void {
        logging.debug(checkin);

        this.inner.checkin(checkin);

        const patrolId = checkin.patrolId;
        const postId = checkin.postId;
        if(checkin.type === CheckinType.CheckIn) {
            logging.writeToPatrolLog(`Patrol ${patrolId} checked in at ${postId}`);
        } else {
            const detour = checkin.type === CheckinType.Detour;
            const nextPost = nextPostId(this.inner, postId, detour);
            logging.writeToPatrolLog(
                `Patrulje ${patrolId} tjekkes ud fra ${postId} og går mod ${nextPost}`
            );
        }
    }

    patrolInfo(patrolId: number): Patrol {
        return this.inner.patrolInfo(patrolId);
    }

    changePatrolStatus(patrolId: number, udgået: boolean): void {
        const patrolInfo = this.inner.patrolInfo(patrolId);
        const changedHappened = patrolInfo.udgået !== udgået;

        this.inner.changePatrolStatus(patrolId, udgået);

        if(!changedHappened) {
            return;
        }

        if(udgået) {
            logging.writeToPatrolLog(`${patrolId} udgår`);
        } else {
            logging.writeToPatrolLog(`${patrolId} genindgår`);
        }
    }

    allPatrolIds(): number[] {
        return this.inner.allPatrolIds();
    }

    postInfo(postId: number): Post {
        return this.inner.postInfo(postId);
    }

    changePostStatus(postId: number, open: boolean): void {
        this.inner.changePostStatus(postId, open);

        if(open) {
            logging.log(`Åbner post ${postId}`);
        } else {
            logging.log(`Lukker post ${postId}`);
        }
    }

    allPostIds(): number[] {
        return this.inner.allPostIds();
    }

    checkinsAtPost(postId: number): Checkin[] {
        return this.inner.checkinsAtPost(postId);
    }

    deleteCheckin(checkinId: number): void {
        return this.inner.deleteCheckin(checkinId);
    }

    reset(): void {
        logging.log("Resetting database");
        this.inner.reset();
    }
}
