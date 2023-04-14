const sendRequest = (url, dataHeaders, dataReciever, onFail) => {
    fetch(url, {
        method: "GET",
        headers: dataHeaders
    })
        .then(response => {
        response;
        if (response.ok)
            dataReciever(response.status, response.headers);
        else if (onFail != null)
            onFail();
        else
            console.log("Error downloading response");
    })
        .catch(err => {
        if (onFail != null)
            onFail();
        else
            console.log(err);
    });
};
