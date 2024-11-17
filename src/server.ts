import * as http from 'http'
import * as fs from 'fs'
import { serverClasses as sc } from './serverClasses'
import { files } from './files'
import * as users from "./users";
import { Checkin, CheckinType, Post } from "./database/generic";
import { JsonDatabase } from "./database/jsonDatabase";

namespace CCMR_server {
    const database = new JsonDatabase("data/database.json");

    namespace log{
        const patruljeLogWriteStream = fs.createWriteStream("data/patruljeLog.txt", {flags:'a'})
        const serverLogWriteStream = fs.createWriteStream("data/serverLog.txt", {flags:'a'});
        export const writeToServerLog = (message: string) => {
            serverLogWriteStream.write("\n" + getTimeString() + " - " + message)
        }
        export const writeToPatruljeLog = (melding: string) => {
            const skriv = getTimeString() + " - " + melding
            patruljeLogWriteStream.write(skriv + "\n")
            addToLastUpdates(skriv)
            patruljer.updatePostStatus()
        }
        let lastUpdates: string[] = ["", "", "", "", "", ""]
        let lastUpdatesIndex: number = 0
        const numberOfLogsToKeep = 6
        const addToLastUpdates = (update: string): void => {
            lastUpdates.push(update)
            lastUpdatesIndex++
            if(lastUpdates.length > numberOfLogsToKeep)
                lastUpdates.shift()
        }
        export const getNewUpdates = (): string[] => {
            return lastUpdates
        }
    }

    namespace posts {

        /**
         * Get post information.
         *
         * @param postId the id of the post
         * @returns information about post
         */
        export const getPost = (postId: number): Post => {
            return database.postInfo(postId);
        }

        /**
         * Change detour from open to closed or closed to open.
         *
         * @param postId the id of the post to change
         * @returns `true` if status changed, `false` otherwise
         */
        export const changeDetourStatus = (postId: number, open: boolean): boolean => {
            let post = getPost(postId);
            if (!post.detour || post.open === open) {
                return false;
            }
            database.changePostStatus(postId, open);
            return true;
        }

    }

    namespace patruljer { //Funktioner der varetager patruljerne

        /**
         * Check all patrols in at post 0.
         */
        export const sendAllPatruljerTowardsFirstPost = () => {
            console.log("Sending all patrols to first post");
            let time = new Date();
            database.allPatrolIds().forEach((patrolId) => {
                applyCheckin({
                    patrolId: patrolId,
                    postId: 0,
                    type: CheckinType.CheckIn,
                    time: time,
                });
            });
        }

        /**
         * Verifies that a patrol can be checkout out of a post.
         *
         * @param patrolId the id of the patrol to check out
         * @param postId the id of the post to check out of
         * @param detour `true` if the patrol is sent on a detour, `false` otherwise
         * @return `true` if the patrol can be checked out, `false` otherwise
         */
        export const canPatruljeBeCheckedUd = (patrolId: number, postId: number, detour: boolean): boolean => {
            const lastCheckin = database.latestCheckinOfPatrol(patrolId);
            const patrolInfo = database.patrolInfo(patrolId);
            const nextPostIsDetour = database.postInfo(postId + 1).detour;

            return lastCheckin.postId === postId
                && lastCheckin.type === CheckinType.CheckIn
                && !patrolInfo.udgået
                && (detour ? nextPostIsDetour : true);
        }

        /**
         * Check if a patrol can be checked in at a post.
         *
         * @param patrolId the id of the patrol
         * @param postId the id of the post
         * @return `true` if the patrol can be checked in, `false` otherwise
         */
        export const canPaltrolBeCheckedIn = (patrolId: number, postId: number): boolean => {
            const lastCheckin = database.latestCheckinOfPatrol(patrolId);
            const patrolIsOnDetour = lastCheckin.type === CheckinType.Detour;
            const patrolInfo = database.patrolInfo(patrolId);

            return lastCheckin.type !== CheckinType.CheckIn
                && nextPostId(lastCheckin.postId, patrolIsOnDetour) === postId
                && !patrolInfo.udgået;
        }

