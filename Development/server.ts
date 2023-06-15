import * as http from 'http'
import * as fs from 'fs'

//import process = require('process');
namespace server {
    //#region -  Setup
    process.chdir(__dirname);
    const hostname = '127.0.0.1';
    const port = 3000;
    //#endregion

    //#region -  Klasser til løbsdata, MIME og interfaces
    interface singleParamCallback<Type> {
        (file: Type): void
    }
    enum MIME {
        html = "text/html",
        json = 'application/JSON',
        css = "text/css",
        jpg = "image/jpg",
        png = "image/png",
        ico = "image/x-icon",
        any = "*/*",
    }
    class Loeb{
        navn: string
        beskrivelse: string
        patruljer: string[]
        udgåedePatruljer: boolean[]
        constructor(obj: any){
            this.navn = obj.navn
            this.beskrivelse = obj.beskrivelse
            this.patruljer = obj.patruljer
            this.udgåedePatruljer = obj.udgåedePatruljer
        }
        patruljeIkkeUdgået = (pNum: number) => {
            return !this.udgåedePatruljer[pNum]
        }
    }
    class Post{
        navn: string
        beskrivelse: string
        erOmvej: boolean
        omvejÅben: boolean

        constructor(obj: any){
            this.navn = obj.navn
            this.beskrivelse = obj.beskrivelse
            this.erOmvej = obj.erOmvej
            this.omvejÅben = obj.omvejÅben
        }

        static createArray(obj: any): Post[]{
            let arr: Post[] = []
            obj.forEach((element: any) => {
                arr.push(new Post(element))
            });
            return arr
        }

        toString(){
            return "Post: " + this.navn + " - " + this.beskrivelse + "     Omvej: " + this.erOmvej.toString() + "     Omvej åben: " + this.erOmvej.toString()
        }
    }
    class User {
        kode: string
        postIndex: number
        identifier: string[]
        master: boolean

        constructor(obj: any){
            this.kode = obj.kode
            this.postIndex = obj.postIndex
            this.identifier = obj.identifier
            this.master = obj.master
        }

        type(): number{
            if(this.master)
                return Infinity
            return this.postIndex
        }
        printIdentifiers(): void{
            console.log(this.identifier)
        }
        static createArray(obj: any): User[]{
            let arr: User[] = []
            obj.forEach((element: any) => {
                arr.push(new User(element))
            });
            return arr
        }
    }
    //#endregion

    //#region -  Functions needed to run server
    const readJSONFileSync = (path: string, critical?: boolean): object => {
        //Removing "/"" at the start of paths 
        if (path[0] == '/')
            path = path.substring(1)
        try{
            return JSON.parse(fs.readFileSync(path, {encoding: "utf8"}))
        }catch (err){
            console.log("Error reading file " + path)
            if(critical)
                process.exit(1)
            return null
        }
    }
    const createJaggedArray = (numOfPatruljer: number): string[][] => {
        let array: string[][] = []
        for (let patruljer = 0; patruljer < numOfPatruljer; patruljer++) {
            array.push([]);
        }
        return array
    }
    const getTimeString = (date?: Date) => {
        if(date == undefined)
            date = new Date()
    return date.getFullYear() +'-'+ (date.getMonth() + 1) +'-'+ (date.getDay()) + ' ' + date.getHours()+':'+date.getMinutes()+':'+date.getSeconds()
    }
    const writeToServerLog = (message: string) => {
        serverLogWriteStream.write("\n" + getTimeString() + " - " + message)
    }
    const writeToPatruljeLog = (melding: string) => {
        patruljeLogWriteStream.write(getTimeString() + " - " + melding + "\n")
    }
    const sendAllPatruljerTowardsFirstPost = () => {
        const time = getTimeString()
        ppMatrix.forEach((patrulje) => {
            patrulje.push(time)
        })
    }
    //@ts-ignore
    const cleanUpServer = (options, event) => {
        console.log("Program exiting with code: " + event)
        try{
            writeToServerLog("Program exiting with code: " + event)
        }catch{
            process.exit()
        }
        process.exit()
    };
    [`exit`, `SIGINT`, `SIGUSR1`, `SIGUSR2`, `uncaughtException`, `SIGTERM`].forEach((eventType) => {
        process.on(eventType, cleanUpServer.bind(null, eventType));
    })
    //#endregion

    //#region -  Loading files into variables and defining variables needed for the server
    const patruljeLogWriteStream = fs.createWriteStream("data/patruljeLog.txt", {flags:'a'})
    const serverLogWriteStream = fs.createWriteStream("data/serverLog.txt", {flags:'a'});
    writeToServerLog("PROGRAM STARTED - Loading files")

