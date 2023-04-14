let kode: HTMLInputElement
const onLoadFunction = () => {
    console.log("Page loaded")
    kode = document.getElementById("kode") as HTMLInputElement
    if(getCookie("identifier") == null)
        (document.getElementById("loginWithExistingUser") as HTMLButtonElement).disabled = true
}
const loginClicked = () => {
    let identifier: string
    if(kode.value.match("^[a-zA-Z0-9]{6,15}\$") != null){
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
        const wrongPassword = (status: number) => {
            kode.style.setProperty("color", "red")
        }
        sendRequest("/login", loginHeader, loginSucces, wrongPassword)
    }

    
    
    
    
    // let HTTPResponse
    // if (kode.value.match("^[a-zA-Z0-9]{6,15}\$") != null) {
    //     const loginData = {
    //         kode: kode.value,
    //         identifier: generateIdentifyer(20)
    //     }
    //     identifier = loginData.identifier
    //     fetch('/login', {
    //         method: "POST",
    //         headers: {
    //             "Content-Type": "application/json",
    //         },
    //         body: JSON.stringify(loginData)
    //     }).then(response => {
    //         HTTPResponse = response
    //         return response.text()
    //     }).then(userType => {
    //         if(HTTPResponse.status == 200){
    //             setCookie("identifier", loginData.identifier, 10/24/60)
    //             if(userType == "master: true")
    //                 location.assign("master.html") 
    //             else
    //                 location.assign("postmandskab.html")
    //         }
    //     })
    // }               
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