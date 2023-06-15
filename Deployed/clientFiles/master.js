var Client;
(function (Client) {
    let Master;
    (function (Master) {
        const identity = Client.getCookie("identifier");
        let ppMatrix;
        let loeb;
        let poster;
        let patruljeCollection = [];
        class Data {
            constructor(x, y, patrulje, hoverText) {
                this.x = x;
                this.y = y;
                this.name = patrulje;
                this.text = hoverText;
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
            }
        }
        Master.createPatruljePlot = () => {
            const meldinger = ["På vej mod ", "Tjekket ind på ", "Tjekket ud fra "];
            for (let patruljeIndex = 0; patruljeIndex < ppMatrix.length; patruljeIndex++) {
                let patruljeY = [];
                let patruljeX = [];
                let plotText = [];
                for (let t = 0; t < ppMatrix[patruljeIndex].length; t++) {
                    const pTimeStamp = ppMatrix[patruljeIndex][t];
                    if (pTimeStamp != "") {
                        patruljeX.push(t);
                        patruljeY.push(-(patruljeIndex + 1));
                        plotText.push("Patrulje " + (patruljeIndex + 1).toString() + "<br>" + meldinger[t % 3] + poster[Math.floor(t / 3)].navn + "<br>" + pTimeStamp);
                    }
                }
                patruljeCollection.push(new Data(patruljeX, patruljeY, loeb.patruljer[patruljeIndex], plotText));
            }
            Plotly.newPlot('patruljeOversigt', patruljeCollection, generateLayout());
        };
        const generateLayout = () => {
            return {
                title: 'Patruljeoversigt',
                showlegend: false,
                font: {
                    size: 13.5
                },
                xaxis: {
                    ticktext: getPostNames(),
                    tickvals: getTickVals(),
                    showgrid: false,
                    range: [-0.2, poster.length * 3 + 0.2],
                    mirror: "all"
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
        Master.onLoad = () => {
            Client.sendRequest("/masterData", new Headers({
                "id": identity
            }), (status, headers) => {
                const data = JSON.parse(headers.get("data"));
                ppMatrix = data.ppMatrix;
                loeb = data.loeb;
                poster = data.poster;
                Master.createPatruljePlot();
            }, (status) => {
                console.log("Request failed");
                logOut();
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
                vals.push(i * 3 + 1);
            }
            return vals;
        };
        const logOut = (deleteUser) => {
            if (deleteUser)
                Client.deleteCookie("identifier");
            location.href = "/home";
        };
    })(Master = Client.Master || (Client.Master = {}));
})(Client || (Client = {}));
