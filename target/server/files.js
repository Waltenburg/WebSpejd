"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.files = void 0;
const fs = __importStar(require("fs"));
var files;
(function (files) {
    files.isAssetFile = (path) => {
        if (!path.startsWith("/assets/")) {
            return false;
        }
        return fs.existsSync(path.slice(1));
    };
    files.isClientJs = (path) => {
        if (!path.startsWith("/js/")) {
            return false;
        }
        return true;
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
        if (path[0] == '/') {
            path = path.substring(1);
        }
        try {
            return JSON.parse(fs.readFileSync(path, { encoding: "utf8" }));
        }
        catch (err) {
            console.log("Error reading file " + path);
            if (critical) {
                console.log(err);
                process.exit(1);
            }
            return null;
        }
    };
    files.sendFileToClient = (res, path, failCallback) => {
        files.getFile(path, file => {
            res.setHeader("content-type", files.determineContentType(path));
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
        const fileExtension = path.split('.')[1];
        const extensionsWithUTF8 = ["css", "html", "txt", "js"];
        let encoding;
        if (extensionsWithUTF8.includes(fileExtension)) {
            encoding = "utf8";
        }
        else {
            encoding = null;
        }
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
    files.determineContentType = (path) => {
        let split = path.split(".");
        let extension = split[split.length - 1].toLowerCase();
        const extensionsToMimeTypes = {
            "css": "text/css",
            "html": "text/html",
            "ico": "image/x-icon",
            "jpg": "image/jpg",
            "json": "application/JSON",
            "js": "application/javascript",
            "mp3": "audio/mpeg",
            "png": "image/png",
        };
        if (extension in extensionsToMimeTypes) {
            return extensionsToMimeTypes[extension];
        }
        return "*/*";
    };
})(files || (exports.files = files = {}));
//# sourceMappingURL=files.js.map