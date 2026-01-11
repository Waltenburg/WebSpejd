/** TODO
 * - Currently, if no next locations are available, the user cannot check patrols in.
 */

import type { FullPatrolUpdateInfo, PatrolInfoToMandskab } from "@shared/responseTypes";
import { sendRequest } from "./sendHTTPRequest.js";
// import { PatrolUpdateWithNoId } from "../database/types";
import { Endpoints } from "@shared/endpoints";
import type { PatrolUpdateFromMandskab, MandskabData } from "@shared/responseTypes";
import type { Location, PatrolUpdate } from "@shared/types";
import { deleteCookie } from "./cookie.js";
import { showDialog, isErrorDialogOpen} from "./dialog.js";

const enum Action {
    checkinToLocation,
    checkoutFromLocation
}

const secondsBetweenDataReload = 5;

window.onload = () => {
    new Mandskab();
}

class Mandskab {
    listPatrolsOnLocation: HTMLElement;
    listPatrolsTowardsLocation: HTMLElement;
    nextLocationSelector: HTMLSelectElement;
    nextLocationsAtLastLoad: number[] = [];
    undoButton: HTMLInputElement;
    recentActionsTable: HTMLTableElement;
    locationNameHeader: HTMLElement;

    patrolsOnLocation: PatrolInfoToMandskab[] = [];
    patrolsTowardsLocation: PatrolInfoToMandskab[] = [];
    currentLocationId = Number.NaN;
    recentActions: autoEmptyingFILO<number>;
    reloadDataInterval: number;
    errorDialogOpen = false;

    firstLoad = true;

    constructor() {
        this.listPatrolsOnLocation = document.getElementById("listPåPost") as HTMLElement;
        this.listPatrolsTowardsLocation = document.getElementById("listPåVej") as HTMLElement;
        this.nextLocationSelector = document.getElementById("nextLocationSelector") as HTMLSelectElement;
        this.undoButton = document.getElementById("undoButton") as HTMLInputElement;
        this.recentActionsTable = document.getElementById("recentActionsTable") as HTMLTableElement;
        this.locationNameHeader = document.getElementById("locationNameHeader") as HTMLElement;

        this.recentActions = new autoEmptyingFILO<number>(10, 20 * 1000, 1000, () => {
            this.undoButton.disabled = true;
        });
        this.reloadDataInterval = window.setInterval(this.reloadData, secondsBetweenDataReload * 1000);
        this.reloadData();

        // Set up undo button
        this.undoButton.addEventListener("click", () => this.undoLastAction());
    }

    private reloadData = (): void => {
        const success = (status: number, headers: Headers) => {
            const data = JSON.parse(headers.get("data") as string) as MandskabData;
            this.patrolsOnLocation = data.patrolsOnLocation;
            this.patrolsTowardsLocation = data.patrolsTowardsLocation;
            this.currentLocationId = data.location.id;

            if(this.firstLoad){
                this.firstLoad = false;
                this.nextLocationsAtLastLoad = data.routesTo.map(location => location.id);
            }

            this.addPatrolsToLists(this.patrolsTowardsLocation, this.patrolsOnLocation);
            this.setNextLocationSelector(data.routesTo);
            this.addRecentActionsTable(data.latestUpdates, this.currentLocationId);
            this.locationNameHeader.innerHTML = data.location.name;
        }

        const fail = (err: number) => {
            window.clearInterval(this.reloadDataInterval);
            showDialog(
                "Der skete en fejl ved hentning af patruljer. Hvis fejlen fortsætter, kontroller internetforbindelsen eller log ind igen.",
                ["Prøv igen", () => this.reloadData()],
                ["Log ud", () => this.logout()]
            );
        }

        const headers: Headers | null = null;

        sendRequest(Endpoints.GetMandskabData, headers, success, fail);
    }

