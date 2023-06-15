var Client;
(function (Client) {
    let Home;
    (function (Home) {
        let kode;
        Home.onLoadFunction = () => {
            console.log("Page loaded");
            kode = document.getElementById("kode");
            if (Client.getCookie("identifier") == null)
                document.getElementById("loginWithExistingUser").disabled = true;
        };
        Home.loginClicked = () => {
            let identifier;
            if (kode.value.match("^[a-zA-Z0-9]{4,15}\$") != null) {
                identifier = generateIdentifyer(20);
                const loginHeader = new Headers({
                    "password": kode.value,
                    "id": identifier
                });
                const loginSucces = (status, headers) => {
                    Client.setCookie("identifier", identifier, 1 / 24);
                    if (headers.get("ismaster") == "true")
                        location.assign("/master");
                    else
                        location.assign("/mandskab");
                };
                const wrongPassword = () => {
                    kode.style.setProperty("color", "red");
                };
                Client.sendRequest("/login", loginHeader, loginSucces, wrongPassword);
            }
        };
        Home.codeChanged = () => {
            kode.style.setProperty("color", "black");
        };
        function loginWithExistingUser() {
            location.assign("postmandskab.html");
        }
        Home.loginWithExistingUser = loginWithExistingUser;
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
    })(Home = Client.Home || (Client.Home = {}));
})(Client || (Client = {}));
