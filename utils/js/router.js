import { initFrame } from "./frame.js";
import { initPolaroid} from "./polaroid.js";
export async function loadSection(section) {
    const appContent = document.getElementById("app-content");

    try {
        const response = await fetch(`templates/${section}.html`);
        if (!response.ok) throw new Error("Failed to load section");
        const html = await response.text();
        console.log("Loaded section:", html);
        appContent.innerHTML = html;

        // Initialize section-specific JS logic
        if (section === "frame") initFrame();
        else if (section === "polaroid") initPolaroid();
        else if (section === "buttons") initButtons();
    } catch (error) {
        console.error("Error loading section:", error);
        appContent.innerHTML = `<p>Could not load section: ${section}</p>`;
    }
}