        /**
         * Get list of patrols at a post.
         * @param postId the id of the post
         * @returns the patrol ids of the patrols at the post
         */
        export const patruljerPåPost = (postId: number): number[] => {
            let checkins = database.checkinsAtPost(postId);
            let patrolsCheckedOut = checkins
                .filter((checkin) => checkin.type !== CheckinType.CheckIn)
                .map((checkin) => checkin.patrolId);
            let patrolsAtPost = checkins
                .filter((checkin) => {
                    return checkin.type === CheckinType.CheckIn
                    && !patrolsCheckedOut.includes(checkin.patrolId)
                })
                .map((checkin) => checkin.patrolId);
            return patrolsAtPost;
        }

        /**
         * Get patrols on detour from post.
         *
         * @param postId the id of the post the patrol is on detour from.
         * @return a list of patrol ids
         */
        export const patruljerPåVej = (postId: number): number[] => {
            return database.allPatrolIds()
                .filter((patrolId) => canPaltrolBeCheckedIn(patrolId, postId));
            // let patrolsCheckedIn = database.checkinsAtPost(postId)
            //     .filter((checkin) => checkin.type === CheckinType.CheckIn)
            //     .map((checkin) => checkin.patrolId);
            // return database.checkinsAtPost(postId-1)
            //     .filter((checkin) => {
            //         return checkin.type !== CheckinType.CheckIn
            //             && !patrolsCheckedIn.includes(checkin.patrolId);
            //     })
            //     .map((checkin) => checkin.patrolId);
        }

        export const nextPostId = (postId: number, detour: boolean): number => {
            //Alt efter om patruljen skal på omvej og om den næste post er en omvej, er den næste post jo noget forskelligt
            if(!detour && posts.getPost(postId + 1).detour) {
                return postId + 2;
            }
            return postId + 1;
        }

        export const updatePostStatus = (): void => {
            postStatus = sc.Post.getPostStatus(poster, ppMatrix, loeb)
        }

        /**
         * Check if a patrol is "udgået".
         *
         * @param patrolId the id of the patrol to check
         * @returns `true` if the patrol is "udgået", `false` otherwise
         */
        export const patrolUdgået = (patrolId: number): boolean => {
            let patrol = database.patrolInfo(patrolId);
            return patrol.udgået;
        }

        /**
         * Set a patrol status to "udgået".
         *
         * @param patrolId the id of the patrol to change status of
         */
        export const patrolUdgår = (patrolId: number): void => {
            database.changePatrolStatus(patrolId, true);
        }

        /**
         * Remove patrol status of "udgået".
         *
         * @param patrolId the id of the patrol to change status of
         */
        export const patrolGenindgår = (patrolId: number): void => {
            database.changePatrolStatus(patrolId, false);
        }

        /**
         * Verify a checkin is valid.
         *
         * @param checkin the checkin to verify
         * @returns `true` if checkin is valid, `false` otherwise
         */
        export const isCheckinValid = (checkin: Checkin): boolean => {
            if(checkin.type === CheckinType.CheckIn) {
                return canPaltrolBeCheckedIn(checkin.patrolId, checkin.postId);
            } else {
                const detour = checkin.type === CheckinType.Detour;
                return canPatruljeBeCheckedUd(checkin.patrolId, checkin.postId, detour);
            }
        }

