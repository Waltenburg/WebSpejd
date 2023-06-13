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
let undoTime = 5 * 1000
let timeBetweenUpdates = 5 * 1000
let lastUpdateTimeString = new Date().getTime().toString()

const createPatruljeElement = (patruljeNummer: number): HTMLInputElement => {
    let newPatrulje: HTMLInputElement = document.createElement("input")
    newPatrulje.classList.add("patrulje")
    newPatrulje.type = "button"
    newPatrulje.id = "p" + patruljeNummer.toString()
    newPatrulje.value = "#" + patruljeNummer.toString()
    return newPatrulje
}
const checkError = (indOrUd: string, pNum: number) => {
    alert("Kunne ikke tjekke patrulje " + pNum + " " + indOrUd +". Prøv igen...")
    console.log("Kunne ikke tjekke patrulje " + pNum + " ud. Prøv igen...")
    lastUpdateTimeString = "0"
    getUpdateFunc()
}
const clickedPatruljePåPost = (val: HTMLInputElement, commit?:boolean) => {
    const pNum = parseInt(val.id.substring(1))
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
            addPatruljePåPost(pNum)
        })
        setTimeout(() => { //Kalder funktionen der rent faktisk eksekvere tjek ind efter given tid, hvis ikke undo er blevet trykket
            if(undoDepth > 0){
                lastUpdateTimeString = new Date().getTime().toString()
                sendRequest("/sendUpdate", new Headers({
                    "id": identifier,
                    "update": pNum.toString() + "%ud"+"%" + postOrOmvejAtCLickedTime,
                    "commit-type": "commit"
                }
                ), (status, headers) => { //Check in succesfull
                        console.log('Tjekket patrulje ' + pNum + " ud")
                        undoActions.shift()
                }, status => { //Check in failed
                    undoActions.shift()()
                    checkError("ud", pNum)
                })
                decreaseUndoDepth()
            }
        }, undoTime)
    }, status => { //Test failed
        checkError("ud", pNum)
    })
}

const clickedPatruljePåVej = (val: HTMLInputElement, commit?:boolean) => {
    const pNum = parseInt(val.id.substring(1))
    sendRequest("/sendUpdate", new Headers({
        "id": identifier,
        "update": pNum.toString() + "%ind",
        "commit-type": "test"
    }), (status, headers) => { //Test succesfull
        undoDepth++
        undoButton.disabled = false
        removePatruljePåVej(pNum)
        addPatruljePåPost(pNum, true)
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
                        lastUpdateTimeString = new Date().getTime().toString()
                }, status => { //Check in failed
                    undoActions.shift()()
                    checkError("ind", pNum)
                })
                decreaseUndoDepth()
            }
        }, undoTime)
    }, status => { //Test failed
        checkError("ind", pNum)
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

const addPatruljePåPost = (patruljeNummer: number, timeout?: boolean) => {
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
class PatruljePostData{
    påPost: number[]
    påVej: number[]
    post: string
    omvejÅben: boolean
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
        const data = JSON.parse(headers.get("data")) as PatruljePostData
        data.påPost.forEach(pNum => {
            addPatruljePåPost(pNum)
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
const getUpdateFunc = () => {
    const headers = new Headers({
        "id": identifier,
        'last-update': lastUpdateTimeString
    })
    lastUpdateTimeString = new Date().getTime().toString()
    sendRequest("/getUpdate", headers, (status, headers) => {
        if(headers.get('update') == "true"){ //Update has arrived since last time client checked
            const data = JSON.parse(headers.get("data")) as PatruljePostData

            const updatePåPost = getDiffArr(patruljerPåPost, data.påPost)
            updatePåPost[0].forEach(patrulje => {
                removePatruljePåPost(patrulje)
            })
            updatePåPost[1].forEach(patrulje => {
                addPatruljePåPost(patrulje)
            })

            const updatePåVej = getDiffArr(patruljerPåVej, data.påVej)
            updatePåVej[0].forEach(patrulje => {
                removePatruljePåVej(patrulje)
            })
            updatePåVej[1].forEach(patrulje => {
                addPatruljeToPåVej(patrulje)
            })

        }
    }, status => {
        clearInterval(updateInterval)

        if(confirm("Fejl ved opdatering. Log ind igen")){
            logOut()
        }
        else{
            updateInterval = setInterval(getUpdateFunc, timeBetweenUpdates)
        }
    })
}
let updateInterval = setInterval(getUpdateFunc, timeBetweenUpdates)
//Getting initial data from server
if(identifier == null)
    location.href = "/home"

interface callback{
    () : void
}
//function getDiffArr<T>(arr1: T)

//Returns a tuple with the first value being all values in Arr1 that arent in Arr2
//and second value being all vales in Arr2 that arent in Arr1
function getDiffArr<T>(Arr1: T[], Arr2: T[]): [T[], T[]] {
    let arr1 = Arr1.slice()
    let arr2 = Arr2.slice()
    for (let i = 0; i < arr1.length; i++) {
        const vi = arr1[i];
        let sameValueFound = false
        for (let j = 0; j < arr2.length; j++) {
            const vj = arr2[j];
            if(vi == vj){
                sameValueFound = true
                arr1.splice(i, 1)
                arr2.splice(j, 1)
                i--
                break
            }
        }
    }
    return [arr1, arr2];
  }