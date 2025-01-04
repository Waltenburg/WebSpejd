import { assert } from "chai";
import { ChildProcess, ChildProcessWithoutNullStreams, exec, spawn } from "child_process";

const pathToServer = 'test/server.js'
const pathToDatabase = 'test/database.json'
const pathToAssets = 'assets'
const PORT = 43210;
let serverProcess: ChildProcessWithoutNullStreams;
const reqTimedOut = new Error("Request timed out");

describe("Requests to server", () => {
    before((done) => {
        // console.log("Starting server");
        const command = `node ${pathToServer} --database ${pathToDatabase} --port ${PORT} --assets ${pathToAssets}`;
        // const command = 'echo %cd%';
        // console.log(command);

        serverProcess = spawn('node', [pathToServer, '--database', pathToDatabase, '--port', `${PORT}`, '--assets', pathToAssets], { stdio: 'pipe' });

        serverProcess.on('error', (err) => {
            console.error("Error starting server:", err);
            done(err);
            assert.fail(err.message);
        });

        serverProcess.stdout?.on('data', (data) => {
            const output:string = data.toString();
            if (output.includes("Server is now listening")) {
                done();
            }
            else if(output.includes("Program exiting")) {
                // done("Server exited");
                assert.fail("Server exited");
            }
        });

        serverProcess.stderr?.on('data', (data) => {
            console.error("stderr:", data.toString());
            done(data);
            assert.fail(data.toString());
        });
    });
    after(() => {
        console.log("Stopping server");
        serverProcess.kill();
    })

    it("Should respond with 200", (done) => {
        fetch(`http://localhost:${PORT}`).then((response) => {
            assert.equal(response.status, 200);
            done();
        }).catch(() => {
            done(reqTimedOut);
        });
    });

    it("Should still respond with 200", (done) => {
        // fetch(`http://localhost:${PORT}/css/loginStyle.css`).then((response) => {
        fetch(`http://localhost:${PORT}/assets/css/loginStyle.css`, { signal: AbortSignal.timeout(200) }).then((response) => {
            assert.equal(response.status, 200);
            done();
        }).catch(() => {
            done(reqTimedOut);
        });
    });
})