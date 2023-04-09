import * as http from 'http'
import * as fs from 'fs'

import process = require('process');
import { buffer } from 'stream/consumers';
import { match } from 'assert';
import { type } from 'os';

class Lob {
    navn: string;
    antalPoster: number
    constructor(navn: string, antalPoster: number) {
        this.navn = navn
        this.antalPoster = antalPoster
    }
}
class Post {
    navn: string
    omvej: boolean
    åbningstid: string
    lukketid: string
    omvejLukketid: string
    constructor(navn: string, omvej: boolean, åbningstid: string, lukketid: string, omvejLukketid: string) {
        this.navn = navn;
        this.omvej = omvej;
        this.åbningstid = åbningstid;
        this.lukketid = lukketid;
        this.omvejLukketid = omvejLukketid;
    }
}
class User {
    kode: string
    post: BigInt
    identifier: string
    master: boolean
    constructor(
        kode: string,
        post: BigInt,
        identifier: string,
        master: boolean
    ) {
        this.kode = kode
        this.post = post
        this.identifier = identifier
        this.master = master
    }
}
enum MIME {
    html = "text/html",
    JSON = 'application/JSON',
    css = "text/css",
    jgp = "image/jpg",
    ico = "image/x-icon",
    any = "*/*",
}

process.chdir(__dirname);
const hostname = '127.0.0.1';
const port = 3000;

let activeUsers: User[] = []

let post: Post = new Post("FugleZoo", false, "1600", "1800", "1715")
const server: http.Server = http.createServer((req: http.IncomingMessage, res: http.ServerResponse): void => {
    const { headers, method, url } = req
    console.log(`Request type: ${method}, URL: ${url}`)

    switch (method) {
        case "GET":
            handleGET(req, res)
            break //End of GET

        case "POST":
            handlePOST(req, res)
            break
        default:
            res.writeHead(400)
            res.end()
            break

    }
}).listen(port, hostname, () => console.log(`Server is now listening at http://${hostname}:${port}`))

const handlePOST = (req: http.IncomingMessage, res: http.ServerResponse): void => {
    const { headers, method, url } = req
    switch (url) {
        case "/login":
            handleLogin(req, res)
            break
        default:
            res.writeHead(400)
            res.end()

    }
}
const handleLogin = (req: http.IncomingMessage, res: http.ServerResponse): void => {
    getData(req, buffer => {
        const requestData: any = JSON.parse(buffer.toString()) //TODO
        getJSON(`secured/users-${requestData.id}.json`, userObject => {
            //@ts-expect-error
            const users: User[] = userObject.users as User[]
            let foundUser = false
            for (let i = 0; i < users.length; i++) {
                if (users[i].kode == requestData.kode) {
                    sendResponse(res, 200, "master: " + users[i].master.toString()) //Kode passede med en bruger
                    users[i].identifier = requestData.identifier
                    activeUsers.push(users[i])
                    foundUser = true
                    i = users.length
                }
            }
            if (foundUser == false)
                sendResponse(res, 400)
        }, () =>
            sendResponse(res, 401)) //Løbs ID does not exist
    },
        () => {
            sendResponse(res, 400) //Error reading data from client
        })
}

//Handle all GET http requests
const handleGET = (req: http.IncomingMessage, res: http.ServerResponse): void => {
    const { headers, method, url } = req
    //Checking if url is path to file. If it is it sends file.
    if (url.split('/').slice(-1)[0].match("\^[a-zA-Z\-_]{2,}[.][a-zA-Z]{2,}\$")) {
        getFile(url, file => {
            //Sending file
            res.writeHead(200, { 'Content-Type': determineContentType(url) })
            res.end(file)
        })
    } else { //The request is not just for a file
        switch (url) {
            case "/":
            case "/home": //Sending homepage
                sendFileToClient(res, "home.html")
                break
            case "/space": //Space
                sendFileToClient(res, "ErrorPage/img/bg.jpg")
                break
            default: //If server does not recognise url as valid, but client is asking for html the 404 errorpage is send to client
                sendFileToClientIfRequestAcceptsFormat(req, res, "404Error.html")
                break
        }
    }
}
const sendResponse = (res: http.ServerResponse, status: number, data?: string) => {
    res.writeHead(status)
    if (data != null){
        res.write(data, 'utf8')
        console.log(data)
    }
    res.end()
}
const getJSON = (path: string, succesCallback: singleParamCallback<object>, failCallback?: singleParamCallback<void>) => {
    //Removing "/"" at the start of paths 
    if (path[0] == '/')
        path = path.substring(1)

    fs.readFile(path, "utf-8", (error: NodeJS.ErrnoException | null, data: string): void => {
        if (isError(error)) {
            console.log("error reading file: " + path)
            if (failCallback != null)
                failCallback()
        }
        else
            succesCallback(JSON.parse(data))

        function isError(error: NodeJS.ErrnoException | null): error is NodeJS.ErrnoException { return !(!error) }
    })

}

//Send file only if the request will accept the file type
const sendFileToClientIfRequestAcceptsFormat = (req: http.IncomingMessage, res: http.ServerResponse, path: string, strict?: boolean) => {
    if (requestAcceptsFormat(req.headers, determineContentType(path), strict)) {
        sendFileToClient(res, path)
    } else {
        res.writeHead(406)
        res.end()
    }
}


//Gets data from request "req". On succes succesCallback is called 
//THIS SHOULD ALSO BE ABLE TO RETURN STRING
const getData = (req: http.IncomingMessage, succesCallback: singleParamCallback<Buffer>, failCallback?: singleParamCallback<void>) => {
    let body: Buffer[] = []
    req.on("error", error => {
        console.log("error in reading data from request: \n" + error)
        if (failCallback != null)
            failCallback()
    }).on('data', chunk => {
        body.push(chunk)
    }).on('end', () => {
        if (body != undefined) {
            succesCallback(Buffer.concat(body))
        } else
            if (failCallback != null)
                failCallback()
    })

}

//Determines the MIME type of file with path "path". Eg. "Deployed/home.html" will return in MIME.html
const determineContentType = (path: string): MIME => {
    let split = path.split(".")
    let extension = split[split.length - 1].toLowerCase()

    const extensions: string[] = ["css", "html", "jpg", "json", "ico"]
    const MIMEType: MIME[] = [MIME.css, MIME.html, MIME.jgp, MIME.JSON, MIME.ico]
    const index = extensions.indexOf(extension)
    if (index >= 0)
        return MIMEType[index]
    return MIME.any
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
const requestAcceptsFormat = (header: http.IncomingHttpHeaders, format: string, strict?: boolean): boolean => {
    let acceptedFormats: string[] = header.accept?.split(/[,;]+/)
    strict == undefined ? true : strict
    for (let i = 0; i < acceptedFormats.length; i++) {
        if (acceptedFormats[i] == format || (!strict && acceptedFormats[i] == "*/*"))
            return true
    }
    return false;
}
interface singleParamCallback<Type> {
    (file: Type): void
}

function saveAsCSV(data: string[][], fileName: string, path: string) {
    const csv: string = data.map(row => row.join(',')).join('\n')
    fs.writeFile(`${path}/${fileName}.csv`, csv, (err) => {
        if (err)
            throw err;
    })
}
function loadCSV(fileName: string, path: string): string[][] {
    var data = fs.readFileSync(`${path}/${fileName}.csv`).toString().split("\n").map(e => e.split(","));
    return data
}