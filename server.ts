import * as http from 'http'
import * as fs from 'fs'

const hostname = '127.0.0.1';
const port = 3000;
const server: http.Server = http.createServer(createServer);
server.listen(port, hostname)

class Lob {
    navn: string;
    antalPoster: bigint
    constructor(navn: string, antalPoster: bigint) {
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
function createServer(req: http.IncomingMessage, res: http.ServerResponse): void {
    res.writeHead(200, { 'Content-Type': 'text/html' })
    fs.readFile('index.html', sendResponse)
    
    function sendResponse(error: NodeJS.ErrnoException | null, data: Buffer) {
        if (isError(error))
            console.log("error")
        else{
            res.write(data)
            console.log("Server created")
        }
        res.end()

        function isError(error: NodeJS.ErrnoException | null): error is NodeJS.ErrnoException {
            return !(!error)
        }
    }
}

const data: string[][] = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
];

saveAsCSV(data, "testData", ".")