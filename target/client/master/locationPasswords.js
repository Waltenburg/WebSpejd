var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class LocationPasswordManager {
    constructor() {
        this.overlay = null;
        this.modal = null;
        this.listContainer = null;
        this.addArea = null;
        this.statusElement = null;
        this.headerElement = null;
        this.currentLocation = null;
        this.passwords = [];
        document.addEventListener("click", (event) => {
            var _a, _b;
            const target = event.target;
            if (!target)
                return;
            const button = target.closest(".location-passwords-button");
            if (!button)
                return;
            const locationId = Number((_a = button.dataset.locationId) !== null && _a !== void 0 ? _a : "NaN");
            const locationName = (_b = button.dataset.locationName) !== null && _b !== void 0 ? _b : "Ukendt lokation";
            if (Number.isNaN(locationId))
                return;
            event.preventDefault();
            this.open(locationId, locationName);
        });
    }
    ensureModal() {
        if (this.overlay)
            return;
        this.overlay = document.createElement("div");
        this.overlay.className = "location-passwords-overlay";
        this.overlay.style.cssText = `
            position: fixed;
            inset: 0;
            background-color: rgba(0, 0, 0, 0.55);
            display: none;
            align-items: center;
            justify-content: center;
            padding: 24px;
            z-index: 1000;
        `;
        this.overlay.addEventListener("click", (event) => {
            if (event.target === this.overlay) {
                this.close();
            }
        });
        this.modal = document.createElement("div");
        this.modal.className = "location-passwords-modal";
        this.modal.style.cssText = `
            width: min(480px, 100%);
            background: #ffffff;
            border-radius: 12px;
            padding: 20px;
            display: flex;
            flex-direction: column;
            gap: 16px;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
        `;
        const header = document.createElement("div");
        header.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
        `;
        this.headerElement = document.createElement("h2");
        this.headerElement.textContent = "Kodeord";
        this.headerElement.style.margin = "0";
        this.headerElement.style.fontSize = "1.4rem";
        const closeButton = document.createElement("button");
        closeButton.type = "button";
        closeButton.textContent = "Luk";
        closeButton.style.cssText = `
            border: none;
            background: #1f5ac9;
            color: #fff;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
        `;
        closeButton.addEventListener("click", () => this.close());
        header.append(this.headerElement, closeButton);
        this.statusElement = document.createElement("p");
        this.statusElement.style.margin = "0";
        this.statusElement.style.fontSize = "0.95rem";
        this.statusElement.style.color = "#374151";
        this.listContainer = document.createElement("div");
        this.listContainer.className = "location-passwords-list";
        this.listContainer.style.display = "flex";
        this.listContainer.style.flexDirection = "column";
        this.listContainer.style.gap = "8px";
        this.addArea = document.createElement("div");
        this.addArea.className = "location-passwords-add";
        this.addArea.style.display = "flex";
        this.addArea.style.flexWrap = "wrap";
        this.addArea.style.gap = "8px";
        this.modal.append(header, this.statusElement, this.listContainer, this.addArea);
        this.overlay.appendChild(this.modal);
        document.body.appendChild(this.overlay);
        document.addEventListener("keydown", (event) => {
            var _a;
            if (event.key === "Escape" && ((_a = this.overlay) === null || _a === void 0 ? void 0 : _a.style.display) === "flex") {
                this.close();
            }
        });
    }
    open(locationId, locationName) {
        this.ensureModal();
        if (!this.overlay || !this.listContainer || !this.statusElement || !this.headerElement || !this.addArea) {
            return;
        }
        this.currentLocation = { id: locationId, name: locationName };
        this.headerElement.textContent = `Kodeord - ${locationName}`;
        this.overlay.style.display = "flex";
        this.statusElement.textContent = "Henter kodeord...";
        this.listContainer.innerHTML = "";
        this.passwords = [];
        this.renderAddDefault();
        this.fetchPasswords(locationId);
    }
    fetchPasswords(locationId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch(`${"/master/getLocationPasswords"}?locationId=${encodeURIComponent(String(locationId))}`);
                if (!response.ok) {
                    throw new Error("Kunne ikke hente kodeord");
                }
                const payload = yield response.json();
                if (!this.currentLocation || this.currentLocation.id !== payload.locationId) {
                    return;
                }
                this.passwords = payload.passwords;
                this.renderPasswords();
            }
            catch (error) {
                console.error(error);
                if (this.statusElement) {
                    this.statusElement.textContent = "Der opstod en fejl under indlæsning af kodeord.";
                    this.statusElement.style.color = "#b91c1c";
                }
            }
        });
    }
    renderPasswords() {
        if (!this.listContainer || !this.statusElement)
            return;
        this.listContainer.innerHTML = "";
        if (this.passwords.length === 0) {
            this.statusElement.textContent = "Der er ingen kodeord for denne lokation endnu.";
            this.statusElement.style.color = "#374151";
            return;
        }
        this.statusElement.textContent = "Aktive kodeord:";
        this.statusElement.style.color = "#374151";
        this.passwords.forEach((entry) => {
            var _a;
            const row = document.createElement("div");
            row.style.cssText = `
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                padding: 8px 12px;
                border: 1px solid #d1d5db;
                border-radius: 6px;
            `;
            const value = document.createElement("span");
            value.textContent = entry.password;
            value.style.fontFamily = "'Fira Code', 'Courier New', monospace";
            value.style.fontSize = "1rem";
            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.textContent = "Slet";
            deleteButton.style.cssText = `
                border: none;
                background: #b91c1c;
                color: #fff;
                padding: 6px 10px;
                border-radius: 4px;
                cursor: pointer;
            `;
            deleteButton.addEventListener("click", () => this.deletePassword(entry.id));
            row.append(value, deleteButton);
            (_a = this.listContainer) === null || _a === void 0 ? void 0 : _a.appendChild(row);
        });
    }
    renderAddDefault() {
        if (!this.addArea)
            return;
        this.addArea.innerHTML = "";
        const addButton = document.createElement("button");
        addButton.type = "button";
        addButton.textContent = "Tilføj kodeord";
        addButton.style.cssText = `
            border: none;
            background: #1f5ac9;
            color: #fff;
            padding: 8px 14px;
            border-radius: 4px;
            cursor: pointer;
        `;
        addButton.addEventListener("click", () => this.renderAddForm());
        this.addArea.appendChild(addButton);
    }
    renderAddForm() {
        if (!this.addArea)
            return;
        this.addArea.innerHTML = "";
        const input = document.createElement("input");
        input.type = "text";
        input.placeholder = "Nyt kodeord";
        input.maxLength = 128;
        input.style.flex = "1";
        input.style.minWidth = "180px";
        input.style.padding = "8px";
        input.style.border = "1px solid #d1d5db";
        input.style.borderRadius = "4px";
        const confirmButton = document.createElement("button");
        confirmButton.type = "button";
        confirmButton.textContent = "Tilføj";
        confirmButton.style.cssText = `
            border: none;
            background: #16a34a;
            color: #fff;
            padding: 8px 12px;
            border-radius: 4px;
            cursor: pointer;
        `;
        const cancelButton = document.createElement("button");
        cancelButton.type = "button";
        cancelButton.textContent = "Annuller";
        cancelButton.style.cssText = `
            border: 1px solid #d1d5db;
            background: transparent;
            color: #374151;
            padding: 8px 12px;
            border-radius: 4px;
            cursor: pointer;
        `;
        const submit = () => {
            const value = input.value.trim();
            if (!value) {
                input.focus();
                return;
            }
            this.addPassword(value);
        };
        confirmButton.addEventListener("click", submit);
        input.addEventListener("keypress", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                submit();
            }
        });
        cancelButton.addEventListener("click", () => this.renderAddDefault());
        this.addArea.append(input, confirmButton, cancelButton);
        input.focus();
    }
    addPassword(password) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.currentLocation)
                return;
            try {
                const body = new URLSearchParams({
                    locationId: String(this.currentLocation.id),
                    password
                });
                const response = yield fetch("/master/addLocationPassword", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded"
                    },
                    body: body.toString()
                });
                if (!response.ok) {
                    throw new Error("Kunne ikke tilføje kodeord");
                }
                const entry = yield response.json();
                this.passwords.push(entry);
                this.renderPasswords();
                this.renderAddDefault();
            }
            catch (error) {
                console.error(error);
                alert("Kunne ikke tilføje kodeord. Prøv igen.");
            }
        });
    }
    deletePassword(entryId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.currentLocation)
                return;
            try {
                const body = new URLSearchParams({ userId: String(entryId) });
                const response = yield fetch("/master/deleteLocationPassword", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded"
                    },
                    body: body.toString()
                });
                if (!response.ok) {
                    throw new Error("Kunne ikke slette kodeord");
                }
                this.passwords = this.passwords.filter((entry) => entry.id !== entryId);
                this.renderPasswords();
            }
            catch (error) {
                console.error(error);
                alert("Kunne ikke slette kodeord. Prøv igen.");
            }
        });
    }
    close() {
        if (!this.overlay)
            return;
        this.overlay.style.display = "none";
        this.currentLocation = null;
    }
}
new LocationPasswordManager();
export {};
//# sourceMappingURL=locationPasswords.js.map