import * as http from 'http';
import { serverClasses as sc } from './serverClasses';
export declare namespace files {
    /**
     * Returns true if input path points to a valid asset file.
     * @param path the url path
     * @returns `true` if the path is an asset file, `false` otherwise
     */
    const isAssetFile: (path: string) => boolean;
    /**
     * Returns `true` if input path points to a client javascript file.
     * @param path the url path
     * @return `true` if the path is a client javascript file, `false` otherwise
     */
    const isClientJs: (path: string) => boolean;
    const readJSONFile: (path: string, succesCallback: sc.singleParamCallback<object>, failCallback?: sc.singleParamCallback<void>) => object;
    /** Read json file synchronous */
    const readJSONFileSync: (path: string, critical?: boolean) => object;
    /**
     * Sends file with "path" to client with response "res".
     * On error in reading file it calls failCallback if given. If not given
     * 404 error will be send to client.
     */
    const sendFileToClient: (res: http.ServerResponse, path: string, failCallback?: sc.singleParamCallback<void>) => void;
    const getFile: (path: string, succesCallback: sc.singleParamCallback<Buffer | string>, failCallback?: sc.singleParamCallback<void>) => void;
    /**
     * Guess mimetype of file based on extension.
     * @param path the path to get mimetype of
     * @return the mimetype based on the path
     */
    const determineContentType: (path: string) => sc.MIME;
}
//# sourceMappingURL=files.d.ts.map