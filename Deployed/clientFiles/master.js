var Client;
(function (Client) {
    let Master;
    (function (Master) {
        const identifier = Client.getCookie("identifier");
        let ppMatrix;
        let loeb;
        let poster;
        let patruljeCollection = [];
        let plotLayout;
        class Data {
            constructor(patruljeIndex) {
                const meldinger = ["På vej mod ", "Tjekket ind på ", "Tjekket ud fra "];
                this.x = [];
                this.y = [];
                this.text = [];
                this.name = loeb.patruljer[patruljeIndex];
                for (let t = 0; t < ppMatrix[patruljeIndex].length; t++) {
                    const pTimeStamp = ppMatrix[patruljeIndex][t];
                    if (pTimeStamp != "") {
                        this.x.push(t);
                        this.y.push(-(patruljeIndex + 1));
                        this.text.push("Patrulje " + (patruljeIndex + 1).toString() + " - " + this.name + "<br>" + meldinger[t % 3] + poster[Math.floor(t / 3)].navn + "<br>" + pTimeStamp);
                    }
                }
                this.mode = "lines+markers";
                this.type = "scatter";
                this.hoverinfo = "text";
                this.marker = {
                    size: 8
                };
                this.line = {
                    dash: "dot",
                    width: 2
                };
                this.font = {
                    size: 15
                };
            }
        }
        Master.onLoad = () => {
            Client.sendRequest("/masterData", new Headers({
                "id": identifier
            }), (status, headers) => {
                const data = JSON.parse(headers.get("data"));
                ppMatrix = data.ppMatrix;
                loeb = data.loeb;
                poster = data.poster;
                updateSidsteMeldinger(data.sidsteMeldinger);
                Master.createPatruljePlot();
            }, (status) => {
                if (confirm("Fejl ved hentning af data " + status + ". Vil du logge ud?"))
                    logOut();
            });
        };
        Master.createPatruljePlot = () => {
            for (let patruljeIndex = 0; patruljeIndex < ppMatrix.length; patruljeIndex++) {
                patruljeCollection.push(new Data(patruljeIndex));
            }
            plotLayout = generateLayout();
            Plotly.newPlot('patruljeOversigt', patruljeCollection, plotLayout);
        };
        const generateLayout = () => {
            return {
                title: 'Oversigt over patruljerne',
                showlegend: false,
                font: {
                    size: 18
                },
                xaxis: {
                    ticktext: getPostNames(),
                    tickvals: getTickVals(),
                    showgrid: false,
                    range: [-0.2, poster.length * 3 + 0.2],
                },
                yaxis: {
                    autotick: false,
                    dtick: 1,
                    zeroline: false,
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
        const getTickVals = () => {
            let vals = [];
            for (let i = 0; i < poster.length; i++) {
                vals.push(i * 3 + 1);
            }
            return vals;
        };
        const logOut = (deleteUser) => {
            if (deleteUser)
                Client.deleteCookie("identifier");
            location.href = "/home";
        };
        const updatePatruljeOversigt = (patruljer, ppArrays) => {
            for (let i = 0; i < ppArrays.length; i++) {
                const patrulje = patruljer[i];
                ppMatrix[patrulje] = ppArrays[i];
                patruljeCollection[patrulje] = new Data(patrulje);
            }
            Plotly.newPlot('patruljeOversigt', patruljeCollection, plotLayout);
        };
        const updateSidsteMeldinger = (updates) => {
            console.log(updates);
            if (updates != undefined && updates != null) {
                const list = document.getElementById('senesteUpdates');
                for (let i = updates.length - 1; i >= 0; i--) {
                    const listElem = document.createElement('li');
                    listElem.innerHTML = updates[i].slice(updates[i].indexOf(" "));
                    lastUpdatesListArray.push(list.appendChild(listElem));
                    if (lastUpdatesListArray.length > 5) {
                        lastUpdatesListArray.shift().remove();
                    }
                }
            }
        };
        let lastUpdatesListArray = [];
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
                    updatePatruljeOversigt(obj.patruljer, obj.ppArrays);
                    updateSidsteMeldinger(obj.senesteUpdates);
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
    })(Master = Client.Master || (Client.Master = {}));
})(Client || (Client = {}));
