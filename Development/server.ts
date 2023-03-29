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
class Post{
    navn: string
    omvej: boolean
    åbningstid: string
    lukketid: string
    omvejLukketid: string
    constructor(navn: string, omvej: boolean, åbningstid: string, lukketid: string, omvejLukketid: string){
        this.navn = navn;
        this.omvej = omvej;
        this.åbningstid = åbningstid;
        this.lukketid = lukketid;
        this.omvejLukketid = omvejLukketid;
    }
}
enum MIME{
    html = "text/html",
    JSON = 'application/JSON',
    css = "text/css",
    jgp = "image/jpg",
    any = "*/*",
}

process.chdir(__dirname)

const hostname = '127.0.0.1';
const port = 3000;

let post: Post = new Post("FugleZoo", false, "1600", "1800", "1715")
const server: http.Server = http.createServer((req: http.IncomingMessage, res: http.ServerResponse): void => {
    const {headers, method, url} = req
    console.log(`Request type: ${method}, URL: ${url}`)

    switch (method){
        case "GET":
            //Handling requests for files
            if(url.substring(0,6) == "/file/"){
                const path = url.substring(6) 
                getFile(path, file => {
                    res.writeHead(200, {'Content-Type': determineContentType(path)})
                    res.end(file)
                }, () => {
                    console.log("Finding file unsuccesful. Wiriting error")
                    res.writeHead(400)
                    res.end()
                })
            }else{
                switch (url){ //Handling other requests
                    case "/":
                    case "/home":
                        if(requestAcceptsFormat(headers, MIME.html, true)){
                            sendFileToClient(res, "home.html", MIME.html)
                        }else{
                            res.writeHead(406)
                            res.end()
                        }
                        break
                    case "/space":
                        sendFileToClient(res, "ErrorPage/img/bg.jpg", MIME.html)
                        break
                    default:
                        if(requestAcceptsFormat(headers, MIME.html, true))
                            sendFileToClient(res, "ErrorPage/404Error.html", MIME.html)
                        else{
                            res.writeHead(404)
                            res.end()
                        }
                        break
                } 
            }
            break //End of GET

        case "PUT":
            break

        default:
            break

        }
}).listen(port, hostname, () => console.log(`Server is now listening at http://${hostname}:${port}`))

// let body: Buffer[] = []
// let reqData: string = null
// req.on("error", error => console.log(error))
// .on('data', chunk => {body.push(chunk)})
// .on('end', () => {
//     if(body != undefined)
//         reqData = Buffer.concat(body).toString()
//     console.log(`Data: ${reqData}`)
// })
let determineContentType = (path: string): MIME => {
    let split = path.split(".")
    let extension = split[split.length - 1]

    const extensions: string[] = ["css", "html", "jpg"]
    const MIMEType: MIME[] = [MIME.css, MIME.html, MIME.jgp]
    const index = extensions.indexOf(extension)
    if(index >= 0)
        return MIMEType[index]
    return MIME.any
}
let sendFileToClient = (res: http.ServerResponse, path: string, contentType: string, failCallback?: singleParamCallback<void>): void => {
    getFile(path,
    file => {
        res.end(file)
    }, () => {
        if(failCallback == null){
            res.writeHead(404);
            res.end()
        }else
            failCallback()
    })
}
let getFile = (path: string, succesCallback: singleParamCallback<Buffer>, failCallback?: singleParamCallback<void>): void => {
    fs.readFile(path, (error: NodeJS.ErrnoException | null, data: Buffer): void => {
        if (isError(error)){
            console.log("error reading file: " + path)
            if(failCallback != null)
                failCallback()
        }
        else
            succesCallback(data)
        function isError(error: NodeJS.ErrnoException | null): error is NodeJS.ErrnoException { return !(!error) }
    })
}
let requestAcceptsFormat = (header: http.IncomingHttpHeaders, format: string, strict?: boolean): boolean => {
    let acceptedFormats: string[] = header.accept?.split(/[,;]+/)
    strict == undefined ? true: strict
    for(let i = 0; i < acceptedFormats.length; i++){
        if (acceptedFormats[i] == format || (!strict && acceptedFormats[i] == "*/*" ))
            return true
    }
    return false;
}
interface singleParamCallback<T>{
    (file: T): void
}


function saveAsCSV (data: string[][], fileName: string, path: string){
    const csv: string = data.map(row => row.join(',')).join('\n')
    fs.writeFile(`${path}/${fileName}.csv`, csv, (err) => {
        if (err)
            throw err;
    })
}
function loadCSV(fileName: string, path: string) : string[][]{
var data = fs.readFileSync(`${path}/${fileName}.csv`).toString().split("\n").map(e => e.split(","));
    return data
}

const data: string[][] = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
];

saveAsCSV(data, "testData", ".")