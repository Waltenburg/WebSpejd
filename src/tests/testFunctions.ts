import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { assert } from "chai";

export namespace EndPointTest{
    
    /**
     * A suite of tests for a single endpoint
     * @param url The url of the endpoint
     */
    export class Suite{
        private url: string
        private port: number
    
        constructor(url: string, port: number){
            this.url = url
            this.port = port
        }
    }

    export class Test{
        private headers: Headers
        private query: string
        private responeTester: (response: Response) => string


        /**
         * A single test of an endpoint including the headers to send and the expected response
         * @param headers The headers to send with the request
         * @param assertion The expected response status code, or an array of possible status codes, or a function that takes the response and returns an error string if the response is not as expected and empty string otherwise
         */
        constructor(headers: Headers, assertion?: number | number[] | ((response: Response) => string), query?: string){
            this.headers = headers
            this.query = query

            if(!assertion)
                assertion = 200

            if(typeof assertion == "number"){
                this.responeTester = (response: Response) => {
                    if(response.status != assertion){
                        return `Expected ${assertion}, got ${response.status}`;
                    }
                    return "";
                }
            }
            else if(Array.isArray(assertion)){
                this.responeTester = (response: Response) => {
                    if(!assertion.includes(response.status)){
                        return `Expected ${assertion}, got ${response.status}`;
                    }
                    return "";
                }
            }
            else{
                this.responeTester = assertion
            }
        }
    }
}



export class URLTester{
    private url: string
    private goodID: string
    private badID: string
    private goodAction: Headers
    private badAction: Headers

    private currentHeaders: Headers

    

    private errorString: string

    test = (done: Mocha.Done) => {
        // Test goodID and goodAction giving 200
        this.currentHeaders = this.goodAction
            //If fail, add to errorString
        fetch(this.url, {
            headers: this.addID(this.goodAction, this.goodID),
            signal: AbortSignal.timeout(200)
        }).then((response) => {
            if(response.status != 200){
                this.errorString += `Good ID and good action gave ${response.status} instead of 200\n`;
            }
        }).catch(() => {
            this.errorString += "Good ID and good action timed out\n";
        });


        //Test goodID and badAction giving 403

        //Test badID and goodAction giving 401
    }

    private addID = (action: Headers, id: string) => {
        action.append("id", id);
        return action;
    }
}

// export const makeRequest = (url: string, action: Headers, assertFunction: (response: Response) => void) => {
//     fetch(url, { headers: action, signal: AbortSignal.timeout(200) }).then((response) => {
//         assertFunction(response);
//     }).catch(() => {
//         assert.fail("Request timed out");
//     }); 
// }

export class ServerShell{
    private serverProcess: ChildProcessWithoutNullStreams
    port: number
    private pathToServer: string
    private pathToDatabase: string
    private pathToAssets: string

    constructor(pathToServer: string, pathToDatabase: string, port: number, pathToAssets: string){
        this.pathToServer = pathToServer
        this.pathToDatabase = pathToDatabase
        this.port = port
        this.pathToAssets = pathToAssets
    }


    startServer = (done: Mocha.Done) => {
        this.serverProcess = spawn('node', [this.pathToServer, '--database', this.pathToDatabase, '--port', `${this.port}`, '--assets', this.pathToAssets], { stdio: 'pipe' });
    
        this.serverProcess.on('error', (err) => {
            console.error("Error starting server:", err);
            done(err);
            assert.fail(err.message);
        });
    
        this.serverProcess.stdout?.on('data', (data) => {
            const output:string = data.toString();
            if (output.includes("Server is now listening")) {
                done();
            }
            else if(output.includes("Program exiting")) {
                // done("Server exited");
                assert.fail("Server exited");
            }
        });
    
        this.serverProcess.stderr?.on('data', (data) => {
            console.error("stderr:", data.toString());
            done(data);
            assert.fail(data.toString());
        });
    }

    stopServer = () => {
        console.log("Stopping server");
        this.serverProcess.kill();
    }

}