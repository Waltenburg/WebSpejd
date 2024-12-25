export namespace serverClasses{
    export interface singleParamCallback<Type> {
        (file: Type): void
    }
    export enum MIME {
        html = "text/html",
        json = 'application/JSON',
        css = "text/css",
        jpg = "image/jpg",
        png = "image/png",
        ico = "image/x-icon",
        mp3 = "audio/mpeg",
        javascript = "application/javascript",
        any = "*/*",
    }
    export class Loeb{
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
        patruljeUdgår = (pNum: number) => {
            this.udgåedePatruljer[pNum] = true
        }
        patruljeGeninddgår = (pNum: number) => {
            this.udgåedePatruljer[pNum] = false
        }
    }
    export class Post{
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
        static getPostStatus(poster: Post[], ppMatrix: string[][], loeb: Loeb): number[] {
            let status: number[] = []
            for (let i = 0; i < poster.length; i++) {
                let exclusiveBefore = true
                let on = false
                let towards = false
                let exclusiveAfter = true

                for (let j = 0; j < ppMatrix.length; j++) {
                    if(loeb.udgåedePatruljer[j])
                        continue

                    const p = ppMatrix[j]
                    let len = p.length
                    if(len >= i * 3 + 1)
                        exclusiveBefore = false
                    if(len == i * 3 + 1)
                    towards = true
                    else if(len == i * 3 + 2)
                    on = true

                    if(len < i * 3 + 3)
                        exclusiveAfter = false
                }
                // console.log(`Exclusive before: ${exclusiveBefore}, ON: ${on}, TOWARDS: ${towards}, Exclusive after: ${exclusiveAfter}`)
                let stat: number = -1

                if(exclusiveBefore)
                    stat = 0
                else if(towards){
                    stat = 1
                    if(on)
                        stat = 2
                }else if(on)
                    stat = 3
                else if(exclusiveAfter)
                    stat = 4
                else if(!exclusiveAfter && !exclusiveBefore)
                    stat = 0

                if(poster[i].erOmvej && !poster[i].omvejÅben && !exclusiveBefore)
                    stat = 0

                // if(exclusiveAfter)
                //     stat = 0
                // else{
                //     if(towards){
                //         stat = 1
                //         if(on)
                //             stat = 2
                //     }
                //     else if(on)
                //         stat = 3
                //     else if(exclusiveBefore)
                //         stat = 4
                //     else if(!exclusiveAfter && !exclusiveBefore)
                //         stat = 4
                // }

                // if(poster[i].erOmvej && !poster[i].omvejÅben && !exclusiveBefore)
                //     stat = 0
            status.push(stat)
            }
        return status
        }
    }
    export class User {
        kode: string
        postIndex: number
        identifiers: string[]
        master: boolean
        lastAcces: number[]
        static maxAge: number = 120 * 60 * 1000 //i millisekunder
        static deleteInterval: NodeJS.Timer
        static users: User[]

        constructor(obj: any){
            this.kode = obj.kode
            this.postIndex = obj.postIndex
            this.identifiers = obj.identifiers
            this.master = obj.master
            this.lastAcces = obj.lastAcces
            // this.maxAge = 30 * 60 * 1000
        }
        addIdentifier(identifier: string){
            this.identifiers.push(identifier)
            this.lastAcces.push(new Date().getTime())
        }
        type(identifierIndex: number): number{
            this.lastAcces[identifierIndex] = new Date().getTime()
            if(this.master)
                return Infinity
            return this.postIndex
        }
        static recognizeUser = (id: string): number => {
            let userPostIndex: number = -1
            for (let u = 0; u < User.users.length; u++) {
                const user = User.users[u];
                for (let i = 0; i < user.identifiers.length; i++) {
                    if(id == user.identifiers[i]){
                        userPostIndex = user.type(i)
                        u = User.users.length //Breaks first loop
                        break
                    }
                }
            }
            return userPostIndex
        }
        printIdentifiers(): void{
            console.log(this.identifiers)
        }
        static createUserArray(obj: any): User[]{
            let arr: User[] = []
            obj.forEach((element: any) => {
                arr.push(new User(element))
            });
            return arr
        }
        static deleteUnusedUsers(){
            const cutOffTime = new Date().getTime() - User.maxAge
            for (let u = 0; u < User.users.length; u++) {
                const userLastAccesArr = User.users[u].lastAcces;
                for (let i = 0; i < userLastAccesArr.length; i++) {
                    const userLastAcces = userLastAccesArr[i];
                    if(userLastAcces < cutOffTime){
                        User.users[u].lastAcces.splice(i, 1)
                        User.users[u].identifiers.splice(i, 1)
                        i--
                    }
                }
            }
        }
        static startDeleteInterval(){
            this.deleteUnusedUsers()
            this.deleteInterval = setInterval(this.deleteUnusedUsers, 5 * 60 * 1000)
        }
        static stopDeleteInterval(){
            clearInterval(this.deleteInterval)
        }
    }
}
