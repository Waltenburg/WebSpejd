var Client;
(function (Client) {
    let plotSide;
    (function (plotSide) {
        let patruljePlot;
        (function (patruljePlot) {
            let ppMatrix;
            let poster;
            patruljePlot.patruljeCollection = [];
            let plotLayout;
            let visUdgåede = true;
            const colors = ["rgb(48, 131, 220)", "rgb(68, 154, 202)", "rgb(126, 195, 200)", "rgb(62, 182, 112)", "rgb(77, 209, 105)"];
            const udgåetColor = "rgb(219, 125, 37)";
            let plotRange;
            patruljePlot.onLoad = () => {
                Client.sendRequest("/masterData", null, (status, headers) => {
                    const data = JSON.parse(headers.get("data"));
                    ppMatrix = data.ppMatrix;
                    console.log(ppMatrix);
                    patruljePlot.loeb = data.loeb;
                    console.log(patruljePlot.loeb);
                    poster = data.poster;
                    console.log(poster);
                    const rangeSelectorMinTemp = document.getElementById("patruljePlotRangeMin");
                    const rangeSelectorMaxTemp = document.getElementById("patruljePlotRangeMax");
                    for (let i = 0; i < poster.length; i++) {
                        const option = document.createElement("option");
                        option.text = poster[i].navn;
                        option.value = (i + 1).toString();
                        const option2 = document.createElement("option");
                        option2.text = poster[i].navn;
                        option2.value = (i + 1).toString();
                        rangeSelectorMinTemp.add(option);
                        rangeSelectorMaxTemp.add(option2);
                    }
                    rangeSelectorMaxTemp.value = poster.length.toString();
                    plotRange = [-0.2, poster.length * 3 + 0.2];
                    createPatruljePlot();
                }, (status) => {
                    if (confirm("Fejl ved hentning af data " + status + ". Vil du logge ud?"))
                        document.location.href = "/home";
                    else
                        location.reload();
                });
            };
            class Data {
                constructor(patruljeIndex) {
                    const meldinger = ["På vej mod ", "Tjekket ind på ", "Tjekket ud fra "];
                    this.x = [];
                    this.y = [];
                    this.text = [];
                    this.name = patruljePlot.loeb.patruljer[patruljeIndex];
                    for (let t = 0; t < ppMatrix[patruljeIndex].length; t++) {
                        const pTimeStamp = ppMatrix[patruljeIndex][t];
                        if (pTimeStamp != "" && pTimeStamp !== null) {
                            this.x.push(t);
                            this.y.push(-(patruljeIndex + 1));
                            this.text.push("Patrulje " + (patruljeIndex + 1).toString() + " - " + this.name + "<br>" + meldinger[t % 3] + poster[Math.floor(t / 3)].navn + "<br>" + pTimeStamp);
                        }
                    }
                    const color = patruljePlot.loeb.udgåedePatruljer[patruljeIndex] ? udgåetColor : colors[patruljeIndex % 5];
                    this.mode = "lines+markers";
                    this.type = "scatter";
                    this.hoverinfo = "text";
                    this.marker = {
                        size: 7,
                        color: color
                    };
                    this.line = {
                        dash: "dot",
                        width: 2,
                        color: color
                    };
                    this.font = {
                        size: 11
                    };
                }
            }
            patruljePlot.Data = Data;
            const createPatruljePlot = () => {
                patruljePlot.patruljeCollection = [];
                for (let patruljeIndex = 0; patruljeIndex < ppMatrix.length; patruljeIndex++) {
                    if (visUdgåede || !patruljePlot.loeb.udgåedePatruljer[patruljeIndex])
                        patruljePlot.patruljeCollection.push(new Data(patruljeIndex));
                }
                plotLayout = generateLayout();
                Plotly.newPlot('patruljeOversigtPlot', patruljePlot.patruljeCollection, plotLayout);
            };
            patruljePlot.updatePatruljeOversigt = (patruljer, ppArrays) => {
                for (let i = 0; i < ppArrays.length; i++) {
                    const patrulje = patruljer[i];
                    ppMatrix[patrulje] = ppArrays[i];
                    patruljePlot.patruljeCollection[patrulje] = new Data(patrulje);
                }
                Plotly.newPlot('patruljeOversigtPlot', patruljePlot.patruljeCollection, plotLayout);
            };
            patruljePlot.visUdgåedeChanged = () => {
                visUdgåede = document.getElementById("visUdgåede").checked;
                createPatruljePlot();
            };
            patruljePlot.rangeSelectorChanged = () => {
                const min = Number.parseInt(document.getElementById("patruljePlotRangeMin").value);
                const max = Number.parseInt(document.getElementById("patruljePlotRangeMax").value);
                plotRange = [(min - 1) * 3 - 0.2, max * 3 + 0.2];
                plotLayout.xaxis.range = plotRange;
                Plotly.newPlot('patruljeOversigtPlot', patruljePlot.patruljeCollection, plotLayout);
            };
            const generateLayout = () => {
                return {
                    autosize: true,
                    margin: {
                        t: 5,
                        l: 30,
                        r: 10,
                        b: 20
                    },
                    paper_bgcolor: "rgba(0,0,0,0",
                    plot_bgcolor: "rgba(0,0,0,0)",
                    showlegend: false,
                    font: {
                        size: 10
                    },
                    xaxis: {
                        ticktext: getPostNames(),
                        tickvals: getXTickVals(),
                        showgrid: false,
                        range: plotRange,
                        tickangle: 0
                    },
                    yaxis: {
                        ticktext: getYTickText(),
                        tickvals: getYTickVals(),
                        range: [-(ppMatrix.length + 0.5), -0.5,],
                        showgrid: false,
                        title: "Patruljer",
                    }
                };
            };
            const getPostNames = () => {
                let names = [];
                poster.forEach(post => {
                    names.push(post.navn);
                });
                return names;
            };
            const getXTickVals = () => {
                let vals = [];
                for (let i = 0; i < poster.length; i++) {
                    vals.push(i * 3 + 1);
                }
                return vals;
            };
            const getYTickVals = () => {
                let vals = [];
                for (let i = 0; i < patruljePlot.loeb.patruljer.length; i++) {
                    if (visUdgåede || !patruljePlot.loeb.udgåedePatruljer[i])
                        vals.push(-(i + 1));
                }
                return vals;
            };
            const getYTickText = () => {
                let vals = [];
                for (let i = 0; i < patruljePlot.loeb.patruljer.length; i++) {
                    if (visUdgåede || !patruljePlot.loeb.udgåedePatruljer[i])
                        vals.push((i + 1).toString());
                }
                return vals;
            };
        })(patruljePlot = plotSide.patruljePlot || (plotSide.patruljePlot = {}));
        let updates;
        (function (updates) {
            let lastUpdateTimeString = new Date().getTime().toString();
            let secondsBetweenUpdates = 3;
            let connectionTries = 0;
            const maxConnectionTries = 10;
            const notificationAudio = new Audio("images/notification.mp3");
            const errorAudio = new Audio("images/error.mp3");
            const getMasterUpdateFunc = () => {
                const headers = new Headers({
                    'last-update': lastUpdateTimeString
                });
                lastUpdateTimeString = new Date().getTime().toString();
                Client.sendRequest("/masterUpdate", headers, (status, headers) => {
                    if (headers.get('update') == "true") {
                        notificationAudio.play();
                        const obj = JSON.parse(headers.get('data'));
                        patruljePlot.updatePatruljeOversigt(obj.patruljer, obj.ppArrays);
                    }
                    connectionTries = 0;
                }, status => {
                    alert("Fejl ved opdatering af data");
                });
            };
            let updateInterval = setInterval(getMasterUpdateFunc, secondsBetweenUpdates * 1000);
            updates.forceUpdateNextTime = () => { lastUpdateTimeString = "0"; };
        })(updates || (updates = {}));
    })(plotSide = Client.plotSide || (Client.plotSide = {}));
})(Client || (Client = {}));
