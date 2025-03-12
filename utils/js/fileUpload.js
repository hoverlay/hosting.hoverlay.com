export function setupFileUpload() {
    const uploadArea = document.getElementById("upload-area");
    const fileInput = document.getElementById("file-input");

    uploadArea.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", (e) => handleFile(e.target.files[0]));

    function handleFile(file) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            console.log("File loaded", reader.result);
            // Process file here (e.g., send to canvas)
        };
        reader.readAsDataURL(file);
    }
}
