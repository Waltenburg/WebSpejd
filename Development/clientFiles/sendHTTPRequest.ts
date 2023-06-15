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
                onFail(null)    
        })
    }
    export interface singleParamCallback<Type> {
        (a: Type): void
    }
    export interface doubleParamCallback<Type, Type2> {
        (a: Type, b: Type2): void
    }
}