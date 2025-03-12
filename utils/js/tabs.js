export function setupTabs() {
    const tabs = document.querySelectorAll(".tab-button");
    tabs.forEach((tab) => {
        tab.addEventListener("click", () => {
            // Switch to the selected tab
            console.log(`Switched to ${tab.dataset.tab} tab`);
        });
    });
}
