let kode;
const onLoadFunction = () => {
    console.log("Page loaded");
    kode = document.getElementById("kode");
    if (getCookie("identifier") == null)
        document.getElementById("loginWithExistingUser").disabled = true;
};
const loginClicked = () => {
    let identifier;
    if (kode.value.match("^[a-zA-Z0-9]{4,15}\$") != null) {
        identifier = generateIdentifyer(20);
        const loginHeader = new Headers({
            "password": kode.value,
            "id": identifier
        });
        const loginSucces = (status, headers) => {
            setCookie("identifier", identifier, 1 / 24);
            if (headers.get("ismaster") == "true")
                location.assign("/master");
            else
                location.assign("/mandskab");
        };
        const wrongPassword = () => {
            kode.style.setProperty("color", "red");
        };
        sendRequest("/login", loginHeader, loginSucces, wrongPassword);
    }
};
const codeChanged = () => {
    kode.style.setProperty("color", "black");
};
function loginWithExistingUser() {
    location.assign("postmandskab.html");
}
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