        /**
         * Apply checkin to database.
         *
         * @param checkin the checkin to apply
         */
        export const applyCheckin = (checkin: Checkin) => {
            console.log(checkin);
            database.checkin(checkin);

            const patrolId = checkin.patrolId;
            const postId = checkin.postId;
            if(checkin.type === CheckinType.CheckIn) {
                log.writeToPatruljeLog(`Patrol ${patrolId} checked in at ${postId}`);
            } else {
                const detour = checkin.type === CheckinType.Detour;
                const nextPost = nextPostId(postId, detour);
                log.writeToPatruljeLog(
                    `Patrulje ${patrolId} tjekkes ud fra ${postId} og går mod ${nextPost}`
                );
            }
        }
    }
    namespace reqRes{ //Alle funktioner der håndterer de specifikke request url's der kommer
        export const loginReq = (req: http.IncomingMessage, res: http.ServerResponse): void => {
            const password = req.headers['password'] as string
            const identifier = req.headers['id'] as string
            let succes = false
            for (let i = 0; i < sc.User.users.length; i++) {
                const user = sc.User.users[i];
                if(user.kode == password){
                    user.addIdentifier(identifier)
                    if(user.master) {
                        res.setHeader("isMaster", "true")
                    }
                    res.writeHead(200)
                    res.end()
                    succes = true
                    break
                }
            }
            // console.log("User logging in: " + password + " - " + identifier)
            if(!succes){
                res.writeHead(403)
                res.end();
            }
        }

        export const postUpdateRequest = (req: http.IncomingMessage, res: http.ServerResponse): void => {
            const user = users.userFromRequest(req);
            if (!user.isPostUser()) {
                res.end();
                return;
            }

            const userLastUpdate = parseInt(req.headers['last-update'] as string)
            const post = posts.getPost(user.postId);

            //Der er kommet ny update siden sidst klienten spurgte
            if(userLastUpdate < post.lastUpdate.getTime()){ 
                res.setHeader("update", "true")
                postDataRequest(req, res)
            }
            else{
                res.setHeader("update", "false")
                res.end()
            }
        }

        export const postDataRequest = (req: http.IncomingMessage, res: http.ServerResponse): void => {
            const user = users.userFromRequest(req);
            if(!user.isPostUser()) {
                res.writeHead(403);
                res.end()
                return;
            }

            const post: Post = posts.getPost(user.postId);
            const nextPost = posts.getPost(user.postId + 1);
            let isLastPost = nextPost === undefined;
            let omvejÅben = !isLastPost && !post.detour && nextPost.detour && nextPost.open;

            res.setHeader("data", JSON.stringify({
                "påPost": patruljer.patruljerPåPost(user.postId),
                "påVej": patruljer.patruljerPåVej(user.postId),
                "post": post.name,
                "omvejÅben": omvejÅben,
            }))
            res.end()
        }

        /**
         * Check patrol in or out.
         *
         * @param req the http request
         * @param res the http response builder
         */
        export const handleCheckinRequest = (req: http.IncomingMessage, res: http.ServerResponse): void => {
            const user = users.userFromRequest(req);

            // User is master or unauthenticated
            if (!user.isPostUser()) {
                res.writeHead(403);
                res.end();
                return;
            }

            let patrolId: number;
            let melding: string;
            let postOrOmvej: string;
            const update = req.headers['update'] as string //{patruljenummer}%{melding}%{post/omvej}
            const commit = req.headers['commit-type'] as string == "commit"
            try {
                const split = update.split('%')
                patrolId = Number.parseInt(split[0]);
                melding = split[1]
                postOrOmvej = split[2]
            } catch(error) {
                console.log("Error in update: " + error)
                res.writeHead(400);
                res.end();
                return;
            }

            const checkin: Checkin = {
                time: new Date(),
                patrolId: patrolId,
                postId: user.postId,
                type: melding === "ind"
                    ? CheckinType.CheckIn
                    : postOrOmvej === "omvej"
                        ? CheckinType.Detour
                        : CheckinType.CheckOut
            };

            if(!patruljer.isCheckinValid(checkin)) {
                res.writeHead(400);
                res.end();
                return;
            }

            // Client wants to commit changes
            if (commit) {
                patruljer.applyCheckin(checkin);
            }

            res.writeHead(200);
            res.end();
        }

        export const masterDataReq = (req: http.IncomingMessage, res: http.ServerResponse): void => {
            const user = users.userFromRequest(req);
            res.setHeader("recognized", user.isMasterUser() ? "true": "false");

            res.setHeader("data", JSON.stringify({
                "loeb": loeb,
                "ppMatrix": ppMatrix,
                "poster": poster,
                "sidsteMeldinger": log.getNewUpdates(),
                "postStatus": postStatus
            }))
            res.end()
        }

