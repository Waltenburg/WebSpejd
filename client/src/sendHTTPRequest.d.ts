export declare const identifier: string | null;
export declare const sendRequest: (url: string, dataHeaders: Headers | null, succesReciever: doubleParamCallback<number, Headers>, onFail?: singleParamCallback<number>, dontSendID?: boolean) => void;
export interface singleParamCallback<Type> {
    (a: Type): void;
}
export interface doubleParamCallback<Type, Type2> {
    (a: Type, b: Type2): void;
}
export declare function getDiffArr<T>(Arr1: T[], Arr2: T[]): [T[], T[]];
