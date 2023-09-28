/// <reference path="sendHTTPRequest.ts"/>
namespace Client{
    export namespace Home{
        let kode: HTMLInputElement
        export const onLoadFunction = () => {
            console.log("Page loaded")
            kode = document.getElementById("kode") as HTMLInputElement
            if(getCookie("identifier") != null){
                const master = getCookie("master");
                if(master == "true")
                    (document.getElementById("loginInMaster") as HTMLButtonElement).disabled = false;
                else if(master == "false")
                    (document.getElementById("loginInMandskab") as HTMLButtonElement).disabled = false;
            }
        }
        export const loginClicked = (existingUser?: boolean) => {
            if(kode.value.match("^[a-zA-Z0-9]{4,15}\$") != null || existingUser){
                const identifier = existingUser ? getCookie("identifier"): generateIdentifyer(20)
                const loginHeader: Headers = new Headers({
                    "id": identifier,
                    "password": kode.value,
                })
                const loginSucces = (status: number, headers: Headers) => {
                    setCookie("identifier", identifier, 2)
                    if(headers.get("ismaster") == "true"){
                        setCookie("master", "true", 2)
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
    }
}