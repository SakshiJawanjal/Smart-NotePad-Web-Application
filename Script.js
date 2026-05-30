// Grab DOM Elements
const textarea = document.getElementById('notepad-text-area');
const video = document.getElementById('webcam-video');
const savedPhotoView = document.getElementById('saved-photo-view');
const audioPlayback = document.getElementById('audio-playback');

const camStart = document.getElementById('btn-cam-start');
const camSnap = document.getElementById('btn-cam-snap');
const camStop = document.getElementById('btn-cam-stop');
const recBtn = document.getElementById('btn-audio-record');
const saveBtn = document.getElementById('btn-save-app');
const deleteBtn = document.getElementById('btn-delete-all');
const statMsg = document.getElementById('status-message');

const btnBold = document.getElementById('btn-bold');
const btnItalic = document.getElementById('btn-italic');
const btnUnderline = document.getElementById('btn-underline');
const colorPicker = document.getElementById('colorPicker');
const sizePicker = document.getElementById('sizePicker');

let videoStream = null;
let audioRecorder = null;
let audioChunks = [];
let isAudioRecording = false;

let currentStyles = { bold: false, italic: false, underline: false };
let photoBase64 = "";
let audioBase64 = "";

// Event Listeners (No onclick attributes in HTML means zero "not defined" errors)
window.addEventListener('DOMContentLoaded', loadSavedData);
saveBtn.addEventListener('click', saveToLocalStorage);
deleteBtn.addEventListener('click', clearAllData);
camStart.addEventListener('click', startCamera);
camStop.addEventListener('click', stopCamera);
camSnap.addEventListener('click', takeSnapshot);
recBtn.addEventListener('click', toggleAudio);

btnBold.addEventListener('click', () => { currentStyles.bold = !currentStyles.bold; applyTypography(); });
btnItalic.addEventListener('click', () => { currentStyles.italic = !currentStyles.italic; applyTypography(); });
btnUnderline.addEventListener('click', () => { currentStyles.underline = !currentStyles.underline; applyTypography(); });
colorPicker.addEventListener('input', (e) => { textarea.style.color = e.target.value; });
sizePicker.addEventListener('change', (e) => { textarea.style.fontSize = e.target.value; });

function applyTypography() {
    textarea.style.fontWeight = currentStyles.bold ? "bold" : "normal";
    textarea.style.fontStyle = currentStyles.italic ? "italic" : "normal";
    textarea.style.textDecoration = currentStyles.underline ? "underline" : "none";
}

function loadSavedData() {
    if (localStorage.getItem('app_txt')) textarea.value = localStorage.getItem('app_txt');
    if (localStorage.getItem('app_col')) {
        textarea.style.color = localStorage.getItem('app_col');
        colorPicker.value = localStorage.getItem('app_col');
    }
    if (localStorage.getItem('app_sz')) {
        textarea.style.fontSize = localStorage.getItem('app_sz');
        sizePicker.value = localStorage.getItem('app_sz');
    }
    if (localStorage.getItem('app_sty')) {
        currentStyles = JSON.parse(localStorage.getItem('app_sty'));
        applyTypography();
    }
    if (localStorage.getItem('app_pic')) {
        photoBase64 = localStorage.getItem('app_pic');
        savedPhotoView.src = photoBase64;
        savedPhotoView.style.display = "block";
    }
    if (localStorage.getItem('app_aud')) {
        audioBase64 = localStorage.getItem('app_aud');
        audioPlayback.src = audioBase64;
        audioPlayback.style.display = "block";
    }
}

function saveToLocalStorage() {
    localStorage.setItem('app_txt', textarea.value);
    localStorage.setItem('app_col', colorPicker.value);
    localStorage.setItem('app_sz', sizePicker.value);
    localStorage.setItem('app_sty', JSON.stringify(currentStyles));
    localStorage.setItem('app_pic', photoBase64);
    localStorage.setItem('app_aud', audioBase64);
    
    statMsg.textContent = "Saved to browser memory! ✓";
    setTimeout(() => { statMsg.textContent = ""; }, 3000);
}

function clearAllData() {
    if (confirm("Clear notepad completely?")) {
        textarea.value = "";
        textarea.style.color = "#000000";
        textarea.style.fontSize = "16px";
        colorPicker.value = "#000000";
        sizePicker.value = "16px";
        currentStyles = { bold: false, italic: false, underline: false };
        applyTypography();
        
        photoBase64 = "";
        audioBase64 = "";
        savedPhotoView.style.display = "none";
        savedPhotoView.src = "";
        audioPlayback.style.display = "none";
        audioPlayback.src = "";
        
        stopCamera();
        localStorage.clear();
    }
}

async function startCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Security Block: Your browser restricts camera usage unless hosted on a server or using Live Server.");
        return;
    }
    try {
        videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = videoStream;
        video.style.display = "block";
        camSnap.style.display = "block";
        camStop.style.display = "block";
        camStart.style.display = "none";
    } catch (err) {
        alert("Camera blocked. Please update site settings permissions.");
    }
}

function stopCamera() {
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        videoStream = null;
    }
    video.srcObject = null;
    video.style.display = "none";
    camSnap.style.display = "none";
    camStop.style.display = "none";
    camStart.style.display = "block";
}

function takeSnapshot() {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    photoBase64 = canvas.toDataURL('image/png');
    savedPhotoView.src = photoBase64;
    savedPhotoView.style.display = "block";
}

async function toggleAudio() {
    if (!isAudioRecording) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioRecorder = new MediaRecorder(stream);
            audioChunks = [];
            audioRecorder.ondataavailable = e => audioChunks.push(e.data);
            audioRecorder.onstop = () => {
                const blob = new Blob(audioChunks, { type: 'audio/mp3' });
                const reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = () => {
                    audioBase64 = reader.result;
                    audioPlayback.src = audioBase64;
                    audioPlayback.style.display = "block";
                };
            };
            audioRecorder.start();
            isAudioRecording = true;
            recBtn.textContent = "🛑 Stop Recording";
        } catch (err) {
            alert("Microphone connection failed.");
        }
    } else {
        audioRecorder.stop();
        audioRecorder.stream.getTracks().forEach(track => track.stop());
        isAudioRecording = false;
        recBtn.textContent = "🎙️ Start Voice Recording";
    }
}
