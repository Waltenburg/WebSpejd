const sendRequest = (url, method, headers, body, dataReciever, onFail) => {
    var localOnFail = (err) => {
        if (onFail != null)
            onFail();
        else
            console.log("Error with downloading response from request. Method: " + method + ", url: " + url + ", error: " + err)
    };
    
    let res;
    fetch(url, {
        method: method,
        headers: headers,
        body: body
    })
        .then(response => {
        res = response;
        if (response.ok)
            return response.text();
        else
            localOnFail()
        return "%error%";
    })
        .then(text => {
        if (text != "%error%")
            dataReciever(res.status, text);
    })
        .catch(err => {
            localOnFail(err)
    });
}
const sendString = (text, url, dataReciever, onFail) => {
    sendRequest(url, "POST",
    {ContentType: "text", accept: "*/*"},
    text, (status, text) => {
        if (text != "")
            dataReciever(status, text);
        else
            dataReciever(status, null);
    }, onFail);
};
const sendJSON = (data, url, dataReciever, onFail) => {
    sendRequest(url, "POST",
    {ContentType: "application/JSON", accept: "*/*"},
    JSON.stringify(data), (status, text) => {
        if (text != "")
            dataReciever(status, text);
        else
            dataReciever(status, null);
    }, onFail);
};
const GETJSON = (url, id, dataReciever, onFail) => {
    sendRequest(url, "GET",{accept: "application/json", id: id}, (status, text) => {
        if (text != "")
            dataReciever(status, JSON.stringify(text));
        else
            dataReciever(status, null);
    }, onFail);
}
