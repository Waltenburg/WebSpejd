let kode: HTMLInputElement
const onLoadFunction = () => {
    console.log("Page loaded")
    kode = document.getElementById("kode") as HTMLInputElement
    if(getCookie("identifier") == null)
        (document.getElementById("loginWithExistingUser") as HTMLButtonElement).disabled = true
}
const loginClicked = () => {
    let identifier: string
    if(kode.value.match("^[a-zA-Z0-9]{4,15}\$") != null){
        identifier = generateIdentifyer(20)
        const loginHeader: Headers = new Headers({
            "password": kode.value,
            "id": identifier
        })
        const loginSucces = (status: number, headers: Headers) => {
            setCookie("identifier", identifier, 10/24/60)
            if(headers.get("ismaster") == "true")
                location.assign("/master")
            else
                location.assign("/mandskab")
        }
        const wrongPassword = () => {
            kode.style.setProperty("color", "red")
        }
        sendRequest("/login", loginHeader, loginSucces, wrongPassword)
    }              
}
const codeChanged = () => {
    kode.style.setProperty("color", "black")
}
function loginWithExistingUser(){
        location.assign("postmandskab.html")
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