"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http = require("http");
const fs = require("fs");
const process = require("process");
class Lob {
    constructor(navn, antalPoster) {
        this.navn = navn;
        this.antalPoster = antalPoster;
    }
}
class Post {
    constructor(navn, omvej, åbningstid, lukketid, omvejLukketid) {
        this.navn = navn;
        this.omvej = omvej;
        this.åbningstid = åbningstid;
        this.lukketid = lukketid;
        this.omvejLukketid = omvejLukketid;
    }
}
var MIME;
(function (MIME) {
    MIME["html"] = "text/html";
    MIME["JSON"] = "application/JSON";
    MIME["css"] = "text/css";
    MIME["jgp"] = "image/jpg";
    MIME["ico"] = "image/x-icon";
    MIME["any"] = "*/*";
})(MIME || (MIME = {}));
process.chdir(__dirname);
const hostname = '127.0.0.1';
const port = 3000;
let post = new Post("FugleZoo", false, "1600", "1800", "1715");
const server = http.createServer((req, res) => {
    const { headers, method, url } = req;
    console.log(`Request type: ${method}, URL: ${url}`);
    switch (method) {
        case "GET":
            if (url.split('/').slice(-1)[0].match("\^[a-zA-Z\-_]{2,}[.][a-zA-Z]{2,}\$")) {
                getFile(url, file => {
                    res.writeHead(200, { 'Content-Type': determineContentType(url) });
                    res.end(file);
                }, () => {
                    res.writeHead(400);
                    res.end();
                });
            }
            else {
                switch (url) {
                    case "/":
                    case "/home":
                        if (requestAcceptsFormat(headers, MIME.html, true)) {
                            sendFileToClient(res, "home.html", MIME.html);
                        }
                        else {
                            res.writeHead(406);
                            res.end();
                        }
                        break;
                    case "/space":
                        sendFileToClient(res, "ErrorPage/img/bg.jpg", MIME.jgp);
                        break;
                    default:
                        if (requestAcceptsFormat(headers, MIME.html, true))
                            sendFileToClient(res, "404Error.html", MIME.html);
                        else {
                            res.writeHead(404);
                            res.end();
                        }
                        break;
                }
            }
            break;
        case "PUT":
            break;
        default:
            break;
    }
}).listen(port, hostname, () => console.log(`Server is now listening at http://${hostname}:${port}`));
let determineContentType = (path) => {
    let split = path.split(".");
    let extension = split[split.length - 1].toLowerCase();
    const extensions = ["css", "html", "jpg", "json", "ico"];
    const MIMEType = [MIME.css, MIME.html, MIME.jgp, MIME.JSON, MIME.ico];
    const index = extensions.indexOf(extension);
    if (index >= 0)
        return MIMEType[index];
    return MIME.any;
};
let sendFileToClient = (res, path, contentType, failCallback) => {
    getFile(path, file => {
        res.end(file);
    }, () => {
        if (failCallback == null) {
            res.writeHead(404);
            res.end();
        }
        else
            failCallback();
    });
};
let getFile = (path, succesCallback, failCallback) => {
    if (path[0] == '/')
        path = path.substring(1);
    fs.readFile(path, (error, data) => {
        if (isError(error)) {
            console.log("error reading file: " + path);
            if (failCallback != null)
                failCallback();
        }
        else
            succesCallback(data);
        function isError(error) { return !(!error); }
    });
};
let requestAcceptsFormat = (header, format, strict) => {
    let acceptedFormats = header.accept?.split(/[,;]+/);
    strict == undefined ? true : strict;
    for (let i = 0; i < acceptedFormats.length; i++) {
        if (acceptedFormats[i] == format || (!strict && acceptedFormats[i] == "*/*"))
            return true;
    }
    return false;
};
function saveAsCSV(data, fileName, path) {
    const csv = data.map(row => row.join(',')).join('\n');
    fs.writeFile(`${path}/${fileName}.csv`, csv, (err) => {
        if (err)
            throw err;
    });
}
function loadCSV(fileName, path) {
    var data = fs.readFileSync(`${path}/${fileName}.csv`).toString().split("\n").map(e => e.split(","));
    return data;
}
const data = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
];
saveAsCSV(data, "testData", ".");
