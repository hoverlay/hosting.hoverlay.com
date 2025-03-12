export function setupImageProcessor() {
    const canvas = document.getElementById("preview-canvas");
    const ctx = canvas.getContext("2d");

    function processImage(imageSrc) {
        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
        };
        img.src = imageSrc;
    }

    window.processImage = processImage; // Temporary for testing
}
