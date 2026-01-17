const leadingZero = (num) => num < 10 ? '0' + num : num;
export const getTime = (date) => {
    return leadingZero(date.getHours()) + ":" + leadingZero(date.getMinutes()) + ":" + leadingZero(date.getSeconds());
};
export const getDateTimeString = (timestamp) => {
    if (!timestamp)
        return "-";
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime()))
        return "Error";
    const now = new Date();
    const isToday = date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();
    if (isToday) {
        return getTime(date);
    }
    else {
        const day = leadingZero(date.getDate());
        const month = leadingZero(date.getMonth() + 1);
        const hours = leadingZero(date.getHours());
        const minutes = leadingZero(date.getMinutes());
        return `${day}/${month} ${hours}:${minutes}`;
    }
};
export const formatTimestamps = (root) => {
    root.querySelectorAll('time.ts').forEach((el) => {
        if (!el)
            return;
        const iso = el.getAttribute('datetime');
        el.textContent = getDateTimeString(iso);
    });
};
document.addEventListener('DOMContentLoaded', () => {
    formatTimestamps(document);
});
document.body.addEventListener('htmx:afterSwap', (evt) => {
    const target = evt.target;
    if (target) {
        formatTimestamps(target);
    }
});
//# sourceMappingURL=time.js.map