    let loeb: Loeb = new Loeb(readJSONFileSync("data/loeb.json", true))
    console.log("Loeb loaded succesfully")

    let poster: Post[] = Post.createArray(readJSONFileSync("data/poster.json", true))
    console.log(poster.length.toString() + " poster loaded succesfully")

    let ppMatrix: string[][] = readJSONFileSync("data/ppMatrix.json") as string[][]
    if(ppMatrix == null){
        ppMatrix = createJaggedArray(loeb.patruljer.length)
        fs.writeFile("data/ppMatrix.json", JSON.stringify(ppMatrix), () => {})
        console.log("Patruljepost-matrix (ppMatrix.json) oprettet med " + ppMatrix.length + " patruljer")

        sendAllPatruljerTowardsFirstPost()
        fs.writeFile("data/ppMatrix.json", JSON.stringify(ppMatrix), () => {})
    }else
        console.log("ppMatrix.json loaded succesfully")


    const users: User[] = User.createArray(readJSONFileSync("data/users.json", true))
    console.log(users.length.toString() + " users loaded succesfully")
    writeToServerLog("All files loaded succesfully")

    let lastUpdateTimes: number[] = []
    for (let i = 0; i < poster.length; i++) {
        lastUpdateTimes.push(new Date().getTime())
    }
    //#endregion

