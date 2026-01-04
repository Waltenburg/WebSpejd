"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const child_process_1 = require("child_process");
const pathToServer = 'test/server.js';
const pathToDatabase = 'test/database.json';
const pathToAssets = 'assets';
const PORT = 43210;
let serverProcess;
const reqTimedOut = new Error("Request timed out");
describe("Requests to server", () => {
    before((done) => {
        // console.log("Starting server");
        const command = `node ${pathToServer} --database ${pathToDatabase} --port ${PORT} --assets ${pathToAssets}`;
        // const command = 'echo %cd%';
        // console.log(command);
        serverProcess = (0, child_process_1.spawn)('node', [pathToServer, '--database', pathToDatabase, '--port', `${PORT}`, '--assets', pathToAssets], { stdio: 'pipe' });
        serverProcess.on('error', (err) => {
            console.error("Error starting server:", err);
            done(err);
            chai_1.assert.fail(err.message);
        });
        serverProcess.stdout?.on('data', (data) => {
            const output = data.toString();
            if (output.includes("Server is now listening")) {
                done();
            }
            else if (output.includes("Program exiting")) {
                // done("Server exited");
                chai_1.assert.fail("Server exited");
            }
        });
        serverProcess.stderr?.on('data', (data) => {
            console.error("stderr:", data.toString());
            done(data);
            chai_1.assert.fail(data.toString());
        });
    });
    after(() => {
        console.log("Stopping server");
        serverProcess.kill();
    });
    it("Should respond with 200", (done) => {
        fetch(`http://localhost:${PORT}`).then((response) => {
            chai_1.assert.equal(response.status, 200);
            done();
        }).catch(() => {
            done(reqTimedOut);
        });
    });
    it("Should still respond with 200", (done) => {
        // fetch(`http://localhost:${PORT}/css/loginStyle.css`).then((response) => {
        fetch(`http://localhost:${PORT}/assets/css/loginStyle.css`, { signal: AbortSignal.timeout(200) }).then((response) => {
            chai_1.assert.equal(response.status, 200);
            done();
        }).catch(() => {
            done(reqTimedOut);
        });
    });
});
