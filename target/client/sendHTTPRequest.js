var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { getCookie } from "./cookie.js";
export const identifier = getCookie("identifier");
export const sendRequest = (url, dataHeaders, succesReciever, onFail, dontSendID) => {
    const headersToSend = dataHeaders !== null && dataHeaders !== void 0 ? dataHeaders : new Headers();
    if (!dontSendID) {
        if (identifier == null)
            throw new Error("No identifier cookie set");
        headersToSend.append("id", identifier);
    }
    fetch(url, {
        method: "GET",
        headers: headersToSend
    })
        .then((response) => __awaiter(void 0, void 0, void 0, function* () {
        let body = "";
        try {
            body = yield response.text();
        }
        catch (err) {
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
    }))
        .catch(err => {
        console.log("Error in communication with server.");
        console.error(err);
        if (onFail != null)
            onFail(err);
    });
};
export function getDiffArr(Arr1, Arr2) {
    let arr1 = Arr1.slice();
    let arr2 = Arr2.slice();
    for (let i = 0; i < arr1.length; i++) {
        const vi = arr1[i];
        let sameValueFound = false;
        for (let j = 0; j < arr2.length; j++) {
            const vj = arr2[j];
            if (vi == vj) {
                sameValueFound = true;
                arr1.splice(i, 1);
                arr2.splice(j, 1);
                i--;
                break;
            }
        }
    }
    return [arr1, arr2];
}
//# sourceMappingURL=sendHTTPRequest.js.map