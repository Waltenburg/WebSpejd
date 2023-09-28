import * as http from 'http'
import * as fs from 'fs'
import { serverClasses as sc } from './serverClasses'
import { files } from './files'
import { update } from 'plotly.js';
namespace CCMR_server {
    process.chdir(__dirname);
    const hostname = '127.0.0.1';
    const port = 3000;

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
        }
        let lastUpdates: string[] = []
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
    namespace patruljer{ //Funktioner der varetager patruljerne
        export const sendAllPatruljerTowardsFirstPost = () => {
            const time = getTimeString()
            ppMatrix.forEach((patrulje) => {
                patrulje.push(time)
            })
        }
        export const canPatruljeBeCheckedUd = (pNum: number, post: number): boolean => {
            return (ppMatrix[pNum].length == 3 * post + 2  && loeb.patruljeIkkeUdgået(pNum))
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
                if(nextPostIsOmvej && !patruljeSkalPåOmvej){ //Tilføjer tomme felter hvis næste post er en omvej og patruljen IKKE skal på omvej
                    for (let i = 0; i < 3; i++) {
                        ppMatrix[pIndex].push("") 
                    }
                }
                ppMatrix[pIndex].push(getTimeString(date))
                lastUpdateTimesPost[currentPostIndex + postIndexAddition(omvejOrPost, currentPostIndex)] = date.getTime()
            }
        }
        export const checkPatruljeInd = (pIndex: number, currentPostIndex: number) => {
            ppMatrix[pIndex].push(getTimeString())
            const date = new Date().getTime()
            lastUpdateTimesPost[currentPostIndex] = date
            lastUpdateTimesPatrulje[pIndex] = date
        }
        export const postIndexAddition = (postOrOmvej: string, userPostIndex: number): number => {
            let postIndexAddition = 1 //Alt efter om patruljen skal på omvej og om den næste post er en omvej, er den næste post jo noget forskelligt
            if(postOrOmvej == "post" && poster[userPostIndex + 1].erOmvej)
                postIndexAddition = 2
            return postIndexAddition
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
                    if(user.master)
                        res.setHeader("isMaster", "true")
                    res.writeHead(200)
                    res.end()
                    succes = true
                    break
                }
            }
            console.log("User logging in: " + password + " - " + identifier)
            if(!succes){
                res.writeHead(403)
                res.end();
            }
        }
        export const getUpdateReq = (req: http.IncomingMessage, res: http.ServerResponse): void => {
            const userPost = sc.User.recognizeUser(req.headers['id'] as string)
            if(userPost == -1){ //Bruger ikke recognized
                res.writeHead(403)
                res.end()
            }else if (userPost != Infinity){ //Bruger er mandskab
                const userLastUpdate = parseInt(req.headers['last-update'] as string)
                if(userLastUpdate < lastUpdateTimesPost[userPost]){ //Der er kommet ny update siden sidst klienten spurgte
                    res.setHeader("update", "true")
                    getDataReq(req, res)
                }
                else{
                    res.setHeader("update", "false")
                    res.end()
                }
            }
        }
        export const getDataReq = (req: http.IncomingMessage, res: http.ServerResponse): void => {
            const userPost = sc.User.recognizeUser(req.headers['id'] as string)
            //console.log("Get data request with post: " + userPost.toString())
            if(userPost == null || userPost == Infinity)
                res.writeHead(403)
            else if(userPost >= 0){ //Bruger er mandskab
                let omvejÅben: boolean
                if(userPost >= poster.length - 1 || poster[userPost].erOmvej){ //Sidste post eller posten er en omvej
                    omvejÅben = false
                }else
                    omvejÅben = poster[userPost + 1].erOmvej ? poster[userPost + 1].omvejÅben: false
    
                res.setHeader("data", JSON.stringify({
                    "påPost": patruljer.patruljerPåPost(userPost),
                    "påVej": patruljer.patruljerPåVej(userPost),
                    "post": poster[userPost].navn,
                    "omvejÅben": omvejÅben,
                }))
            }
            res.end()
        }
        export const sendUpdateReq = (req: http.IncomingMessage, res: http.ServerResponse): void => {
            const headers = req.headers
            const userPostIndex = sc.User.recognizeUser(headers['id'] as string)
            let status = 200
            if(userPostIndex >= 0 && userPostIndex != Infinity){ //Brugeren er genkendt og er mandskb (eller udgiver sig for at være det (master))
                try{
                    const update = req.headers['update'] as string //{patruljenummer}%{melding}%{post/omvej}
                    const split = update.split('%')
                    const pIndex = Number.parseInt(split[0]) - 1
                    const melding = split[1]
                    const commit = req.headers['commit-type'] as string == "commit"
                    if(melding == "ud"){ //Klienten vil tjekke en patrulje UD eller undersøge om det er muligt
                        if(patruljer.canPatruljeBeCheckedUd(pIndex, userPostIndex)){ //Patrulje kan tjekkes ud ifølge ppMatrix
                            if(commit){ //Klienten vil gerne comitte ændringerne
                                const postOrOmvej = split[2]
                                patruljer.checkPatruljeUdAndTowardsNext(pIndex, userPostIndex, postOrOmvej)//Check patrulje ud og sæt som gå mod enten post eller omvej
                                if(userPostIndex < poster.length - 1){ //Den nuværende post er IKKE den sidste post
                                    let postAddition = patruljer.postIndexAddition(postOrOmvej, userPostIndex)
                                    log.writeToPatruljeLog(`Patrulje ${pIndex + 1} tjekkes UD fra ${poster[userPostIndex].navn} og går mod ${poster[userPostIndex + postAddition].navn}`)
                                }
                                else
                                    log.writeToPatruljeLog(`Patrulje ${pIndex + 1} tjekkes UD fra ${poster[userPostIndex].navn} og går mod MÅL`)
                            }
                        }
                        else //Patrulje kan IKKE blive tjekket UD ifølge ppMatrix
                            status = 400
                    }else if(melding == "ind"){ //Klienten vil tjekke en patrulje IND eller undersøge om det er muligt
                        if(patruljer.canPatruljeBeCheckedIn(pIndex, userPostIndex)){ //Patruljen kan tjekkes IND ifølge ppMatrix
                            if(commit){ //Klienten vil gerne comitte ændringerne
                                patruljer.checkPatruljeInd(pIndex, userPostIndex)
                                log.writeToPatruljeLog(`Patrulje ${pIndex + 1} tjekkes IND på post ${poster[userPostIndex].navn}`)
                            }
                        }else //Patrulje kan IKKE blive tjekket IND ifølge ppMatrix
                            status = 400
                    }
                }catch(error){
                    console.log("Error in update: " + error)
                    status = 400
                }
            }
            else{
                status = 403
            }
            fs.writeFile("data/ppMatrix.json", JSON.stringify(ppMatrix), () => {})
            res.writeHead(status)
            res.end()
        }
        export const masterDataReq = (req: http.IncomingMessage, res: http.ServerResponse): void => {
            const isMaster = sc.User.recognizeUser(req.headers['id'] as string) == Infinity
            if(isMaster){
                res.setHeader("data", JSON.stringify({
                    "loeb": loeb,
                    "ppMatrix": ppMatrix,
                    "poster": poster,
                    "sidsteMeldinger": log.getNewUpdates()
                }))
            }
            else
                res.writeHead(403)
            res.end()
        }
        export const masterUpdateReq = (req: http.IncomingMessage, res: http.ServerResponse): void => {
            if(sc.User.recognizeUser(req.headers['id'] as string) == Infinity){ //User is master
                const mastersLastUpdate = parseInt(req.headers['last-update'] as string)
                let patruljerDerSkalOpdateres: number[] = []
                let ppArrays: string[][] = []
                for (let p = 0; p < lastUpdateTimesPatrulje.length; p++) {
                    if(mastersLastUpdate < lastUpdateTimesPatrulje[p]){ //patrulje skal opdateres
                        patruljerDerSkalOpdateres.push(p)
                        ppArrays.push(ppMatrix[p])
                    }
                }
                if(patruljerDerSkalOpdateres.length > 0){
                    res.setHeader("update", "true")
                    res.setHeader("data", JSON.stringify({
                        "patruljer": patruljerDerSkalOpdateres,
                        "ppArrays": ppArrays,
                        "senesteUpdates": log.getNewUpdates()
                    }))
                }
                else
                    res.setHeader("update", "false")
                res.writeHead(200)
            }else
                res.writeHead(403)
            res.end()
        }
        export const patruljeMasterUpdate = (req: http.IncomingMessage, res: http.ServerResponse): void => {
            if(sc.User.recognizeUser(req.headers['id'] as string) == Infinity){ //User is master
                }
                const patruljeUdgår = () => {
                    if(loeb.patruljeIkkeUdgået(pNum)){
                        succes = true
                        loeb.patruljeUdgår(pNum)
                    }
                }
                const patruljeGeninddgår = () => {
                    if(!loeb.patruljeIkkeUdgået(pNum)){
                        succes = true
                        loeb.patruljeGeninddgår(pNum)
                    }
                }

                const action = req.headers['action'] as string
                let succes: boolean = false
                let pNum = Number(req.headers['pnum'] as string)

                switch (action) {
                    case "UDGÅ":
                        patruljeUdgår()
                        break
                    case "GEN-INDGÅ":
                        patruljeGeninddgår()
                        break
                }
                if(succes){
                    res.writeHead(200)
                    log.writeToPatruljeLog(`Patrulje ${pNum + 1} ${action}R ${action == "UDGÅ" ? "fra": "i"} løbet`)
                }
                else
                    res.writeHead(400)
                res.end()
        }
        export const postMasterUpdate = (req: http.IncomingMessage, res: http.ServerResponse): void => {
            if(sc.User.recognizeUser(req.headers['id'] as string) == Infinity){ //User is master
                const omvejLukker = () => {
                    console.log("LUKKER")
                    if(post.erOmvej && post.omvejÅben){
                        post.omvejÅben = false
                        succes = true
                    }
                }
                const omvejÅbner = () => {
                    if(post.erOmvej && !post.omvejÅben){
                        post.omvejÅben = true
                        succes = true
                    }
                }
                
                let succes: boolean = false
                let pNum = Number(req.headers['post'] as string)
                console.log(pNum)
                const post = poster[pNum]
                switch (req.headers['action'] as string) {
                    case "LUKKE":
                        omvejLukker()
                        break
                    case "ÅBNE":
                        omvejÅbner()
                        break
                }
                if(succes){
                    res.writeHead(200)
                    lastUpdateTimesPost[pNum - 1] = new Date().getTime()
                }
                else
                    res.writeHead(400)
            }
                res.end()
        }
    }

    const cleanUpServer = (options:any, event:string) => {
        console.log("Program exiting with code: " + event)
        console.log(event)
        try{
            log.writeToServerLog("Program exiting with code: " + event)
            fs.writeFileSync("data/users.json", JSON.stringify(sc.User.users))
            fs.writeFileSync("data/loeb.json", JSON.stringify(loeb))
        }catch{
            console.log("Problem with writing to server log")
            process.exit()
        }
        process.exit()
    };
    const getTimeString = (date?: Date) => {
        if(date == undefined)
            date = new Date()
        return date.getFullYear() +'-'+ (date.getMonth() + 1) +'-'+ (date.getDate()) + ' ' + date.getHours()+':'+date.getMinutes()+':'+date.getSeconds()
    }
    [`exit`, `SIGINT`, `SIGUSR1`, `SIGUSR2`, `uncaughtException`, `SIGTERM`].forEach((eventType) => {
        process.on(eventType, cleanUpServer.bind(null, eventType));
    })

    //#region -  Loading files into variables and defining variables needed for the server

    log.writeToServerLog("PROGRAM STARTED - Loading files")

    const loeb: sc.Loeb = new sc.Loeb(files.readJSONFileSync("data/loeb.json", true))

    const poster: sc.Post[] = sc.Post.createArray(files.readJSONFileSync("data/poster.json", true))
    console.log(poster[3].erOmvej)

    let ppMatrix: string[][] = files.readJSONFileSync("data/ppMatrix.json") as string[][]
    if(ppMatrix == null){
        ppMatrix = Array.apply(null, Array(loeb.patruljer.length)).map((): string[] => [])
        fs.writeFile("data/ppMatrix.json", JSON.stringify(ppMatrix), () => {})
        console.log("Patruljepost-matrix (ppMatrix.json) oprettet med " + ppMatrix.length + " patruljer")

        patruljer.sendAllPatruljerTowardsFirstPost()
        fs.writeFile("data/ppMatrix.json", JSON.stringify(ppMatrix), () => {})
    }

    sc.User.users = sc.User.createUserArray(files.readJSONFileSync("data/users.json", true))
    sc.User.startDeleteInterval()
    console.log(`Alle filer succesfuldt loadet. Loadet ${poster.length} poster, ${sc.User.users.length} brugere og ${ppMatrix.length} patruljer`)
    log.writeToServerLog(`Alle filer succesfuldt loadet. Loadet ${poster.length} poster, ${sc.User.users.length} brugere og ${ppMatrix.length} patruljer`)

    let lastUpdateTimesPost: number[] = Array.apply(null, Array(poster.length)).map(() => new Date().getTime())
    let lastUpdateTimesPatrulje: number[] = Array.apply(null, Array(ppMatrix.length)).map(() => new Date().getTime())
    //#endregion

    const server: http.Server = http.createServer((req: http.IncomingMessage, res: http.ServerResponse): void => {
        const { headers, method, url } = req
        if (req.method == "GET") {
            // console.log(url)
            if (files.urlIsValidPathToFile(req.url))
                files.sendFileToClient(res, req.url)
            else {
                switch (req.url) {
                    case "/":
                    case "/home":
                        files.sendFileToClient(res, "home.html")
                        break
                    case "/login":
                        reqRes.loginReq(req, res)
                        break
                    case "/mandskab":
                        files.sendFileToClient(res, "mandskab.html")
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
                        files.sendFileToClient(res, "master.html")
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
                        default:
                        res.writeHead(400);
                        res.end()
                        break
                }
            }
        }
        else {
            res.writeHead(400)
            res.end()
        }
    }).listen(port, hostname, () => {
        console.log(`Server is now listening at http://${hostname}:${port}`)
        log.writeToServerLog("Server running")
    })
}