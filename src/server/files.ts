import * as http from 'http'
import * as fs from 'fs'
import { serverClasses as sc } from './serverClasses'

export namespace files {
    /**
     * Returns true if input path points to a valid asset file.
     * @param path the url path
     * @returns `true` if the path is an asset file, `false` otherwise
     */
    export const isAssetFile = (path: string): boolean => {
        if (!path.startsWith("/assets/")) {
            return false;
        }
        return fs.existsSync(path.slice(1));
    }

    /**
     * Returns `true` if input path points to a client javascript file.
     * @param path the url path
     * @return `true` if the path is a client javascript file, `false` otherwise
     */
    export const isClientJs = (path: string): boolean => {
        if(!path.startsWith("/js/")) {
            return false;
        }
        return true;
    }

    export const readJSONFile = (path: string, succesCallback: sc.singleParamCallback<object>, failCallback?: sc.singleParamCallback<void>): object => {
        //Removing "/"" at the start of paths 
        if (path[0] == '/')
            path = path.substring(1)

        fs.readFile(path, "utf-8", (error: NodeJS.ErrnoException | null, data: string): void => {
            if (isError(error)) {
                console.log("error reading file: " + path)
                if (failCallback != null)
                    failCallback()
            }
            else{
                const obj = JSON.parse(data)
                succesCallback(obj)
                return obj
            }

            function isError(error: NodeJS.ErrnoException | null): error is NodeJS.ErrnoException { return !(!error) }
        })
        return null
    }

    /** Read json file synchronous */
    export const readJSONFileSync = (path: string, critical?: boolean): object => {
        // Removing "/" at the start of paths
        if (path[0] == '/') {
            path = path.substring(1)
        }

        try{
            return JSON.parse(fs.readFileSync(path, {encoding: "utf8"}))
        }catch (err){
            console.log("Error reading file " + path);
            if(critical) {
                console.log(err);
                process.exit(1);
            }
            return null
        }
    }

    /**
     * Sends file with "path" to client with response "res".
     * On error in reading file it calls failCallback if given. If not given
     * 404 error will be send to client.
     */
    export const sendFileToClient = (res: http.ServerResponse, path: string, failCallback?: sc.singleParamCallback<void>): void => {
        getFile(path,
            file => {
                res.setHeader("content-type", determineContentType(path))
                res.end(file)
            }, () => {
                if (failCallback == null) {
                    res.writeHead(404);
                    res.end()
                } else
                    failCallback()
            })
    }

    export const getFile = (path: string, succesCallback: sc.singleParamCallback<Buffer | string>, failCallback?: sc.singleParamCallback<void>): void => {
        //Setting correct encoding type. Extensions in "extensionsWithUTF8" will be encoded with utf8. 
        //Everything else will not be encoded beacuse "encoding" = null
        const fileExtension: string = path.split('.')[1]
        const extensionsWithUTF8: string[] = ["css", "html", "txt", "js"]
        let encoding;
        if (extensionsWithUTF8.includes(fileExtension)) {
            encoding = "utf8";
        } else {
            encoding = null;
        }

        //@ts-expect-error having "encoding" as a variable string raises error in typescript but not in javascript
        fs.readFile(path, encoding, (error: NodeJS.ErrnoException | null, data: Buffer | string): void => {
            if (isError(error)) {
                console.log("error reading file: " + path)
                if (failCallback != null)
                    failCallback()
            }
            else
                succesCallback(data)
            function isError(error: NodeJS.ErrnoException | null): error is NodeJS.ErrnoException { return !(!error) }
        })
    }

    /**
     * Guess mimetype of file based on extension.
     * @param path the path to get mimetype of
     * @return the mimetype based on the path
     */
    export const determineContentType = (path: string): sc.MIME => {
        let split = path.split(".")
        let extension = split[split.length - 1].toLowerCase()

        const extensionsToMimeTypes: { [extension: string]: sc.MIME } = {
            "css": sc.MIME.css,
            "html": sc.MIME.html,
            "ico": sc.MIME.ico,
            "jpg": sc.MIME.jpg,
            "json": sc.MIME.json,
            "js": sc.MIME.javascript,
            "mp3": sc.MIME.mp3,
            "png": sc.MIME.png,
        };
        if (extension in extensionsToMimeTypes) {
            return extensionsToMimeTypes[extension];
        }
        return sc.MIME.any;
    }
}
