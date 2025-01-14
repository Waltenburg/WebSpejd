import { assert } from "chai";
import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { ServerShell } from "./testFunctions";

const pathToServer = 'test/server.js'
const pathToDatabase = 'test/database.json'
const pathToAssets = 'assets'
const PORT = 3000;

const reqTimedOut = new Error("Request timed out");

describe("Requests to server", () => {
    const server = new ServerShell(pathToServer, pathToDatabase, PORT, pathToAssets)
    before(server.startServer);
    after(server.stopServer);

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