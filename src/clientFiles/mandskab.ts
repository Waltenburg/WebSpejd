
/// <reference path="sendHTTPRequest.ts"/>
namespace Client{
    export namespace Mandskab {
        let postOrOmvej = "post"
        let listPåPost: HTMLElement
        let listPåVej: HTMLElement
        let postOmvejSelector: HTMLInputElement
        let undoButton: HTMLInputElement
        
        let patruljerPåPost: number[] = [] //De patruljer der er på posten i nummeret rækkefølge
        let patruljeElementsPåPost: HTMLInputElement[] = [] //De tilhørende elementer 
        
        let noPatruljerPåPostText: HTMLParagraphElement
        let noPatruljerPåVejText: HTMLParagraphElement
        
        let patruljerPåVej: number[] = [] //De patruljer der er på vej til posten i nummeret rækkefølge
        let patruljeElementsPåVej: HTMLInputElement[]= [] //De tilhørende elementer
        
        let undoTime = 10 * 1000
        let undoTimer: NodeJS.Timeout[] = []
        let undoActions: callback[] = []
        let timeBetweenUpdates = 2 * 1000
        let lastUpdateTimeString = new Date().getTime().toString()

        let showingError = false

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
        export const clickedPatruljePåPost = (val: HTMLInputElement, commit?:boolean) => {
            const pNum = parseInt(val.id.substring(1))
            const postOrOmvejAtCLickedTime = postOrOmvej
            if(confirmCheckinWithUser(pNum, "ud", postOrOmvejAtCLickedTime)){
                sendRequest("/sendUpdate", new Headers({
                    "update": pNum.toString() + "%ud"+"%" + postOrOmvejAtCLickedTime,
                }), (status, headers) => {
                    //Checkout succesfull
                    undoButton.disabled = false
                    setUndoButtonTimer()
                    removePatruljePåPost(pNum)
                    const checkinID = Number.parseInt(headers.get("checkinID"))
                    undoActions.push(() => {
                        addPatruljePåPost(pNum)
                        undoCheckin(checkinID)
                    })
                }, _ => checkError("ud", pNum))
            }
        }

        export const clickedPatruljePåVej = (val: HTMLInputElement, commit?:boolean) => {
            const pNum = parseInt(val.id.substring(1))
            if(confirmCheckinWithUser(pNum, "ind", "")){
                sendRequest("/sendUpdate", new Headers({
                    "update": pNum.toString() + "%ind",
                }), (status, headers) => { //Test succesfull
                    undoButton.disabled = false
                    setUndoButtonTimer()
                    removePatruljePåVej(pNum)
                    addPatruljePåPost(pNum)
                    const checkinID = Number.parseInt(headers.get("checkinID"))
                    undoActions.push(() => {
                        addPatruljeToPåVej(pNum)
                        removePatruljePåPost(pNum)
                        undoCheckin(checkinID)
                    })
                }, status => checkError("ind", pNum))
            }
        }

        const confirmCheckinWithUser = (patruljeNummer: number, udEllerInd: string, postOrOmvej?: string): boolean => {
            if(udEllerInd == "ud")
                return confirm(`Er du sikker på at du vil tjekke patrulje ${patruljeNummer} ud mod ${postOrOmvej}?`)
            else
                return confirm(`Er du sikker på at du vil tjekke patrulje ${patruljeNummer} ind?`)
        }


        const undoCheckin = (id: number) => {
            sendRequest(`/deleteCheckin?id=${id}`, null, (status, headers) => {}, status => {
                lastUpdateTimeString = "0"
                getUpdateFunc()
            })
        }

        const setUndoButtonTimer = () => {
            undoTimer.push(setTimeout(() => {
                undoActions.shift()
                undoTimer.shift()
                if(undoTimer.length == 0)
                    undoButton.disabled = true
            }, undoTime))
        }

        export const undoButtonClicked = () => {
            undoActions.pop()()
            clearTimeout(undoTimer.pop())
            if(undoActions.length == 0)
                undoButton.disabled = true 
        }
        const removePatruljePåPost = (patruljeNummer: number) => {
            const i = patruljerPåPost.indexOf(patruljeNummer)
            if(i < 0)
                console.log("Patrulje kan ikke fjernes, den er ikke i listen")
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
        export const postOmvejChanged = () => {
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

        const addPatruljePåPost = (patruljeNummer: number) => {
            const newElement = createPatruljeElement(patruljeNummer)
            newElement.setAttribute("onclick", "Client.Mandskab.clickedPatruljePåPost(this)")

            insertElement(patruljeNummer, newElement , patruljerPåPost, patruljeElementsPåPost, listPåPost)
            postOmvejChanged()
            noPatruljerPåPostText.style.display = 'none'
            
        }
        const addPatruljeToPåVej = (patruljeNummer: number) => {
            const newElement = createPatruljeElement(patruljeNummer)
            newElement.setAttribute("onclick", "Client.Mandskab.clickedPatruljePåVej(this)")
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
        export const logOut = () => {
            deleteCookie("identifier")
            location.href = "/home"
        }
        class PatruljePostData{
            påPost: number[]
            påVej: number[]
            post: string
            omvejÅben: boolean
        }
        export const onLoadFunction = () => {
            listPåPost = document.getElementById("listCheckOut")
            listPåVej = document.getElementById("listCheckIn")
            postOmvejSelector = document.getElementById("postOmvejSelector") as HTMLInputElement
            undoButton = document.getElementById("undo") as HTMLInputElement
            noPatruljerPåPostText = document.getElementById("ingenPåPost") as HTMLParagraphElement
            noPatruljerPåVejText = document.getElementById("ingenPåVej") as HTMLParagraphElement
            //Get data from server
            sendRequest("/getData", null, (status, headers) => {
                const data = JSON.parse(headers.get("data")) as PatruljePostData
                data.påPost.forEach(pNum => {
                    addPatruljePåPost(pNum)
                });
                data.påVej.forEach(pNum => {
                    addPatruljeToPåVej(pNum)
                })
                document.getElementById("postNum").innerHTML = data.post.toString();
                setOmvejSelector(data.omvejÅben)
                console.log(data.omvejÅben)
            }, () => {
                if(confirm("Fejl. Du bliver viderestillet til login"))
                    location.replace(window.location.origin)
            })

            console.log("Entire page loaded")
        }
        const setOmvejSelector = (omvejÅben: boolean) => {
            if(omvejÅben){
                (document.getElementById("postOmvejSelector") as HTMLInputElement).disabled = false
                document.getElementById("OmvejSelectorText").innerHTML = "Omvej"
            }
            else{
                (document.getElementById("postOmvejSelector") as HTMLInputElement).disabled = true
                document.getElementById("OmvejSelectorText").innerHTML = "Omvej (Lukket)"
                postOmvejSelector.value = "0"
            }

            postOmvejChanged()
        }
        const getUpdateFunc = () => {
            const headers = new Headers({
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
                    setOmvejSelector(data.omvejÅben)
                }
            }, status => {
                clearInterval(updateInterval)
                
                if(!showingError)
                    showingError = true
                    if(confirm("Fejl ved opdatering. Log ind igen")){
                        logOut()
                    }
                    else{
                    showingError = false
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
    }
    
}