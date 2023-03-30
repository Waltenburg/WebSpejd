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

let handlePOST = (req: http.IncomingMessage, res: http.ServerResponse): void => {
    const { headers, method, url } = req
    switch (url){
        case "/login":
            getData(req, buffer => {
                const value = buffer.toString()
                const id = value.substring(1, 5)
                const kode = value.substring(6)
                console.log(`id: ${id} kode: ${kode}`)
                getFile()
                res.writeHead(200)
                res.end()
            }, () => {
                res.writeHead(400)
                res.end()
            })
        break
        default:
            res.writeHead(400)
            res.end()

    }
}
//Handle all GET http requests
let handleGET = (req: http.IncomingMessage, res: http.ServerResponse): void => {
    const { headers, method, url } = req
    
    //Checking if url is path to file. If it is it sends file.
    if (url.split('/').slice(-1)[0].match("\^[a-zA-Z\-_]{2,}[.][a-zA-Z]{2,}\$")) {
        getFile(url, file => {
            //Sending file
            res.writeHead(200, { 'Content-Type': determineContentType(url) })
            res.end(file)
        }, () => {
            //File did not exist
            res.writeHead(400)
            res.end()
        })
    } else { //The request is not just for a file
        switch (url) {
            case "/":
            case "/home": //Sending homepage
                if (requestAcceptsFormat(headers, MIME.html, true)) {
                    sendFileToClient(res, "home.html", MIME.html)
                } else { //Error reading file
                    res.writeHead(406)
                    res.end()
                }
                break
            case "/space": //Space
                sendFileToClient(res, "ErrorPage/img/bg.jpg", MIME.jgp)
                break
            default: //If server does not recognise url as valid, but client is asking for html the 404 errorpage is send to client
                if (requestAcceptsFormat(headers, MIME.html, true))
                    sendFileToClient(res, "404Error.html", MIME.html)
                else { //If even finding the error page fails....
                    res.writeHead(404)
                    res.end()
                }
                break
        }
    }
}

let getData = (req: http.IncomingMessage, succesCallback: singleParamCallback<Buffer>, failCallback?: singleParamCallback<void>) => {
    let body: Buffer[] = []
    req.on("error", error => {
        console.log(error)
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
let determineContentType = (path: string): MIME => {
    let split = path.split(".")
    let extension = split[split.length - 1].toLowerCase()

    const extensions: string[] = ["css", "html", "jpg", "json", "ico"]
    const MIMEType: MIME[] = [MIME.css, MIME.html, MIME.jgp, MIME.JSON, MIME.ico]
    const index = extensions.indexOf(extension)
    if (index >= 0)
        return MIMEType[index]
    return MIME.any
}
let sendFileToClient = (res: http.ServerResponse, path: string, contentType: string, failCallback?: singleParamCallback<void>): void => {
    getFile(path,
        file => {
            res.end(file)
        }, () => {
            if (failCallback == null) {
                res.writeHead(404);
                res.end()
            } else
                failCallback()
        })
}
let getFile = (path: string, succesCallback: singleParamCallback<Buffer>, failCallback?: singleParamCallback<void>): void => {
    if (path[0] == '/')
        path = path.substring(1)
    fs.readFile(path, (error: NodeJS.ErrnoException | null, data: Buffer): void => {
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
let requestAcceptsFormat = (header: http.IncomingHttpHeaders, format: string, strict?: boolean): boolean => {
    let acceptedFormats: string[] = header.accept?.split(/[,;]+/)
    strict == undefined ? true : strict
    for (let i = 0; i < acceptedFormats.length; i++) {
        if (acceptedFormats[i] == format || (!strict && acceptedFormats[i] == "*/*"))
            return true
    }
    return false;
}
interface singleParamCallback<T> {
    (file: T): void
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