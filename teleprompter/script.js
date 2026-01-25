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
const scriptNameInput = document.getElementById('scriptNameInput');
const saveToCloudButton = document.getElementById('saveToCloudButton');
const loadFromCloudButton = document.getElementById('loadFromCloudButton');
const cloudScriptsList = document.getElementById('cloudScriptsList');
const cameraButton = document.getElementById('cameraButton');
const cameraVideo = document.getElementById('cameraVideo');
const recordButton = document.getElementById('recordButton');
const recordingIndicator = document.getElementById('recordingIndicator');
const recordingTime = document.getElementById('recordingTime');

// Cloud Storage Configuration
// IMPORTANT: Replace this with your Google Apps Script web app URL
const CLOUD_API_URL = 'https://script.google.com/macros/s/AKfycbwBbsuTez6AXyqiv4acyMBIum1JveQ6XG-PDyttEioCML-gsZ-t5cZAhax3jnCFc21x/exec';

// Variables
let isPlaying = false;
let scrollInterval;
let countdownInterval;
let scrollSpeed = 50 - parseInt(speedControlInput.value);
let cameraStream = null;
let currentFacingMode = 'user'; // 'user' for front camera, 'environment' for back camera
let mediaRecorder = null;
let recordedChunks = [];
let recordingStartTime = null;
let recordingTimer = null;

// Event Listeners
playPauseButton.addEventListener('click', togglePlayPause);
loadScriptButton.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', loadScript);
saveScriptButton.addEventListener('click', saveSession);
saveToCloudButton.addEventListener('click', saveToCloud);
loadFromCloudButton.addEventListener('click', loadFromCloud);
cameraButton.addEventListener('click', toggleCamera);
cameraButton.addEventListener('dblclick', switchCamera);
recordButton.addEventListener('click', toggleRecording);
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

// Cloud Storage Functions
async function saveToCloud() {
    const scriptName = scriptNameInput.value.trim();
    if (!scriptName) {
        alert('Please enter a script name');
        return;
    }

    if (CLOUD_API_URL === '') {
        alert('Please configure your Google Apps Script URL first. See setup instructions.');
        return;
    }

    const sessionData = {
        script: scriptContent.innerText,
        fontSize: textSizeInput.value,
        speed: speedControlInput.value,
        bgColor: bgColorPicker.value,
        textColor: textColorPicker.value
    };

    try {
        saveToCloudButton.disabled = true;
        saveToCloudButton.textContent = 'Saving...';

        // Use GET request to avoid CORS issues with Google Apps Script
        const params = new URLSearchParams({
            action: 'save',
            name: scriptName,
            data: JSON.stringify(sessionData)
        });

        const response = await fetch(`${CLOUD_API_URL}?${params.toString()}`, {
            method: 'GET',
            redirect: 'follow'
        });

        const result = await response.json();

        if (result.success) {
            alert('Script saved to cloud successfully!');
            await refreshCloudScriptsList();
        } else {
            alert('Error saving script: ' + (result.error || 'Unknown error'));
        }
    } catch (error) {
        alert('Error saving to cloud: ' + error.message);
    } finally {
        saveToCloudButton.disabled = false;
        saveToCloudButton.textContent = 'Save to Cloud';
    }
}

async function loadFromCloud() {
    const scriptName = cloudScriptsList.value;
    if (!scriptName) {
        alert('Please select a script to load');
        return;
    }

    if (CLOUD_API_URL === '') {
        alert('Please configure your Google Apps Script URL first. See setup instructions.');
        return;
    }

    try {
        loadFromCloudButton.disabled = true;
        loadFromCloudButton.textContent = 'Loading...';

        const response = await fetch(`${CLOUD_API_URL}?action=load&name=${encodeURIComponent(scriptName)}`);
        const result = await response.json();

        if (result.success && result.sessionData) {
            const sessionData = result.sessionData;

            // Apply the script and settings
            scriptContent.innerText = sessionData.script || '';
            textSizeInput.value = sessionData.fontSize || 58;
            speedControlInput.value = sessionData.speed || 10;
            bgColorPicker.value = sessionData.bgColor || "#000000";
            textColorPicker.value = sessionData.textColor || "#FFFFFF";

            // Update CSS styles
            document.documentElement.style.setProperty('--text-size', `${textSizeInput.value}px`);
            document.documentElement.style.setProperty('--bg-color', bgColorPicker.value);
            document.documentElement.style.setProperty('--text-color', textColorPicker.value);

            // Update scroll speed variable
            scrollSpeed = 50 - parseInt(speedControlInput.value);

            // Update script name input
            scriptNameInput.value = scriptName;

            alert('Script loaded successfully!');
        } else {
            alert('Error loading script: ' + (result.error || 'Unknown error'));
        }
    } catch (error) {
        alert('Error loading from cloud: ' + error.message);
    } finally {
        loadFromCloudButton.disabled = false;
        loadFromCloudButton.textContent = 'Load from Cloud';
    }
}

