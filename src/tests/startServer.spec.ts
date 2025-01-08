import { assert } from "chai";
import { ChildProcess, ChildProcessWithoutNullStreams, exec, spawn } from "child_process";

const pathToServer = 'test/server.js'
const pathToDatabase = 'test/database.json'
const pathToAssets = 'assets'
const PORT = 43210;
let serverProcess: ChildProcessWithoutNullStreams;
const reqTimedOut = new Error("Request timed out");

const startServer = (done: Mocha.Done) => {
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
}

const stopServer = () => {
    console.log("Stopping server");
    serverProcess.kill();
}

const request = (adress: String, headers: Headers, assertion: (response: Response) => void, done: Mocha.Done) => {
    const url = `http://localhost:${PORT}/` + adress
    fetch(url, {
        headers: headers,
        signal: AbortSignal.timeout(200)
    }).then((response) => {
        assertion(response);
        done();
    }).catch(() => {
        done(reqTimedOut);
    });
}

describe("Requests to server", () => {
    before(startServer);
    after(stopServer);

    it("Should respond with 200", (done) => {
        fetch(`http://localhost:${PORT}`).then((response) => {
            assert.equal(response.status, 200);
            done();
        }).catch(() => {
            done(reqTimedOut);
        });
    });

    it("Should get file", (done) => {
        // fetch(`http://localhost:${PORT}/css/loginStyle.css`).then((response) => {
        fetch(`http://localhost:${PORT}/assets/css/loginStyle.css`, { signal: AbortSignal.timeout(200) }).then((response) => {
            assert.equal(response.status, 200);
            done();
        }).catch(() => {
            done(reqTimedOut);
        });
    });

    it("Should login", (done) => {
        request("login", new Headers({
            "id": "test",
            "password": "egernsamlernødder"
        }), (response) => {
            assert.equal(response.status, 200);
        },
        done);
    })
    it("Should not login", (done) => {
        request("login", new Headers({
            "id": "test",
            "password": "NotTheRightPassword"
        }), (response) => {
            assert.oneOf(response.status, [401, 404]);
        },
        done);
    })
})