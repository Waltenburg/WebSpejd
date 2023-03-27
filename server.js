"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var http = require("http");
var fs = require("fs");
var hostname = '127.0.0.1';
var port = 3000;
var server = http.createServer(createServer);
server.listen(port, hostname, () => {
    console.log(`Server running at http:/${hostname}:${port}/`);
});
var Lob = (function () {
    function Lob(navn, antalPoster) {
        this.navn = navn;
        this.antalPoster = antalPoster;
    }
    return Lob;
}());
var Post = (function () {
    function Post(navn, omvej, åbningstid, lukketid, omvejLukketid) {
        this.navn = navn;
        this.omvej = omvej;
        this.åbningstid = åbningstid;
        this.lukketid = lukketid;
        this.omvejLukketid = omvejLukketid;
    }
    return Post;
}());
function saveAsCSV(data, fileName, path) {
    var csv = data.map(function (row) { return row.join(','); }).join('\n');
    fs.writeFile("".concat(path, "/").concat(fileName, ".csv"), csv, function (err) {
        if (err)
            throw err;
    });
}
function loadCSV(fileName, path) {
    var data = fs.readFileSync("".concat(path, "/").concat(fileName, ".csv")).toString().split("\n").map(function (e) { return e.split(","); });
    return data;
}
function createServer(req, res) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    fs.readFile('index.html', sendResponse);
    function sendResponse(error, data) {
        if (isError(error))
            console.log("error");
        else {
            res.write(JSON.stringify(data));
            console.log("Server created");
        }
        res.end();
        function isError(error) {
            return !error;
        }
    }
}
var data = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
];
saveAsCSV(data, "testData", ".");