async function refreshCloudScriptsList() {
    if (CLOUD_API_URL === '') {
        return;
    }

    try {
        const response = await fetch(`${CLOUD_API_URL}?action=list`);
        const result = await response.json();

        if (result.scripts) {
            cloudScriptsList.innerHTML = '<option value="">-- Select a script --</option>';
            result.scripts.forEach(script => {
                const option = document.createElement('option');
                option.value = script.name;
                option.textContent = `${script.name}${script.lastModified ? ' (' + script.lastModified + ')' : ''}`;
                cloudScriptsList.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error refreshing scripts list:', error);
    }
}

// Refresh cloud scripts list when settings menu is opened
settingsButton.addEventListener('click', () => {
    if (settingsMenu.style.display === 'none') {
        refreshCloudScriptsList();
    }
});

// Load cloud scripts list on page load
window.addEventListener('load', () => {
    refreshCloudScriptsList();
});

// Camera Functions
async function toggleCamera() {
    if (cameraStream) {
        // Stop camera
        stopCamera();
    } else {
        // Start camera
        await startCamera();
    }
}

async function startCamera() {
    try {
        const constraints = {
            video: {
                facingMode: currentFacingMode,
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            },
            audio: true  // Enable audio for recording
        };

        cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
        cameraVideo.srcObject = cameraStream;
        cameraVideo.classList.add('active');
        cameraButton.classList.add('active');
        document.body.classList.add('camera-active');

        // Show record button when camera is active
        recordButton.style.display = 'block';
    } catch (error) {
        console.error('Error accessing camera:', error);
        alert('Unable to access camera. Please ensure camera permissions are granted.');
    }
}

function stopCamera() {
    // Stop recording if active
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        stopRecording();
    }

    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
        cameraVideo.srcObject = null;
        cameraVideo.classList.remove('active');
        cameraButton.classList.remove('active');
        document.body.classList.remove('camera-active');
        recordButton.style.display = 'none';
    }
}

async function switchCamera() {
    if (!cameraStream) {
        return;
    }

    // Toggle between front and back camera
    currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';

    // Stop current stream
    stopCamera();

    // Start with new facing mode
    await startCamera();
}

// Recording Functions
function toggleRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        stopRecording();
    } else {
        startRecording();
    }
}

function startRecording() {
    if (!cameraStream) {
        alert('Please enable camera first');
        return;
    }

    try {
        recordedChunks = [];

        // Try MP4 first for better compatibility, then fall back to WebM
        let mimeType;
        let fileExtension;

        if (MediaRecorder.isTypeSupported('video/mp4')) {
            mimeType = 'video/mp4';
            fileExtension = 'mp4';
        } else if (MediaRecorder.isTypeSupported('video/webm;codecs=h264')) {
            mimeType = 'video/webm;codecs=h264';
            fileExtension = 'webm';
        } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
            mimeType = 'video/webm;codecs=vp9,opus';
            fileExtension = 'webm';
        } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
            mimeType = 'video/webm;codecs=vp8,opus';
            fileExtension = 'webm';
        } else {
            mimeType = 'video/webm';
            fileExtension = 'webm';
        }

        // Store for later use in download
        mediaRecorder = new MediaRecorder(cameraStream, { mimeType });
        mediaRecorder.recordedMimeType = mimeType;
        mediaRecorder.recordedExtension = fileExtension;

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = () => {
            downloadRecording();
        };

        mediaRecorder.start();
        recordButton.classList.add('recording');
        recordingIndicator.classList.add('active');

        // Start timer
        recordingStartTime = Date.now();
        recordingTimer = setInterval(updateRecordingTime, 1000);

    } catch (error) {
        console.error('Error starting recording:', error);
        alert('Unable to start recording: ' + error.message);
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        recordButton.classList.remove('recording');
        recordingIndicator.classList.remove('active');

        // Stop timer
        if (recordingTimer) {
            clearInterval(recordingTimer);
            recordingTimer = null;
        }
        recordingTime.textContent = '0:00';
    }
}

function updateRecordingTime() {
    const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    recordingTime.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

async function downloadRecording() {
    if (recordedChunks.length === 0) {
        return;
    }

    const mimeType = mediaRecorder.recordedMimeType || 'video/webm';
    const extension = mediaRecorder.recordedExtension || 'webm';

    const blob = new Blob(recordedChunks, {
        type: mimeType
    });

    const fileName = `teleprompter-recording-${Date.now()}.${extension}`;

    // Try to use Web Share API first (better for mobile)
    if (navigator.canShare && navigator.canShare({ files: [new File([blob], fileName)] })) {
        try {
            const file = new File([blob], fileName, { type: mimeType });
            await navigator.share({
                files: [file],
                title: 'Teleprompter Recording',
                text: 'Video recorded with teleprompter'
            });
            recordedChunks = [];
            return;
        } catch (error) {
            // User cancelled share or share failed, fall back to download
            console.log('Share cancelled or failed, falling back to download');
        }
    }

    // Fallback to download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);

    recordedChunks = [];
}
