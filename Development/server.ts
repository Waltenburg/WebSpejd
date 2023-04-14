//Sidste gang var jeg i gang med at rette mandskab.ts til, så det bliver med typer og så det passer med den nye kommunikationsform
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
class Loeb{
    navn: string
    beskrivelse: string
    patruljer: string[]
}
class Post{
    navn: string
    beskrivelse: string
    erOmvej: boolean
    kanSendeVidereTil: number[]

    toString(){
        return "Post: " + this.navn + " - " + this.beskrivelse + "     Omvej: " + this.erOmvej.toString() + "     Kan sende patruljer til følgende poster: " + this.kanSendeVidereTil.toString()
    }
}
class User {
    kode: string
    post: number
    identifier: string[]
    master: boolean
}
class PPEvent{
    melding: string
    tid: Date

    toString(): string {
        return this.tid.toTimeString() + "  -  " + this.melding
    }
}
const readJSONFileSync = (path: string, critical?: boolean): object => {
    //Removing "/"" at the start of paths 
    if (path[0] == '/')
        path = path.substring(1)
    try{
        return JSON.parse(fs.readFileSync(path, {encoding: "utf8"}))
    }catch (err){
        console.log("Error reading file " + path)
        return null
        if(critical)
            process.exit(1)
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
const loeb: Loeb = readJSONFileSync("data/loeb.json", true) as Loeb
console.log("Loeb loaded succesfully")

const poster: Post[] = readJSONFileSync("data/poster.json", true) as Post[]
console.log("Poster loaded succesfully")

let ppMatrix: string[][] = readJSONFileSync("ppMatrix.json") as string[][]
if(ppMatrix == null){
    ppMatrix = createJaggedArray(loeb.patruljer.length)
    fs.writeFile("data/ppMatrix.json", JSON.stringify(ppMatrix), () => {})
    console.log("Patruljepost-matrix (ppMatrix.json) oprettet")
}else
    console.log("ppMatrix.json loaded succesfully")

const users: User[] = readJSONFileSync("data/users.json", true) as User[]
console.log("Users loaded succesfully")
//#endregion

const server: http.Server = http.createServer((req: http.IncomingMessage, res: http.ServerResponse): void => {
    const { headers, method, url } = req
    console.log(`Request type: ${method}, URL: ${url}`)
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
    users.forEach(user => {
        if(user.kode == password){
            user.identifier.push(identifier)
            res.writeHead(200)
            res.end()
        }
    });
    console.log(password + " - " + identifier)
    res.end();
}
const mandskabReq = (req: http.IncomingMessage, res: http.ServerResponse): void => {
    sendFileToClient(res, "mandskab.html")
}
const getUpdateReq = (req: http.IncomingMessage, res: http.ServerResponse): void => {

}
const getDataReq = (req: http.IncomingMessage, res: http.ServerResponse): void => {

}
const sendUpdateReq = (req: http.IncomingMessage, res: http.ServerResponse): void => {

}
const masterReq = (req: http.IncomingMessage, res: http.ServerResponse): void => {

}
//#endregion

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

interface singleParamCallback<Type> {
    (file: Type): void
}

//Start