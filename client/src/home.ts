import { Endpoints } from "@shared/endpoints.js";
import { getCookie, setCookie } from "./cookie.js";
import { sendRequest } from "./sendHTTPRequest.js";

let kode: HTMLInputElement
const onLoadFunction = () => {
    kode = document.getElementById("kode") as HTMLInputElement
    kode.addEventListener("keypress", (e) => {
        if(e.key == "Enter")
            loginClicked()
        else
            codeChanged()
    })
    if(getCookie("identifier") != null){
        const master = getCookie("master");
        if(master == "true")
            (document.getElementById("loginInMaster") as HTMLButtonElement).disabled = false;
        else if(master == "false")
            (document.getElementById("loginInMandskab") as HTMLButtonElement).disabled = false;
    }

    (document.getElementById("loginButton") as HTMLButtonElement).addEventListener("click", () => loginClicked(false));
    (document.getElementById("loginInMandskab") as HTMLButtonElement).addEventListener("click", () => location.assign(Endpoints.Mandskab));
    (document.getElementById("loginInMaster") as HTMLButtonElement).addEventListener("click", () => location.assign(Endpoints.Master));

    console.log("Home page loaded");
}
const loginClicked = (existingUser?: boolean) => {
    const identifier = existingUser ? getCookie("identifier"): generateIdentifyer(20)
    if(identifier == null)
        throw new Error("No identifier cookie set")

    const loginHeader: Headers = new Headers({
        "id": identifier,
        "password": kode.value,
    })
    const loginSucces = (status: number, headers: Headers) => {
        setCookie("identifier", identifier, 2)
        if(headers.get("ismaster") == "true"){
            setCookie("master", "true", 1)
            location.assign("/master")
        }
        else{
            setCookie("master", "false", 2)
            location.assign("/mandskab")
        }
    }
    const wrongPassword = () => {
        kode.style.setProperty("color", "red")
    }
    sendRequest("/login", loginHeader, loginSucces, wrongPassword, true)
}
export const codeChanged = () => {
    kode.style.setProperty("color", "black")
}
const generateIdentifyer = (length: number): string => {
    let result = '';
    const characters: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength: number = characters.length;
    let counter = 0;
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return result;
}

// Safe approach: wait for DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onLoadFunction);
} else {
    onLoadFunction();
}
