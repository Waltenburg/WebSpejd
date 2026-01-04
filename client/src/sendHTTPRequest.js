"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendRequest = exports.identifier = void 0;
exports.getDiffArr = getDiffArr;
const cookie_js_1 = require("./cookie.js");
exports.identifier = (0, cookie_js_1.getCookie)("identifier");
const sendRequest = (url, dataHeaders, succesReciever, onFail, dontSendID) => {
    if (dataHeaders == null)
        dataHeaders = new Headers();
    if (!dontSendID) {
        if (exports.identifier == null)
            throw new Error("No identifier cookie set");
        dataHeaders.append("id", exports.identifier);
    }
    fetch(url, {
        method: "GET",
        headers: dataHeaders
    })
        .then(response => {
        if (response.ok)
            succesReciever(response.status, response.headers);
        else if (onFail != null)
            onFail(response.status);
        else
            console.log("Response was not OK. Status: " + response.status);
    })
        .catch(err => {
        console.log("Error in communication with server.");
        console.error(err);
        if (onFail != null)
            onFail(err);
    });
};
exports.sendRequest = sendRequest;
function getDiffArr(Arr1, Arr2) {
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