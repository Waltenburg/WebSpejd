class Loeb{
    navn: string
    beskrivelse: string
    patruljer: string[]
    udgåedePatruljer: boolean[]
    constructor(obj: any){
        this.navn = obj.navn
        this.beskrivelse = obj.beskrivelse
        this.patruljer = obj.patruljer
        this.udgåedePatruljer = obj.udgåedePatruljer
    }
    patruljeIkkeUdgået = (pNum: number) => {
        return !this.udgåedePatruljer[pNum]
    }
    patruljeNummerOgNavn = (pNum: number) => {
        return (pNum+1).toString() + " - " + this.patruljer[pNum]
    }
}
class ClientLoebMethods{
    static patruljeIkkeUdgået = (loeb: Loeb, pNum: number) => {
        return !(loeb.udgåedePatruljer[pNum])
    }
    static patruljeNummerOgNavn = (loeb: Loeb, pNum: number) => {
        return (pNum+1).toString() + " - " + loeb.patruljer[pNum]
    }
}
class Post{
    navn: string
    beskrivelse: string
    erOmvej: boolean
    omvejÅben: boolean

    constructor(obj: any){
        this.navn = obj.navn
        this.beskrivelse = obj.beskrivelse
        this.erOmvej = obj.erOmvej
        this.omvejÅben = obj.omvejÅben
    }

    static postStatus: number[] = []
    static createArray(obj: any): Post[]{
        let arr: Post[] = []
        obj.forEach((element: any) => {
            arr.push(new Post(element))
        });
        return arr
    }

    toString(){
        return "Post: " + this.navn + " - " + this.beskrivelse + "     Omvej: " + this.erOmvej.toString() + "     Omvej åben: " + this.erOmvej.toString()
    }
}