import { loadSection } from "./router.js";

document.addEventListener("DOMContentLoaded", () => {
    const buttons = document.querySelectorAll(".tab-button");

    buttons.forEach((button) =>
        button.addEventListener("click", () => {
            const section = button.dataset.section;
            loadSection(section);
        })
    );

    // Load the default section
    loadSection("frame");
});
