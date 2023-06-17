"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http = require("http");
const fs = require("fs");
const serverClasses_1 = require("./serverClasses");
const files_1 = require("./files");
var CCMR_server;
(function (CCMR_server) {
    process.chdir(__dirname);
    const hostname = '127.0.0.1';
    const port = 3000;
    let log;
    (function (log) {
        const patruljeLogWriteStream = fs.createWriteStream("data/patruljeLog.txt", { flags: 'a' });
        const serverLogWriteStream = fs.createWriteStream("data/serverLog.txt", { flags: 'a' });
        log.writeToServerLog = (message) => {
            serverLogWriteStream.write("\n" + getTimeString() + " - " + message);
        };
        log.writeToPatruljeLog = (melding) => {
            const skriv = getTimeString() + " - " + melding;
            patruljeLogWriteStream.write(skriv + "\n");
            addToLastUpdates(skriv);
        };
        let lastUpdates = [];
        let lastUpdatesIndex = 0;
        const numberOfLogsToKeep = 5;
        const addToLastUpdates = (update) => {
            lastUpdates.push(update);
            lastUpdatesIndex++;
            if (lastUpdates.length > numberOfLogsToKeep)
                lastUpdates.shift();
        };
        log.getNewUpdates = () => {
            return lastUpdates;
        };
    })(log || (log = {}));
    let patruljer;
    (function (patruljer_1) {
        patruljer_1.sendAllPatruljerTowardsFirstPost = () => {
            const time = getTimeString();
            ppMatrix.forEach((patrulje) => {
                patrulje.push(time);
            });
        };
        patruljer_1.canPatruljeBeCheckedUd = (pNum, post) => {
            return (ppMatrix[pNum].length == 3 * post + 2 && loeb.patruljeIkkeUdgået(pNum));
        };
        patruljer_1.canPatruljeBeCheckedIn = (pNum, post) => {
            return (ppMatrix[pNum].length == 3 * post + 1 && loeb.patruljeIkkeUdgået(pNum));
        };
        patruljer_1.patruljerPåPost = (post) => {
            let patruljer = [];
            for (let i = 0; i < ppMatrix.length; i++) {
                if (ppMatrix[i].length == post * 3 + 2 && loeb.patruljeIkkeUdgået(i))
                    patruljer.push(i + 1);
            }
            return patruljer;
        };
        patruljer_1.patruljerPåVej = (post) => {
            let patruljer = [];
            for (let i = 0; i < ppMatrix.length; i++) {
                if (ppMatrix[i].length == post * 3 + 1 && loeb.patruljeIkkeUdgået(i))
                    patruljer.push(i + 1);
            }
            return patruljer;
        };
        patruljer_1.checkPatruljeUdAndTowardsNext = (pIndex, currentPostIndex, omvejOrPost) => {
            const date = new Date();
            ppMatrix[pIndex].push(getTimeString(date));
            lastUpdateTimesPost[currentPostIndex] = date.getTime();
            lastUpdateTimesPatrulje[pIndex] = date.getTime();
            if (currentPostIndex < poster.length - 1) {
                const nextPostIsOmvej = poster[currentPostIndex + 1].erOmvej;
                const patruljeSkalPåOmvej = omvejOrPost == "omvej";
                if (nextPostIsOmvej && !patruljeSkalPåOmvej) {
                    for (let i = 0; i < 3; i++) {
                        ppMatrix[pIndex].push("");
                    }
                }
                ppMatrix[pIndex].push(getTimeString(date));
                lastUpdateTimesPost[currentPostIndex + patruljer_1.postIndexAddition(omvejOrPost, currentPostIndex)] = date.getTime();
            }
        };
        patruljer_1.checkPatruljeInd = (pIndex, currentPostIndex) => {
            ppMatrix[pIndex].push(getTimeString());
            const date = new Date().getTime();
            lastUpdateTimesPost[currentPostIndex] = date;
            lastUpdateTimesPatrulje[pIndex] = date;
        };
        patruljer_1.postIndexAddition = (postOrOmvej, userPostIndex) => {
            let postIndexAddition = 1;
            if (postOrOmvej == "post" && poster[userPostIndex + 1].erOmvej)
                postIndexAddition = 2;
            return postIndexAddition;
        };
    })(patruljer || (patruljer = {}));
    let reqRes;
    (function (reqRes) {
        reqRes.loginReq = (req, res) => {
            const password = req.headers['password'];
            const identifier = req.headers['id'];
            let succes = false;
            for (let i = 0; i < serverClasses_1.serverClasses.User.users.length; i++) {
                const user = serverClasses_1.serverClasses.User.users[i];
                if (user.kode == password) {
                    user.addIdentifier(identifier);
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
        reqRes.getUpdateReq = (req, res) => {
            const userPost = serverClasses_1.serverClasses.User.recognizeUser(req.headers['id']);
            if (userPost == -1) {
                res.writeHead(403);
                res.end();
            }
            else if (userPost == Infinity) {
                res.writeHead(403);
            }
            else {
                const userLastUpdate = parseInt(req.headers['last-update']);
                if (userLastUpdate < lastUpdateTimesPost[userPost]) {
                    res.setHeader("update", "true");
                    reqRes.getDataReq(req, res);
                }
                else {
                    res.setHeader("update", "false");
                    res.end();
                }
            }
        };
        reqRes.getDataReq = (req, res) => {
            const userPost = serverClasses_1.serverClasses.User.recognizeUser(req.headers['id']);
            if (userPost == null || userPost == Infinity)
                res.writeHead(403);
            else if (userPost >= 0) {
                let omvejÅben;
                if (userPost >= poster.length - 1 || poster[userPost].erOmvej) {
                    omvejÅben = false;
                }
                else
                    omvejÅben = poster[userPost + 1].erOmvej;
                res.setHeader("data", JSON.stringify({
                    "påPost": patruljer.patruljerPåPost(userPost),
                    "påVej": patruljer.patruljerPåVej(userPost),
                    "post": poster[userPost].navn,
                    "omvejÅben": omvejÅben,
                }));
            }
            res.end();
        };
        reqRes.sendUpdateReq = (req, res, overrideUserPost) => {
            const headers = req.headers;
            const userPostIndex = overrideUserPost == undefined ? serverClasses_1.serverClasses.User.recognizeUser(headers['id']) : overrideUserPost;
            let status = 200;
            if (userPostIndex >= 0 || userPostIndex == null) {
                try {
                    const update = req.headers['update'];
                    const split = update.split('%');
                    const pIndex = Number.parseInt(split[0]) - 1;
                    const melding = split[1];
                    const commit = req.headers['commit-type'] == "commit";
                    if (melding == "ud") {
                        if (patruljer.canPatruljeBeCheckedUd(pIndex, userPostIndex)) {
                            if (commit) {
                                const postOrOmvej = split[2];
                                patruljer.checkPatruljeUdAndTowardsNext(pIndex, userPostIndex, postOrOmvej);
                                if (userPostIndex < poster.length - 1) {
                                    let postAddition = patruljer.postIndexAddition(postOrOmvej, userPostIndex);
                                    log.writeToPatruljeLog(`Patrulje ${pIndex + 1} tjekkes UD fra ${poster[userPostIndex].navn} og går mod ${poster[userPostIndex + postAddition].navn}`);
                                }
                                else
                                    log.writeToPatruljeLog(`Patrulje ${pIndex + 1} tjekkes UD fra ${poster[userPostIndex].navn} og går mod MÅL`);
                            }
                        }
                        else
                            status = 400;
                    }
                    else if (melding == "ind") {
                        if (patruljer.canPatruljeBeCheckedIn(pIndex, userPostIndex)) {
                            if (commit) {
                                patruljer.checkPatruljeInd(pIndex, userPostIndex);
                                log.writeToPatruljeLog(`Patrulje ${pIndex + 1} tjekkes IND på post ${userPostIndex + 1}`);
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
        reqRes.masterDataReq = (req, res) => {
            const isMaster = serverClasses_1.serverClasses.User.recognizeUser(req.headers['id']) == Infinity;
            if (isMaster) {
                console.log(log.getNewUpdates());
                res.setHeader("data", JSON.stringify({
                    "loeb": loeb,
                    "ppMatrix": ppMatrix,
                    "poster": poster,
                    "sidsteMeldinger": log.getNewUpdates()
                }));
            }
            else
                res.writeHead(403);
            res.end();
        };
        reqRes.masterUpdateReq = (req, res) => {
            if (serverClasses_1.serverClasses.User.recognizeUser(req.headers['id']) == Infinity) {
                const mastersLastUpdate = parseInt(req.headers['last-update']);
                let patruljerDerSkalOpdateres = [];
                let ppArrays = [];
                for (let p = 0; p < lastUpdateTimesPatrulje.length; p++) {
                    if (mastersLastUpdate < lastUpdateTimesPatrulje[p]) {
                        patruljerDerSkalOpdateres.push(p);
                        ppArrays.push(ppMatrix[p]);
                    }
                }
                if (patruljerDerSkalOpdateres.length > 0) {
                    res.setHeader("update", "true");
                    res.setHeader("data", JSON.stringify({
                        "patruljer": patruljerDerSkalOpdateres,
                        "ppArrays": ppArrays,
                        "senesteUpdates": log.getNewUpdates()
                    }));
                }
                else
                    res.setHeader("update", "false");
                res.writeHead(200);
            }
            else
                res.writeHead(403);
            res.end();
        };
    })(reqRes || (reqRes = {}));
    const cleanUpServer = (options, event) => {
        console.log("Program exiting with code: " + event);
        try {
            log.writeToServerLog("Program exiting with code: " + event);
            fs.writeFileSync("data/users.json", JSON.stringify(serverClasses_1.serverClasses.User.users));
        }
        catch {
            console.log("Problem with writing to server log");
            process.exit();
        }
        process.exit();
    };
    const getTimeString = (date) => {
        if (date == undefined)
            date = new Date();
        return date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + (date.getDate()) + ' ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
    };
    [`exit`, `SIGINT`, `SIGUSR1`, `SIGUSR2`, `uncaughtException`, `SIGTERM`].forEach((eventType) => {
        process.on(eventType, cleanUpServer.bind(null, eventType));
    });
    log.writeToServerLog("PROGRAM STARTED - Loading files");
    const loeb = new serverClasses_1.serverClasses.Loeb(files_1.files.readJSONFileSync("data/loeb.json", true));
    const poster = serverClasses_1.serverClasses.Post.createArray(files_1.files.readJSONFileSync("data/poster.json", true));
    let ppMatrix = files_1.files.readJSONFileSync("data/ppMatrix.json");
    if (ppMatrix == null) {
        ppMatrix = Array.apply(null, Array(loeb.patruljer.length)).map(() => []);
        fs.writeFile("data/ppMatrix.json", JSON.stringify(ppMatrix), () => { });
        console.log("Patruljepost-matrix (ppMatrix.json) oprettet med " + ppMatrix.length + " patruljer");
        patruljer.sendAllPatruljerTowardsFirstPost();
        fs.writeFile("data/ppMatrix.json", JSON.stringify(ppMatrix), () => { });
    }
    serverClasses_1.serverClasses.User.users = serverClasses_1.serverClasses.User.createUserArray(files_1.files.readJSONFileSync("data/users.json", true));
    serverClasses_1.serverClasses.User.startDeleteInterval();
    console.log(`Alle filer succesfuldt loadet. Loadet ${poster.length} poster, ${serverClasses_1.serverClasses.User.users.length} brugere og ${ppMatrix.length} patruljer`);
    log.writeToServerLog(`Alle filer succesfuldt loadet. Loadet ${poster.length} poster, ${serverClasses_1.serverClasses.User.users.length} brugere og ${ppMatrix.length} patruljer`);
    let lastUpdateTimesPost = Array.apply(null, Array(poster.length)).map(() => new Date().getTime());
    let lastUpdateTimesPatrulje = Array.apply(null, Array(ppMatrix.length)).map(() => new Date().getTime());
    const server = http.createServer((req, res) => {
        const { headers, method, url } = req;
        if (req.method == "GET") {
            if (files_1.files.urlIsValidPathToFile(req.url))
                files_1.files.sendFileToClient(res, req.url);
            else {
                switch (req.url) {
                    case "/":
                    case "/home":
                        files_1.files.sendFileToClient(res, "home.html");
                        break;
                    case "/login":
                        reqRes.loginReq(req, res);
                        break;
                    case "/mandskab":
                        files_1.files.sendFileToClient(res, "mandskab.html");
                        break;
                    case "/getUpdate":
                        reqRes.getUpdateReq(req, res);
                        break;
                    case "/getData":
                        reqRes.getDataReq(req, res);
                        break;
                    case "/sendUpdate":
                        reqRes.sendUpdateReq(req, res);
                        break;
                    case "/master":
                        files_1.files.sendFileToClient(res, "master.html");
                        break;
                    case "/masterData":
                        reqRes.masterDataReq(req, res);
                        break;
                    case "/masterUpdate":
                        reqRes.masterUpdateReq(req, res);
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
        log.writeToServerLog("Server running");
    });
})(CCMR_server || (CCMR_server = {}));
