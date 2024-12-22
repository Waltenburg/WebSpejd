"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.files = void 0;
const fs = require("fs");
const serverClasses_1 = require("./serverClasses");
var files;
(function (files) {
    files.urlIsValidPathToFile = (str) => {
        if (str.includes(".json"))
            return false;
        return (str.split('/').slice(-1)[0].match("\^[a-zA-Z\-_0-9]{2,}[.][a-zA-Z0-9]{2,}\$")) != null;
    };
    files.readJSONFile = (path, succesCallback, failCallback) => {
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
    files.readJSONFileSync = (path, critical) => {
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
    files.sendFileToClient = (res, path, failCallback) => {
        files.getFile(path, file => {
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
    files.getFile = (path, succesCallback, failCallback) => {
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
        const extensions = ["css", "html", "jpg", "png", "json", "ico", "mp3"];
        const MIMEType = [serverClasses_1.serverClasses.MIME.css, serverClasses_1.serverClasses.MIME.html, serverClasses_1.serverClasses.MIME.jpg, serverClasses_1.serverClasses.MIME.png, serverClasses_1.serverClasses.MIME.json, serverClasses_1.serverClasses.MIME.ico, serverClasses_1.serverClasses.MIME.mp3];
        const index = extensions.indexOf(extension);
        if (index >= 0)
            return MIMEType[index];
        return serverClasses_1.serverClasses.MIME.any;
    };
})(files || (exports.files = files = {}));
