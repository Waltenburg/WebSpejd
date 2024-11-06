import * as http from 'http'
import * as fs from 'fs'
import { serverClasses as sc } from './serverClasses'
import { files } from './files'
import * as users from "./users";

namespace CCMR_server {

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
        export const getPost = (postId: number): sc.Post | undefined => {
            return poster[postId];
        }

        /**
         * Change detour from open to closed or closed to open.
         *
         * @param postId the id of the post to change
         * @returns `true` if status changed, `false` otherwise
         */
        export const changeDetourStatus = (postId: number, open: boolean): boolean => {
            let post = getPost(postId);
            if (!post.erOmvej || post.omvejÅben === open) {
                return false;
            }
            post.omvejÅben = open;
            return true;
        }

    }

    namespace patruljer{ //Funktioner der varetager patruljerne
        export const sendAllPatruljerTowardsFirstPost = (ppMatrix: string[][]) => {
            const time = getTimeString()
            ppMatrix.forEach((patrulje) => {
                patrulje.push(time)
            })
        }
        export const canPatruljeBeCheckedUd = (pNum: number, post: number, postOrOmvej: string): boolean => {
            return (ppMatrix[pNum].length == 3 * post + 2  && loeb.patruljeIkkeUdgået(pNum) && (postOrOmvej == "post" || (postOrOmvej == "omvej" && poster[post + 1].omvejÅben)))
        }
        export const canPatruljeBeCheckedIn = (pNum: number, post: number): boolean => {
            return (ppMatrix[pNum].length == 3 * post + 1 && loeb.patruljeIkkeUdgået(pNum))
        }
        export const patruljerPåPost = (post: number): number[] =>{
            let patruljer: number[] = []
            for (let i = 0; i < ppMatrix.length; i++) {
                if(ppMatrix[i].length == post * 3 + 2 && loeb.patruljeIkkeUdgået(i))
                    patruljer.push(i + 1)
            }
            return patruljer
        }
        export const patruljerPåVej = (post: number): number[] =>{
            let patruljer: number[] = []
            for (let i = 0; i < ppMatrix.length; i++) {
                if(ppMatrix[i].length == post * 3 + 1 && loeb.patruljeIkkeUdgået(i))
                    patruljer.push(i + 1)
            }
            return patruljer
        }
        export const checkPatruljeUdAndTowardsNext = (pIndex: number, currentPostIndex: number, omvejOrPost: string) => {
            const date = new Date()
            ppMatrix[pIndex].push(getTimeString(date))
            lastUpdateTimesPost[currentPostIndex] = date.getTime()
            lastUpdateTimesPatrulje[pIndex] = date.getTime()
            if(currentPostIndex < poster.length - 1){//Hvis det ikke er sidste post, skal der gøres noget mere
                const nextPostIsOmvej = poster[currentPostIndex + 1].erOmvej
                const patruljeSkalPåOmvej = omvejOrPost == "omvej"
                if(nextPostIsOmvej && !patruljeSkalPåOmvej && poster[currentPostIndex + 1].omvejÅben){ //Tilføjer tomme felter hvis næste post er en omvej og patruljen IKKE skal på omvej
                    for (let i = 0; i < 3; i++) {
                        ppMatrix[pIndex].push("") 
                    }
                }
                ppMatrix[pIndex].push(getTimeString(date))
                lastUpdateTimesPost[currentPostIndex + postIndexAddition(omvejOrPost, currentPostIndex)] = date.getTime()
            }
            fs.writeFile("data/ppMatrix.json", JSON.stringify(ppMatrix), () => {});
        }
        export const checkPatruljeInd = (pIndex: number, currentPostIndex: number) => {
            ppMatrix[pIndex].push(getTimeString())
            const date = new Date().getTime()
            lastUpdateTimesPost[currentPostIndex] = date
            lastUpdateTimesPatrulje[pIndex] = date
            fs.writeFile("data/ppMatrix.json", JSON.stringify(ppMatrix), () => {});
        }
        export const postIndexAddition = (postOrOmvej: string, userPostIndex: number): number => {
            let postIndexAddition = 1 //Alt efter om patruljen skal på omvej og om den næste post er en omvej, er den næste post jo noget forskelligt
            if(postOrOmvej == "post" && poster[userPostIndex + 1].erOmvej)
                postIndexAddition = 2
            return postIndexAddition
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
            return !loeb.patruljeIkkeUdgået(patrolId);
        }

        /**
         * Set a patrol status to "udgået".
         *
         * @param patrolId the id of the patrol to change status of
         */
        export const patrolUdgår = (patrolId: number): void => {
            loeb.patruljeUdgår(patrolId);
        }

        /**
         * Remove patrol status of "udgået".
         *
         * @param patrolId the id of the patrol to change status of
         */
        export const patrolGenindgår = (patrolId: number): void => {
            loeb.patruljeGeninddgår(patrolId);
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

        export const getUpdateReq = (req: http.IncomingMessage, res: http.ServerResponse): void => {
            const user = users.userFromRequest(req);
            if (!user.isPostUser()) {
                res.end();
                return;
            }

            const userLastUpdate = parseInt(req.headers['last-update'] as string)
            if(userLastUpdate < lastUpdateTimesPost[user.postId]){ //Der er kommet ny update siden sidst klienten spurgte
                res.setHeader("update", "true")
                getDataReq(req, res)
            }
            else{
                res.setHeader("update", "false")
                res.end()
            }
        }

        export const getDataReq = (req: http.IncomingMessage, res: http.ServerResponse): void => {
            const user = users.userFromRequest(req);
            if(!user.isPostUser()) {
                res.writeHead(403);
                res.end()
                return;
            }

            const post = posts.getPost(user.postId);
            const nextPost = posts.getPost(user.postId + 1);
            let isLastPost = nextPost === undefined;
            let omvejÅben = !isLastPost && !post.erOmvej && nextPost.erOmvej && nextPost.omvejÅben;

            res.setHeader("data", JSON.stringify({
                "påPost": patruljer.patruljerPåPost(user.postId),
                "påVej": patruljer.patruljerPåVej(user.postId),
                "post": post.navn,
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
        export const sendUpdateReq = (req: http.IncomingMessage, res: http.ServerResponse): void => {
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
                patrolId = Number.parseInt(split[0]) - 1;
                melding = split[1]
                postOrOmvej = split[2]
            } catch(error) {
                console.log("Error in update: " + error)
                res.writeHead(400);
                res.end();
                return;
            }

            // Client does not want to commit changes
            if (!commit) {
                res.writeHead(200);
                res.end();
                return;
            }

            let post = posts.getPost(user.postId);

            if(melding == "ud"){ //Klienten vil tjekke en patrulje UD eller undersøge om det er muligt
                // Patrol can not be checked out
                if (!patruljer.canPatruljeBeCheckedUd(patrolId, user.postId, postOrOmvej)) {
                    res.writeHead(400);
                    res.end();
                    return;
                }

                // Check patrulje ud og sæt som gå mod enten post eller omvej
                patruljer.checkPatruljeUdAndTowardsNext(patrolId, user.postId, postOrOmvej)
                if(user.postId < poster.length - 1){ //Den nuværende post er IKKE den sidste post
                    let postAddition = patruljer.postIndexAddition(postOrOmvej, user.postId)
                    let nextPost = posts.getPost(user.postId + postAddition);
                    log.writeToPatruljeLog(`Patrulje ${patrolId + 1} tjekkes UD fra ${post.navn} og går mod ${nextPost.navn}`)
                } else {
                    log.writeToPatruljeLog(`Patrulje ${patrolId + 1} tjekkes UD fra ${post.navn} og går mod MÅL`)
                }
            } else if(melding == "ind"){ //Klienten vil tjekke en patrulje IND eller undersøge om det er muligt
                if (!patruljer.canPatruljeBeCheckedIn(patrolId, user.postId)) {
                    res.writeHead(400);
                    res.end();
                    return;
                }

                patruljer.checkPatruljeInd(patrolId, user.postId)
                log.writeToPatruljeLog(`Patrulje ${patrolId + 1} tjekkes IND på post ${post.navn}`)
            }
            res.writeHead(200)
            res.end()
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
            res.setHeader("recognized", user.isMasterUser() ? "true": "false")

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

            ppMatrix = Array.apply(null, Array(loeb.patruljer.length)).map((): string[] => [])
            patruljer.sendAllPatruljerTowardsFirstPost(ppMatrix)
            fs.writeFile("data/ppMatrix.json", JSON.stringify(ppMatrix), () => {})
            for (let i = 0; i < poster.length; i++) {
                const post = poster[i];
                if(post.erOmvej)
                    post.omvejÅben = true
            }
            loeb.udgåedePatruljer = loeb.patruljer.map(() => false)
            fs.writeFile("data/loeb.json", JSON.stringify(loeb), () => {})
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

            patruljer.sendAllPatruljerTowardsFirstPost(ppMatrix);
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
    console.log(`Alle filer succesfuldt loadet. Loadet ${poster.length} poster, ${sc.User.users.length} brugere og ${ppMatrix.length} patruljer`)
    log.writeToServerLog(`Alle filer succesfuldt loadet. Loadet ${poster.length} poster, ${sc.User.users.length} brugere og ${ppMatrix.length} patruljer`)

    let lastUpdateTimesPost: number[] = Array.apply(null, Array(poster.length)).map(() => new Date().getTime())
    let lastUpdateTimesPatrulje: number[] = Array.apply(null, Array(ppMatrix.length)).map(() => new Date().getTime())
    //#endregion

    let [address, port] = readArguments();
    const server: http.Server = http.createServer((req: http.IncomingMessage, res: http.ServerResponse): void => {
        if (req.method != "GET") {
            res.writeHead(400);
            res.end();
            return;
        }

        console.log(`REQUEST: ${req.url}`);

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
                reqRes.getUpdateReq(req, res)
                break
            case "/getData":
                reqRes.getDataReq(req, res)
                break
            case "/sendUpdate":
                reqRes.sendUpdateReq(req, res)
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
