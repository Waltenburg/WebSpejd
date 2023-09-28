/// <reference path="sendHTTPRequest.ts"/>
namespace Client{
    export namespace Master{
        let ppMatrix: string[][]
        export let loeb: Loeb
        let poster: Post[]

        export const onLoad = () => {
            sendRequest("/masterData", null, (status: number, headers: Headers) =>{ //Succes
                const data = JSON.parse(headers.get("data"))
                ppMatrix = data.ppMatrix
                loeb = data.loeb
                poster = data.poster
                meldinger.updateSidsteMeldinger(data.sidsteMeldinger)
                patruljePlot.onLoad()
                patruljePlot.createPatruljePlot()
                patruljer.loadPatruljer()
                post.loadPoster()
            }, (status: number) => { //Fail
                if(confirm("Fejl ved hentning af data " + status + ". Vil du logge ud?"))
                    logOut()
                // else
                //     location.reload()
            })
        }
        const logOut = (deleteUser?: boolean) => {
            if(deleteUser)
                deleteCookie("identifier")
            location.href = "/home"
        }
        export namespace patruljePlot{
            export let patruljeCollection: Data[] = []
            let plotLayout: object
            let visUdgåede: boolean = true
            const colors: string[] = ["rgb(48, 131, 220)", "rgb(68, 154, 202)", "rgb(126, 195, 200)", "rgb(62, 182, 112)", "rgb(77, 209, 105)"]
            const udgåetColor = "rgb(219, 125, 37)"
            let plotRange: number[]

