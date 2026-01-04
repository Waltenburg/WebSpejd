"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.codeChanged = void 0;
const endpoints_js_1 = require("@shared/endpoints.js");
const cookie_js_1 = require("./cookie.js");
const sendHTTPRequest_js_1 = require("./sendHTTPRequest.js");
let kode;
const onLoadFunction = () => {
    kode = document.getElementById("kode");
    kode.addEventListener("keypress", (e) => {
        if (e.key == "Enter")
            loginClicked();
        else
            (0, exports.codeChanged)();
    });
    if ((0, cookie_js_1.getCookie)("identifier") != null) {
        const master = (0, cookie_js_1.getCookie)("master");
        if (master == "true")
            document.getElementById("loginInMaster").disabled = false;
        else if (master == "false")
            document.getElementById("loginInMandskab").disabled = false;
    }
    document.getElementById("loginButton").addEventListener("click", () => loginClicked(false));
    document.getElementById("loginInMandskab").addEventListener("click", () => location.assign(endpoints_js_1.Endpoints.Mandskab));
    document.getElementById("loginInMaster").addEventListener("click", () => location.assign(endpoints_js_1.Endpoints.Master));
    console.log("Home page loaded");
};
const loginClicked = (existingUser) => {
    const identifier = existingUser ? (0, cookie_js_1.getCookie)("identifier") : generateIdentifyer(20);
    if (identifier == null)
        throw new Error("No identifier cookie set");
    const loginHeader = new Headers({
        "id": identifier,
        "password": kode.value,
    });
    const loginSucces = (status, headers) => {
        (0, cookie_js_1.setCookie)("identifier", identifier, 2);
        if (headers.get("ismaster") == "true") {
            (0, cookie_js_1.setCookie)("master", "true", 1);
            location.assign("/master");
        }
        else {
            (0, cookie_js_1.setCookie)("master", "false", 2);
            location.assign("/mandskab");
        }
    };
    const wrongPassword = () => {
        kode.style.setProperty("color", "red");
    };
    (0, sendHTTPRequest_js_1.sendRequest)("/login", loginHeader, loginSucces, wrongPassword, true);
};
const codeChanged = () => {
    kode.style.setProperty("color", "black");
};
exports.codeChanged = codeChanged;
const generateIdentifyer = (length) => {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return result;
};
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onLoadFunction);
}
else {
    onLoadFunction();
}
//# sourceMappingURL=home.js.map