class Loeb {
    constructor(obj) {
        this.patruljeIkkeUdgået = (pNum) => {
            return !this.udgåedePatruljer[pNum];
        };
        this.navn = obj.navn;
        this.beskrivelse = obj.beskrivelse;
        this.patruljer = obj.patruljer;
        this.udgåedePatruljer = obj.udgåedePatruljer;
    }
}
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