            export const onLoad = ()=>{
                const rangeSelectorMinTemp = document.getElementById("patruljePlotRangeMin") as HTMLSelectElement
                const rangeSelectorMaxTemp = document.getElementById("patruljePlotRangeMax") as HTMLSelectElement
                for (let i = 0; i < poster.length; i++) {
                    const option = document.createElement("option")
                    option.text = poster[i].navn
                    option.value = (i+1).toString();

                    const option2 = document.createElement("option")
                    option2.text = poster[i].navn
                    option2.value = (i+1).toString();

                    rangeSelectorMinTemp.add(option)                    
                    rangeSelectorMaxTemp.add(option2)
                }
                rangeSelectorMaxTemp.value = poster.length.toString()
                plotRange = [-0.2, poster.length * 3 + 0.2]
            }
            export class Data{
                x: number[]
                y: number[]
                z: number[]
                text: string[]
                label: string[]
                name: string
                mode
                type
                hoverinfo
                marker
                line
                font
                constructor(patruljeIndex: number){
                    const meldinger = ["På vej mod ", "Tjekket ind på ", "Tjekket ud fra "]
                    this.x = []
                    this.y = []
                    this.text = []
                    this.name = loeb.patruljer[patruljeIndex]
                    for (let t = 0; t < ppMatrix[patruljeIndex].length; t++) {
                        const pTimeStamp = ppMatrix[patruljeIndex][t];
                        if(pTimeStamp != ""){
                            this.x.push(t)
                            this.y.push(-(patruljeIndex + 1))
                            this.text.push("Patrulje " + (patruljeIndex + 1).toString() + " - " + this.name + "<br>" + meldinger[t % 3] + poster[Math.floor(t/3)].navn  + "<br>" + pTimeStamp)

                        }
                    }
                    const color = loeb.udgåedePatruljer[patruljeIndex] ? udgåetColor: colors[patruljeIndex % 5]
                    this.mode = "lines+markers"
                    this.type = "scatter"
                    this.hoverinfo = "text"
                    this.marker = {
                        size: 8,
                        color: color
                    }
                    this.line = {
                        dash: "dot",
                        width: 2,
                        color: color
                    }
                    this.font = {
                        size: 15
                    }

                }
            }
            export const createPatruljePlot = (): void => {
                patruljeCollection = []
                //Creating array
                for (let patruljeIndex = 0; patruljeIndex < ppMatrix.length; patruljeIndex++) {
                    if(visUdgåede || !loeb.udgåedePatruljer[patruljeIndex])
                        patruljeCollection.push(new Data(patruljeIndex))
                }
                plotLayout = generateLayout()
                //@ts-ignore
                Plotly.newPlot('patruljeOversigtPlot', patruljeCollection, plotLayout)
            }
            export const updatePatruljeOversigt = (patruljer: number[], ppArrays:string[][]) => {
                for (let i = 0; i < ppArrays.length; i++) {
                    const patrulje = patruljer[i]
                    ppMatrix[patrulje] = ppArrays[i]
                    patruljeCollection[patrulje] = new Data(patrulje)  
                }
                //@ts-expect-error
                Plotly.newPlot('patruljeOversigtPlot', patruljeCollection, plotLayout)
            }
            export const visUdgåedeChanged = (): void => {
                visUdgåede = (document.getElementById("visUdgåede") as HTMLInputElement).checked
                // if(visUdgåede){
                //     for (let p = 0; p < loeb.udgåedePatruljer.length; p++) {
                        
                //         patruljeCollection.splice
                //     }
                // }
                createPatruljePlot()
            }
            export const rangeSelectorChanged = (): void => {
                const min = Number.parseInt((document.getElementById("patruljePlotRangeMin") as HTMLSelectElement).value)
                const max = Number.parseInt((document.getElementById("patruljePlotRangeMax") as HTMLSelectElement).value)
                plotRange = [(min- 1) * 3 - 0.2, max * 3 + 0.2]
                //@ts-ignore
                plotLayout.xaxis.range = plotRange
                //@ts-ignore
                Plotly.newPlot('patruljeOversigtPlot', patruljeCollection, plotLayout)
            }
            const generateLayout = (): object => {
                return {
                    // title:'Oversigt over patruljerne',
                    autosize: true,
                    margin: {
                        t: 5, //top margin
                        l: 45, //left margin
                        r: 10, //right margin
                        b: 20 //bottom margin
                    },
                    paper_bgcolor: "rgba(0,0,0,0", //background color of the chart container space
                    plot_bgcolor: "rgba(0,0,0,0)",
                    showlegend: false,
                    font:{
                        size: 13
                    },
                    xaxis: {
                        ticktext: getPostNames(),
                        tickvals: getXTickVals(),
                        showgrid: false,
                        range: plotRange,
                        // title: "Poster og omveje"
                    },
                    yaxis:{
                        // autotick: false,
                        ticktext: getYTickText(),
                        tickvals: getYTickVals(),
                        // zeroline: true,
                        range: [-(ppMatrix.length + 0.5), -0.5, ],
                        showgrid: false,
                        title: "Patruljer",
                    }
                }
            }
            const getPostNames = (): string[] => {
                let names: string[] = []
                poster.forEach(post => {
                    names.push(post.navn)
                });
                return names
            }
            const getXTickVals = (): number[] => {
                let vals: number[] = []
                for (let i = 0; i < poster.length; i++) {
                    vals.push(i * 3 + 1)
                }
                return vals
            }
            const getYTickVals = (): number[] => {
                let vals: number[] = []
                for (let i = 0; i < loeb.patruljer.length; i++) {
                    if(visUdgåede || !loeb.udgåedePatruljer[i])
                        vals.push(-(i + 1))
                }
                return vals
            }
            const getYTickText = (): string[] => {
                let vals: string[] = []
                for (let i = 0; i < loeb.patruljer.length; i++) {
                    if(visUdgåede || !loeb.udgåedePatruljer[i])
                        vals.push((i + 1).toString())
                }
                return vals
            }
        }
        namespace meldinger{
            const antalMeldinger = 6
            export const updateSidsteMeldinger = (updates: string[]) => {
                if(updates != undefined && updates != null){
                    const list = document.getElementById('senesteUpdates')
                    for (let i = updates.length - 1; i >= 0; i--) {
                        const listElem = document.createElement('li')
                        listElem.innerHTML = updates[i].slice(updates[i].indexOf(" "))
                        lastMeldingerListArray.push(list.appendChild(listElem))
                        if(lastMeldingerListArray.length > antalMeldinger){
                            lastMeldingerListArray.shift().remove()
                        }
                    }
                }
            }
            let lastMeldingerListArray: HTMLLIElement[] = []
        }
        export namespace post{
            export const loadPoster = () => {
                const container: HTMLDivElement = document.getElementById("postContainer") as HTMLDivElement
                
                //Removing all children
                container.innerHTML = ""

                for (let i = 0; i < poster.length; i++) {
                    const button = document.createElement("button")
                    button.innerHTML = poster[i].navn
                    button.value = i.toString()
                    button.setAttribute("onclick", "Client.Master.post.postClicked(this.value)")
                    if(!poster[i].erOmvej)
                        button.disabled = true
                    container.appendChild(button)
                }
            }
            export const postClicked = (post: string) => {
                const p = parseInt(post)
                const omvejLukker = poster[p].omvejÅben
                const action = omvejLukker ? "LUKKE": "ÅBNE"
                if(confirm(`Er du sikker på at ${poster[p].navn} skal ${action}?`)){
                    sendRequest("/postMasterUpdate", new Headers({
                        "post": post,
                        "action": action
                    }), (status: number, headers: Headers) => {

                    }, (status: number) => {
                        alert("Der er sket en fejl. Posten kan ikke " + action)
                    })
                }
            }
        }
        export namespace patruljer{
            export const loadPatruljer = () => {
                const patruljerMed: HTMLDivElement = document.getElementById("patruljerMed") as HTMLDivElement
                const patruljerUde: HTMLDivElement = document.getElementById("patruljerUde") as HTMLDivElement
                
                //Removing all children
                patruljerMed.innerHTML = ""
                patruljerUde.innerHTML = ""

                for (let p = 0; p < loeb.patruljer.length; p++) {
                    const button = document.createElement("button")
                    button.innerHTML = ClientLoebMethods.patruljeNummerOgNavn(loeb, p)
                    button.value = p.toString()
                    button.setAttribute("onclick", "Client.Master.patruljer.buttonClicked(this.value)")
                    if(loeb.udgåedePatruljer[p])
                        patruljerUde.appendChild(button)
                    else
                        patruljerMed.appendChild(button)
                }
            }
            export const buttonClicked = (value: string) => {
                const p = parseInt(value)
                const patruljeSkalUdgå = ClientLoebMethods.patruljeIkkeUdgået(loeb, p)
                const action = patruljeSkalUdgå ? "UDGÅ": "GEN-INDGÅ"
                const message = `Er du sikker på at patrulje ${ClientLoebMethods.patruljeNummerOgNavn(loeb, p)} skal ${action} fra løbet?`
                if(confirm(message)){
                    sendRequest("/patruljeMasterUpdate", new Headers({
                        "pNum": value,
                        "action": action
                    }), (status: number, headers: Headers) => {
                        loeb.udgåedePatruljer[p] = patruljeSkalUdgå
                        loadPatruljer()
                        updates.forceUpdateNextTime()
                    }, (status: number) => {
                        alert("Der er sket en fejl. Patruljen kan ikke " + action)
                    })
                }
            }
        } 
        //Namespace for handling sending and recieving updates from server
        //Put functions to run at every update within callback funciton in SendRequest()
        namespace updates {
            let lastUpdateTimeString: string = new Date().getTime().toString()
            let secondsBetweenUpdates: number = 3
            let connectionTries = 0
            const maxConnectionTries = 10
            const notificationAudio = new Audio("images/notification.mp3")
            const getMasterUpdateFunc = () => {
                const headers = new Headers({
                    'last-update': lastUpdateTimeString
                })
                lastUpdateTimeString = new Date().getTime().toString()
                sendRequest("/masterUpdate", headers, (status, headers) => {
                    if(headers.get('update') == "true"){ //Update has arrived since last time client checked
                        notificationAudio.play()
                        interface IData{
                            patruljer: number[]
                            ppArrays: string[][]
                            senesteUpdates: string[]
                        }
                        const obj = JSON.parse(headers.get('data')) as IData

                        //FUNCTIONS TO RUN AT EVERY UPDATE
                        patruljePlot.updatePatruljeOversigt(obj.patruljer, obj.ppArrays)
                        meldinger.updateSidsteMeldinger(obj.senesteUpdates)
                    }
                    connectionTries = 0
                }, status => {
                    connectionTries++
                    if(connectionTries > maxConnectionTries){
                        clearInterval(updateInterval)
                        if(confirm("Fejl ved opdatering. Log ind igen")){
                            logOut()
                        }
                        else{
                            connectionTries = 0
                            updateInterval = setInterval(getMasterUpdateFunc, secondsBetweenUpdates * 1000)
                        }
                    }
                })
            }
            let updateInterval = setInterval(getMasterUpdateFunc, secondsBetweenUpdates * 1000)

            export const forceUpdateNextTime = () => {lastUpdateTimeString = "0"}
        }
    }
}