    const server: http.Server = http.createServer((req: http.IncomingMessage, res: http.ServerResponse): void => {
        const { headers, method, url } = req
        //console.log(`Request type: ${method}, URL: ${url}`)
        if (req.method == "GET") {
            console.log(url)
            if (urlIsValidPathToFile(req.url))
                sendFileToClient(res, req.url)
            else {
                switch (req.url) {
                    case "/":
                    case "/home":
                        sendFileToClient(res, "home.html")
                        break
                    case "/login":
                        loginReq(req, res)
                        break
                    case "/mandskab":
                        sendFileToClient(res, "mandskab.html")
                        break
                    case "/getUpdate":
                        getUpdateReq(req, res)
                        break
                    case "/getData":
                        getDataReq(req, res)
                        break
                    case "/sendUpdate":
                        sendUpdateReq(req, res)
                        break
                    case "/master":
                        sendFileToClient(res, "master.html")
                        break
                    case "/masterData":
                        masterDataReq(req, res)
                        break
                    case "/masterUpdate":
                        masterUpdateReq(req, res)
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
        writeToServerLog("Server running")
    })

    //#region -  Alle funktioner der håndterer de specifikke requests url's der kommer
    const loginReq = (req: http.IncomingMessage, res: http.ServerResponse): void => {
        const password = req.headers['password'] as string
        const identifier = req.headers['id'] as string
        let succes = false
        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            if(user.kode == password){
                user.identifier.push(identifier)
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
    const getUpdateReq = (req: http.IncomingMessage, res: http.ServerResponse): void => {
        const userPost = recognizeUser(req.headers['id'] as string)
        if(userPost == -1){ //Bruger ikke recognized
            res.writeHead(403)
            res.end()
        }
        else if(userPost == null){ //Bruger er master
            res.writeHead(403) //Skal fjernes ved implementering af master
        }else{ //Bruger er mandskab
            const userLastUpdate = parseInt(req.headers['last-update'] as string)
            if(userLastUpdate < lastUpdateTimes[userPost]){ //Der er kommet ny update siden sidst klienten spurgte
                res.setHeader("update", "true")
                getDataReq(req, res)
            }
            else{
                res.setHeader("update", "false")
                res.end()
            }
        }
    }
    const getDataReq = (req: http.IncomingMessage, res: http.ServerResponse): void => {
        const userPost = recognizeUser(req.headers['id'] as string)
        console.log("Get data request with post: " + userPost.toString())
        if(userPost == -1) //Bruger ikke recognized
            res.writeHead(403)
        else if(userPost == null){ //Bruger er master
            res.writeHead(403) //Skal fjernes ved implementering af master
        }
        else{ //Bruger er mandskab
            let omvejÅben: boolean
            if(userPost >= poster.length - 1 || poster[userPost].erOmvej){ //Sidste post eller posten er en omvej
                omvejÅben = false
            }else
                omvejÅben = poster[userPost + 1].erOmvej

            res.setHeader("data", JSON.stringify({
                "påPost": patruljerPåPost(userPost),
                "påVej": patruljerPåVej(userPost),
                "post": poster[userPost].navn,
                "omvejÅben": omvejÅben,
            }))
        }
        res.end()
    }
    const sendUpdateReq = (req: http.IncomingMessage, res: http.ServerResponse, overrideUserPost?: number): void => {
        const headers = req.headers
        const userPostIndex = overrideUserPost == undefined ? recognizeUser(headers['id'] as string): overrideUserPost
        let status = 200
        console.log("update recieved")
        if(userPostIndex >= 0 || userPostIndex == null){ //Brugeren er genkendt og er mandskb (eller udgiver sig for at være det (master))
            console.log("User recognized as user " + userPostIndex)
            try{
                const update = req.headers['update'] as string //{patruljenummer}%{melding}%{post/omvej}
                const split = update.split('%')
                const pIndex = Number.parseInt(split[0]) - 1
                const melding = split[1]
                const commit = req.headers['commit-type'] as string == "commit"
                if(melding == "ud"){ //Klienten vil tjekke en patrulje UD eller undersøge om det er muligt
                    console.log("Patrulje skal tjekkes ud")
                    if(canPatruljeBeCheckedUd(pIndex, userPostIndex)){ //Patrulje kan tjekkes ud ifølge ppMatrix
                        if(commit){ //Klienten vil gerne comitte ændringerne
                            const postOrOmvej = split[2]
                            checkPatruljeUdAndTowardsNext(pIndex, userPostIndex, postOrOmvej)//Check patrulje ud og sæt som gå mod enten post eller omvej
                            if(userPostIndex < poster.length - 1){ //Den nuværende post er IKKE den sidste post
                                let postAddition = postIndexAddition(postOrOmvej, userPostIndex)
                                writeToPatruljeLog(`Patrulje ${pIndex + 1} tjekkes UD fra ${poster[userPostIndex].navn} og går mod ${poster[userPostIndex + postAddition].navn}`)
                            }
                            else
                                writeToPatruljeLog(`Patrulje ${pIndex + 1} tjekkes UD fra ${poster[userPostIndex].navn} og går mod MÅL`)
                        }
                    }
                    else //Patrulje kan IKKE blive tjekket UD ifølge ppMatrix
                        status = 400
                }else if(melding == "ind"){ //Klienten vil tjekke en patrulje IND eller undersøge om det er muligt
                    if(canPatruljeBeCheckedIn(pIndex, userPostIndex)){ //Patruljen kan tjekkes IND ifølge ppMatrix
                        if(commit){ //Klienten vil gerne comitte ændringerne
                            checkPatruljeInd(pIndex, userPostIndex)
                            writeToPatruljeLog(`Patrulje ${pIndex + 1} tjekkes IND på post ${userPostIndex + 1}`)
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
    const masterDataReq = (req: http.IncomingMessage, res: http.ServerResponse): void => {
        const isMaster = recognizeUser(req.headers['id'] as string) == Infinity
        if(isMaster){
            res.setHeader("data", JSON.stringify({
                "loeb": loeb,
                "ppMatrix": ppMatrix,
                "poster": poster
            }))
        }
        else
            res.writeHead(403)
        res.end()
    }
    const masterUpdateReq = (req: http.IncomingMessage, res: http.ServerResponse): void => {
        
    }
    //#endregion

    //#region -  Funktioner der håndtere patruljer, poster og brugere
    const canPatruljeBeCheckedUd = (pNum: number, post: number): boolean => {
        return (ppMatrix[pNum].length == 3 * post + 2  && loeb.patruljeIkkeUdgået(pNum))
    }
    const canPatruljeBeCheckedIn = (pNum: number, post: number): boolean => {
        return (ppMatrix[pNum].length == 3 * post + 1 && loeb.patruljeIkkeUdgået(pNum))
    }
    const patruljerPåPost = (post: number): number[] =>{
        console.log("Post der undersøges: " + post.toString())
        let patruljer: number[] = []
        for (let i = 0; i < ppMatrix.length; i++) {
            if(ppMatrix[i].length == post * 3 + 2 && loeb.patruljeIkkeUdgået(i))
                patruljer.push(i + 1)
        }
        return patruljer
    }
    const patruljerPåVej = (post: number): number[] =>{
        let patruljer: number[] = []
        for (let i = 0; i < ppMatrix.length; i++) {
            if(ppMatrix[i].length == post * 3 + 1 && loeb.patruljeIkkeUdgået(i))
                patruljer.push(i + 1)
        }
        return patruljer
    }
    const recognizeUser = (id: string): number => {
        let userPostIndex: number = -1
        for (let u = 0; u < users.length; u++) {
            const user = users[u];
            for (let i = 0; i < user.identifier.length; i++) {
                if(id == user.identifier[i]){
                    userPostIndex = user.type()
                    u = users.length
                    break
                }
            }
        }
        return userPostIndex
    }
    const checkPatruljeUdAndTowardsNext = (pIndex: number, currentPostIndex: number, omvejOrPost: string) => {
        const date = new Date()
        ppMatrix[pIndex].push(getTimeString(date))
        lastUpdateTimes[currentPostIndex] = date.getTime()
        if(currentPostIndex < poster.length - 1){//Hvis det ikke er sidste post, skal der gøres noget mere
            const nextPostIsOmvej = poster[currentPostIndex + 1].erOmvej
            const patruljeSkalPåOmvej = omvejOrPost == "omvej"
            if(nextPostIsOmvej && !patruljeSkalPåOmvej){ //Tilføjer tomme felter hvis næste post er en omvej og patruljen IKKE skal på omvej
                for (let i = 0; i < 3; i++) {
                    ppMatrix[pIndex].push("") 
                }
            }
            ppMatrix[pIndex].push(getTimeString(date))
            lastUpdateTimes[currentPostIndex + postIndexAddition(omvejOrPost, currentPostIndex)] = date.getTime()
        }
    }
    const checkPatruljeInd = (pIndex: number, currentPostIndex: number) => {
        ppMatrix[pIndex].push(getTimeString())
        lastUpdateTimes[currentPostIndex] = new Date().getTime()
    }
    const postIndexAddition = (postOrOmvej: string, userPostIndex: number): number => {
        let postIndexAddition = 1 //Alt efter om patruljen skal på omvej og om den næste post er en omvej, er den næste post jo noget forskelligt
        if(postOrOmvej == "post" && poster[userPostIndex + 1].erOmvej)
            postIndexAddition = 2
        return postIndexAddition
    }
    //#endregion

    //#region -  Functions for handling files
    const urlIsValidPathToFile = (str: string): boolean => {
        if(str.includes(".json"))
            return false
        return (str.split('/').slice(-1)[0].match("\^[a-zA-Z\-_0-9]{2,}[.][a-zA-Z]{2,}\$")) != null
    }
    const readJSONFile = (path: string, succesCallback: singleParamCallback<object>, failCallback?: singleParamCallback<void>): object => {
        //Removing "/"" at the start of paths 
        if (path[0] == '/')
            path = path.substring(1)

        fs.readFile(path, "utf-8", (error: NodeJS.ErrnoException | null, data: string): void => {
            if (isError(error)) {
                console.log("error reading file: " + path)
                if (failCallback != null)
                    failCallback()
            }
            else{
                const obj = JSON.parse(data)
                succesCallback(obj)
                return obj
            }

            function isError(error: NodeJS.ErrnoException | null): error is NodeJS.ErrnoException { return !(!error) }
        })
        return null
    }
    //Sends file with "path" to client with response "res".
    //On error in reading file it calls failCallback if given. If not given 404 error will be send to client.
    const sendFileToClient = (res: http.ServerResponse, path: string, failCallback?: singleParamCallback<void>): void => {
        getFile(path,
            file => {
                res.setHeader("content_type", determineContentType(path))
                res.end(file)
            }, () => {
                if (failCallback == null) {
                    res.writeHead(404);
                    res.end()
                } else
                    failCallback()
            })
    }
    const getFile = (path: string, succesCallback: singleParamCallback<Buffer | string>, failCallback?: singleParamCallback<void>): void => {
        //Removing "/"" at the start of paths 
        if (path[0] == '/')
            path = path.substring(1)

        //Setting correct encoding type. Extensions in "extensionsWithUTF8" will be encoded with utf8. 
        //Everything else will not be encoded beacuse "encoding" = null
        const fileExtension: string = path.split('.')[1]
        const extensionsWithUTF8: string[] = ["css", "html", "txt", "js"]
        let encoding;
        if (extensionsWithUTF8.includes(fileExtension))
            encoding = "utf8"
        else
            encoding = null

        //@ts-expect-error having "encoding" as a variable string raises error in typescript but not in javascript
        fs.readFile(path, encoding, (error: NodeJS.ErrnoException | null, data: Buffer | string): void => {
            if (isError(error)) {
                console.log("error reading file: " + path)
                if (failCallback != null)
                    failCallback()
            }
            else
                succesCallback(data)
            function isError(error: NodeJS.ErrnoException | null): error is NodeJS.ErrnoException { return !(!error) }
        })
    }
    const determineContentType = (path: string): MIME => {
        let split = path.split(".")
        let extension = split[split.length - 1].toLowerCase()

        const extensions: string[] = ["css", "html", "jpg", "png", "json", "ico"]
        const MIMEType: MIME[] = [MIME.css, MIME.html, MIME.jpg, MIME.png, MIME.json, MIME.ico]
        const index = extensions.indexOf(extension)
        if (index >= 0)
            return MIMEType[index]
        return MIME.any
    }
    //#endregion
}