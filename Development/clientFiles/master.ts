/// <reference path="sendHTTPRequest.ts"/>
namespace Client{
    export namespace Master{
        const identity = getCookie("identifier")
        let ppMatrix: string[][]
        let loeb: Loeb
        let poster: Post[]

        let patruljeCollection: Data[] = []

        class Data{
            x
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
            constructor(x: number[], y: number[], patrulje: string, hoverText: string[]){
                this.x = x
                this.y = y
                this.name = patrulje
                this.text = hoverText
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
            }

        }

        export const createPatruljePlot = (): void => {
            //Creating array
            const meldinger = ["På vej mod ", "Tjekket ind på ", "Tjekket ud fra "]
            for (let patruljeIndex = 0; patruljeIndex < ppMatrix.length; patruljeIndex++) {
                let patruljeY: number[] = []
                let patruljeX: number[] = []
                let plotText: string[] = []
                for (let t = 0; t < ppMatrix[patruljeIndex].length; t++) {
                    const pTimeStamp = ppMatrix[patruljeIndex][t];
                    if(pTimeStamp != ""){
                        patruljeX.push(t)
                        patruljeY.push(-(patruljeIndex + 1))
                        plotText.push("Patrulje " + (patruljeIndex + 1).toString() + "<br>" + meldinger[t % 3] + poster[Math.floor(t/3)].navn  + "<br>" + pTimeStamp)

                    }
                }
                patruljeCollection.push(new Data(patruljeX, patruljeY, loeb.patruljer[patruljeIndex], plotText))
            }
            //@ts-ignore
            Plotly.newPlot('patruljeOversigt', patruljeCollection, generateLayout())
        }
        const generateLayout = (): object => {
            return {
                title:'Patruljeoversigt',
                showlegend: false,
                font:{
                    size: 13.5
                },
                xaxis: {
                    ticktext: getPostNames(),
                    tickvals: getTickVals(),
                    showgrid: false,
                    range: [-0.2, poster.length * 3 + 0.2],
                    mirror: "all"
                },
                yaxis:{
                    autotick: false,
                    dtick: 1,
                    zeroline: false,
                    range: [-(ppMatrix.length + 0.5), -0.5, ],
                    showgrid: false,
                    //ticktext: ['1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30'],
                    title: "Patruljer",
                    // autorange: "reversed"
                }
            }
        }
        export const onLoad = () => {
            sendRequest("/masterData", new Headers({
                "id": identity
            }), (status: number, headers: Headers) =>{ //Succes
                const data = JSON.parse(headers.get("data"))
                ppMatrix = data.ppMatrix
                loeb = data.loeb
                poster = data.poster

                createPatruljePlot()
            }, (status: number) => { //Fail
                console.log("Request failed")
                logOut()
            })
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

        // const getMasterUpdateFunc = () => {
        //     const headers = new Headers({
        //         "id": identifier,
        //         'last-update': lastUpdateTimeString
        //     })
        //     lastUpdateTimeString = new Date().getTime().toString()
        //     sendRequest("/getMasterUpdate", headers, (status, headers) => {
        //         if(headers.get('update') == "true"){ //Update has arrived since last time client checked
                    
        //         }
        //     }, status => {
        //         clearInterval(updateInterval)
        //         if(confirm("Fejl ved opdatering. Log ind igen")){
        //             logOut()
        //         }
        //         else{
        //             updateInterval = setInterval(getUpdateFunc, timeBetweenUpdates)
        //         }
        //     })
        // }
        // let updateInterval = setInterval(getUpdateFunc, timeBetweenUpdates)
    }
}