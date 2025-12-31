import type { PatrolInfoToMandskab } from "@shared/responseTypes";
import { sendRequest } from "./sendHTTPRequest.js";
// import { PatrolUpdateWithNoId } from "../database/types";
import { Endpoints } from "@shared/endpoints";
import type { PatrolUpdateFromMandskab, MandskabData } from "@shared/responseTypes";
import type { Location, PatrolUpdate } from "@shared/types";
import { deleteCookie } from "./cookie.js";

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
    undoButton: HTMLInputElement;
    recentActionsTable: HTMLTableElement;
    locationNameHeader: HTMLElement;

    patrolsOnLocation: PatrolInfoToMandskab[] = [];
    patrolsTowardsLocation: PatrolInfoToMandskab[] = [];
    currentLocationId = Number.NaN;
    recentActions = new autoEmptyingFILO<number>(20, 5 * 60 * 1000, 500, () => this.undoButton.disabled = true); //Max 20 actions, max 5 minutes old, clean every 0.5 seconds, disable undo button when empty

    reloadDataInterval: number;
    errorDialogOpen = false;

    constructor() {
        this.listPatrolsOnLocation = document.getElementById("listPåPost") as HTMLElement;
        this.listPatrolsTowardsLocation = document.getElementById("listPåVej") as HTMLElement;
        this.nextLocationSelector = document.getElementById("nextLocationSelector") as HTMLSelectElement;
        this.undoButton = document.getElementById("undoButton") as HTMLInputElement;
        this.recentActionsTable = document.getElementById("recentActionsTable") as HTMLTableElement;
        this.locationNameHeader = document.getElementById("locationNameHeader") as HTMLElement;

        this.reloadDataInterval = window.setInterval(this.reloadData, secondsBetweenDataReload * 1000);
        this.reloadData();
    }

    private reloadData = (): void => {
        const success = (status: number, headers: Headers) => {
            const data = JSON.parse(headers.get("data") as string) as MandskabData;
            this.patrolsOnLocation = data.patrolsOnLocation;
            this.patrolsTowardsLocation = data.patrolsTowardsLocation;
            this.currentLocationId = data.location.id;

            this.addPatrolsToLists(this.patrolsTowardsLocation, this.patrolsOnLocation);
            this.setNextLocationSelector(data.routesTo);
            this.setRecentActionsTable(data.latestUpdates);
            this.locationNameHeader.innerHTML = data.location.name;
        }

        const fail = (err: number) => {
            window.clearInterval(this.reloadDataInterval);
            this.showDialog(
                "Der skete en fejl ved hentning af patruljer. Hvis fejlen fortsætter, kontroller internetforbindelsen eller log ind igen.",
                [ "Prøv igen", () => this.reloadData() ],
                [ "Log ud", () => this.logout() ]
            );
        }

        const headers: Headers | null = null;

        sendRequest(Endpoints.GetData, headers, success, fail);
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

        const onConfirm = (): void => {
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
                this.showDialog(
                    "Der skete en fejl ved afsendelse af opdatering. Du kan prøve igen eller genindlæse siden.",
                    [ "Prøv igen", () => onConfirm() ],
                    [ "Genindlæs side", () => this.reloadData() ]
                );
            }
            sendRequest(Endpoints.SendUpdate, header, succesReciever, onFail);
        }

        const nextLocationName = this.nextLocationSelector.options[this.nextLocationSelector.selectedIndex].text;
        const message = `Vil du checke #${patrolNumber} ${patrolName} ${action === Action.checkinToLocation ? ("ind på denne post") : ("ud imod " + nextLocationName)}?`;
        this.showDialog(message,
            [`Ja, check patrulje ${action === Action.checkinToLocation ? "ind" : "ud"}` , onConfirm],
            ["Nej, annuller", () => {}]);
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

    private setRecentActionsTable = (latestUpdates: PatrolUpdate[]): void => {
        
    }

    private showDialog = (message: string, option1: [string, () => void], option2: [string, () => void]): void => {
        if(this.errorDialogOpen) return;
        this.errorDialogOpen = true;

        // Create overlay
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

        // Create dialog box
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

        // Create message
        const messageElement = document.createElement("p");
        messageElement.textContent = message;
        messageElement.style.cssText = `
            margin: 0 0 24px 0;
            font-size: 16px;
            color: #333;
            line-height: 1.5;
        `;
        dialog.appendChild(messageElement);

        // Create button container
        const buttonContainer = document.createElement("div");
        buttonContainer.style.cssText = `
            display: flex;
            gap: 12px;
            justify-content: center;
        `;

        // Create retry button
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

        // Create logout button
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

        buttonContainer.appendChild(opt1Button);
        buttonContainer.appendChild(opt2Button);
        dialog.appendChild(buttonContainer);
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
    }

    private closeErrorDialog = (overlay: HTMLElement): void => {
        overlay.remove();
        this.errorDialogOpen = false;
    }

    private logout = (): void => {
        // Redirect to logout endpoint or home page
        deleteCookie("identifier");
        deleteCookie("master");
        window.location.href = "/";
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