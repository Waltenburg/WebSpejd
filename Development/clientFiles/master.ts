//import * as plotly from 'plotly.js'
import * as s from "../server"

const identity = getCookie("identifier")
let ppMatrix: string[][]
let loeb: object
let poster: object[]
let overviewLayout: object

let patruljeCollection: Data[] = []

const createPatruljePlot = (): void => {
    //Creating array
    for (let i = 0; i < ppMatrix.length; i++) {
        let patruljeY: number[] = []
        let patruljeX: number[] = []
        for (let t = 0; t < ppMatrix[i].length; t++) {
            const pTimeStamp = ppMatrix[i][t];
            if(pTimeStamp != ""){
                patruljeX.push(t)
                patruljeY.push(i + 1)
            }
        }
        patruljeCollection.push(new Data(patruljeX, patruljeY))
    }
    //@ts-ignore
    Plotly.newPlot('plot', patruljeCollection, overviewLayout)
} 
const onLoad = () => {
    sendRequest("/masterData", new Headers({
        "id": identity
    }), (status: number, headers: Headers) =>{ //Succes
        console.log("Data recieved")
        const data = JSON.parse(headers.get("data"))
        ppMatrix = data.ppMatrix
        loeb = data.loeb
        poster = data.poster
        overviewLayout = {
            title:'Patruljeoversigt',
            showlegend: false,
            xaxis: {
                ticktext: getPostNames(),
                tickvals: getTickVals(),
                showgrid: false,
            },
            yaxis:{
                autotick: false,
                dtick: 1,
                zeroline: false,
                range: [0.9, ppMatrix.length + 0.1],
                title: "Patruljer"
            }
        }
        createPatruljePlot()
    }, (status: number) => { //Fail
        console.log("Request failed")
    })
}

const getPostNames = (): string[] => {
    let names: string[] = []
    poster.forEach(post => {
        //@ts-ignore
        names.push(post.navn)
    });
return names
}
const getTickVals = (): number[] => {
    let vals: number[] = []
    for (let i = 0; i < poster.length; i++) {
        vals.push(i * 3 + 2)
    }
    return vals
}
class DataCollection{
    static type: "scatter"
    data: Data[]
}
class Data{
    x: number[]
    y: number[]
    name: string
    text: string[]

    static mode: "markers"
    static line: {
        dash: 'dot',
        width: 4
    }
    constructor(x: number[], y: number[], patrulje?: string){
        this.x = x
        this.y = y
    }

}



// let patruljer = [1, 2, 3, 5]
// let status = [2, 5, 4, 6]

// var patrulje1 = {
//     x: [1, 2, 3, 7, 8],
//     y: [1, 1, 1, 1, 1],
//     mode: 'lines+markers',
//     name: 'Patrulje 1',
//     text: ["Mod post 1", "Tjek ind post 1", "d", "f"],
//     marker: {size: 13} 
// };
// var sep1 = {
//     x: [3.5, 3.5],
//     y: [1, 4],
//     mode: "lines",
//     line: {
//         color: "rgb(230, 230, 230)",
//         width: 2
//     }
// }
// var sep2 = {
//     x: [6.5, 6.5],
//     y: [1, 4],
//     mode: "lines",
//     line: {
//         color: "rgb(230, 230, 230)",
//         width: 2
//     }
// }
// var patrulje2 = {
//     x: [1, 2, 3, 4, 5],
//     y: [2, 2, 2, 2, 2],
//     mode: 'lines+markers',
//     name: 'Patrulje 2'
// };
// var patrulje3 = {
//     x: [1, 2, 3, 7, 8],
//     y: [3, 3, 3, 3, 3],
//     mode: 'lines+markers',
//     name: 'Patrulje 1',
//     text: ["Mod post 1", "Tjek ind post 1", "d", "f"],
//     marker: {size: 13} 
// };
// var patrulje4 = {
//     x: [1, 2, 3, 7, 8],
//     y: [4, 4, 4, 4, 4],
//     mode: 'lines+markers',
//     name: 'Patrulje 1',
//     text: ["Mod post 1", "Tjek ind post 1", "d", "f"],
//     line: {
//         dash: 'dot',
//         width: 4
        
//     },
//     marker: {size: 13} 
// };

// var data = [sep1, sep2, patrulje1, patrulje2, patrulje3, patrulje4];
// var layout = {
//     title:'Patruljeoversigt',
//     showlegend: false,
//     xaxis: {
//         ticktext: ["Post 1", "Omvej 1", "Post 2"],
//         tickvals: [2, 5, 8],
//         showgrid: false,
//     },
//     yaxis:{
//         autotick: false,
//         dtick: 1,
//         title: "Patruljer"
//     }
// };

// plotly.newPlot('plot', data, layout);