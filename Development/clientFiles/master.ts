/// <reference path="sendHTTPRequest.ts"/>
namespace Client{
    export namespace Master{
        const identifier = getCookie("identifier")
        let ppMatrix: string[][]
        let loeb: Loeb
        let poster: Post[]

        let patruljeCollection: Data[] = []
        let plotLayout: object
        class Data{
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
                this.mode = "lines+markers"
                this.type = "scatter"
                this.hoverinfo = "text"
                this.marker = {
                    size: 8
                }
                this.line = {
                    dash: "dot",
                    width: 2
                }
                this.font = {
                    size: 15
                }
            }
        }

        export const onLoad = () => {
            sendRequest("/masterData", new Headers({
                "id": identifier
            }), (status: number, headers: Headers) =>{ //Succes
                const data = JSON.parse(headers.get("data"))
                ppMatrix = data.ppMatrix
                loeb = data.loeb
                poster = data.poster
                updateSidsteMeldinger(data.sidsteMeldinger)
                createPatruljePlot()
            }, (status: number) => { //Fail
                if(confirm("Fejl ved hentning af data " + status + ". Vil du logge ud?"))
                    logOut()
                // else
                //     location.reload()
            })
        }
        export const createPatruljePlot = (): void => {
            //Creating array
            for (let patruljeIndex = 0; patruljeIndex < ppMatrix.length; patruljeIndex++) {
                patruljeCollection.push(new Data(patruljeIndex))
            }
            plotLayout = generateLayout()
            //@ts-ignore
            Plotly.newPlot('patruljeOversigt', patruljeCollection, plotLayout)
        }
        const generateLayout = (): object => {
            return {
                title:'Oversigt over patruljerne',
                showlegend: false,
                font:{
                    size: 18
                },
                xaxis: {
                    ticktext: getPostNames(),
                    tickvals: getTickVals(),
                    showgrid: false,
                    range: [-0.2, poster.length * 3 + 0.2],
                },
                yaxis:{
                    autotick: false,
                    dtick: 1,
                    zeroline: false,
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
        const getTickVals = (): number[] => {
            let vals: number[] = []
            for (let i = 0; i < poster.length; i++) {
                vals.push(i * 3 + 1)
            }
            return vals
        }
        const logOut = (deleteUser?: boolean) => {
            if(deleteUser)
                deleteCookie("identifier")
            location.href = "/home"
        }
        const updatePatruljeOversigt = (patruljer: number[], ppArrays:string[][]) => {
            for (let i = 0; i < ppArrays.length; i++) {
                const patrulje = patruljer[i]
                ppMatrix[patrulje] = ppArrays[i]
                patruljeCollection[patrulje] = new Data(patrulje)  
            }
            //@ts-expect-error
            Plotly.newPlot('patruljeOversigt', patruljeCollection, plotLayout)
        }
        const updateSidsteMeldinger = (updates: string[]) => {
            console.log(updates)
            if(updates != undefined && updates != null){
                const list = document.getElementById('senesteUpdates')
                for (let i = updates.length - 1; i >= 0; i--) {
                    const listElem = document.createElement('li')
                    listElem.innerHTML = updates[i].slice(updates[i].indexOf(" "))
                    lastUpdatesListArray.push(list.appendChild(listElem))
                    if(lastUpdatesListArray.length > 5){
                        lastUpdatesListArray.shift().remove()
                    }
                }
            }
        }
        let lastUpdatesListArray: HTMLLIElement[] = []

        let lastUpdateTimeString: string = new Date().getTime().toString()
        let secondsBetweenUpdates: number = 3
        const notificationAudio = new Audio("images/notification.mp3")
        const getMasterUpdateFunc = () => {
            const headers = new Headers({
                "id": identifier,
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
                    updatePatruljeOversigt(obj.patruljer, obj.ppArrays)
                    updateSidsteMeldinger(obj.senesteUpdates)
                }
            }, status => {
                clearInterval(updateInterval)
                if(confirm("Fejl ved opdatering. Log ind igen")){
                    logOut()
                }
                else{
                    updateInterval = setInterval(getMasterUpdateFunc, secondsBetweenUpdates * 1000)
                }
            })
        }
        let updateInterval = setInterval(getMasterUpdateFunc, secondsBetweenUpdates * 1000)
    }
}