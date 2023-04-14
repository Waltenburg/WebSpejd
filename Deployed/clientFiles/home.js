let kode;
const onLoadFunction = () => {
    console.log("Page loaded");
    kode = document.getElementById("kode");
    if (getCookie("identifier") == null)
        document.getElementById("loginWithExistingUser").disabled = true;
};
const loginClicked = () => {
    let identifier;
    if (kode.value.match("^[a-zA-Z0-9]{6,15}\$") != null) {
        identifier = generateIdentifyer(20);
        const loginHeader = new Headers({
            "password": kode.value,
            "id": identifier
        });
        const loginSucces = (status, headers) => {
            setCookie("identifier", identifier, 10 / 24 / 60);
            if (headers.get("ismaster") == "true")
                location.assign("/master");
            else
                location.assign("/mandskab");
        };
        const wrongPassword = (status) => {
            kode.style.setProperty("color", "red");
        };
        sendRequest("/login", loginHeader, loginSucces, wrongPassword);
    }
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