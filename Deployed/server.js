"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http = require("http");
const fs = require("fs");
const process = require("process");
process.chdir(__dirname);
const hostname = '127.0.0.1';
const port = 3000;
var MIME;
(function (MIME) {
    MIME["html"] = "text/html";
    MIME["json"] = "application/JSON";
    MIME["css"] = "text/css";
    MIME["jpg"] = "image/jpg";
    MIME["png"] = "image/png";
    MIME["ico"] = "image/x-icon";
    MIME["any"] = "*/*";
})(MIME || (MIME = {}));
class Loeb {
}
class Post {
    toString() {
        return "Post: " + this.navn + " - " + this.beskrivelse + "     Omvej: " + this.erOmvej.toString() + "     Kan sende patruljer til følgende poster: " + this.kanSendeVidereTil.toString();
    }
}
class User {
}
class PPEvent {
    toString() {
        return this.tid.toTimeString() + "  -  " + this.melding;
    }
}
const readJSONFileSync = (path, critical) => {
    if (path[0] == '/')
        path = path.substring(1);
    try {
        return JSON.parse(fs.readFileSync(path, { encoding: "utf8" }));
    }
    catch (err) {
        console.log("Error reading file " + path);
        return null;
        if (critical)
            process.exit(1);
    }
};
const createJaggedArray = (numOfPatruljer) => {
    let array = [];
    for (let patruljer = 0; patruljer < numOfPatruljer; patruljer++) {
        array.push([]);
    }
    return array;
};
const loeb = readJSONFileSync("data/loeb.json", true);
console.log("Loeb loaded succesfully");
const poster = readJSONFileSync("data/poster.json", true);
console.log("Poster loaded succesfully");
let ppMatrix = readJSONFileSync("ppMatrix.json");
if (ppMatrix == null) {
    ppMatrix = createJaggedArray(loeb.patruljer.length);
    fs.writeFile("data/ppMatrix.json", JSON.stringify(ppMatrix), () => { });
    console.log("Patruljepost-matrix (ppMatrix.json) oprettet");
}
else
    console.log("ppMatrix.json loaded succesfully");
const users = readJSONFileSync("data/users.json", true);
console.log("Users loaded succesfully");
const server = http.createServer((req, res) => {
    const { headers, method, url } = req;
    console.log(`Request type: ${method}, URL: ${url}`);
    if (req.method == "GET") {
        if (urlIsValidPathToFile(req.url))
            sendFileToClient(res, req.url);
        else {
            switch (req.url) {
                case "/":
                case "/home":
                    homeReq(req, res);
                    break;
                case "/login":
                    loginReq(req, res);
                    break;
                case "/mandskab":
                    mandskabReq(req, res);
                    break;
                case "/getUpdate":
                    getUpdateReq(req, res);
                    break;
                case "/getData":
                    getDataReq(req, res);
                    break;
                case "/sendUpdate":
                    sendUpdateReq(req, res);
                    break;
                case "/master":
                    masterReq(req, res);
                    break;
                default:
                    res.writeHead(400);
                    res.end();
                    break;
            }
        }
    }
    else {
        res.writeHead(400);
        res.end();
    }
}).listen(port, hostname, () => console.log(`Server is now listening at http://${hostname}:${port}`));
const homeReq = (req, res) => {
    sendFileToClient(res, "home.html");
};
const loginReq = (req, res) => {
    const password = req.headers['password'];
    const identifier = req.headers['id'];
    users.forEach(user => {
        if (user.kode == password) {
            user.identifier.push(identifier);
            res.writeHead(200);
            res.end();
        }
    });
    console.log(password + " - " + identifier);
    res.end();
};
const mandskabReq = (req, res) => {
    sendFileToClient(res, "mandskab.html");
};
const getUpdateReq = (req, res) => {
};
const getDataReq = (req, res) => {
};
const sendUpdateReq = (req, res) => {
};
const masterReq = (req, res) => {
};
const urlIsValidPathToFile = (str) => {
    if (str.includes(".json"))
        return false;
    return (str.split('/').slice(-1)[0].match("\^[a-zA-Z\-_0-9]{2,}[.][a-zA-Z]{2,}\$")) != null;
};
const readJSONFile = (path, succesCallback, failCallback) => {
    if (path[0] == '/')
        path = path.substring(1);
    fs.readFile(path, "utf-8", (error, data) => {
        if (isError(error)) {
            console.log("error reading file: " + path);
            if (failCallback != null)
                failCallback();
        }
        else {
            const obj = JSON.parse(data);
            succesCallback(obj);
            return obj;
        }
        function isError(error) { return !(!error); }
    });
    return null;
};
const sendFileToClient = (res, path, failCallback) => {
    getFile(path, file => {
        res.setHeader("content_type", determineContentType(path));
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
const getFile = (path, succesCallback, failCallback) => {
    if (path[0] == '/')
        path = path.substring(1);
    const fileExtension = path.split('.')[1];
    const extensionsWithUTF8 = ["css", "html", "txt", "js"];
    let encoding;
    if (extensionsWithUTF8.includes(fileExtension))
        encoding = "utf8";
    else
        encoding = null;
    fs.readFile(path, encoding, (error, data) => {
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
const determineContentType = (path) => {
    let split = path.split(".");
    let extension = split[split.length - 1].toLowerCase();
    const extensions = ["css", "html", "jpg", "png", "json", "ico"];
    const MIMEType = [MIME.css, MIME.html, MIME.jpg, MIME.png, MIME.json, MIME.ico];
    const index = extensions.indexOf(extension);
    if (index >= 0)
        return MIMEType[index];
    return MIME.any;
};
