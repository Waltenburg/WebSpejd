import * as http from 'http'
import * as fs from 'fs'
import { serverClasses as sc } from './serverClasses'
export namespace files{
    export const urlIsValidPathToFile = (str: string): boolean => {
        if(str.includes(".json"))
            return false
        return (str.split('/').slice(-1)[0].match("\^[a-zA-Z\-_0-9]{2,}[.][a-zA-Z0-9]{2,}\$")) != null
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
    export const readJSONFileSync = (path: string, critical?: boolean): object => {
        //Removing "/"" at the start of paths 
        if (path[0] == '/')
            path = path.substring(1)
        try{
            return JSON.parse(fs.readFileSync(path, {encoding: "utf8"}))
        }catch (err){
            console.log("Error reading file " + path)
            if(critical)
                process.exit(1)
            return null
        }
    }
    //Sends file with "path" to client with response "res".
    //On error in reading file it calls failCallback if given. If not given 404 error will be send to client.
    export const sendFileToClient = (res: http.ServerResponse, path: string, failCallback?: sc.singleParamCallback<void>): void => {
        getFile(path,
            file => {
                res.setHeader("content_type", determineContentType(path))
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
        //Removing "/"" at the start of paths 
        if (path[0] == '/')
            path = path.substring(1)

        //Setting correct encoding type. Extensions in "extensionsWithUTF8" will be encoded with utf8. 
        //Everything else will not be encoded beacuse "encoding" = null
        const fileExtension: string = path.split('.')[1]
        const extensionsWithUTF8: string[] = ["css", "html", "txt", "js"]
        let encoding;
        if (extensionsWithUTF8.includes(fileExtension))
            encoding = "utf8"
        else
            encoding = null

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
    const determineContentType = (path: string): sc.MIME => {
        let split = path.split(".")
        let extension = split[split.length - 1].toLowerCase()

        const extensions: string[] = ["css", "html", "jpg", "png", "json", "ico", "mp3"]
        const MIMEType: sc.MIME[] = [sc.MIME.css, sc.MIME.html, sc.MIME.jpg, sc.MIME.png, sc.MIME.json, sc.MIME.ico, sc.MIME.mp3]
        const index = extensions.indexOf(extension)
        if (index >= 0)
            return MIMEType[index]
        return sc.MIME.any
    }
}