        export const masterUpdateReq = (req: http.IncomingMessage, res: http.ServerResponse): void => {
            const user = users.userFromRequest(req);
            res.setHeader("recognized", user.isMasterUser().toString());

            const mastersLastUpdate = parseInt(req.headers['last-update'] as string);
            let patruljerDerSkalOpdateres: number[] = [];
            let ppArrays: string[][] = [];
            for (let p = 0; p < lastUpdateTimesPatrulje.length; p++) {
                if(mastersLastUpdate < lastUpdateTimesPatrulje[p]){ //patrulje skal opdateres
                    patruljerDerSkalOpdateres.push(p);
                    ppArrays.push(ppMatrix[p]);
                }
            }
            if(patruljerDerSkalOpdateres.length > 0){
                res.setHeader("update", "true")
                res.setHeader("data", JSON.stringify({
                    "patruljer": patruljerDerSkalOpdateres,
                    "ppArrays": ppArrays,
                    "senesteUpdates": log.getNewUpdates(),
                    "postStatus": postStatus
                }));
            }
            else {
                res.setHeader("update", "false");
            }
            res.writeHead(200);
            res.end();
        }

        export const patruljeMasterUpdate = (req: http.IncomingMessage, res: http.ServerResponse): void => {
            let user = users.userFromRequest(req);
            if(!user.isMasterUser()) {
                res.writeHead(403);
                res.end();
                return;
            }

            const action = req.headers['action'] as string;
            let patrolId = Number(req.headers['pnum'] as string);

            let patrolIsUdGået = patruljer.patrolUdgået(patrolId);
            let changedHappened = (action === "UDGÅ" && !patrolIsUdGået) || (action == "GEN-INDGÅ" && patrolIsUdGået);

            if (action === "UDGÅ") {
                patruljer.patrolUdgår(patrolId);
            } else if (action === "GEN-INDGÅ") {
                patruljer.patrolGenindgår(patrolId);
            }

            if(changedHappened){
                res.writeHead(200);
                log.writeToPatruljeLog(`Patrulje ${patrolId + 1} ${action}R ${action == "UDGÅ" ? "fra": "i"} løbet`);
                patruljer.updatePostStatus();
            }
            else {
                res.writeHead(400);
            }
            res.end()
        }

        /** Update post status. */
        export const postMasterUpdate = (req: http.IncomingMessage, res: http.ServerResponse): void => {
            const user = users.userFromRequest(req);
            if(!user.isMasterUser()) {
                res.writeHead(403);
                res.end();
                return;
            }

            let postId = Number(req.headers['post'] as string);
            const action = req.headers['action'] as string;
            const openPost = action === "ÅBNE";
            const changeHappened = posts.changeDetourStatus(postId, openPost);

            if(changeHappened){
                res.writeHead(200);
                lastUpdateTimesPost[postId - 1] = new Date().getTime();
            } else {
                res.writeHead(400);
            }
            res.end()
        }

