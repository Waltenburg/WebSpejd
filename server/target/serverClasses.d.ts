export declare namespace serverClasses {
    interface singleParamCallback<Type> {
        (file: Type): void;
    }
    const enum MIME {
        html = "text/html",
        json = "application/JSON",
        css = "text/css",
        jpg = "image/jpg",
        png = "image/png",
        ico = "image/x-icon",
        mp3 = "audio/mpeg",
        javascript = "application/javascript",
        any = "*/*"
    }
    class Loeb {
        navn: string;
        beskrivelse: string;
        patruljer: string[];
        udgåedePatruljer: boolean[];
        constructor(obj: any);
        patruljeIkkeUdgået: (pNum: number) => boolean;
        patruljeUdgår: (pNum: number) => void;
        patruljeGeninddgår: (pNum: number) => void;
    }
    class Location {
        navn: string;
        beskrivelse: string;
        erOmvej: boolean;
        omvejÅben: boolean;
        constructor(obj: any);
        static createArray(obj: any): Location[];
        toString(): string;
        static getPostStatus(poster: Location[], ppMatrix: string[][], loeb: Loeb): number[];
    }
    class User {
        kode: string;
        postIndex: number;
        identifiers: string[];
        master: boolean;
        lastAcces: number[];
        static maxAge: number;
        static deleteInterval: NodeJS.Timeout;
        static users: User[];
        constructor(obj: any);
        addIdentifier(identifier: string): void;
        type(identifierIndex: number): number;
        static recognizeUser: (id: string) => number;
        printIdentifiers(): void;
        static createUserArray(obj: any): User[];
        static deleteUnusedUsers(): void;
        static startDeleteInterval(): void;
        static stopDeleteInterval(): void;
    }
}
//# sourceMappingURL=serverClasses.d.ts.map