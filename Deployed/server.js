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
class Patrulje {
}
class User {
    constructor(kode, post, identifier, master) {
        this.kode = kode;
        this.post = post;
        this.identifier = identifier;
        this.master = master;
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
let activeUsers = [];
const server = http.createServer((req, res) => {
    const { headers, method, url } = req;
    console.log(`Request type: ${method}, URL: ${url}`);
    switch (method) {
        case "GET":
            handleGET(req, res);
            break;
        case "POST":
            handlePOST(req, res);
            break;
        default:
            res.writeHead(400);
            res.end();
            break;
    }
}).listen(port, hostname, () => console.log(`Server is now listening at http://${hostname}:${port}`));
const handlePOST = (req, res) => {
    const { headers, method, url } = req;
    switch (url) {
        case "/login":
            handleLogin(req, res);
            break;
        case "/update":
            handleUpdate(req, res);
            break;
        default:
            res.writeHead(400);
            res.end();
    }
};
const handleLogin = (req, res) => {
    getDataFromReq(req, buffer => {
        const requestData = JSON.parse(buffer.toString());
        getJSON(`secured/users-${requestData.id}.json`, userObject => {
            const users = userObject.users;
            let foundUser = false;
            for (let i = 0; i < users.length; i++) {
                if (users[i].kode == requestData.kode) {
                    sendResponse(res, 200, "master: " + users[i].master.toString());
                    users[i].identifier = requestData.identifier;
                    activeUsers.push(users[i]);
                    foundUser = true;
                    i = users.length;
                }
            }
            if (foundUser == false)
                sendResponse(res, 400);
        }, () => sendResponse(res, 401));
    }, () => {
        sendResponse(res, 400);
    });
};
const handleUpdate = (req, res) => {
    getDataFromReq(req, buffer => {
        const requestData = JSON.parse(buffer.toString());
    }, () => {
    });
};
const handleGET = (req, res) => {
    const { headers, method, url } = req;
    if (url.split('/').slice(-1)[0].match("\^[a-zA-Z\-_]{2,}[.][a-zA-Z]{2,}\$")) {
        getFile(url, file => {
            res.writeHead(200, { 'Content-Type': determineContentType(url) });
            res.end(file);
        });
    }
    else {
        switch (url) {
            case "/":
            case "/home":
                sendFileToClient(res, "home.html");
                break;
            case "/space":
                sendFileToClient(res, "ErrorPage/img/bg.jpg");
                break;
            default:
                sendFileToClientIfRequestAcceptsFormat(req, res, "404Error.html");
                break;
        }
    }
};
const sendResponse = (res, status, data) => {
    res.writeHead(status);
    if (data != null) {
        res.write(data, 'utf8');
        console.log(data);
    }
    res.end();
};
const getJSON = (path, succesCallback, failCallback) => {
    if (path[0] == '/')
        path = path.substring(1);
    fs.readFile(path, "utf-8", (error, data) => {
        if (isError(error)) {
            console.log("error reading file: " + path);
            if (failCallback != null)
                failCallback();
        }
        else
            succesCallback(JSON.parse(data));
        function isError(error) { return !(!error); }
    });
};
const sendFileToClientIfRequestAcceptsFormat = (req, res, path, strict) => {
    if (requestAcceptsFormat(req.headers, determineContentType(path), strict)) {
        sendFileToClient(res, path);
    }
    else {
        res.writeHead(406);
        res.end();
    }
};
const getDataFromReq = (req, succesCallback, failCallback) => {
    let body = [];
    req.on("error", error => {
        console.log("error in reading data from request: \n" + error);
        if (failCallback != null)
            failCallback();
    }).on('data', chunk => {
        body.push(chunk);
    }).on('end', () => {
        if (body != undefined) {
            succesCallback(Buffer.concat(body));
        }
        else if (failCallback != null)
            failCallback();
    });
};
const determineContentType = (path) => {
    let split = path.split(".");
    let extension = split[split.length - 1].toLowerCase();
    const extensions = ["css", "html", "jpg", "json", "ico"];
    const MIMEType = [MIME.css, MIME.html, MIME.jgp, MIME.JSON, MIME.ico];
    const index = extensions.indexOf(extension);
    if (index >= 0)
        return MIMEType[index];
    return MIME.any;
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
const requestAcceptsFormat = (header, format, strict) => {
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