        export const redigerPPM = (req: http.IncomingMessage, res: http.ServerResponse): void => {
            const user = users.userFromRequest(req);
            if(!user.isMasterUser()) {
                res.writeHead(403);
                res.end();
                return;
            }

            const collapseStrAndNull = (str: string): string | null => {
                return str == "" ? null : str;
            }

            const patrolId = Number(req.headers['pnum'] as string)
            const postId = Number(req.headers['post'] as string)
            const mod = collapseStrAndNull((req.headers['mod'] as string).trim())
            const ind = collapseStrAndNull((req.headers['ind'] as string).trim())
            const ud =  collapseStrAndNull((req.headers['ud'] as string).trim())

            let toLog = `MASTER OVERRIDE: Patrulje ${patrolId + 1} `
            let change = false
            try{
                const serverMod = collapseStrAndNull(ppMatrix[patrolId][postId * 3])
                const serverInd = collapseStrAndNull(ppMatrix[patrolId][postId * 3 + 1])
                const serverUd = collapseStrAndNull(ppMatrix[patrolId][postId * 3 + 2])
                const postNavn = poster[postId].navn
                if(mod != serverMod){
                    if(mod == null)
                        toLog += `gå mod ${postNavn} SLETTES; `
                        else
                        toLog += `går mod ${postNavn} ${mod}; `
                    ppMatrix[patrolId][postId * 3] = mod
                    change = true
                }
                if(ind != serverInd){
                    if(ind == null)
                        toLog += `tjek ind på ${postNavn} SLETTES; `
                        else
                        toLog += `tjekkes ind på ${postNavn} ${ind}; `
                    ppMatrix[patrolId][postId * 3 + 1] = ind
                    change = true
                }
                if(ud != serverUd){
                    if(ud == null) {
                        toLog += `tjek ud fra ${postNavn} SLETTES; `
                    } else {
                        toLog += `tjekkes ud fra ${postNavn} ${ud}; `
                    }
                    ppMatrix[patrolId][postId * 3 + 2] = ud
                    change = true
                }
                if(change){
                    log.writeToPatruljeLog(toLog)
                    fs.writeFile("data/ppMatrix.json", JSON.stringify(ppMatrix), () => {})
                }
                //Remove empty fields from end of array
                for (let i = ppMatrix[patrolId].length - 1; i >= 0; i--) {
                    if(ppMatrix[patrolId][i] != "") {
                        break;
                    }
                    ppMatrix[patrolId].pop();
                }
                res.writeHead(200);
            }catch{
                res.writeHead(400);
            }
            res.end();
        }

        /**
         * Reset all data.
         *
         * @param req the incoming http request
         * @param res the http response builder
         */
        export const reset = (req: http.IncomingMessage, res: http.ServerResponse): void => {
            // Check if user is master and the password (SletAltOgSmidLortetUdMedOverhåndskast) given in the header is correct
            // If so, reset all data: create new ppMatrix, open all omveje, set all patruljer to not udgået

            const user = users.userFromRequest(req);
            const hasCorrectPassword = req.headers['password'] == "SletAltOgSmidLortetUdMedOverhåndskast";

            if (!user.isMasterUser() || !hasCorrectPassword) {
                res.writeHead(403);
                res.end();
                return;
            }

            database.reset();
            log.writeToServerLog("LØB NULSTILLET AF KLIENT")
            log.writeToPatruljeLog("LØB NULSTILLET AF KLIENT")
            res.writeHead(200)
            res.end();
        }
    }

    const cleanUpServer = (options:any, event:string) => {
        console.log("Program exiting with code: " + event);
        console.log(event);
        try{
            log.writeToServerLog("Program exiting with code: " + event);
            fs.writeFileSync("data/users.json", JSON.stringify(sc.User.users));
            fs.writeFileSync("data/loeb.json", JSON.stringify(loeb));
        }catch{
            console.log("Problem with writing to server log");
        }
        process.exit()
    };

    const getTimeString = (date?: Date) => {
        if(date == undefined) {}
        date = new Date()
        return date.getFullYear() +'-'+ (date.getMonth() + 1) +'-'+ (date.getDate()) + ' ' + date.getHours()+':'+date.getMinutes()+':'+date.getSeconds()
    }

    /**
     * Read ppmatrix from disk or initialize new pp matrix.
     *
     * @param path the path to the ppmatrix file
     * @returns ppmatrix
     */
    const createPPMatrix = (path: string): string[][] => {
        let ppMatrix: string[][] = files.readJSONFileSync(path) as string[][]
        if(ppMatrix == null){
            ppMatrix = Array.apply(null, Array(loeb.patruljer.length)).map((): string[] => []);
            fs.writeFile(path, JSON.stringify(ppMatrix), () => {});
            console.log("Patruljepost-matrix (ppMatrix.json) oprettet med " + ppMatrix.length + " patruljer");

            patruljer.sendAllPatruljerTowardsFirstPost();
            fs.writeFile(path, JSON.stringify(ppMatrix), () => {});
        }
        return ppMatrix;
    }

