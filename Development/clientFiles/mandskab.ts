
const identifier = getCookie("identifier")
const patruljeUpdateURL = "update"
let postOrOmvej = "post"
let listPåPost: HTMLElement
let listPåVej: HTMLElement
let postOmvejSelector: HTMLInputElement
let undoButton: HTMLInputElement
let undoActions: callback[] = []
let patruljerPåPost: number[] = [] //De patruljer der er på posten i nummeret rækkefølge
let patruljeElementsPåPost: HTMLInputElement[] = [] //De tilhørende elementer 
let noPatruljerPåPostText: HTMLParagraphElement
let noPatruljerPåVejText: HTMLParagraphElement


let patruljerPåVej: number[] = [] //De patruljer der er på vej til posten i nummeret rækkefølge
let patruljeElementsPåVej: HTMLInputElement[]= [] //De tilhørende elementer

let undoDepth = 0
const undoTime = 2 * 1000

const createPatruljeElement = (patruljeNummer: number): HTMLInputElement => {
    let newPatrulje: HTMLInputElement = document.createElement("input")
    newPatrulje.classList.add("patrulje")
    newPatrulje.type = "button"
    newPatrulje.id = "p" + patruljeNummer.toString()
    newPatrulje.value = "#" + patruljeNummer.toString()
    return newPatrulje
}
const clickedPatruljePåPost = (val: HTMLInputElement, commit?:boolean) => {
    const pNum = parseInt(val.id.substring(1))
    const cantCheckOutCallback = () => {
        alert("Kunne ikke tjekke patrulje " + pNum + " ud. Prøv igen...")
        console.log("Kunne ikke tjekke patrulje " + pNum + " ud. Prøv igen...")
    }
    const postOrOmvejAtCLickedTime = postOrOmvej
    sendRequest("/sendUpdate", new Headers({
        "id": identifier,
        "update": pNum.toString() + "%ud"+"%" + postOrOmvejAtCLickedTime,
        "commit-type": "test"
    }), (status, headers) => { //Test succesfull
        undoDepth++
        undoButton.disabled = false
        removePatruljePåPost(pNum)
        undoActions.push(() => {
            addPatruljeToPåPost(pNum)
        })
        setTimeout(() => { //Kalder funktionen der rent faktisk eksekvere tjek ind efter given tid, hvis ikke undo er blevet trykket
            if(undoDepth > 0){
                sendRequest("/sendUpdate", new Headers({
                    "id": identifier,
                    "update": pNum.toString() + "%ud"+"%" + postOrOmvejAtCLickedTime,
                    "commit-type": "commit"
                }), (status, headers) => { //Check in succesfull
                        console.log('Tjekket patrulje ' + pNum + " ud")
                        undoActions.shift()
                }, status => { //Check in failed
                    undoActions.shift()()
                    cantCheckOutCallback()
                })
                decreaseUndoDepth()
            }
        }, undoTime)
    }, status => { //Test failed
        cantCheckOutCallback()
    })
}


