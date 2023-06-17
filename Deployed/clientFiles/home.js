var Client;
(function (Client) {
    let Home;
    (function (Home) {
        let kode;
        Home.onLoadFunction = () => {
            console.log("Page loaded");
            kode = document.getElementById("kode");
            if (Client.getCookie("identifier") != null) {
                const master = Client.getCookie("master");
                if (master == "true")
                    document.getElementById("loginInMaster").disabled = false;
                else if (master == "false")
                    document.getElementById("loginInMandskab").disabled = false;
            }
        };
        Home.loginClicked = (existingUser) => {
            let identifier;
            if (kode.value.match("^[a-zA-Z0-9]{4,15}\$") != null || existingUser) {
                identifier = existingUser ? Client.getCookie("identifier") : generateIdentifyer(20);
                const loginHeader = new Headers({
                    "password": kode.value,
                    "id": identifier
                });
                const loginSucces = (status, headers) => {
                    Client.setCookie("identifier", identifier, 2);
                    if (headers.get("ismaster") == "true") {
                        Client.setCookie("master", "true", 2);
                        location.assign("/master");
                    }
                    else {
                        Client.setCookie("master", "false", 2);
                        location.assign("/mandskab");
                    }
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
