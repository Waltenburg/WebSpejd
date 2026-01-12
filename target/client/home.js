import { getCookie, setCookie } from "./cookie.js";
import { sendRequest } from "./sendHTTPRequest.js";
let kode;
const onLoadFunction = () => {
    kode = document.getElementById("kode");
    kode.addEventListener("keypress", (e) => {
        if (e.key == "Enter")
            loginClicked();
        else
            codeChanged();
    });
    if (getCookie("identifier") != null) {
        const master = getCookie("master");
        if (master == "true")
            document.getElementById("loginInMaster").disabled = false;
        else if (master == "false")
            document.getElementById("loginInMandskab").disabled = false;
    }
    document.getElementById("loginButton").addEventListener("click", () => loginClicked(false));
    document.getElementById("loginInMandskab").addEventListener("click", () => location.assign("/mandskab"));
    document.getElementById("loginInMaster").addEventListener("click", () => location.assign("/master"));
    console.log("Home page loaded");
};
const loginClicked = (existingUser) => {
    const identifier = existingUser ? getCookie("identifier") : generateIdentifyer(20);
    if (identifier == null)
        throw new Error("No identifier cookie set");
    const loginHeader = new Headers({
        "id": identifier,
        "password": kode.value,
    });
    const loginSucces = (status, headers) => {
        setCookie("identifier", identifier, 2);
        if (headers.get("ismaster") == "true") {
            setCookie("master", "true", 1);
            location.assign("/master");
        }
        else {
            setCookie("master", "false", 2);
            location.assign("/mandskab");
        }
    };
    const wrongPassword = () => {
        kode.style.setProperty("color", "red");
    };
    sendRequest("/login", loginHeader, loginSucces, wrongPassword, true);
};
export const codeChanged = () => {
    kode.style.setProperty("color", "black");
};
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