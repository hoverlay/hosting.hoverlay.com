export function initFrame() {
    const container = document.getElementById("frame-container");
//     container.innerHTML = `
//     <input type="file" id="frame-file" />
//     <button id="apply-frame">Apply Frame</button>
//     <canvas id="frame-canvas"></canvas>
//   `;

    const fileInput = document.getElementById("frame-file");
    const canvas = document.getElementById("frame-canvas");
    const ctx = canvas.getContext("2d");

    document.getElementById("apply-frame").addEventListener("click", () => {
        const file = fileInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                const img = new Image();
                img.onload = () => {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                    // Add frame logic here
                };
                img.src = reader.result;
            };
            reader.readAsDataURL(file);
        }
    });
}
