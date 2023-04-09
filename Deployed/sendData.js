const sendString = (data, url, dataReciever, onFail) => {
    let res;
    fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "text",
        },
        body: data
    })
        .then(response => {
        res = response;
        if (response.ok)
            return response.text();
        else if (onFail == null)
            console.log("Error downloading response");
        else
            onFail();
        return "%error%";
    })
        .then(text => {
        if (text != "%error%")
            dataReciever(res.status, text);
    })
        .catch(err => {
        if (onFail == null)
            console.log(err);
        else
            onFail();
    });
};
const sendJSON = (data, url, dataReciever, onFail) => {
    const localOnFail = () => {
        if (onFail != null)
            onFail();
    };
    sendString(JSON.stringify(data), url, (status, text) => {
        if (text != "")
            dataReciever(status, JSON.parse(text));
        else
            dataReciever(status, null);
    }, localOnFail);
};
