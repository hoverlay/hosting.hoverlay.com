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
const startDelaySelect = document.getElementById('startDelay');
const countdownOverlay = document.getElementById('countdownOverlay');
const countdownNumber = document.getElementById('countdownNumber');
const settingsButton = document.getElementById('settingsButton');
const settingsMenu = document.getElementById('settingsMenu');

// Variables
let isPlaying = false;
let scrollInterval;
let countdownInterval;
let scrollSpeed = 50 - parseInt(speedControlInput.value);

// Event Listeners
playPauseButton.addEventListener('click', togglePlayPause);
loadScriptButton.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', loadScript);
saveScriptButton.addEventListener('click', saveSession);
scriptContent.addEventListener('paste', (e) => {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text');
    document.execCommand('insertText', false, text);
});
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

settingsButton.addEventListener('click', (e) => {
    e.stopPropagation();
    settingsMenu.style.display = settingsMenu.style.display === 'none' ? 'block' : 'none';
});

document.addEventListener('click', (e) => {
    if (settingsMenu.style.display === 'block' && !settingsMenu.contains(e.target) && e.target !== settingsButton) {
        settingsMenu.style.display = 'none';
    }
});

// Functions
function togglePlayPause() {
    // If counting down or playing, stop everything
    if (isPlaying || countdownOverlay.style.display === 'flex') {
        pauseScroll();
    } else {
        // Starting from pause - apply delay if set
        const delay = parseInt(startDelaySelect.value);
        if (delay > 0) {
            startCountdown(delay);
        } else {
            startScroll();
        }
    }
}

function startCountdown(seconds) {
    let remaining = seconds;
    
    // Show overlay and initial number
    countdownOverlay.style.display = 'flex';
    countdownNumber.textContent = remaining;
    
    // Update UI to show we're starting
    playIcon.style.display = 'none';
    pauseIcon.style.display = 'block';
    scriptContent.contentEditable = 'false';
    
    countdownInterval = setInterval(() => {
        remaining--;
        if (remaining > 0) {
            countdownNumber.textContent = remaining;
        } else {
            clearInterval(countdownInterval);
            countdownOverlay.style.display = 'none';
            startScroll();
        }
    }, 1000);
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
    // Clear countdown if it's running
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
        countdownOverlay.style.display = 'none';
    }
    
    // Clear scroll if it's running
    if (scrollInterval) {
        clearInterval(scrollInterval);
    }
    
    // Reset UI
    playIcon.style.display = 'block';
    pauseIcon.style.display = 'none';
    scriptContent.contentEditable = 'true';
    isPlaying = false;
    controlPanel.classList.remove('playing');
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
