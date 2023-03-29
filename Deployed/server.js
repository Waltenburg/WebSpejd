"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var http = require("http");
var fs = require("fs");
var process = require("process");
process.chdir(__dirname);
var hostname = '127.0.0.1';
var port = 3000;
var server = http.createServer(function (req, res) {
    var headers = req.headers, method = req.method, url = req.url;
    var body;
    var reqData = null;
    req.on("error", function (error) { return console.log(error); })
        .on('data', function (chunk) { body.push(chunk); })
        .on('end', function () {
        if (body != undefined)
            reqData = Buffer.concat(body).toString();
        console.log("Request type: ".concat(method, ", URL: ").concat(url, ", Data: ").concat(reqData));
    });
    res.setHeader('Content-Type', 'text/html');
    getFile('index.html', function (file) { return res.end(file); }, function () { res.writeHead(500); res.end(); });
}).listen(port, hostname, function () { return console.log("Server is now listening at http://".concat(hostname, ":").concat(port)); });
var getFile = function (path, succesCallback, failCallback) {
    fs.readFile(path, function (error, data) {
        if (isError(error)) {
            console.log("error reading file " + path);
            if (failCallback != null)
                failCallback();
        }
        else
            succesCallback(data);
        function isError(error) { return !(!error); }
    });
};
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
var data = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
];
saveAsCSV(data, "testData", ".");