const clickedPatruljePåVej = (val: HTMLInputElement, commit?:boolean) => {
    const pNum = parseInt(val.id.substring(1))
    const cantCheckInCallback = () => {
        alert("Kunne ikke tjekke patrulje " + pNum + " ind. Prøv igen...")
        console.log("Kunne ikke tjekke patrulje " + pNum + " ind. Prøv igen...")
    }
    sendRequest("/sendUpdate", new Headers({
        "id": identifier,
        "update": pNum.toString() + "%ind",
        "commit-type": "test"
    }), (status, headers) => { //Test succesfull
        undoDepth++
        undoButton.disabled = false
        removePatruljePåVej(pNum)
        addPatruljeToPåPost(pNum, true)
        undoActions.push(() => {
            addPatruljeToPåVej(pNum)
            removePatruljePåPost(pNum)
        })
        setTimeout(() => { //Kalder funktionen der rent faktisk eksekvere tjek ind efter given tid, hvis ikke undo er blevet trykket
            if(undoDepth > 0){
                sendRequest("/sendUpdate", new Headers({
                    "id": identifier,
                    "update": pNum.toString() + "%ind",
                    "commit-type": "commit"
                }), (status, headers) => { //Check in succesfull
                        console.log('Tjekket patrulje ' + pNum + " ind")
                        undoActions.shift()
                }, status => { //Check in failed
                    undoActions.shift()()
                })
                decreaseUndoDepth()
            }
        }, undoTime)
    }, status => { //Test failed
        cantCheckInCallback()
    })
}
const decreaseUndoDepth = () =>{
    undoDepth--
    if(undoDepth <= 0){
        undoButton.disabled = true
        undoDepth = 0
    }
}
const undoButtonClicked = () => {
    // const undoAction = undoActions[undoActions.length - 1]
    // undoAction()
    // undoActions.pop() //Disse tre linjer gør det samme som den ene nedenunder
    undoActions.pop()()
    decreaseUndoDepth()
}
const removePatruljePåPost = (patruljeNummer: number) => {
    const i = patruljerPåPost.indexOf(patruljeNummer)
    if(i < 0)
        console.log("Patrulje kan ikke fjernes, den ikke er i listen")
    else{
        patruljeElementsPåPost[i].remove()
        patruljeElementsPåPost.splice(i, 1)
        patruljerPåPost.splice(i, 1)
    }
    if(patruljerPåPost.length == 0)
    noPatruljerPåPostText.style.display = ''
}
const removePatruljePåVej = (patruljeNummer: number) => {
    const i = patruljerPåVej.indexOf(patruljeNummer)
    if(i < 0)
        console.log("Patrulje kan ikke fjernes, den ikke er i listen")
    else{
        patruljeElementsPåVej[i].remove()
        patruljeElementsPåVej.splice(i, 1)
        patruljerPåVej.splice(i, 1)
    }
    if(patruljerPåVej.length == 0)
        noPatruljerPåVejText.style.display = ''
}
const postOmvejChanged = () => {
    if(postOmvejSelector.value == "0"){
        postOrOmvej = "post"
        patruljeElementsPåPost.forEach(element => {
            element.style.backgroundColor = "#04AA6D"
        })
    }else{
        postOrOmvej = "omvej"
        patruljeElementsPåPost.forEach(element => {
            element.style.backgroundColor = "#d4be19"
        })
    }
}

const addPatruljeToPåPost = (patruljeNummer: number, timeout?: boolean) => {
    const newElement = createPatruljeElement(patruljeNummer)
    newElement.setAttribute("onclick", "clickedPatruljePåPost(this)")
    if(timeout){
        newElement.disabled = true
        setTimeout(() => {
            newElement.disabled = false
        }, undoTime)
    }
    insertElement(patruljeNummer, newElement , patruljerPåPost, patruljeElementsPåPost, listPåPost)
    postOmvejChanged()
    noPatruljerPåPostText.style.display = 'none'
    
}
const addPatruljeToPåVej = (patruljeNummer: number) => {
    const newElement = createPatruljeElement(patruljeNummer)
    newElement.setAttribute("onclick", "clickedPatruljePåVej(this)")
    insertElement(patruljeNummer, newElement , patruljerPåVej, patruljeElementsPåVej, listPåVej)
    postOmvejChanged()
    noPatruljerPåVejText.style.display = 'none'
}
const insertElement = (patruljeNummer: number, patruljeElement: HTMLInputElement, patruljeNummerArray: number[], patruljeElementArray: HTMLInputElement[], parent: HTMLElement) => {
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
const logOut = () => {
    deleteCookie("identifier")
    location.href = "/home"
}
const onLoadFunctionMandskab = () => {
    listPåPost = document.getElementById("listCheckOut")
    listPåVej = document.getElementById("listCheckIn")
    postOmvejSelector = document.getElementById("postOmvejSelector") as HTMLInputElement
    undoButton = document.getElementById("undo") as HTMLInputElement
    noPatruljerPåPostText = document.getElementById("ingenPåPost") as HTMLParagraphElement
    noPatruljerPåVejText = document.getElementById("ingenPåVej") as HTMLParagraphElement

    //Get data from server
    sendRequest("/getData", new Headers({
        "id": identifier
    }), (status, headers) => {
        class PatruljePostData{
            påPost: number[]
            påVej: number[]
            post: string
            omvejÅben: boolean
        }
        const data = JSON.parse(headers.get("data")) as PatruljePostData
        data.påPost.forEach(pNum => {
            addPatruljeToPåPost(pNum)
        });
        data.påVej.forEach(pNum => {
            addPatruljeToPåVej(pNum)
        })
        document.getElementById("postNum").innerHTML = data.post.toString();
        if(!data.omvejÅben){
            (document.getElementById("postOmvejSelector") as HTMLInputElement).disabled = true
            document.getElementById("OmvejSelectorText").innerHTML += " (Lukket)"
        }
        postOmvejChanged()
    }, () => {
        //if(confirm("Fejl. Du bliver viderestillet til login"))
            location.replace(window.location.origin)
    })

    console.log("Entire page loaded")
}
//Getting initial data from server
if(identifier == null)
    location.href = "/home"

interface callback{
    () : void
}