export declare const identifier: string;
export declare const sendRequest: (url: string, dataHeaders: Headers | null, succesReciever: SuccessCallback, onFail?: FailCallback, dontSendID?: boolean) => void;
export type SuccessCallback = (status: number, headers: Headers, body: string) => void;
export type FailCallback = (statusOrError: number | unknown, body?: string) => void;
export declare function getDiffArr<T>(Arr1: T[], Arr2: T[]): [T[], T[]];
//# sourceMappingURL=sendHTTPRequest.d.ts.map