interface HtmxConfirmEvent extends CustomEvent {
    detail: {
        elt: HTMLElement;
        issueRequest: (skipConfirmation: boolean) => void;
        path: string;
        question: string;
        target: HTMLElement;
        triggerEvent: Event | null;
        verb: ("get" | "post" | "put" | "delete" | "patch");

    };
}

let errorDialogOpen = false;
export const isErrorDialogOpen = (): boolean => errorDialogOpen;

export const showDialog = (message: string, option1?: [string, () => void], option2?: [string, () => void]): void => {
    if (errorDialogOpen) return;
    errorDialogOpen = true;

    if (!option1 && !option2) {
        throw new Error("At least one option must be provided to showDialog");
    }

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

    // Create option1 button
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

    // Create option2 button
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

    // Escape handler (only if a negative option exists)
    const handleKeydown = (e: KeyboardEvent) => {
        if (e.key === "Escape" && option2) {
            e.preventDefault();
            closeErrorDialog(overlay, handleKeydown);
            option2[1]();
        }
    };
    document.addEventListener("keydown", handleKeydown);

    // Focus the first button for accessibility and trigger focus styling

    if (option1 != undefined) {
        opt1Button.focus();
    } else {
        opt2Button.focus();
    }
}

export const confirmDialog = (message: string): Promise<boolean> =>
    new Promise<boolean>((resolve) => {
        showDialog(
            message,
            ["Ja", () => resolve(true)],
            ["Nej", () => resolve(false)]
        );
    });

const closeErrorDialog = (overlay: HTMLElement, keyHandler?: (e: KeyboardEvent) => void): void => {
    overlay.remove();
    if (keyHandler) {
        document.removeEventListener("keydown", keyHandler);
    }
    errorDialogOpen = false;
}

// window.confirm = () => true;

// HTMX confirm handler
document.body.addEventListener("htmx:confirm", (evt: HtmxConfirmEvent) => {
    // Other hx-events also trigger this listener, so we need to check for hx-confirm attribute
    const sourceEl = evt.detail.elt;
    if (!sourceEl || !sourceEl.hasAttribute("hx-confirm")) return;
    
    console.log("Event is cancelable:", evt.cancelable); 
    evt.preventDefault(); // stop the built-in confirm
    evt.stopPropagation(); // Add this
    evt.stopImmediatePropagation(); // And this

    const question = evt.detail.question;
    confirmDialog(question).then((ok) => {
        //@ts-ignore
        if (ok) evt.detail.issueRequest(true); // proceed with the request
    });
}, { capture: true });

document.addEventListener("confirm", (evt: Event) => {
    console.log("Custom confirm event triggered:", evt);
});

(window as any).showDialog = showDialog;
//Other places in the codebase rely on this name. Dont change.
(window as any).isErrorDialogOpen = isErrorDialogOpen;
(window as any).confirmDialog = confirmDialog;