var Client;
(function (Client) {
    let Mandskab;
    (function (Mandskab) {
        let postOrOmvej = "post";
        let listPåPost;
        let listPåVej;
        let postOmvejSelector;
        let undoButton;
        let patruljerPåPost = [];
        let patruljeElementsPåPost = [];
        let noPatruljerPåPostText;
        let noPatruljerPåVejText;
        let patruljerPåVej = [];
        let patruljeElementsPåVej = [];
        let undoDepth = 0;
        let undoTime = 3 * 1000;
        let undoActions = [];
        let commitTimeoutArr = [];
        let timeBetweenUpdates = 2 * 1000;
        let lastUpdateTimeString = new Date().getTime().toString();
        const createPatruljeElement = (patruljeNummer) => {
            let newPatrulje = document.createElement("input");
            newPatrulje.classList.add("patrulje");
            newPatrulje.type = "button";
            newPatrulje.id = "p" + patruljeNummer.toString();
            newPatrulje.value = "#" + patruljeNummer.toString();
            return newPatrulje;
        };
        const checkError = (indOrUd, pNum) => {
            alert("Kunne ikke tjekke patrulje " + pNum + " " + indOrUd + ". Prøv igen...");
            console.log("Kunne ikke tjekke patrulje " + pNum + " ud. Prøv igen...");
            lastUpdateTimeString = "0";
            getUpdateFunc();
        };
        Mandskab.clickedPatruljePåPost = (val, commit) => {
            const pNum = parseInt(val.id.substring(1));
            const postOrOmvejAtCLickedTime = postOrOmvej;
            Client.sendRequest("/sendUpdate", new Headers({
                "update": pNum.toString() + "%ud" + "%" + postOrOmvejAtCLickedTime,
                "commit-type": "test"
            }), (status, headers) => {
                undoDepth++;
                undoButton.disabled = false;
                removePatruljePåPost(pNum);
                undoActions.push(() => {
                    console.log("UNDO");
                    addPatruljePåPost(pNum);
                });
                commitTimeoutArr.push(setTimeout(() => {
                    if (undoDepth > 0) {
                        Client.sendRequest("/sendUpdate", new Headers({
                            "update": pNum.toString() + "%ud" + "%" + postOrOmvejAtCLickedTime,
                            "commit-type": "commit"
                        }), (status, headers) => {
                            console.log('Tjekket patrulje ' + pNum + " ud");
                            undoActions.shift();
                        }, status => {
                            undoActions.shift()();
                            checkError("ud", pNum);
                        });
                        decreaseUndoDepth();
                    }
                    commitTimeoutArr.shift();
                }, undoTime));
            }, status => {
                checkError("ud", pNum);
            });
        };
        Mandskab.clickedPatruljePåVej = (val, commit) => {
            const pNum = parseInt(val.id.substring(1));
            Client.sendRequest("/sendUpdate", new Headers({
                "update": pNum.toString() + "%ind",
                "commit-type": "test"
            }), (status, headers) => {
                undoDepth++;
                undoButton.disabled = false;
                removePatruljePåVej(pNum);
                addPatruljePåPost(pNum, true);
                undoActions.push(() => {
                    addPatruljeToPåVej(pNum);
                    removePatruljePåPost(pNum);
                });
                commitTimeoutArr.push(setTimeout(() => {
                    if (undoDepth > 0) {
                        Client.sendRequest("/sendUpdate", new Headers({
                            "update": pNum.toString() + "%ind",
                            "commit-type": "commit"
                        }), (status, headers) => {
                            console.log('Tjekket patrulje ' + pNum + " ind");
                            undoActions.shift();
                        }, status => {
                            undoActions.shift()();
                            checkError("ind", pNum);
                        });
                        decreaseUndoDepth();
                    }
                    commitTimeoutArr.shift();
                }, undoTime));
            }, status => {
                checkError("ind", pNum);
            });
        };
        const decreaseUndoDepth = () => {
            undoDepth--;
            if (undoDepth <= 0) {
                undoButton.disabled = true;
                undoDepth = 0;
            }
        };
        Mandskab.undoButtonClicked = () => {
            undoActions.pop()();
            decreaseUndoDepth();
            clearTimeout(commitTimeoutArr.pop());
        };
        const removePatruljePåPost = (patruljeNummer) => {
            const i = patruljerPåPost.indexOf(patruljeNummer);
            if (i < 0)
                console.log("Patrulje kan ikke fjernes, den ikke er i listen");
            else {
                patruljeElementsPåPost[i].remove();
                patruljeElementsPåPost.splice(i, 1);
                patruljerPåPost.splice(i, 1);
            }
            if (patruljerPåPost.length == 0)
                noPatruljerPåPostText.style.display = '';
        };
        const removePatruljePåVej = (patruljeNummer) => {
            const i = patruljerPåVej.indexOf(patruljeNummer);
            if (i < 0)
                console.log("Patrulje kan ikke fjernes, den ikke er i listen");
            else {
                patruljeElementsPåVej[i].remove();
                patruljeElementsPåVej.splice(i, 1);
                patruljerPåVej.splice(i, 1);
            }
            if (patruljerPåVej.length == 0)
                noPatruljerPåVejText.style.display = '';
        };
        Mandskab.postOmvejChanged = () => {
            if (postOmvejSelector.value == "0") {
                postOrOmvej = "post";
                patruljeElementsPåPost.forEach(element => {
                    element.style.backgroundColor = "#04AA6D";
                });
            }
            else {
                postOrOmvej = "omvej";
                patruljeElementsPåPost.forEach(element => {
                    element.style.backgroundColor = "#d4be19";
                });
            }
        };
        const addPatruljePåPost = (patruljeNummer, timeout) => {
            const newElement = createPatruljeElement(patruljeNummer);
            newElement.setAttribute("onclick", "Client.Mandskab.clickedPatruljePåPost(this)");
            if (timeout) {
                newElement.disabled = true;
                setTimeout(() => {
                    newElement.disabled = false;
                }, undoTime);
            }
            insertElement(patruljeNummer, newElement, patruljerPåPost, patruljeElementsPåPost, listPåPost);
            Mandskab.postOmvejChanged();
            noPatruljerPåPostText.style.display = 'none';
        };
        const addPatruljeToPåVej = (patruljeNummer) => {
            const newElement = createPatruljeElement(patruljeNummer);
            newElement.setAttribute("onclick", "Client.Mandskab.clickedPatruljePåVej(this)");
            insertElement(patruljeNummer, newElement, patruljerPåVej, patruljeElementsPåVej, listPåVej);
            Mandskab.postOmvejChanged();
            noPatruljerPåVejText.style.display = 'none';
        };
        const insertElement = (patruljeNummer, patruljeElement, patruljeNummerArray, patruljeElementArray, parent) => {
            if (patruljeNummerArray.length == 0) {
                parent.insertBefore(patruljeElement, patruljeElementArray[0]);
                patruljeNummerArray.unshift(patruljeNummer);
                patruljeElementArray.unshift(patruljeElement);
            }
            else if (patruljeNummer > patruljeNummerArray[patruljeNummerArray.length - 1]) {
                parent.appendChild(patruljeElement);
                patruljeNummerArray.push(patruljeNummer);
                patruljeElementArray.push(patruljeElement);
            }
            else {
                for (let i = 0; i < patruljeNummerArray.length; i++) {
                    if (patruljeNummer < patruljeNummerArray[i]) {
                        parent.insertBefore(patruljeElement, patruljeElementArray[i]);
                        patruljeNummerArray.splice(i, 0, patruljeNummer);
                        patruljeElementArray.splice(i, 0, patruljeElement);
                        break;
                    }
                }
            }
        };
        Mandskab.logOut = () => {
            if (undoDepth > 0)
                alert("Kan ikke logge ud endnu. Vent lidt til alle patruljer er tjekkel helt ind/ud.");
            else {
                Client.deleteCookie("identifier");
                location.href = "/home";
            }
        };
        class PatruljePostData {
        }
        Mandskab.onLoadFunction = () => {
            listPåPost = document.getElementById("listCheckOut");
            listPåVej = document.getElementById("listCheckIn");
            postOmvejSelector = document.getElementById("postOmvejSelector");
            undoButton = document.getElementById("undo");
            noPatruljerPåPostText = document.getElementById("ingenPåPost");
            noPatruljerPåVejText = document.getElementById("ingenPåVej");
            Client.sendRequest("/getData", null, (status, headers) => {
                const data = JSON.parse(headers.get("data"));
                data.påPost.forEach(pNum => {
                    addPatruljePåPost(pNum);
                });
                data.påVej.forEach(pNum => {
                    addPatruljeToPåVej(pNum);
                });
                document.getElementById("postNum").innerHTML = data.post.toString();
                setOmvejSelector(data.omvejÅben);
                console.log(data.omvejÅben);
            }, () => {
                if (confirm("Fejl. Du bliver viderestillet til login"))
                    location.replace(window.location.origin);
            });
            console.log("Entire page loaded");
        };
        const setOmvejSelector = (omvejÅben) => {
            if (omvejÅben) {
                document.getElementById("postOmvejSelector").disabled = false;
                document.getElementById("OmvejSelectorText").innerHTML = "Omvej";
            }
            else {
                document.getElementById("postOmvejSelector").disabled = true;
                document.getElementById("OmvejSelectorText").innerHTML = "Omvej (Lukket)";
                postOmvejSelector.value = "0";
            }
            Mandskab.postOmvejChanged();
        };
        const getUpdateFunc = () => {
            if (undoDepth == 0) {
                const headers = new Headers({
                    'last-update': lastUpdateTimeString
                });
                lastUpdateTimeString = new Date().getTime().toString();
                Client.sendRequest("/getUpdate", headers, (status, headers) => {
                    if (headers.get('update') == "true") {
                        const data = JSON.parse(headers.get("data"));
                        const updatePåPost = Client.getDiffArr(patruljerPåPost, data.påPost);
                        updatePåPost[0].forEach(patrulje => {
                            removePatruljePåPost(patrulje);
                        });
                        updatePåPost[1].forEach(patrulje => {
                            addPatruljePåPost(patrulje);
                        });
                        const updatePåVej = Client.getDiffArr(patruljerPåVej, data.påVej);
                        updatePåVej[0].forEach(patrulje => {
                            removePatruljePåVej(patrulje);
                        });
                        updatePåVej[1].forEach(patrulje => {
                            addPatruljeToPåVej(patrulje);
                        });
                        setOmvejSelector(data.omvejÅben);
                    }
                }, status => {
                    clearInterval(updateInterval);
                    if (confirm("Fejl ved opdatering. Log ind igen")) {
                        Mandskab.logOut();
                    }
                    else {
                        updateInterval = setInterval(getUpdateFunc, timeBetweenUpdates);
                    }
                });
            }
        };
        let updateInterval = setInterval(getUpdateFunc, timeBetweenUpdates);
        if (Client.identifier == null)
            location.href = "/home";
    })(Mandskab = Client.Mandskab || (Client.Mandskab = {}));
})(Client || (Client = {}));
