import { get } from "http";

const leadingZero = (num: number) => num < 10 ? '0' + num : num;

export const getTime = (date: Date) => {
    return leadingZero(date.getHours()) + ":" + leadingZero(date.getMinutes()) + ":" + leadingZero(date.getSeconds());
}

export const getDateTimeString = (timestamp: string) => {
        if (!timestamp) return "-";

        const date = new Date(timestamp);
        if (Number.isNaN(date.getTime())) return "Error";

        //Check if date is today
        const now = new Date();
        const isToday = date.getDate() === now.getDate() &&
            date.getMonth() === now.getMonth() &&
            date.getFullYear() === now.getFullYear();
        if (isToday) {
            // Show only time
            return getTime(date);
        } else {
            // Day-Month HH:mm
            const day = leadingZero(date.getDate());
            const month = leadingZero(date.getMonth() + 1);
            const hours = leadingZero(date.getHours());
            const minutes = leadingZero(date.getMinutes());
            return `${day}/${month} ${hours}:${minutes}`;
        }
}


export const formatTimestamps = (root: ParentNode) => {
    root.querySelectorAll<HTMLTimeElement>('time.ts').forEach((el) => {
        if(!el)
            return;
        const iso = el.getAttribute('datetime');
        el.textContent = getDateTimeString(iso);
    });
};

document.addEventListener('DOMContentLoaded', () => {
    formatTimestamps(document);
});

document.body.addEventListener('htmx:afterSwap', (evt) => {
    const target = evt.target as ParentNode | null;
    if (target) {
        formatTimestamps(target);
    }
});