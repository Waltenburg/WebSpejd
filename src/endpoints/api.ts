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
        const name = request.getParam("name");
        if(name === null) {
            return responses.bad_request("Missing parameter: name");
        }
        this.db.createPatrol(name);
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
        return responses.ok()
    }

}
