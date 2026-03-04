export const selectAll = (id) => {
    const checkboxes = document.querySelectorAll(`#${id}-dropdown input[type="checkbox"]`);
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    checkboxes.forEach(cb => cb.checked = !allChecked);
    console.log(placeHolderMapping);
    updateDisplay(id);
};
const placeHolderMapping = new Map();
export const updateDisplay = (id, placeholderText) => {
    console.log(id, placeholderText);
    if (placeholderText) {
        console.log(placeHolderMapping);
        placeHolderMapping.set(id, placeholderText);
    }
    else
        placeholderText = placeHolderMapping.get(id) || "Vælg muligheder";
    const checkboxes = document.querySelectorAll(`#${id}-dropdown input[type="checkbox"]`);
    const selectedCheckboxes = Array.from(checkboxes).filter(cb => cb.checked);
    const display = document.getElementById(`${id}-display`);
    const hiddenInput = document.getElementById(`${id}-hidden`);
    const selectedText = selectedCheckboxes.map(cb => { var _a; return ((_a = cb.nextElementSibling) === null || _a === void 0 ? void 0 : _a.textContent) || ""; }).join(", ");
    const selectedValues = selectedCheckboxes.map(cb => cb.value);
    display.children[0].textContent = '▼ ' + (selectedCheckboxes.length > 0 ? selectedText : placeholderText);
    display.style.color = selectedCheckboxes.length > 0 ? '#2c3e50' : '#95a5a6';
    hiddenInput.value = selectedValues.join(",");
};
export const toggleDropdown = (id) => {
    const dropdown = document.getElementById(`${id}-dropdown`);
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
};
const exported = {
    'toggleDropdown': toggleDropdown,
    'updateDisplay': updateDisplay,
    'selectAll': selectAll
};
window.multiSelectDropdown = exported;