    public clickedPatrol = (val: HTMLInputElement, action: Action): void => {
        const patrolID = parseInt(val.id.substring(1));
        const patrol = this.getPatrolById(patrolID);
        if (!patrol) {
            alert("Kunne ikke finde patrulje med ID " + patrolID);
            return;
        }
        const patrolName = patrol.name;
        const patrolNumber = patrol.number;
        const selectedNextLocation = this.nextLocationSelector.value;
        const targetLocationId = action === Action.checkinToLocation ? this.currentLocationId : parseInt(selectedNextLocation);

        const onConfirm = (): void => {
            const patrolUpdate: PatrolUpdateFromMandskab = {
                patrolId: patrolID,
                targetLocationId: targetLocationId
            }
            const header = new Headers({ update: JSON.stringify(patrolUpdate) });
            const succesReciever = (status: number, headers: Headers) => {
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
            const onFail = (err: number) => {
                showDialog(
                    "Der skete en fejl ved afsendelse af opdatering. Du kan prøve igen eller genindlæse siden.",
                    ["Prøv igen", () => onConfirm()],
                    ["Genindlæs side", () => this.reloadData()]
                );
            }
            sendRequest(Endpoints.MandskabSendPatrolUpdate, header, succesReciever, onFail);
        }

        if(this.nextLocationSelector.selectedIndex === -1 && action === Action.checkoutFromLocation){
            alert("Der er ingen tilgængelige næste poster at checke ud imod. Kontakt en administrator hvis dette virker forkert.");
            return;
        }

        const nextLocationName = this.nextLocationSelector.options[this.nextLocationSelector.selectedIndex]?.text;
        const message = `Vil du checke #${patrolNumber} ${patrolName} ${action === Action.checkinToLocation ? ("ind på denne post") : ("ud imod " + nextLocationName)}?`;
        showDialog(message,
            [`Ja, check patrulje ${action === Action.checkinToLocation ? "ind" : "ud"}`, onConfirm],
            ["Nej, annuller", () => { }]);
    }

    public undoLastAction = (): void => {
        const lastActionId = this.recentActions.getTop()?.v;
        if (lastActionId == null)
            return;

        const onConfirm = (): void => {
            sendRequest(`${Endpoints.MandskabDeletePatrolUpdate}?patrolUpdateId=${lastActionId}`, null, (status, headers) => {
                this.recentActions.pop();
                this.reloadData();
            }, err => {
                showDialog(
                    "Der skete en fejl ved fortrydelse af den seneste handling. Du kan prøve igen eller genindlæse siden.",
                    ["Prøv igen", () => onConfirm()],
                    ["Genindlæs side", () => this.reloadData()]
                );
            });
        }

        showDialog("Er du sikker på, at du vil fortryde den seneste handling?",
            ["Ja, fortryd", onConfirm],
            ["Nej, annuller", () => { }]
        )
    }

    private getPatrolById = (patrolId: number): PatrolInfoToMandskab | undefined => {
        const onLocation = this.patrolsOnLocation.find(p => p.id === patrolId);
        const towardsLocation = this.patrolsTowardsLocation.find(p => p.id === patrolId);

        return onLocation ?? towardsLocation;
    }

    private addPatrolsToLists = (patrolsTowardsLocation: PatrolInfoToMandskab[], patrolsOnLocation: PatrolInfoToMandskab[]): void => {
        this.listPatrolsOnLocation.innerHTML = "";
        this.listPatrolsTowardsLocation.innerHTML = "";

        const addPatrolToList = (patrol: PatrolInfoToMandskab, action: Action) => {
            let newElement = document.createElement("input") as HTMLInputElement;
            newElement.classList.add("patrulje")
            newElement.type = "button"
            newElement.id = "p" + patrol.id.toString()
            newElement.value = `#${patrol.number} - ${patrol.name}`;

            // newElement.setAttribute("onclick", `Client.Mandskab2.clickedPatrol(this, ${action})`);
            newElement.addEventListener("click", () => this.clickedPatrol(newElement, action));

            if (action === Action.checkinToLocation)
                this.listPatrolsTowardsLocation.appendChild(newElement);
            else
                this.listPatrolsOnLocation.appendChild(newElement);

        }

        patrolsOnLocation.forEach(patrol => addPatrolToList(patrol, Action.checkoutFromLocation));
        patrolsTowardsLocation.forEach(patrol => addPatrolToList(patrol, Action.checkinToLocation));

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
    }

    private setNextLocationSelector = (routesTo: Location[]): void => {
        const currentValue = this.nextLocationSelector.value;

        let nextLocationsAtThisLoad = routesTo.map(location => location.id);

        // TODO do this with a queing system to queue multiple warnings if needed
        const warnUser = (): void => {
            showDialog(
                "Der er sket en ændring i de tilgængelige næste poster. Sikr dig at du har valgt den rigtige post før du checker ud.",
                ["OK", () => { }],
                null
            );
        }

        if(this.nextLocationsAtLastLoad.length !== nextLocationsAtThisLoad.length ||
            !this.nextLocationsAtLastLoad.every((value, index) => value === nextLocationsAtThisLoad[index])){
            if (!isErrorDialogOpen()){
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
        } else if (routesTo.length > 0) {
            this.nextLocationSelector.value = routesTo[0].id.toString();
        }
    }

    private addRecentActionsTable = (latestUpdates: FullPatrolUpdateInfo[], currentLocationId: number): void => {
        const tbody = this.recentActionsTable.querySelector("tbody");
        if (!tbody) return;

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
    }

    private logout = (): void => {
        // Redirect to logout endpoint or home page
        deleteCookie("identifier");
        deleteCookie("master");
        window.location.href = "/";
    }
}
interface valueTimestampPair<T> {
    v: T;
    timestamp: number;
}
class autoEmptyingFILO<T> {
    private maxSize: number;
    private timeToLive: number; //In milliseconds
    private arr: valueTimestampPair<T>[] = [];
    // private autoCleanIntervalId: number;
    private isEmptyCallback?: () => void;

    constructor(maxSize: number, timeToLive: number, autoCleanInterval = 1000, isEmptyCallback?: () => void) {
        this.maxSize = maxSize;
        this.timeToLive = timeToLive;
        window.setInterval(this.clean, autoCleanInterval);
        this.isEmptyCallback = isEmptyCallback;
    }

    public add = (item: T): void => {
        this.clean();
        this.arr.push({ v: item, timestamp: Date.now() });
    }

    public getTop = (): valueTimestampPair<T> | null => {
        this.clean();
        if (this.arr.length == 0)
            return null;
        return this.arr[this.arr.length - 1];
    }

    public pop = (): valueTimestampPair<T> | null => {
        this.clean();
        return this.arr.pop() || null;
    }

    private clean = (): void => {
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
    }

}