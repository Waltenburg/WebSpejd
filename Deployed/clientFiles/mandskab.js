const identifier = getCookie("identifier");
const patruljeUpdateURL = "update";
let postOrOmvej = "post";
let listPåPost;
let listPåVej;
let postOmvejSelector;
let undoButton;
let undoActions = [];
let patruljerPåPost = [];
let patruljeElementsPåPost = [];
let noPatruljerPåPostText;
let noPatruljerPåVejText;
let patruljerPåVej = [];
let patruljeElementsPåVej = [];
let undoDepth = 0;
const undoTime = 2 * 1000;
const createPatruljeElement = (patruljeNummer) => {
    let newPatrulje = document.createElement("input");
    newPatrulje.classList.add("patrulje");
    newPatrulje.type = "button";
    newPatrulje.id = "p" + patruljeNummer.toString();
    newPatrulje.value = "#" + patruljeNummer.toString();
    return newPatrulje;
};
const clickedPatruljePåPost = (val, commit) => {
    const pNum = parseInt(val.id.substring(1));
    const cantCheckOutCallback = () => {
        alert("Kunne ikke tjekke patrulje " + pNum + " ud. Prøv igen...");
        console.log("Kunne ikke tjekke patrulje " + pNum + " ud. Prøv igen...");
    };
    const postOrOmvejAtCLickedTime = postOrOmvej;
    sendRequest("/sendUpdate", new Headers({
        "id": identifier,
        "update": pNum.toString() + "%ud" + "%" + postOrOmvejAtCLickedTime,
        "commit-type": "test"
    }), (status, headers) => {
        undoDepth++;
        undoButton.disabled = false;
        removePatruljePåPost(pNum);
        undoActions.push(() => {
            addPatruljeToPåPost(pNum);
        });
        setTimeout(() => {
            if (undoDepth > 0) {
                sendRequest("/sendUpdate", new Headers({
                    "id": identifier,
                    "update": pNum.toString() + "%ud" + "%" + postOrOmvejAtCLickedTime,
                    "commit-type": "commit"
                }), (status, headers) => {
                    console.log('Tjekket patrulje ' + pNum + " ud");
                    undoActions.shift();
                }, status => {
                    undoActions.shift()();
                    cantCheckOutCallback();
                });
                decreaseUndoDepth();
            }
        }, undoTime);
    }, status => {
        cantCheckOutCallback();
    });
};
const clickedPatruljePåVej = (val, commit) => {
    const pNum = parseInt(val.id.substring(1));
    const cantCheckInCallback = () => {
        alert("Kunne ikke tjekke patrulje " + pNum + " ind. Prøv igen...");
        console.log("Kunne ikke tjekke patrulje " + pNum + " ind. Prøv igen...");
    };
    sendRequest("/sendUpdate", new Headers({
        "id": identifier,
        "update": pNum.toString() + "%ind",
        "commit-type": "test"
    }), (status, headers) => {
        undoDepth++;
        undoButton.disabled = false;
        removePatruljePåVej(pNum);
        addPatruljeToPåPost(pNum, true);
        undoActions.push(() => {
            addPatruljeToPåVej(pNum);
            removePatruljePåPost(pNum);
        });
        setTimeout(() => {
            if (undoDepth > 0) {
                sendRequest("/sendUpdate", new Headers({
                    "id": identifier,
                    "update": pNum.toString() + "%ind",
                    "commit-type": "commit"
                }), (status, headers) => {
                    console.log('Tjekket patrulje ' + pNum + " ind");
                    undoActions.shift();
                }, status => {
                    undoActions.shift()();
                });
                decreaseUndoDepth();
            }
        }, undoTime);
    }, status => {
        cantCheckInCallback();
    });
};
const decreaseUndoDepth = () => {
    undoDepth--;
    if (undoDepth <= 0) {
        undoButton.disabled = true;
        undoDepth = 0;
    }
};
const undoButtonClicked = () => {
    undoActions.pop()();
    decreaseUndoDepth();
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
const postOmvejChanged = () => {
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
const addPatruljeToPåPost = (patruljeNummer, timeout) => {
    const newElement = createPatruljeElement(patruljeNummer);
    newElement.setAttribute("onclick", "clickedPatruljePåPost(this)");
    if (timeout) {
        newElement.disabled = true;
        setTimeout(() => {
            newElement.disabled = false;
        }, undoTime);
    }
    insertElement(patruljeNummer, newElement, patruljerPåPost, patruljeElementsPåPost, listPåPost);
    postOmvejChanged();
    noPatruljerPåPostText.style.display = 'none';
};
const addPatruljeToPåVej = (patruljeNummer) => {
    const newElement = createPatruljeElement(patruljeNummer);
    newElement.setAttribute("onclick", "clickedPatruljePåVej(this)");
    insertElement(patruljeNummer, newElement, patruljerPåVej, patruljeElementsPåVej, listPåVej);
    postOmvejChanged();
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
const logOut = () => {
    deleteCookie("identifier");
    location.href = "/home";
};
const onLoadFunctionMandskab = () => {
    listPåPost = document.getElementById("listCheckOut");
    listPåVej = document.getElementById("listCheckIn");
    postOmvejSelector = document.getElementById("postOmvejSelector");
    undoButton = document.getElementById("undo");
    noPatruljerPåPostText = document.getElementById("ingenPåPost");
    noPatruljerPåVejText = document.getElementById("ingenPåVej");
    sendRequest("/getData", new Headers({
        "id": identifier
    }), (status, headers) => {
        class PatruljePostData {
        }
        const data = JSON.parse(headers.get("data"));
        data.påPost.forEach(pNum => {
            addPatruljeToPåPost(pNum);
        });
        data.påVej.forEach(pNum => {
            addPatruljeToPåVej(pNum);
        });
        document.getElementById("postNum").innerHTML = data.post.toString();
        if (!data.omvejÅben) {
            document.getElementById("postOmvejSelector").disabled = true;
            document.getElementById("OmvejSelectorText").innerHTML += " (Lukket)";
        }
        postOmvejChanged();
    }, () => {
        location.replace(window.location.origin);
    });
    console.log("Entire page loaded");
};
if (identifier == null)
    location.href = "/home";
