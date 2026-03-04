export const selectAll = (id: string) => {
    const checkboxes: NodeListOf<HTMLInputElement> = document.querySelectorAll(`#${id}-dropdown input[type="checkbox"]`);
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    checkboxes.forEach(cb => cb.checked = !allChecked);

    console.log(placeHolderMapping);
    updateDisplay(id);
};

const placeHolderMapping: Map<string, string> = new Map();

export const updateDisplay = (id: string, placeholderText?: string | null) => {
    console.log(id, placeholderText);
    if(placeholderText){
        console.log(placeHolderMapping);
        placeHolderMapping.set(id, placeholderText);
    }
    else
        placeholderText = placeHolderMapping.get(id) || "Vælg muligheder";

    const checkboxes: NodeListOf<HTMLInputElement> = document.querySelectorAll(`#${id}-dropdown input[type="checkbox"]`);
    const selectedCheckboxes = Array.from(checkboxes).filter(cb => cb.checked);
    const display = document.getElementById(`${id}-display`);
    const hiddenInput = document.getElementById(`${id}-hidden`) as HTMLInputElement;

    const selectedText = selectedCheckboxes.map(cb => cb.nextElementSibling?.textContent || "").join(", ");
    const selectedValues = selectedCheckboxes.map(cb => cb.value);

    display.children[0].textContent = '▼ ' + (selectedCheckboxes.length > 0 ? selectedText : placeholderText);
    display.style.color = selectedCheckboxes.length > 0 ? '#2c3e50' : '#95a5a6';
    hiddenInput.value = selectedValues.join(",");
}

export const toggleDropdown = (id: string) => {
    const dropdown = document.getElementById(`${id}-dropdown`);
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
};

const exported = {
    'toggleDropdown': toggleDropdown,
    'updateDisplay': updateDisplay,
    'selectAll': selectAll
};

(window as any).multiSelectDropdown = exported;