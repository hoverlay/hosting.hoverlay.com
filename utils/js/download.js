export function setupDownload() {
    const canvas = document.getElementById("preview-canvas");
    const downloadBtn = document.getElementById("download-btn");

    downloadBtn.addEventListener("click", () => {
        const link = document.createElement("a");
        link.download = "output.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
    });
}
