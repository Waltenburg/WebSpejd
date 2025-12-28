import { PatrolInfoToMandskab } from "./responseTypes";
import { sendRequest } from "./sendHTTPRequest.js";
// import { PatrolUpdateWithNoId } from "../database/types";
import { Endpoints } from "../endpoints";
import { Action, PatrolUpdateFromMandskab, MandskabData } from "./responseTypes";
import { Location } from "../database/types";

let mandskab: Mandskab;

window.onload = () => {
    mandskab = new Mandskab();
}

class Mandskab {
    listPatrolsOnLocation: HTMLElement;
    listPatrolsTowardsLocation: HTMLElement;
    nextLocationSelector: HTMLSelectElement;
    undoButton: HTMLInputElement;
    recentActionsTable: HTMLTableElement;
    locationNameHeader: HTMLElement;

    patrolsOnLocation: PatrolInfoToMandskab[] = [];
    patrolsTowardsLocation: PatrolInfoToMandskab[] = [];
    currentLocationId = Number.NaN;
    recentActions = new autoEmptyingFILO<number>(20, 5 * 60 * 1000, 500, () => this.undoButton.disabled = true); //Max 20 actions, max 5 minutes old, clean every 0.5 seconds, disable undo button when empty

    constructor() {
        this.listPatrolsOnLocation = document.getElementById("listPåPost") as HTMLElement;
        this.listPatrolsTowardsLocation = document.getElementById("listPåVej") as HTMLElement;
        this.nextLocationSelector = document.getElementById("nextLocationSelector") as HTMLSelectElement;
        this.undoButton = document.getElementById("undoButton") as HTMLInputElement;
        this.recentActionsTable = document.getElementById("recentActionsTable") as HTMLTableElement;
        this.locationNameHeader = document.getElementById("locationNameHeader") as HTMLElement;

        this.reloadData();
    }

    private reloadData = (): void => {
        const succesReciever = (status: number, headers: Headers) => {
            const data = JSON.parse(headers.get("data") as string) as MandskabData;
            this.patrolsOnLocation = data.patrolsOnLocation;
            this.patrolsTowardsLocation = data.patrolsTowardsLocation;
            this.currentLocationId = data.location.id;

            this.addPatrolsToLists(this.patrolsTowardsLocation, this.patrolsOnLocation);
            this.setNextLocationSelector(data.routesTo);
            this.locationNameHeader.innerHTML = data.location.name;
        }

        const onFail = (err: number) => {
            alert("Der skete en fejl ved hentning af patrulje data. Hvis fejlen fortsætter, kontroller internetforbindelsen eller log ind igen.");
        }

        sendRequest(Endpoints.GetData, null, succesReciever, onFail);
    }
    
    private confirmWithUser = (patrolNumber: string, patrolName: string, actionType: Action, targetLocation: string) : boolean => {
        let actionString = actionType === Action.checkinToLocation ? "checke ind på" : "checke ud fra"
        return confirm(`Vil du ${actionString} ${targetLocation} for patrulje #${patrolNumber} (${patrolName})?`)
    }
    
    public clickedPatrol = (val: HTMLInputElement, action: Action): void => {
        const patrolID = parseInt(val.id.substring(1));
        const patrol = this.getPatrolById(patrolID);
        if(!patrol){
            alert("Kunne ikke finde patrulje med ID " + patrolID);
            return;
        }
        const patrolName = patrol.name;
        const patrolNumber = patrol.number;
        const selectedNextLocation = this.nextLocationSelector.value;
        const targetLocationId = action === Action.checkinToLocation ? this.currentLocationId : parseInt(selectedNextLocation);
        
        if(this.confirmWithUser(patrolNumber, patrolName, action, selectedNextLocation)){
            const patrolUpdate: PatrolUpdateFromMandskab = {
                patrolId: patrolID,
                targetLocationId: targetLocationId
            }
            const header = new Headers({update: JSON.stringify(patrolUpdate)});
            const succesReciever = (status: number, headers: Headers) => {
                const checkinID = headers.get("checkinID");
                if(checkinID == null){
                    alert("Mulig fejl ved opdaternig. Kontroller at opdateringen er registreret korrekt.");
                    this.reloadData();
                    return;
                }
                this.recentActions.add(Number.parseInt(checkinID));
                this.undoButton.disabled = false;
                this.reloadData();
            };
            const onFail = (err: number) => {
                alert("Der skete en fejl ved afsendelse af opdatering.")
                this.reloadData();
            }
            sendRequest(Endpoints.SendUpdate, header, succesReciever, onFail);
        }
    }

    public undoLastAction = (): void => {
        const lastActionId = this.recentActions.get();
        if(lastActionId == null)
            return;

        sendRequest(`${Endpoints.DeleteCheckin}?id=${lastActionId}`, null, (status, headers) => {
            this.reloadData();
        }, err => {
            alert("Der skete en fejl ved fortrydelse af opdatering.")
            this.reloadData();
        })
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

            if(action === Action.checkinToLocation)
                this.listPatrolsTowardsLocation.appendChild(newElement);
            else
                this.listPatrolsOnLocation.appendChild(newElement);

        }

        patrolsOnLocation.forEach(patrol => addPatrolToList(patrol, Action.checkoutFromLocation));
        patrolsTowardsLocation.forEach(patrol => addPatrolToList(patrol, Action.checkinToLocation));
    }
    
    private setNextLocationSelector = (routesTo: Location[]): void => {
        const currentValue = this.nextLocationSelector.value;

        this.nextLocationSelector.innerHTML = "";
        routesTo.forEach(location => {
            const option = document.createElement("option");
            option.value = location.id.toString();
            option.text = location.name;
            this.nextLocationSelector.add(option);
        });

        if(routesTo.find(loc => loc.id.toString() === currentValue)) {
            this.nextLocationSelector.value = currentValue;
        }else if(routesTo.length > 0) {
            this.nextLocationSelector.value = routesTo[0].id.toString();
        }
    }
}

class autoEmptyingFILO<T> {
    private maxSize: number;
    private timeToLive: number; //In milliseconds
    private arr: { v: T; timestamp: number }[] = [];
    private autoCleanIntervalId: number;
    private isEmptyCallback?: () => void;

    constructor(maxSize: number, timeToLive: number, autoCleanInterval = 1000, isEmptyCallback?: () => void) {
        this.maxSize = maxSize;
        this.timeToLive = timeToLive;
        this.autoCleanIntervalId = window.setInterval(this.clean, autoCleanInterval);
        this.isEmptyCallback = isEmptyCallback;
    }

    public add = (item: T): void => {
        this.clean();
        this.arr.push({ v: item, timestamp: Date.now() });
    }

    public get = (): T | null => {
        this.clean();
        if(this.arr.length == 0)
            return null;
        return this.arr.pop() as T;
    }

    private clean = (): void => {
        const now = Date.now();

        const overLimit = this.arr.length - this.maxSize;
        if(overLimit > 0) {
            this.arr.splice(0, overLimit);
        }

        const oldestValidTimestamp = now - this.timeToLive;
        let oldestValidIndex = 0;
        for (let i = 0; i < this.arr.length; i++) {
            const item = this.arr[i];
            if(item.timestamp >= oldestValidTimestamp) {
                oldestValidIndex = i;
                break;
            }
        }
        if(oldestValidIndex > 0) {
            this.arr.splice(0, oldestValidIndex);
        }
        if(this.arr.length == 0 && this.isEmptyCallback != null) {
            this.isEmptyCallback();
        }
    }
    
}