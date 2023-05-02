import * as http from 'http'
import * as fs from 'fs'

import process = require('process');

process.chdir(__dirname);
const hostname = '127.0.0.1';
const port = 3000;

enum MIME {
    html = "text/html",
    json = 'application/JSON',
    css = "text/css",
    jpg = "image/jpg",
    png = "image/png",
    ico = "image/x-icon",
    any = "*/*",
}
//#region -  Klasser til løbsdata
class Loeb{
    navn: string
    beskrivelse: string
    patruljer: string[]
    constructor(obj: any){
        this.navn = obj.navn
        this.beskrivelse = obj.beskrivelse
        this.patruljer = obj.patruljer
    }
}
class Post{
    navn: string
    beskrivelse: string
    erOmvej: boolean
    kanSendeVidereTil: number[]

    constructor(obj: any){
        this.navn = obj.navn
        this.beskrivelse = obj.beskrivelse
        this.erOmvej = obj.erOmvej
        this.kanSendeVidereTil = obj.kanSendeVidereTil
    }

    static createArray(obj: any): Post[]{
        let arr: Post[] = []
        obj.forEach((element: any) => {
            arr.push(new Post(element))
        });
        return arr
    }

    toString(){
        return "Post: " + this.navn + " - " + this.beskrivelse + "     Omvej: " + this.erOmvej.toString() + "     Kan sende patruljer til følgende poster: " + this.kanSendeVidereTil.toString()
    }
}
class User {
    kode: string
    post: number
    identifier: string[]
    master: boolean

    constructor(obj: any){
        this.kode = obj.kode
        this.post = obj.post
        this.identifier = obj.identifier
        this.master = obj.master
    }

    type(): number{
        if(this.master)
            return 0
        return this.post
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
class PPEvent{
    melding: string
    tid: Date

    toString(): string {
        return this.tid.toTimeString() + "  -  " + this.melding
    }
}
//#endregion
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
//#region Loading json files into variables
const loeb: Loeb = new Loeb(readJSONFileSync("data/loeb.json", true))
console.log("Loeb loaded succesfully")

const poster: Post[] = Post.createArray(readJSONFileSync("data/poster.json", true))
console.log("Poster loaded succesfully")

let ppMatrix: string[][] = readJSONFileSync("data/ppMatrix.json") as string[][]
if(ppMatrix == null){
    ppMatrix = createJaggedArray(loeb.patruljer.length)
    fs.writeFile("data/ppMatrix.json", JSON.stringify(ppMatrix), () => {})
    console.log("Patruljepost-matrix (ppMatrix.json) oprettet")
}else
    console.log("ppMatrix.json loaded succesfully")

const users: User[] = User.createArray(readJSONFileSync("data/users.json", true))
console.log(users.length.toString() + " users loaded succesfully")
//#endregion

const server: http.Server = http.createServer((req: http.IncomingMessage, res: http.ServerResponse): void => {
    const { headers, method, url } = req
    //console.log(`Request type: ${method}, URL: ${url}`)
    if (req.method == "GET") {
        if (urlIsValidPathToFile(req.url))
            sendFileToClient(res, req.url)
        else {
            switch (req.url) {
                case "/":
                case "/home":
                    homeReq(req, res)
                    break
                case "/login":
                    loginReq(req, res)
                    break
                case "/mandskab":
                    mandskabReq(req, res)
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
                    masterReq(req, res)
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
}).listen(port, hostname, () => console.log(`Server is now listening at http://${hostname}:${port}`))


//#region -  Alle funktioner der håndterer de specifikke requests url's der kommer
const homeReq = (req: http.IncomingMessage, res: http.ServerResponse): void => {
    sendFileToClient(res, "home.html")
}
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
const mandskabReq = (req: http.IncomingMessage, res: http.ServerResponse): void => {
    sendFileToClient(res, "mandskab.html")
}
const getUpdateReq = (req: http.IncomingMessage, res: http.ServerResponse): void => {

}
const getDataReq = (req: http.IncomingMessage, res: http.ServerResponse): void => {
    const userPost = recognizeUser(req.headers['id'] as string)
    if(userPost == -1) //Bruger ikke recognized
        res.writeHead(403)
    else if(userPost == 0){ //Bruger er master
        res.writeHead(403) //Skal fjernes ved implementering af master
    }
    else{ //Bruger er mandskab
        res.setHeader("data", JSON.stringify({
            "påPost": patruljerPåPost(userPost),
            "påVej": patruljerPåVej(userPost),
            "post": userPost
        }))
    }
    res.end()
}
const sendUpdateReq = (req: http.IncomingMessage, res: http.ServerResponse): void => {

}
const masterReq = (req: http.IncomingMessage, res: http.ServerResponse): void => {

}
//#endregion

//#region -  Funktioner der håndtere patruljer, poster og brugere
const canPatruljeBeCheckedUd = (pNum: number, post: number): boolean => {
    return ppMatrix[pNum].length == 3 * post + 2
}
const canPatruljeBeCheckedIn = (pNum: number, post: number): boolean => {
    return ppMatrix[pNum].length == 3 * post + 1
}
const patruljerPåPost = (post: number): number[] =>{
    console.log("Post der undersøges: " + post.toString())
    let patruljer: number[] = []
    for (let i = 0; i < ppMatrix.length; i++) {
        if(ppMatrix[i].length == (post - 1) * 3 + 2)
            patruljer.push(i + 1)
    }
    return patruljer
}
const patruljerPåVej = (post: number): number[] =>{
    let patruljer: number[] = []
    for (let i = 0; i < ppMatrix.length; i++) {
        if(ppMatrix[i].length == (post - 1) * 3 + 1)
            patruljer.push(i + 1)
    }
    return patruljer
}
const recognizeUser = (id: string ): number => {
    let type: number = -1
    for (let u = 0; u < users.length; u++) {
        const user = users[u];
        user.printIdentifiers()
        for (let i = 0; i < user.identifier.length; i++) {
            if(id == user.identifier[i]){
                type = user.type()
                u = users.length
                break
            }
        }
    }
    return type
}
//#endregion

//#region -   functions to run the server
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
interface singleParamCallback<Type> {
    (file: Type): void
}