const http = require('http');
const fs = require('fs')

const hostname = '127.0.0.1';
const port = 3000;
const server = http.createServer(createServer);

class Lob {
    navn: string;
    antalPoster: bigint
    constructor(navn, antalPoster) {
        this.navn = navn
        this.antalPoster = antalPoster
    }
    saveAsCSV() {
        const csv = `${this.navn},${this.antalPoster}\n`;
        try {
            fs.appendFileSync(`./${this.navn}.csv`, csv);
        } catch (err) {
            console.error(err);
        }

    }
}
class Post{
    navn: string
    omvej: boolean
    åbningstid: bigint
    lukketid: bigint
    omvejLukketid: bigint
    constructor(navn, omvej, åbningstid, lukketid, omvejLukketid){
        this.navn = navn;
        this.omvej = omvej;
        this.åbningstid = åbningstid;
        this.lukketid = lukketid;
        this.omvejLukketid = omvejLukketid;
    }

}

// let ccmr = new Lob("CCMR", 8)
// ccmr.saveAsCSV()
// console.log(readCSV("CCMR.csv"))

function createServer(req, res) {
    res.writeHead(200, { 'Content-Type': 'text/html' })
    fs.readFile('index.html', demo)
    function demo(error, data) {
        if (error)
            console.log("error")
        else
            res.write(data)
        res.end()
    }
}
function readCSV(path) {
    let data: string[] = []
    fs.createReadStream("./" + path).pipe(parse({ delimiter: ",", from_line: 2 })).on("data", function (row) { data.push(row) })
    return data
}

server.listen(port, hostname, () => {
    console.log(`Server running at http:/${hostname}:${port}/`);
});

