const sendRequest = (url, dataHeaders, succesReciever, onFail) => {
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
        .catch(err => console.log("Error in communication with server. Error: " + err));
};
