namespace Client{
    export const sendRequest = (url: string, dataHeaders: Headers, succesReciever: doubleParamCallback<number, Headers>, onFail?: singleParamCallback<number>): void =>
    {
        fetch(url, {
            method: "GET",
            headers: dataHeaders
        })
        .then(response => {
            if(response.ok)
                succesReciever(response.status, response.headers)
            else if(onFail != null)
                onFail(response.status)    
            else
                console.log("Response was not OK. Status: " + response.status)
        })
        .catch(err => {
            console.log("Error in communication with server. Error: " + err)
            if(onFail != null)
                onFail(err)    
        })
    }
    export interface singleParamCallback<Type> {
        (a: Type): void
    }
    export interface doubleParamCallback<Type, Type2> {
        (a: Type, b: Type2): void
    }

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
}