    /**
     * Read command line arguments to get address and port.
     * @return binding address and port
     */
    const readArguments = (): [string, number] => {
        let address = "127.0.0.1";
        if (process.argv.length >= 3) {
            address = process.argv[2];
        }

        let port = 3000;
        if (process.argv.length >= 4) {
            port = parseInt(process.argv[3]);
        }

        return [address, port];
    };

    [`exit`, `SIGINT`, `SIGUSR1`, `SIGUSR2`, `uncaughtException`, `SIGTERM`].forEach((eventType) => {
        process.on(eventType, cleanUpServer.bind(null, eventType));
    })

    //#region -  Loading files into variables and defining variables needed for the server

    log.writeToServerLog("PROGRAM STARTED - Loading files")

    const loeb: sc.Loeb = new sc.Loeb(files.readJSONFileSync("data/loeb.json", true))
    const poster: sc.Post[] = sc.Post.createArray(files.readJSONFileSync("data/poster.json", true))
    let ppMatrix: string[][] = createPPMatrix("data/ppMatrix.json");

    let postStatus: number[]
    patruljer.updatePostStatus()

    sc.User.users = sc.User.createUserArray(files.readJSONFileSync("data/users.json", true))
    sc.User.startDeleteInterval()

    const numberOfPosts = database.allPostIds().length;
    const numberOfPatrols = database.allPatrolIds().length;
    const numberOfUsers = sc.User.users.length;
    const startUpMessage =`Alle filer succesfuldt loadet. Loadet ${numberOfPosts} poster, ${numberOfUsers} brugere og ${numberOfPatrols} patruljer`; 
    console.log(startUpMessage);
    log.writeToServerLog(startUpMessage);

    let lastUpdateTimesPost: number[] = Array.apply(null, Array(poster.length)).map(() => new Date().getTime())
    let lastUpdateTimesPatrulje: number[] = Array.apply(null, Array(ppMatrix.length)).map(() => new Date().getTime())
    //#endregion

    patruljer.sendAllPatruljerTowardsFirstPost();
    let [address, port] = readArguments();
    const server: http.Server = http.createServer((req: http.IncomingMessage, res: http.ServerResponse): void => {
        if (req.method != "GET") {
            res.writeHead(400);
            res.end();
            return;
        }

        if (files.isAssetFile(req.url)) {
            let relative_path = req.url.slice(1);
            files.sendFileToClient(res, relative_path);
            return;
        }

        if (files.isClientJs(req.url)) {
            let relative_path = req.url.slice(4);
            let javascript_path = `${__dirname}/clientFiles/${relative_path}`;
            files.sendFileToClient(res, javascript_path);
            return;
        }

        switch (req.url) {
            case "/":
            case "/home":
                files.sendFileToClient(res, "assets/html/home.html")
                break
            case "/plot":
                files.sendFileToClient(res, "assets/html/patruljePlot.html")
                break
            case "/login":
                reqRes.loginReq(req, res)
                break
            case "/mandskab":
                files.sendFileToClient(res, "assets/html/mandskab.html")
                break
            case "/getUpdate":
                reqRes.postUpdateRequest(req, res)
                break
            case "/getData":
                reqRes.postDataRequest(req, res)
                break
            case "/sendUpdate":
                reqRes.handleCheckinRequest(req, res)
                break
            case "/master":
                files.sendFileToClient(res, "assets/html/master.html")
                break
            case "/masterData":
                reqRes.masterDataReq(req, res)
                break
            case "/masterUpdate":
                reqRes.masterUpdateReq(req, res)
                break
            case "/patruljeMasterUpdate":
                reqRes.patruljeMasterUpdate(req, res)
                break
            case "/postMasterUpdate":
                reqRes.postMasterUpdate(req, res)
                break
            case "/redigerPPM":
                reqRes.redigerPPM(req, res)
                break
            case "/reset":
                reqRes.reset(req, res)
                break
            default:
                res.writeHead(400);
                res.end()
                break
        }
    }).listen(port, address, () => {
        console.log(`Server is now listening at http://${address}:${port}`)
        log.writeToServerLog("Server running")
    })
}
