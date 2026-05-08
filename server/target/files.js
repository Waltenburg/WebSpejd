import * as fs from 'fs';
export var files;
(function (files) {
    /**
     * Returns true if input path points to a valid asset file.
     * @param path the url path
     * @returns `true` if the path is an asset file, `false` otherwise
     */
    files.isAssetFile = (path) => {
        if (!path.startsWith("/assets/")) {
            return false;
        }
        return fs.existsSync(path.slice(1));
    };
    /**
     * Returns `true` if input path points to a client javascript file.
     * @param path the url path
     * @return `true` if the path is a client javascript file, `false` otherwise
     */
    files.isClientJs = (path) => {
        if (!path.startsWith("/js/")) {
            return false;
        }
        return true;
    };
    files.readJSONFile = (path, succesCallback, failCallback) => {
        //Removing "/"" at the start of paths 
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
    /** Read json file synchronous */
    files.readJSONFileSync = (path, critical) => {
        // Removing "/" at the start of paths
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
    /**
     * Sends file with "path" to client with response "res".
     * On error in reading file it calls failCallback if given. If not given
     * 404 error will be send to client.
     */
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
        //Setting correct encoding type. Extensions in "extensionsWithUTF8" will be encoded with utf8. 
        //Everything else will not be encoded beacuse "encoding" = null
        const fileExtension = path.split('.')[1];
        const extensionsWithUTF8 = ["css", "html", "txt", "js"];
        let encoding;
        if (extensionsWithUTF8.includes(fileExtension)) {
            encoding = "utf8";
        }
        else {
            encoding = null;
        }
        //@ts-expect-error having "encoding" as a variable string raises error in typescript but not in javascript
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
    /**
     * Guess mimetype of file based on extension.
     * @param path the path to get mimetype of
     * @return the mimetype based on the path
     */
    files.determineContentType = (path) => {
        let split = path.split(".");
        let extension = split[split.length - 1].toLowerCase();
        const extensionsToMimeTypes = {
            "css": "text/css" /* sc.MIME.css */,
            "html": "text/html" /* sc.MIME.html */,
            "ico": "image/x-icon" /* sc.MIME.ico */,
            "jpg": "image/jpg" /* sc.MIME.jpg */,
            "json": "application/JSON" /* sc.MIME.json */,
            "js": "application/javascript" /* sc.MIME.javascript */,
            "mp3": "audio/mpeg" /* sc.MIME.mp3 */,
            "png": "image/png" /* sc.MIME.png */,
        };
        if (extension in extensionsToMimeTypes) {
            return extensionsToMimeTypes[extension];
        }
        return "*/*" /* sc.MIME.any */;
    };
})(files || (files = {}));
//# sourceMappingURL=files.js.map