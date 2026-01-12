let errorDialogOpen = false;
export const isErrorDialogOpen = () => errorDialogOpen;
export const showDialog = (message, option1, option2) => {
    if (errorDialogOpen)
        return;
    errorDialogOpen = true;
    if (!option1 && !option2) {
        throw new Error("At least one option must be provided to showDialog");
    }
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
    if (option1 != undefined) {
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
            closeErrorDialog(overlay);
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
        buttonContainer.appendChild(opt1Button);
    }
    const opt2Button = document.createElement("button");
    if (option2 != undefined) {
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
            closeErrorDialog(overlay);
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
        buttonContainer.appendChild(opt2Button);
    }
    dialog.appendChild(buttonContainer);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    const handleKeydown = (e) => {
        if (e.key === "Escape" && option2) {
            e.preventDefault();
            closeErrorDialog(overlay, handleKeydown);
            option2[1]();
        }
    };
    document.addEventListener("keydown", handleKeydown);
    if (option1 != undefined) {
        opt1Button.focus();
    }
    else {
        opt2Button.focus();
    }
};
export const confirmDialog = (message) => new Promise((resolve) => {
    showDialog(message, ["Ja", () => resolve(true)], ["Nej", () => resolve(false)]);
});
const closeErrorDialog = (overlay, keyHandler) => {
    overlay.remove();
    if (keyHandler) {
        document.removeEventListener("keydown", keyHandler);
    }
    errorDialogOpen = false;
};
document.body.addEventListener("htmx:confirm", (evt) => {
    const sourceEl = evt.detail.elt;
    if (!sourceEl || !sourceEl.hasAttribute("hx-confirm"))
        return;
    console.log("Event is cancelable:", evt.cancelable);
    evt.preventDefault();
    evt.stopPropagation();
    evt.stopImmediatePropagation();
    const question = evt.detail.question;
    confirmDialog(question).then((ok) => {
        if (ok)
            evt.detail.issueRequest(true);
    });
}, { capture: true });
document.addEventListener("confirm", (evt) => {
    console.log("Custom confirm event triggered:", evt);
});
window.showDialog = showDialog;
window.isErrorDialogOpen = isErrorDialogOpen;
window.confirmDialog = confirmDialog;
//# sourceMappingURL=dialog.js.map