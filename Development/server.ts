import * as http from 'http'
import * as fs from 'fs'

import process = require('process');
import { buffer } from 'stream/consumers';
import { match } from 'assert';
process.chdir(__dirname)

const hostname = '127.0.0.1';
const port = 3000;

const server: http.Server = http.createServer((req: http.IncomingMessage, res: http.ServerResponse): void => {
    const {headers, method, url} = req

    let body: Buffer[]
    let reqData: string = null
    req.on("error", error => console.log(error))
    .on('data', chunk => {body.push(chunk)})
    .on('end', () => {
        if(body != undefined)
            reqData = Buffer.concat(body).toString()
        console.log(`Request type: ${method}, URL: ${url}, Data: ${reqData}`)
    })

    res.setHeader('Content-Type', 'text/html')
    getFile('index.html', file => res.end(file), () => {res.writeHead(500); res.end()})
}).listen(port, hostname, () => console.log(`Server is now listening at http://${hostname}:${port}`))

let getFile = (path: string, succesCallback: singleParamCallback<Buffer>, failCallback?: singleParamCallback<void>): void => {
    fs.readFile(path, (error: NodeJS.ErrnoException | null, data: Buffer): void => {
        if (isError(error)){
            console.log("error reading file " + path)
            if(failCallback != null)
                failCallback()
        }
        else
            succesCallback(data)
        function isError(error: NodeJS.ErrnoException | null): error is NodeJS.ErrnoException { return !(!error) }
    })
    //JEG TROR AT PROBLEMET ER AT FS.READFILE BRUGER CALLBACK. DERFOR NÅR file AT BLIVE RETURNERET FØR DEN ER BLEVET DEFINERET I CALLBACKEN
    //LØSNINGEN MÅ VÆRE AT LAVE DEN FUNKTION OM SÅ DEN OGSÅ KALDER EN CALLBACK NÅR FILEN ER FUNDET OG EVENTUELLE FEJL ER HÅNDTERET
}
interface singleParamCallback<T>{
    (file: T): void
}
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
    åbningstid: bigint
    lukketid: bigint
    omvejLukketid: bigint
    constructor(navn: string, omvej: boolean, åbningstid: bigint, lukketid: bigint, omvejLukketid: bigint){
        this.navn = navn;
        this.omvej = omvej;
        this.åbningstid = åbningstid;
        this.lukketid = lukketid;
        this.omvejLukketid = omvejLukketid;
    }
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