"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const identity = getCookie("identifier");
let ppMatrix;
let loeb;
let poster;
let overviewLayout;
let patruljeCollection = [];
const createPatruljePlot = () => {
    for (let i = 0; i < ppMatrix.length; i++) {
        let patruljeY = [];
        let patruljeX = [];
        for (let t = 0; t < ppMatrix[i].length; t++) {
            const pTimeStamp = ppMatrix[i][t];
            if (pTimeStamp != "") {
                patruljeX.push(t);
                patruljeY.push(i + 1);
            }
        }
        patruljeCollection.push(new Data(patruljeX, patruljeY));
    }
    Plotly.newPlot('plot', patruljeCollection, overviewLayout);
};
const onLoad = () => {
    sendRequest("/masterData", new Headers({
        "id": identity
    }), (status, headers) => {
        console.log("Data recieved");
        const data = JSON.parse(headers.get("data"));
        ppMatrix = data.ppMatrix;
        loeb = data.loeb;
        poster = data.poster;
        overviewLayout = {
            title: 'Patruljeoversigt',
            showlegend: false,
            xaxis: {
                ticktext: getPostNames(),
                tickvals: getTickVals(),
                showgrid: false,
            },
            yaxis: {
                autotick: false,
                dtick: 1,
                zeroline: false,
                range: [0.9, ppMatrix.length + 0.1],
                title: "Patruljer"
            }
        };
        createPatruljePlot();
    }, (status) => {
        console.log("Request failed");
    });
};
const getPostNames = () => {
    let names = [];
    poster.forEach(post => {
        names.push(post.navn);
    });
    return names;
};
const getTickVals = () => {
    let vals = [];
    for (let i = 0; i < poster.length; i++) {
        vals.push(i * 3 + 2);
    }
    return vals;
};
class DataCollection {
}
class Data {
    constructor(x, y, patrulje) {
        this.x = x;
        this.y = y;
    }
}
