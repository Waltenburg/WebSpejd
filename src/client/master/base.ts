import { getTime } from '../time.js';

let lastUpdateTime = new Date();
const STALE_THRESHOLD_MS = 8000;

document.addEventListener("DOMContentLoaded", () => {
    const lastUpdateElement = document.createElement('div');
    lastUpdateElement.className = 'last-update';

    const content = document.getElementById('content');
    if (content) {
        content.prepend(lastUpdateElement);
    } else {
        document.body.prepend(lastUpdateElement);
    }

    const setHeaderColor = (color: string) => {
        const header = document.getElementById("header");
        if (header) header.style.backgroundColor = color;
    };

    const renderStatus = (isStale: boolean, prefix: string) => {
        const now = new Date();
        lastUpdateElement.textContent = `${prefix} ${getTime(lastUpdateTime)}`;
        lastUpdateElement.classList.toggle('stale', isStale);
        setHeaderColor(isStale ? "#b91c1c" : "#1f5ac9");
    };

    const heartbeatSuccess = () => {
        lastUpdateTime = new Date();
        renderStatus(false, 'Seneste opdatering:');
    };
    const heartbeatError = () => {
        renderStatus(true, 'Fejl! Seneste opdatering:');
    };

    const updateFunction = () => {
        fetch('/master/heartbeat')
            .then(response => {
                if (response.ok)
                    heartbeatSuccess();
                else
                    heartbeatError();
            }).catch(() => {
                heartbeatError();
            });
    };

    // Heartbeat check + stale watchdog
    setInterval(() => {
        updateFunction();
        const age = Date.now() - lastUpdateTime.getTime();
        if (age > STALE_THRESHOLD_MS) {
            renderStatus(true, 'Ingen opdateringer! Seneste:');
        }
    }, 3100);
    updateFunction(); // Run immediately on page load
});