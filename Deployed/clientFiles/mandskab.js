const identifier = getCookie("identifier");
const patruljeUpdateURL = "update";
let listPåPost;
let listPåVej;
let patruljerPåPost = [];
let patruljeElementsPåPost = [];
let patruljerPåVej = [];
let patruljeElementsPåVej = [];
const createPatruljeElement = (patruljeNummer) => {
    let newPatrulje = document.createElement("input");
    newPatrulje.classList.add("patrulje");
    newPatrulje.type = "button";
    newPatrulje.id = "p" + patruljeNummer.toString();
    newPatrulje.value = "#" + patruljeNummer.toString();
    return newPatrulje;
};
const clickedPatruljePåPost = (val) => {
    const pNum = parseInt(val.id.substring(1));
    const data = {
        melding: "ud",
        patrulje: pNum,
        identifier: identifier
    };
    sendRequest("/sendupdate", new Headers({
        "id": identifier,
        "update": pNum.toString() + "%ud"
    }), (status, headers) => {
        removePatruljePåPost(pNum);
        console.log('Tjekket patrulje ' + pNum + " ud");
    }, status => {
        console.log("Kunne ikke tjekke patrulje " + pNum + " ud. Prøv igen...");
    });
};
const clickedPatruljePåVej = (val) => {
    const pNum = parseInt(val.id.substring(1));
    const data = {
        melding: "ind",
        patrulje: pNum,
        auth: identifier
    };
    sendRequest("/sendupdate", new Headers({
        "id": identifier,
        "update": pNum.toString() + "%ind"
    }), (status, headers) => {
        removePatruljePåVej(pNum);
        addPatruljeToPåPost(pNum);
        console.log('Tjekket patrulje ' + pNum + " ind");
    }, status => {
        alert("Kunne ikke tjekke patrulje " + pNum + " ind. Prøv igen...");
        console.log("Kunne ikke tjekke patrulje " + pNum + " ind. Prøv igen...");
    });
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
};
const addPatruljeToPåPost = (patruljeNummer) => {
    const newElement = createPatruljeElement(patruljeNummer);
    newElement.setAttribute("onclick", "clickedPatruljePåPost(this)");
    insertElement(patruljeNummer, newElement, patruljerPåPost, patruljeElementsPåPost, listPåPost);
};
const addPatruljeToPåVej = (patruljeNummer) => {
    const newElement = createPatruljeElement(patruljeNummer);
    newElement.setAttribute("onclick", "clickedPatruljePåVej(this)");
    insertElement(patruljeNummer, newElement, patruljerPåVej, patruljeElementsPåVej, listPåVej);
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
const onLoadFunctionMandskab = () => {
    listPåPost = document.getElementById("listCheckOut");
    listPåVej = document.getElementById("listCheckIn");
    sendRequest("/getData", new Headers({
        "id": identifier
    }), (status, headers) => {
        class PatruljeData {
        }
        const data = JSON.parse(headers.get("data"));
        data.påPost.forEach(pNum => {
            addPatruljeToPåPost(pNum);
        });
        data.påVej.forEach(pNum => {
            addPatruljeToPåVej(pNum);
        });
        document.getElementById("postNum").innerHTML = "Post " + data.post.toString();
    }, () => {
        location.replace(window.location.origin);
    });
    console.log("Entire page loaded");
};
if (identifier == null)
    location.href = "/home";
