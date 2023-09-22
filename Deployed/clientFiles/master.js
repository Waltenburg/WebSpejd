var Client;
(function (Client) {
    let Master;
    (function (Master) {
        const identifier = Client.getCookie("identifier");
        let ppMatrix;
        let poster;
        Master.onLoad = () => {
            Client.sendRequest("/masterData", new Headers({
                "id": identifier
            }), (status, headers) => {
                const data = JSON.parse(headers.get("data"));
                ppMatrix = data.ppMatrix;
                Master.loeb = data.loeb;
                poster = data.poster;
                meldinger.updateSidsteMeldinger(data.sidsteMeldinger);
                patruljePlot.onLoad();
                patruljePlot.createPatruljePlot();
                patruljer.loadPatruljer();
            }, (status) => {
                if (confirm("Fejl ved hentning af data " + status + ". Vil du logge ud?"))
                    logOut();
            });
        };
        const logOut = (deleteUser) => {
            if (deleteUser)
                Client.deleteCookie("identifier");
            location.href = "/home";
        };
        let patruljePlot;
        (function (patruljePlot) {
            patruljePlot.patruljeCollection = [];
            let plotLayout;
            let visUdgåede = true;
            const colors = ["rgb(48, 131, 220)", "rgb(68, 154, 202)", "rgb(126, 195, 200)", "rgb(62, 182, 112)", "rgb(77, 209, 105)"];
            const udgåetColor = "rgb(219, 125, 37)";
            let plotRange;
            patruljePlot.onLoad = () => {
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
            };
            class Data {
                constructor(patruljeIndex) {
                    const meldinger = ["På vej mod ", "Tjekket ind på ", "Tjekket ud fra "];
                    this.x = [];
                    this.y = [];
                    this.text = [];
                    this.name = Master.loeb.patruljer[patruljeIndex];
                    for (let t = 0; t < ppMatrix[patruljeIndex].length; t++) {
                        const pTimeStamp = ppMatrix[patruljeIndex][t];
                        if (pTimeStamp != "") {
                            this.x.push(t);
                            this.y.push(-(patruljeIndex + 1));
                            this.text.push("Patrulje " + (patruljeIndex + 1).toString() + " - " + this.name + "<br>" + meldinger[t % 3] + poster[Math.floor(t / 3)].navn + "<br>" + pTimeStamp);
                        }
                    }
                    const color = Master.loeb.udgåedePatruljer[patruljeIndex] ? udgåetColor : colors[patruljeIndex % 5];
                    this.mode = "lines+markers";
                    this.type = "scatter";
                    this.hoverinfo = "text";
                    this.marker = {
                        size: 8,
                        color: color
                    };
                    this.line = {
                        dash: "dot",
                        width: 2,
                        color: color
                    };
                    this.font = {
                        size: 15
                    };
                }
            }
            patruljePlot.Data = Data;
            patruljePlot.createPatruljePlot = () => {
                patruljePlot.patruljeCollection = [];
                for (let patruljeIndex = 0; patruljeIndex < ppMatrix.length; patruljeIndex++) {
                    if (visUdgåede || !Master.loeb.udgåedePatruljer[patruljeIndex])
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
                patruljePlot.createPatruljePlot();
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
                        t: 0,
                        l: 45,
                        r: 10,
                        b: 20
                    },
                    paper_bgcolor: "rgba(0,0,0,0",
                    plot_bgcolor: "rgba(0,0,0,0)",
                    showlegend: false,
                    font: {
                        size: 13
                    },
                    xaxis: {
                        ticktext: getPostNames(),
                        tickvals: getXTickVals(),
                        showgrid: false,
                        range: plotRange,
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
                for (let i = 0; i < Master.loeb.patruljer.length; i++) {
                    if (visUdgåede || !Master.loeb.udgåedePatruljer[i])
                        vals.push(-(i + 1));
                }
                return vals;
            };
            const getYTickText = () => {
                let vals = [];
                for (let i = 0; i < Master.loeb.patruljer.length; i++) {
                    if (visUdgåede || !Master.loeb.udgåedePatruljer[i])
                        vals.push((i + 1).toString());
                }
                return vals;
            };
        })(patruljePlot = Master.patruljePlot || (Master.patruljePlot = {}));
        let meldinger;
        (function (meldinger) {
            const antalMeldinger = 6;
            meldinger.updateSidsteMeldinger = (updates) => {
                if (updates != undefined && updates != null) {
                    const list = document.getElementById('senesteUpdates');
                    for (let i = updates.length - 1; i >= 0; i--) {
                        const listElem = document.createElement('li');
                        listElem.innerHTML = updates[i].slice(updates[i].indexOf(" "));
                        lastMeldingerListArray.push(list.appendChild(listElem));
                        if (lastMeldingerListArray.length > antalMeldinger) {
                            lastMeldingerListArray.shift().remove();
                        }
                    }
                }
            };
            let lastMeldingerListArray = [];
        })(meldinger || (meldinger = {}));
        let patruljer;
        (function (patruljer) {
            patruljer.loadPatruljer = () => {
                const patruljerMed = document.getElementById("patruljerMed");
                const patruljerUde = document.getElementById("patruljerUde");
                patruljerMed.innerHTML = "";
                patruljerUde.innerHTML = "";
                for (let p = 0; p < Master.loeb.patruljer.length; p++) {
                    const button = document.createElement("button");
                    button.innerHTML = ClientLoebMethods.patruljeNummerOgNavn(Master.loeb, p);
                    button.value = p.toString();
                    button.setAttribute("onclick", "Client.Master.patruljer.buttonClicked(this.value)");
                    if (Master.loeb.udgåedePatruljer[p])
                        patruljerUde.appendChild(button);
                    else
                        patruljerMed.appendChild(button);
                }
            };
            patruljer.buttonClicked = (value) => {
                const p = parseInt(value);
                const patruljeSkalUdgå = ClientLoebMethods.patruljeIkkeUdgået(Master.loeb, p);
                const action = patruljeSkalUdgå ? "UDGÅ" : "GEN-INDGÅ";
                const message = `Er du sikker på at patrulje ${ClientLoebMethods.patruljeNummerOgNavn(Master.loeb, p)} skal ${action} fra løbet?`;
                if (confirm(message)) {
                    Client.sendRequest("/patruljeMasterUpdate", new Headers({
                        "pNum": value,
                        "action": action
                    }), (status, headers) => {
                    }, (status) => {
                    });
                }
            };
        })(patruljer = Master.patruljer || (Master.patruljer = {}));
        let updates;
        (function (updates) {
            let lastUpdateTimeString = new Date().getTime().toString();
            let secondsBetweenUpdates = 3;
            const notificationAudio = new Audio("images/notification.mp3");
            const getMasterUpdateFunc = () => {
                const headers = new Headers({
                    "id": identifier,
                    'last-update': lastUpdateTimeString
                });
                lastUpdateTimeString = new Date().getTime().toString();
                Client.sendRequest("/masterUpdate", headers, (status, headers) => {
                    if (headers.get('update') == "true") {
                        notificationAudio.play();
                        const obj = JSON.parse(headers.get('data'));
                        patruljePlot.updatePatruljeOversigt(obj.patruljer, obj.ppArrays);
                        meldinger.updateSidsteMeldinger(obj.senesteUpdates);
                    }
                }, status => {
                    clearInterval(updateInterval);
                    if (confirm("Fejl ved opdatering. Log ind igen")) {
                        logOut();
                    }
                    else {
                        updateInterval = setInterval(getMasterUpdateFunc, secondsBetweenUpdates * 1000);
                    }
                });
            };
            let updateInterval = setInterval(getMasterUpdateFunc, secondsBetweenUpdates * 1000);
        })(updates || (updates = {}));
    })(Master = Client.Master || (Client.Master = {}));
})(Client || (Client = {}));
