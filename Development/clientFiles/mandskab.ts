
const identifier = getCookie("identifier")
const listPåPost = document.getElementById("listCheckOut")
const listPåVej = document.getElementById("listCheckIn")
const patruljeUpdateURL = "update"

let patruljerPåPost: number[] = [] //De patruljer der er på posten i nummeret rækkefølge
let patruljeElementsPåPost: HTMLInputElement[] = [] //De tilhørende elementer 

let patruljerPåVej: number[] = [] //De patruljer der er på vej til posten i nummeret rækkefølge
let patruljeElementsPåVej: HTMLInputElement[]= [] //De tilhørende elementer

const createPatruljeElement = (patruljeNummer: number): HTMLInputElement => {
    let newPatrulje: HTMLInputElement = document.createElement("input")
    newPatrulje.classList.add("patrulje")
    newPatrulje.type = "button"
    newPatrulje.id = "p" + patruljeNummer.toString()
    newPatrulje.value = "#" + patruljeNummer.toString()
    return newPatrulje
}
const clickedPatruljePåPost = (val) => {
    const pNum = parseInt(val.id.substring(1))
    const data = {
        melding: "ud",
        patrulje: pNum,
        identifier: identifier
    }
    sendJSON(data, "/patruljeUpdate", (HTTPStatus, response) => {
            removePatruljePåPost(pNum)
            console.log('Tjekket patrulje ' + pNum + " ud")
    }, () => {
        console.log("Kunne ikke tjekke patrulje " + pNum + " ud. Prøv igen...")
    })
    
}
const clickedPatruljePåVej = val => {
    const pNum = parseInt(val.id.substring(1))
    const data = {
        melding: "ind",
        patrulje: pNum,
        auth: identifier
    }
    sendJSON(data, "/patruljeUpdate", (HTTPStatus, response) => {
            removePatruljePåVej(pNum)
            addPatruljeToPåPost(pNum)
    }, () => {
        console.log("Kunne ikke tjekke patrulje " + pNum + " ind. Prøv igen...")
    })
}
const removePatruljePåPost = patruljeNummer => {
    const i = patruljerPåPost.indexOf(patruljeNummer)
    if(i < 0)
        console.log("Patrulje kan ikke fjernes, den ikke er i listen")
    else{
        patruljeElementsPåPost[i].remove()
        patruljeElementsPåPost.splice(i, 1)
        patruljerPåPost.splice(i, 1)
    }
}
const removePatruljePåVej = patruljeNummer => {
    const i = patruljerPåVej.indexOf(patruljeNummer)
    if(i < 0)
        console.log("Patrulje kan ikke fjernes, den ikke er i listen")
    else{
        patruljeElementsPåVej[i].remove()
        patruljeElementsPåVej.splice(i, 1)
        patruljerPåVej.splice(i, 1)
    }
}

const addPatruljeToPåPost = patruljeNummer => {
    const newElement = createPatruljeElement(patruljeNummer)
    newElement.setAttribute("onclick", "clickedPatruljePåPost(this)")
    insertElement(patruljeNummer, newElement , patruljerPåPost, patruljeElementsPåPost, listPåPost)
    
}
const addPatruljeToPåVej = patruljeNummer => {
    const newElement = createPatruljeElement(patruljeNummer)
    newElement.setAttribute("onclick", "clickedPatruljePåVej(this)")
    insertElement(patruljeNummer, newElement , patruljerPåVej, patruljeElementsPåVej, listPåVej)
}

const insertElement = (patruljeNummer, patruljeElement, patruljeNummerArray, patruljeElementArray, parent) => {
    if(patruljeNummerArray.length == 0){//Det er ikke nogle andre elementer
        parent.insertBefore(patruljeElement, patruljeElementArray[0])
        patruljeNummerArray.unshift(patruljeNummer)
        patruljeElementArray.unshift(patruljeElement)
    }
    else if(patruljeNummer > patruljeNummerArray[patruljeNummerArray.length - 1]){ //Det nye element skal være bagers
        parent.appendChild(patruljeElement)
        patruljeNummerArray.push(patruljeNummer)
        patruljeElementArray.push(patruljeElement)
    }
    else{ //Det nye element skal indsættes imellem andre elementer
        for (let i = 0 ; i < patruljeNummerArray.length; i++) {
            if(patruljeNummer < patruljeNummerArray[i]){
                parent.insertBefore(patruljeElement, patruljeElementArray[i])
                patruljeNummerArray.splice(i, 0, patruljeNummer)
                patruljeElementArray.splice(i, 0, patruljeElement)
                break
            }
        }
    }
}

//Getting initial data from server
if(identifier == null)
    location.href = "/home"

let data = GETJSON("/mandskabData", identifier, (status, data) => {

}, () => console.log("Error getting data. Please reload site"))

console.log("Entire page loaded")
    addPatruljeToPåVej(4)
    addPatruljeToPåVej(6)
    addPatruljeToPåVej(8)
    addPatruljeToPåPost(3)