import { Database } from "./database/generic";

export const nextPostId = (database: Database, postId: number, detour: boolean): number => {
    //Alt efter om patruljen skal på omvej og om den næste post er en omvej, er den næste post jo noget forskelligt
    if(!detour && database.postInfo(postId + 1).detour) {
        return postId + 2;
    }
    return postId + 1;
}
