
const sendString = (data: string, url: string, dataReciever: doubleParamCallback<number, string>, onFail?: singleParamCallback<void>): void =>
{
    let res: Response
    fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "text",
        },
        body: data
    })
    .then(response => {
        res =  response
        if(response.ok)
            return response.text()
        else if(onFail == null)
            console.log("Error downloading response")
        else
            onFail()
        return "%error%"
    })
    .then(text => {
        if(text != "%error%")
            dataReciever(res.status, text)
    })
    .catch(err => {
        if(onFail == null)
            console.log(err)
        else
            onFail()
    })
}
const sendJSON = (data: any, url: string, dataReciever: doubleParamCallback<number, any>, onFail?: singleParamCallback<void>): void =>
{
    const localOnFail = () => {
        if(onFail != null)
            onFail()
    }
    sendString(JSON.stringify(data), url, (status, text) => {
        if(text != "")
            dataReciever(status, JSON.parse(text))
        else
            dataReciever(status, null)
    } , localOnFail)

    
}
interface singleParamCallback<Type> {
    (a: Type): void
}
interface doubleParamCallback<Type, Type2> {
    (a: Type, b: Type2): void
}