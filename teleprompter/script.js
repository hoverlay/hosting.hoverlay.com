// script.js

// Elements
const playPauseButton = document.getElementById('playPauseButton');
const playIcon = document.getElementById('playIcon');
const pauseIcon = document.getElementById('pauseIcon');
const scriptContent = document.getElementById('scriptContent');
const loadScriptButton = document.getElementById('loadScriptButton');
const saveScriptButton = document.getElementById('saveScriptButton');
const fileInput = document.getElementById('fileInput');
const textSizeInput = document.getElementById('textSize');
const speedControlInput = document.getElementById('speedControl');
const bgColorPicker = document.getElementById('bgColorPicker');
const textColorPicker = document.getElementById('textColorPicker');
const flipHorizontalButton = document.getElementById('flipHorizontalButton');
const flipVerticalButton = document.getElementById('flipVerticalButton');
const controlPanel = document.getElementById('controlPanel');

// Variables
let isPlaying = false;
let scrollInterval;
let scrollSpeed = 50 - parseInt(speedControlInput.value);

// Event Listeners
playPauseButton.addEventListener('click', togglePlayPause);
loadScriptButton.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', loadScript);
saveScriptButton.addEventListener('click', saveSession);
textSizeInput.addEventListener('input', () => {
    document.documentElement.style.setProperty('--text-size', `${textSizeInput.value}px`);
});
bgColorPicker.addEventListener('input', () => {
    document.documentElement.style.setProperty('--bg-color', bgColorPicker.value);
});
textColorPicker.addEventListener('input', () => {
    document.documentElement.style.setProperty('--text-color', textColorPicker.value);
});
flipHorizontalButton.addEventListener('click', () => {
    scriptContent.classList.toggle('flip-horizontal');
});
flipVerticalButton.addEventListener('click', () => {
    scriptContent.classList.toggle('flip-vertical');
});
speedControlInput.addEventListener('input', () => {
    scrollSpeed = 50 - parseInt(speedControlInput.value);
    if (isPlaying) {
        // If already playing, adjust the scroll speed
        clearInterval(scrollInterval);
        startScroll();
    }
});

// Functions
function togglePlayPause() {
    if (isPlaying) {
        pauseScroll();
    } else {
        startScroll();
    }
}

function startScroll() {
    playIcon.style.display = 'none';
    pauseIcon.style.display = 'block';
    scriptContent.contentEditable = 'false';
    isPlaying = true;
    controlPanel.classList.add('playing');
    scrollInterval = setInterval(() => {
        scriptContent.scrollBy(0, 1);
    }, scrollSpeed);
}

function pauseScroll() {
    playIcon.style.display = 'block';
    pauseIcon.style.display = 'none';
    scriptContent.contentEditable = 'true';
    isPlaying = false;
    controlPanel.classList.remove('playing');
    clearInterval(scrollInterval);
}

function loadScript(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const sessionData = JSON.parse(e.target.result);

                // Apply the script and settings
                scriptContent.innerText = sessionData.script || '';
                textSizeInput.value = sessionData.fontSize || 58;
                speedControlInput.value = sessionData.speed || 10;
                bgColorPicker.value = sessionData.bgColor || "#000000";
                textColorPicker.value = sessionData.textColor || "#FFFFFF";

                // Update CSS styles accordingly
                document.documentElement.style.setProperty('--text-size', `${textSizeInput.value}px`);
                document.documentElement.style.setProperty('--bg-color', bgColorPicker.value);
                document.documentElement.style.setProperty('--text-color', textColorPicker.value);
            } catch (error) {
                console.error("Error parsing the loaded file: ", error);
            }
        };
        reader.readAsText(file);
    }
}

function saveSession() {
    const sessionData = {
        script: scriptContent.innerText,
        fontSize: textSizeInput.value,
        speed: speedControlInput.value,
        bgColor: bgColorPicker.value,
        textColor: textColorPicker.value
    };

    // Convert session data to JSON string
    const jsonString = JSON.stringify(sessionData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });

    // Create a link to download the file
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'teleprompter_session.json';
    a.click();
}
