"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sendHTTPRequest_js_1 = require("./sendHTTPRequest.js");
const endpoints_1 = require("@shared/endpoints");
const cookie_js_1 = require("./cookie.js");
const secondsBetweenDataReload = 5;
window.onload = () => {
    new Mandskab();
};
class Mandskab {
    listPatrolsOnLocation;
    listPatrolsTowardsLocation;
    nextLocationSelector;
    undoButton;
    recentActionsTable;
    locationNameHeader;
    patrolsOnLocation = [];
    patrolsTowardsLocation = [];
    currentLocationId = Number.NaN;
    recentActions;
    reloadDataInterval;
    errorDialogOpen = false;
    constructor() {
        this.listPatrolsOnLocation = document.getElementById("listPåPost");
        this.listPatrolsTowardsLocation = document.getElementById("listPåVej");
        this.nextLocationSelector = document.getElementById("nextLocationSelector");
        this.undoButton = document.getElementById("undoButton");
        this.recentActionsTable = document.getElementById("recentActionsTable");
        this.locationNameHeader = document.getElementById("locationNameHeader");
        this.recentActions = new autoEmptyingFILO(10, 20 * 1000, 1000, () => {
            this.undoButton.disabled = true;
        });
        this.reloadDataInterval = window.setInterval(this.reloadData, secondsBetweenDataReload * 1000);
        this.reloadData();
        this.undoButton.addEventListener("click", () => this.undoLastAction());
    }
    reloadData = () => {
        const success = (status, headers) => {
            const data = JSON.parse(headers.get("data"));
            this.patrolsOnLocation = data.patrolsOnLocation;
            this.patrolsTowardsLocation = data.patrolsTowardsLocation;
            this.currentLocationId = data.location.id;
            this.addPatrolsToLists(this.patrolsTowardsLocation, this.patrolsOnLocation);
            this.setNextLocationSelector(data.routesTo);
            this.addRecentActionsTable(data.latestUpdates, this.currentLocationId);
            this.locationNameHeader.innerHTML = data.location.name;
        };
        const fail = (err) => {
            window.clearInterval(this.reloadDataInterval);
            this.showDialog("Der skete en fejl ved hentning af patruljer. Hvis fejlen fortsætter, kontroller internetforbindelsen eller log ind igen.", ["Prøv igen", () => this.reloadData()], ["Log ud", () => this.logout()]);
        };
        const headers = null;
        (0, sendHTTPRequest_js_1.sendRequest)(endpoints_1.Endpoints.GetData, headers, success, fail);
    };
    clickedPatrol = (val, action) => {
        const patrolID = parseInt(val.id.substring(1));
        const patrol = this.getPatrolById(patrolID);
        if (!patrol) {
            alert("Kunne ikke finde patrulje med ID " + patrolID);
            return;
        }
        const patrolName = patrol.name;
        const patrolNumber = patrol.number;
        const selectedNextLocation = this.nextLocationSelector.value;
        const targetLocationId = action === 0 ? this.currentLocationId : parseInt(selectedNextLocation);
        const onConfirm = () => {
            const patrolUpdate = {
                patrolId: patrolID,
                targetLocationId: targetLocationId
            };
            const header = new Headers({ update: JSON.stringify(patrolUpdate) });
            const succesReciever = (status, headers) => {
                const checkinID = headers.get("checkinID");
                if (checkinID == null) {
                    alert("Mulig fejl ved opdaternig. Kontroller at opdateringen er registreret korrekt.");
                    this.reloadData();
                    return;
                }
                this.recentActions.add(Number.parseInt(checkinID));
                this.undoButton.disabled = false;
                this.reloadData();
            };
            const onFail = (err) => {
                this.showDialog("Der skete en fejl ved afsendelse af opdatering. Du kan prøve igen eller genindlæse siden.", ["Prøv igen", () => onConfirm()], ["Genindlæs side", () => this.reloadData()]);
            };
            (0, sendHTTPRequest_js_1.sendRequest)(endpoints_1.Endpoints.SendUpdate, header, succesReciever, onFail);
        };
        const nextLocationName = this.nextLocationSelector.options[this.nextLocationSelector.selectedIndex].text;
        const message = `Vil du checke #${patrolNumber} ${patrolName} ${action === 0 ? ("ind på denne post") : ("ud imod " + nextLocationName)}?`;
        this.showDialog(message, [`Ja, check patrulje ${action === 0 ? "ind" : "ud"}`, onConfirm], ["Nej, annuller", () => { }]);
    };
    undoLastAction = () => {
        const lastActionId = this.recentActions.getTop()?.v;
        if (lastActionId == null)
            return;
        const onConfirm = () => {
            (0, sendHTTPRequest_js_1.sendRequest)(`${endpoints_1.Endpoints.DeleteCheckin}?id=${lastActionId}`, null, (status, headers) => {
                this.recentActions.pop();
                this.reloadData();
            }, err => {
                this.showDialog("Der skete en fejl ved fortrydelse af den seneste handling. Du kan prøve igen eller genindlæse siden.", ["Prøv igen", () => onConfirm()], ["Genindlæs side", () => this.reloadData()]);
            });
        };
        this.showDialog("Er du sikker på, at du vil fortryde den seneste handling?", ["Ja, fortryd", onConfirm], ["Nej, annuller", () => { }]);
    };
    getPatrolById = (patrolId) => {
        const onLocation = this.patrolsOnLocation.find(p => p.id === patrolId);
        const towardsLocation = this.patrolsTowardsLocation.find(p => p.id === patrolId);
        return onLocation ?? towardsLocation;
    };
    addPatrolsToLists = (patrolsTowardsLocation, patrolsOnLocation) => {
        this.listPatrolsOnLocation.innerHTML = "";
        this.listPatrolsTowardsLocation.innerHTML = "";
        const addPatrolToList = (patrol, action) => {
            let newElement = document.createElement("input");
            newElement.classList.add("patrulje");
            newElement.type = "button";
            newElement.id = "p" + patrol.id.toString();
            newElement.value = `#${patrol.number} - ${patrol.name}`;
            newElement.addEventListener("click", () => this.clickedPatrol(newElement, action));
            if (action === 0)
                this.listPatrolsTowardsLocation.appendChild(newElement);
            else
                this.listPatrolsOnLocation.appendChild(newElement);
        };
        patrolsOnLocation.forEach(patrol => addPatrolToList(patrol, 1));
        patrolsTowardsLocation.forEach(patrol => addPatrolToList(patrol, 0));
        if (patrolsOnLocation.length === 0) {
            const noPatrolText = document.createElement("p");
            noPatrolText.textContent = "Ingen patruljer";
            this.listPatrolsOnLocation.appendChild(noPatrolText);
        }
        if (patrolsTowardsLocation.length === 0) {
            const noPatrolText = document.createElement("p");
            noPatrolText.textContent = "Ingen patruljer";
            this.listPatrolsTowardsLocation.appendChild(noPatrolText);
        }
    };
    setNextLocationSelector = (routesTo) => {
        const currentValue = this.nextLocationSelector.value;
        this.nextLocationSelector.innerHTML = "";
        routesTo.forEach(location => {
            const option = document.createElement("option");
            option.value = location.id.toString();
            option.text = location.name;
            this.nextLocationSelector.add(option);
        });
        if (routesTo.find(loc => loc.id.toString() === currentValue)) {
            this.nextLocationSelector.value = currentValue;
        }
        else if (routesTo.length > 0) {
            this.nextLocationSelector.value = routesTo[0].id.toString();
        }
    };
    addRecentActionsTable = (latestUpdates, currentLocationId) => {
        const tbody = this.recentActionsTable.querySelector("tbody");
        if (!tbody)
            return;
        tbody.innerHTML = "";
        latestUpdates.forEach(update => {
            const patrol = update.patrol;
            const row = document.createElement("tr");
            const timeCell = document.createElement("td");
            const updateTime = new Date(update.time);
            timeCell.textContent = updateTime.toLocaleTimeString();
            row.appendChild(timeCell);
            const patrolCell = document.createElement("td");
            patrolCell.textContent = `#${patrol.number} ${patrol.name}`;
            row.appendChild(patrolCell);
            const actionCell = document.createElement("td");
            const isCheckIn = update.targetLocationId === currentLocationId;
            actionCell.textContent = isCheckIn ? "Check ind" : `Check ud imod ${update.targetLocationName}`;
            row.appendChild(actionCell);
            tbody.appendChild(row);
        });
    };
    showDialog = (message, option1, option2) => {
        if (this.errorDialogOpen)
            return;
        this.errorDialogOpen = true;
        const overlay = document.createElement("div");
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;
        const dialog = document.createElement("div");
        dialog.style.cssText = `
            background-color: white;
            border-radius: 8px;
            padding: 24px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            max-width: 500px;
            width: 90%;
            text-align: center;
        `;
        const messageElement = document.createElement("p");
        messageElement.textContent = message;
        messageElement.style.cssText = `
            margin: 0 0 24px 0;
            font-size: 16px;
            color: #333;
            line-height: 1.5;
        `;
        dialog.appendChild(messageElement);
        const buttonContainer = document.createElement("div");
        buttonContainer.style.cssText = `
            display: flex;
            gap: 12px;
            justify-content: center;
        `;
        const opt1Button = document.createElement("button");
        opt1Button.textContent = option1[0];
        opt1Button.style.cssText = `
            padding: 10px 20px;
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            outline: 3px solid transparent;
            transition: outline 0.15s, background-color 0.15s;
        `;
        opt1Button.addEventListener("click", () => {
            this.closeErrorDialog(overlay);
            option1[1]();
        });
        opt1Button.addEventListener("mouseover", () => {
            opt1Button.style.backgroundColor = "#45a049";
        });
        opt1Button.addEventListener("mouseout", () => {
            opt1Button.style.backgroundColor = "#4CAF50";
        });
        opt1Button.addEventListener("focus", () => {
            opt1Button.style.outline = "3px solid #2e7d32";
        });
        opt1Button.addEventListener("blur", () => {
            opt1Button.style.outline = "3px solid transparent";
        });
        const opt2Button = document.createElement("button");
        opt2Button.textContent = option2[0];
        opt2Button.style.cssText = `
            padding: 10px 20px;
            background-color: #f44336;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            outline: 3px solid transparent;
            transition: outline 0.15s, background-color 0.15s;
        `;
        opt2Button.addEventListener("click", () => {
            this.closeErrorDialog(overlay);
            option2[1]();
        });
        opt2Button.addEventListener("mouseover", () => {
            opt2Button.style.backgroundColor = "#da190b";
        });
        opt2Button.addEventListener("mouseout", () => {
            opt2Button.style.backgroundColor = "#f44336";
        });
        opt2Button.addEventListener("focus", () => {
            opt2Button.style.outline = "3px solid #b71c1c";
        });
        opt2Button.addEventListener("blur", () => {
            opt2Button.style.outline = "3px solid transparent";
        });
        buttonContainer.appendChild(opt1Button);
        buttonContainer.appendChild(opt2Button);
        dialog.appendChild(buttonContainer);
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        opt1Button.focus();
    };
    closeErrorDialog = (overlay) => {
        overlay.remove();
        this.errorDialogOpen = false;
    };
    logout = () => {
        (0, cookie_js_1.deleteCookie)("identifier");
        (0, cookie_js_1.deleteCookie)("master");
        window.location.href = "/";
    };
}
class autoEmptyingFILO {
    maxSize;
    timeToLive;
    arr = [];
    isEmptyCallback;
    constructor(maxSize, timeToLive, autoCleanInterval = 1000, isEmptyCallback) {
        this.maxSize = maxSize;
        this.timeToLive = timeToLive;
        window.setInterval(this.clean, autoCleanInterval);
        this.isEmptyCallback = isEmptyCallback;
    }
    add = (item) => {
        this.clean();
        this.arr.push({ v: item, timestamp: Date.now() });
    };
    getTop = () => {
        this.clean();
        if (this.arr.length == 0)
            return null;
        return this.arr[this.arr.length - 1];
    };
    pop = () => {
        this.clean();
        return this.arr.pop() || null;
    };
    clean = () => {
        const now = Date.now();
        const overLimit = this.arr.length - this.maxSize;
        if (overLimit > 0) {
            this.arr.splice(0, overLimit);
        }
        const oldestValidTimestamp = now - this.timeToLive;
        let numOfInvalidItems = this.arr.findIndex(item => item.timestamp >= oldestValidTimestamp);
        numOfInvalidItems = numOfInvalidItems === -1 ? this.arr.length : numOfInvalidItems;
        this.arr.splice(0, numOfInvalidItems);
        if (this.arr.length == 0 && this.isEmptyCallback != null) {
            this.isEmptyCallback();
        }
    };
}
//# sourceMappingURL=mandskab.js.map