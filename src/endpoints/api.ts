import { DatabaseWrapper } from "../database";
import { Routing, Routes, Request, UserType } from "../request";
import { Response } from "../response";
import * as responses from "../response";

export class Api implements Routing {
    private db: DatabaseWrapper;

    constructor(db: DatabaseWrapper) {
        this.db = db;
    }

    routes = (): Routes => {
        return new Routes()
            .post("/patrol/create", UserType.Master, this.createPatrol)
            .post("/patrol/change", UserType.Master, this.changePatrol)
            .post("/patrol/delete", UserType.Master, this.deletePatrol)
            .post("/post/create", UserType.Master, this.createPost)
            .post("/post/change", UserType.Master, this.changePost)
            .post("/post/delete", UserType.Master, this.deletePost);
    }

    createPatrol = async (request: Request): Promise<Response> => {
        const patrol = JSON.parse(await request.body());
        this.db.createPatrol(patrol);
        return responses.ok();
    }

    changePatrol = async (request: Request): Promise<Response> => {
        const patrolChange = JSON.parse(await request.body());
        this.db.changePatrol(patrolChange["patrolId"], patrolChange["change"]);
        return responses.ok();
    }

    deletePatrol = async (request: Request): Promise<Response> => {
        const body = JSON.parse(await request.body());
        this.db.deletePatrol(body["patrolId"]);
        return responses.ok();
    }

    createPost = async (request: Request): Promise<Response> => {
        const post = JSON.parse(await request.body());
        this.db.createPost(post);
        return responses.ok();
    }

    changePost = async (request: Request): Promise<Response> => {
        const postChange = JSON.parse(await request.body());
        this.db.changePost(postChange["postId"], postChange["change"]);
        return responses.ok();
    }

    deletePost = async (request: Request): Promise<Response> => {
        const body = JSON.parse(await request.body());
        this.db.deletePost(body["postId"]);
        return responses.ok();
    }

}
