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
    constructor(obj) {
        this.navn = obj.navn;
        this.beskrivelse = obj.beskrivelse;
        this.patruljer = obj.patruljer;
    }
}
class Post {
    constructor(obj) {
        this.navn = obj.navn;
        this.beskrivelse = obj.beskrivelse;
        this.erOmvej = obj.erOmvej;
        this.omvejÅben = obj.omvejÅben;
    }
    static createArray(obj) {
        let arr = [];
        obj.forEach((element) => {
            arr.push(new Post(element));
        });
        return arr;
    }
    toString() {
        return "Post: " + this.navn + " - " + this.beskrivelse + "     Omvej: " + this.erOmvej.toString() + "     Omvej åben: " + this.erOmvej.toString();
    }
}
class User {
    constructor(obj) {
        this.kode = obj.kode;
        this.postIndex = obj.postIndex;
        this.identifier = obj.identifier;
        this.master = obj.master;
    }
    type() {
        if (this.master)
            return null;
        return this.postIndex;
    }
    printIdentifiers() {
        console.log(this.identifier);
    }
    static createArray(obj) {
        let arr = [];
        obj.forEach((element) => {
            arr.push(new User(element));
        });
        return arr;
    }
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
        if (critical)
            process.exit(1);
        return null;
    }
};
const createJaggedArray = (numOfPatruljer) => {
    let array = [];
    for (let patruljer = 0; patruljer < numOfPatruljer; patruljer++) {
        array.push([]);
    }
    return array;
};
const getTimeString = (date) => {
    if (date == undefined)
        date = new Date();
    return date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + (date.getDay()) + ' ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
};
const writeToServerLog = (message) => {
    serverLogWriteStream.write("\n" + getTimeString() + " - " + message);
};
const writeToPatruljeLog = (melding) => {
    patruljeLogWriteStream.write(getTimeString() + " - " + melding + "\n");
};
const sendAllPatruljerTowardsFirstPost = () => {
    const time = getTimeString();
    ppMatrix.forEach((patrulje) => {
        patrulje.push(time);
    });
};
const patruljeLogWriteStream = fs.createWriteStream("data/patruljeLog.txt", { flags: 'a' });
const serverLogWriteStream = fs.createWriteStream("data/serverLog.txt", { flags: 'a' });
writeToServerLog("PROGRAM STARTED - Loading files");
const loeb = new Loeb(readJSONFileSync("data/loeb.json", true));
console.log("Loeb loaded succesfully");
const poster = Post.createArray(readJSONFileSync("data/poster.json", true));
console.log(poster.length.toString() + " poster loaded succesfully");
let ppMatrix = readJSONFileSync("data/ppMatrix.json");
if (ppMatrix == null) {
    ppMatrix = createJaggedArray(loeb.patruljer.length);
    fs.writeFile("data/ppMatrix.json", JSON.stringify(ppMatrix), () => { });
    console.log("Patruljepost-matrix (ppMatrix.json) oprettet med " + ppMatrix.length + " patruljer");
    sendAllPatruljerTowardsFirstPost();
    fs.writeFile("data/ppMatrix.json", JSON.stringify(ppMatrix), () => { });
}
else
    console.log("ppMatrix.json loaded succesfully");
