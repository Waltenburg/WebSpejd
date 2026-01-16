import { getCookie } from "./cookie.js";

export const identifier = getCookie("identifier");

export const sendRequest = (
    url: string,
    dataHeaders: Headers | null,
    succesReciever: SuccessCallback,
    onFail?: FailCallback,
    dontSendID?: boolean
): void => {
    const headersToSend = dataHeaders ?? new Headers();

    if (!dontSendID) {
        if (identifier == null)
            throw new Error("No identifier cookie set");
        headersToSend.append("id", identifier);
    }

    fetch(url, {
        method: "GET",
        headers: headersToSend
    })
        .then(async response => {
            let body = "";
            try {
                body = await response.text();
            } catch (err) {
                console.error("Failed to read response body", err);
            }

            if (response.ok) {
                succesReciever(response.status, response.headers, body);
            }
            else if (onFail != null) {
                onFail(response.status, body);
            }
            else {
                console.log("Response was not OK. Status: " + response.status + " Body: " + body);
            }
        })
        .catch(err => {
            console.log("Error in communication with server.");
            console.error(err);
            if (onFail != null)
                onFail(err);
        });
};

export type SuccessCallback = (status: number, headers: Headers, body: string) => void;
export type FailCallback = (statusOrError: number | unknown, body?: string) => void;

//Returns a tuple with the first value being all values in Arr1 that arent in Arr2
//and second value being all values in Arr2 that arent in Arr1
export function getDiffArr<T>(Arr1: T[], Arr2: T[]): [T[], T[]] {
    let arr1 = Arr1.slice()
    let arr2 = Arr2.slice()
    for (let i = 0; i < arr1.length; i++) {
        const vi = arr1[i];
        let sameValueFound = false
        for (let j = 0; j < arr2.length; j++) {
            const vj = arr2[j];
            if(vi == vj){
                sameValueFound = true
                arr1.splice(i, 1)
                arr2.splice(j, 1)
                i--
                break
            }
        }
    }
    return [arr1, arr2];
}