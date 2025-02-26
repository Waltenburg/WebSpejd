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
            .post("/post/create", UserType.Master, this.createPost);
    }

    createPatrol = async (request: Request): Promise<Response> => {
        const name = request.query["name"];
        if(name === undefined) {
            return responses.bad_request("missing name parameter");
        }
        this.db.createPatrol(name);
        return responses.ok();
    }

    createPost = async (request: Request): Promise<Response> => {
        const post = JSON.parse(request.body);
        this.db.createPost(post);
        return responses.ok();
    }

}
