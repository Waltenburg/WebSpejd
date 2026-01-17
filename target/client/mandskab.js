import { sendRequest } from "./sendHTTPRequest.js";
import { deleteCookie } from "./cookie.js";
import { showDialog, isErrorDialogOpen } from "./dialog.js";
import { getDateTimeString } from "./time.js";
const secondsBetweenDataReload = 5;
window.onload = () => {
    new Mandskab();
};
class Mandskab {
    constructor() {
        this.nextLocationsAtLastLoad = [];
        this.patrolsOnLocation = [];
        this.patrolsTowardsLocation = [];
        this.currentLocationId = Number.NaN;
        this.errorDialogOpen = false;
        this.firstLoad = true;
        this.reloadData = () => {
            const success = (_status, _headers, body) => {
                const data = JSON.parse(body);
                console.log(data);
                this.patrolsOnLocation = data.patrolsOnLocation;
                this.patrolsTowardsLocation = data.patrolsTowardsLocation;
                this.currentLocationId = data.location.id;
                if (this.firstLoad) {
                    this.firstLoad = false;
                    this.nextLocationsAtLastLoad = data.routesTo.map(location => location.id);
                }
                this.addPatrolsToLists(this.patrolsTowardsLocation, this.patrolsOnLocation);
                this.setNextLocationSelector(data.routesTo);
                this.addRecentActionsTable(data.latestUpdates, this.currentLocationId);
                this.locationNameHeader.innerHTML = data.location.name;
            };
            const fail = (_err, _body) => {
                window.clearInterval(this.reloadDataInterval);
                showDialog("Der skete en fejl ved hentning af patruljer. Hvis fejlen fortsætter, kontroller internetforbindelsen eller log ind igen.", ["Prøv igen", () => this.reloadData()], ["Log ud", () => this.logout()]);
            };
            const headers = null;
            sendRequest("/getData", headers, success, fail);
        };
        this.clickedPatrol = (val, action) => {
            var _a;
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
                const succesReciever = (_status, headers, _body) => {
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
                const onFail = (_err, _body) => {
                    showDialog("Der skete en fejl ved afsendelse af opdatering. Du kan prøve igen eller genindlæse siden.", ["Prøv igen", () => onConfirm()], ["Genindlæs side", () => this.reloadData()]);
                };
                sendRequest("/sendPatrolUpdateMandskab", header, succesReciever, onFail);
            };
            if (this.nextLocationSelector.selectedIndex === -1 && action === 1) {
                alert("Der er ingen tilgængelige næste poster at checke ud imod. Kontakt en administrator hvis dette virker forkert.");
                return;
            }
            const nextLocationName = (_a = this.nextLocationSelector.options[this.nextLocationSelector.selectedIndex]) === null || _a === void 0 ? void 0 : _a.text;
            const message = `Vil du checke #${patrolNumber} ${patrolName} ${action === 0 ? ("ind på denne post") : ("ud imod " + nextLocationName)}?`;
            showDialog(message, [`Ja, check patrulje ${action === 0 ? "ind" : "ud"}`, onConfirm], ["Nej, annuller", () => { }]);
        };
        this.undoLastAction = () => {
            var _a;
            const lastActionId = (_a = this.recentActions.getTop()) === null || _a === void 0 ? void 0 : _a.v;
            if (lastActionId == null)
                return;
            const onConfirm = () => {
                sendRequest(`${"/deletePatrolUpdateMandskab"}?patrolUpdateId=${lastActionId}`, null, (_status, _headers, _body) => {
                    this.recentActions.pop();
                    this.reloadData();
                }, err => {
                    showDialog("Der skete en fejl ved fortrydelse af den seneste handling. Du kan prøve igen eller genindlæse siden.", ["Prøv igen", () => onConfirm()], ["Genindlæs side", () => this.reloadData()]);
                });
            };
            showDialog("Er du sikker på, at du vil fortryde den seneste handling?", ["Ja, fortryd", onConfirm], ["Nej, annuller", () => { }]);
        };
        this.getPatrolById = (patrolId) => {
            const onLocation = this.patrolsOnLocation.find(p => p.id === patrolId);
            const towardsLocation = this.patrolsTowardsLocation.find(p => p.id === patrolId);
            return onLocation !== null && onLocation !== void 0 ? onLocation : towardsLocation;
        };
        this.addPatrolsToLists = (patrolsTowardsLocation, patrolsOnLocation) => {
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
        this.setNextLocationSelector = (routesTo) => {
            const currentValue = this.nextLocationSelector.value;
            let nextLocationsAtThisLoad = routesTo.map(location => location.id);
            const warnUser = () => {
                showDialog("Der er sket en ændring i de tilgængelige næste poster. Sikr dig at du har valgt den rigtige post før du checker ud.", ["OK", () => { }], null);
            };
            if (this.nextLocationsAtLastLoad.length !== nextLocationsAtThisLoad.length ||
                !this.nextLocationsAtLastLoad.every((value, index) => value === nextLocationsAtThisLoad[index])) {
                if (!isErrorDialogOpen()) {
                    warnUser();
                    this.nextLocationsAtLastLoad = nextLocationsAtThisLoad;
                }
            }
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
        this.addRecentActionsTable = (latestUpdates, currentLocationId) => {
            const tbody = this.recentActionsTable.querySelector("tbody");
            if (!tbody)
                return;
            tbody.innerHTML = "";
            latestUpdates.forEach(update => {
                const patrol = update.patrol;
                const row = document.createElement("tr");
                const timeCell = document.createElement("td");
                const updateTime = getDateTimeString(update.time);
                timeCell.textContent = updateTime;
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
        this.logout = () => {
            deleteCookie("identifier");
            deleteCookie("master");
            window.location.href = "/";
        };
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
}
class autoEmptyingFILO {
    constructor(maxSize, timeToLive, autoCleanInterval = 1000, isEmptyCallback) {
        this.arr = [];
        this.add = (item) => {
            this.clean();
            this.arr.push({ v: item, timestamp: Date.now() });
        };
        this.getTop = () => {
            this.clean();
            if (this.arr.length == 0)
                return null;
            return this.arr[this.arr.length - 1];
        };
        this.pop = () => {
            this.clean();
            return this.arr.pop() || null;
        };
        this.clean = () => {
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
        this.maxSize = maxSize;
        this.timeToLive = timeToLive;
        window.setInterval(this.clean, autoCleanInterval);
        this.isEmptyCallback = isEmptyCallback;
    }
}
//# sourceMappingURL=mandskab.js.map