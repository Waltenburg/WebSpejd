"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serverClasses = void 0;
var serverClasses;
(function (serverClasses) {
    let MIME;
    (function (MIME) {
        MIME["html"] = "text/html";
        MIME["json"] = "application/JSON";
        MIME["css"] = "text/css";
        MIME["jpg"] = "image/jpg";
        MIME["png"] = "image/png";
        MIME["ico"] = "image/x-icon";
        MIME["mp3"] = "audio/mpeg";
        MIME["any"] = "*/*";
    })(MIME = serverClasses.MIME || (serverClasses.MIME = {}));
    class Loeb {
        constructor(obj) {
            this.patruljeIkkeUdgået = (pNum) => {
                return !this.udgåedePatruljer[pNum];
            };
            this.patruljeUdgår = (pNum) => {
                this.udgåedePatruljer[pNum] = true;
            };
            this.patruljeGeninddgår = (pNum) => {
                this.udgåedePatruljer[pNum] = false;
            };
            this.navn = obj.navn;
            this.beskrivelse = obj.beskrivelse;
            this.patruljer = obj.patruljer;
            this.udgåedePatruljer = obj.udgåedePatruljer;
        }
    }
    serverClasses.Loeb = Loeb;
    class Post {
        constructor(obj) {
            this.navn = obj.navn;
            this.beskrivelse = obj.beskrivelse;
            this.erOmvej = obj.erOmvej;
            this.omvejÅben = obj.omvejÅben;
        }
        static createArray(obj) {
            let arr = [];
            obj.forEach((element) => {
                arr.push(new Post(element));
            });
            return arr;
        }
        toString() {
            return "Post: " + this.navn + " - " + this.beskrivelse + "     Omvej: " + this.erOmvej.toString() + "     Omvej åben: " + this.erOmvej.toString();
        }
    }
    serverClasses.Post = Post;
    class User {
        constructor(obj) {
            this.kode = obj.kode;
            this.postIndex = obj.postIndex;
            this.identifiers = obj.identifiers;
            this.master = obj.master;
            this.lastAcces = obj.lastAcces;
        }
        addIdentifier(identifier) {
            this.identifiers.push(identifier);
            this.lastAcces.push(new Date().getTime());
        }
        type(identifierIndex) {
            this.lastAcces[identifierIndex] = new Date().getTime();
            if (this.master)
                return Infinity;
            return this.postIndex;
        }
        printIdentifiers() {
            console.log(this.identifiers);
        }
        static createUserArray(obj) {
            let arr = [];
            obj.forEach((element) => {
                arr.push(new User(element));
            });
            return arr;
        }
        static deleteUnusedUsers() {
            const cutOffTime = new Date().getTime() - User.maxAge;
            for (let u = 0; u < User.users.length; u++) {
                const userLastAccesArr = User.users[u].lastAcces;
                for (let i = 0; i < userLastAccesArr.length; i++) {
                    const userLastAcces = userLastAccesArr[i];
                    if (userLastAcces < cutOffTime) {
                        User.users[u].lastAcces.splice(i, 1);
                        User.users[u].identifiers.splice(i, 1);
                        i--;
                    }
                }
            }
        }
        static startDeleteInterval() {
            this.deleteUnusedUsers();
            this.deleteInterval = setInterval(this.deleteUnusedUsers, 5 * 60 * 1000);
        }
        static stopDeleteInterval() {
            clearInterval(this.deleteInterval);
        }
    }
    User.maxAge = 30 * 60 * 1000;
    User.recognizeUser = (id) => {
        let userPostIndex = -1;
        for (let u = 0; u < User.users.length; u++) {
            const user = User.users[u];
            for (let i = 0; i < user.identifiers.length; i++) {
                if (id == user.identifiers[i]) {
                    userPostIndex = user.type(i);
                    u = User.users.length;
                    break;
                }
            }
        }
        console.log(userPostIndex);
        return userPostIndex;
    };
    serverClasses.User = User;
})(serverClasses || (exports.serverClasses = serverClasses = {}));