const users = User.createArray(readJSONFileSync("data/users.json", true));
console.log(users.length.toString() + " users loaded succesfully");
writeToServerLog("All files loaded succesfully");
const server = http.createServer((req, res) => {
    const { headers, method, url } = req;
    if (req.method == "GET") {
        console.log(url);
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
}).listen(port, hostname, () => {
    console.log(`Server is now listening at http://${hostname}:${port}`);
    writeToServerLog("Server running");
});
const homeReq = (req, res) => {
    sendFileToClient(res, "home.html");
};
const loginReq = (req, res) => {
    const password = req.headers['password'];
    const identifier = req.headers['id'];
    let succes = false;
    for (let i = 0; i < users.length; i++) {
        const user = users[i];
        if (user.kode == password) {
            user.identifier.push(identifier);
            if (user.master)
                res.setHeader("isMaster", "true");
            res.writeHead(200);
            res.end();
            succes = true;
            break;
        }
    }
    console.log("User logging in: " + password + " - " + identifier);
    if (!succes) {
        res.writeHead(403);
        res.end();
    }
};
const mandskabReq = (req, res) => {
    sendFileToClient(res, "mandskab.html");
};
const getUpdateReq = (req, res) => {
};
const getDataReq = (req, res) => {
    const userPost = recognizeUser(req.headers['id']);
    console.log("Get data request with post: " + userPost.toString());
    if (userPost == -1)
        res.writeHead(403);
    else if (userPost == null) {
        res.writeHead(403);
    }
    else {
        let omvejÅben;
        if (userPost >= poster.length - 1 || poster[userPost].erOmvej) {
            omvejÅben = false;
        }
        else
            omvejÅben = poster[userPost + 1].erOmvej;
        res.setHeader("data", JSON.stringify({
            "påPost": patruljerPåPost(userPost),
            "påVej": patruljerPåVej(userPost),
            "post": poster[userPost].navn,
            "omvejÅben": omvejÅben,
        }));
    }
    res.end();
};
const sendUpdateReq = (req, res) => {
    const headers = req.headers;
    const userPostIndex = recognizeUser(headers['id']);
    let status = 200;
    console.log("update recieved");
    if (userPostIndex >= 0 || userPostIndex == null) {
        console.log("User recognized as user " + userPostIndex);
        try {
            const update = req.headers['update'];
            const split = update.split('%');
            const pIndex = Number.parseInt(split[0]) - 1;
            const melding = split[1];
            const makeChanges = req.headers['commit-type'] == "commit";
            if (melding == "ud") {
                console.log("Patrulje skal tjekkes ud");
                if (canPatruljeBeCheckedUd(pIndex, userPostIndex)) {
                    if (makeChanges) {
                        const postOrOmvej = split[2];
                        checkPatruljeUdAndTowardsNext(pIndex, userPostIndex, postOrOmvej);
                        if (userPostIndex < poster.length - 1) {
                            let postIndexAddition = 1;
                            if (postOrOmvej == "post" && poster[userPostIndex + 1].erOmvej)
                                postIndexAddition = 2;
                            writeToPatruljeLog(`Patrulje ${pIndex + 1} tjekkes UD fra ${poster[userPostIndex].navn} og går mod ${poster[userPostIndex + postIndexAddition].navn}`);
                        }
                        else
                            writeToPatruljeLog(`Patrulje ${pIndex + 1} tjekkes UD fra ${poster[userPostIndex].navn} og går mod MÅL`);
                    }
                }
                else
                    status = 400;
            }
            else if (melding == "ind") {
                if (canPatruljeBeCheckedIn(pIndex, userPostIndex)) {
                    if (makeChanges) {
                        checkPatruljeInd(pIndex);
                        writeToPatruljeLog(`Patrulje ${pIndex + 1} tjekkes IND på post ${userPostIndex + 1}`);
                    }
                }
                else
                    status = 400;
            }
        }
        catch (error) {
            console.log("Error in update: " + error);
            status = 400;
        }
    }
    else {
        status = 403;
    }
    fs.writeFile("data/ppMatrix.json", JSON.stringify(ppMatrix), () => { });
    res.writeHead(status);
    res.end();
};
const masterReq = (req, res) => {
};
const canPatruljeBeCheckedUd = (pNum, post) => {
    return ppMatrix[pNum].length == 3 * post + 2;
};
const canPatruljeBeCheckedIn = (pNum, post) => {
    return ppMatrix[pNum].length == 3 * post + 1;
};
const patruljerPåPost = (post) => {
    console.log("Post der undersøges: " + post.toString());
    let patruljer = [];
    for (let i = 0; i < ppMatrix.length; i++) {
        if (ppMatrix[i].length == post * 3 + 2)
            patruljer.push(i + 1);
    }
    return patruljer;
};
const patruljerPåVej = (post) => {
    let patruljer = [];
    for (let i = 0; i < ppMatrix.length; i++) {
        if (ppMatrix[i].length == post * 3 + 1)
            patruljer.push(i + 1);
    }
    return patruljer;
};
const recognizeUser = (id) => {
    let userPostIndex = -1;
    for (let u = 0; u < users.length; u++) {
        const user = users[u];
        user.printIdentifiers();
        for (let i = 0; i < user.identifier.length; i++) {
            if (id == user.identifier[i]) {
                userPostIndex = user.type();
                u = users.length;
                break;
            }
        }
    }
    return userPostIndex;
};
const checkPatruljeUdAndTowardsNext = (pIndex, currentPostIndex, omvejOrPost) => {
    const date = new Date();
    ppMatrix[pIndex].push(getTimeString(date));
    if (currentPostIndex < poster.length - 1) {
        const nextPostIsOmvej = poster[currentPostIndex + 1].erOmvej;
        const patruljeSkalPåOmvej = omvejOrPost == "omvej";
        if (nextPostIsOmvej && !patruljeSkalPåOmvej) {
            for (let i = 0; i < 3; i++) {
                ppMatrix[pIndex].push("");
            }
        }
        ppMatrix[pIndex].push(getTimeString(date));
    }
};
const checkPatruljeInd = (pIndex) => {
    ppMatrix[pIndex].push(getTimeString());
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
