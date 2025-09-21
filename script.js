// Global State Management
const AuraState = {
    currentMode: 'normal',
    isListening: false,
    isSpeaking: false,
    timerActive: false,
    timerInterval: null,
    timeLeft: 2400, // 40 minutes in seconds
    sessionNumber: 0,
    alarmCount: 0,
    cloneActive: false,
    recognition: null,
    synthesis: window.speechSynthesis,
    cameraStream: null
};

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 AURA Mind initializing...');
    
    initializeSpeechRecognition();
    initializeTimestamps();
    initializeEventListeners();
    
    // Add initial system message
    addSystemMessage('AURA Mind AI system initialized successfully. All sensors online and ready for interaction.');
    
    // Test backend connection
    testBackendConnection();
    
    console.log('✅ AURA Mind ready for use');
});

// Backend Connection Test
async function testBackendConnection() {
    try {
        const response = await fetch('/api/status');
        const data = await response.json();
        
        if (data.currentActiveAPI) {
            document.getElementById('apiStatus').textContent = `${data.currentActiveAPI.toUpperCase()} AI`;
            document.getElementById('systemStatus').textContent = 'All Systems Online';
            console.log('✅ Backend connected:', data);
        }
    } catch (error) {
        console.error('❌ Backend connection failed:', error);
        document.getElementById('systemStatus').textContent = 'Backend Offline';
        addSystemMessage('Warning: Backend connection failed. Some features may not work properly.');
    }
}

// Initialize Speech Recognition
function initializeSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        AuraState.recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        
        AuraState.recognition.continuous = false;
        AuraState.recognition.interimResults = false;
        AuraState.recognition.lang = 'en-US';
        
        AuraState.recognition.onstart = function() {
            console.log('🎤 Voice recognition started');
            AuraState.isListening = true;
            updateVoiceButton(true);
        };
        
        AuraState.recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            console.log('🗣️ Voice input:', transcript);
            
            addMessage('user', transcript);
            processMessage(transcript, 'voice');
        };
        
        AuraState.recognition.onend = function() {
            console.log('🎤 Voice recognition ended');
            AuraState.isListening = false;
            updateVoiceButton(false);
        };
        
        AuraState.recognition.onerror = function(event) {
            console.error('❌ Speech recognition error:', event.error);
            AuraState.isListening = false;
            updateVoiceButton(false);
            
            if (event.error === 'not-allowed') {
                addSystemMessage('Microphone access denied. Please enable microphone permissions and try again.');
            }
        };
        
        console.log('✅ Speech recognition initialized');
    } else {
        console.warn('⚠️ Speech recognition not supported');
        document.getElementById('voiceBtn').disabled = true;
    }
}

// Initialize Event Listeners
function initializeEventListeners() {
    // Enter key for message input
    document.getElementById('messageInput').addEventListener('keypress', handleKeyPress);
    
    // Mode buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            setMode(this.dataset.mode);
        });
    });
}

// Initialize Timestamps
function initializeTimestamps() {
    const now = new Date().toLocaleTimeString();
    document.getElementById('welcomeTime').textContent = now;
}

// Handle Enter Key Press
function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

// Send Message Function
async function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    addMessage('user', message);
    input.value = '';
    
    await processMessage(message, 'text');
}

// Process Message (Core Function)
async function processMessage(message, inputType = 'text') {
    showLoading(true);
    
    try {
        const endpoint = inputType === 'voice' ? '/api/voice/process' : '/api/aura/process';
        const payload = inputType === 'voice' ? 
            { command: message, audioData: null } : 
            { command: message, mode: AuraState.currentMode };
        
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        
        if (data.success) {
            const responseText = data.response.message || data.response;
            addMessage('aura', responseText);
            
            // Handle voice response
            if (data.response.voiceMessage) {
                speak(data.response.voiceMessage);
            } else {
                speak(responseText);
            }
            
            // Handle special responses
            handleSpecialResponse(data.response);
            
        } else {
            addMessage('aura', 'I apologize, but I encountered an issue processing your request. Please try again.');
        }
        
    } catch (error) {
        console.error('❌ Message processing error:', error);
        addMessage('aura', 'I\'m having trouble connecting to my AI systems. Please check your connection and try again.');
    } finally {
        showLoading(false);
    }
}

// Handle Special Responses (Timer, Clone, etc.)
function handleSpecialResponse(response) {
    if (typeof response === 'object') {
        // Timer responses
        if (response.status === 'timer_started') {
            startTimerDisplay();
            AuraState.sessionNumber = response.sessionNumber || 1;
            updateSessionDisplay();
        }
        
        if (response.status === 'active' && response.timeLeft) {
            updateTimerDisplay(response.timeLeft);
        }
        
        if (response.status === 'ai_clone_activated') {
            activateCloneDisplay();
            if (response.cloneActivities) {
                showCloneActivities(response.cloneActivities);
            }
        }
        
        if (response.status === 'safe_mode_active') {
            activateSafeModeDisplay();
        }
        
        // Mode switching
        if (response.status && response.status.includes('mode_active')) {
            const mode = response.status.split('_')[0];
            setMode(mode);
        }
    }
}

// Add Message to Chat
function addMessage(sender, text) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    
    const isUser = sender === 'user';
    const timestamp = new Date().toLocaleTimeString();
    
    messageDiv.innerHTML = `
        <div class="message-avatar ${isUser ? 'user-avatar' : 'aura-avatar'}">
            <i class="fas ${isUser ? 'fa-user' : 'fa-robot'}"></i>
        </div>
        <div class="message-content ${isUser ? 'user-message' : ''}">
            <div class="message-text">${text}</div>
            <div class="message-time">${timestamp}</div>
        </div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    console.log(`💬 ${sender}: ${text}`);
}

// Add System Message
function addSystemMessage(text) {
    addMessage('system', `🔧 ${text}`);
}

// Text-to-Speech Function
function speak(text) {
    if (!AuraState.synthesis || AuraState.isSpeaking) return;
    
    AuraState.synthesis.cancel(); // Cancel any ongoing speech
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 0.8;
    
    // Try to use a professional voice
    const voices = AuraState.synthesis.getVoices();
    const preferredVoice = voices.find(voice => 
        voice.name.includes('Google') || 
        voice.name.includes('Microsoft') ||
        (voice.lang.startsWith('en') && voice.name.includes('Female'))
    );
    
    if (preferredVoice) {
        utterance.voice = preferredVoice;
    }
    
    utterance.onstart = function() {
        AuraState.isSpeaking = true;
        console.log('🗣️ AURA speaking:', text.substring(0, 50) + '...');
    };
    
    utterance.onend = function() {
        AuraState.isSpeaking = false;
        console.log('🗣️ Speech completed');
    };
    
    utterance.onerror = function(event) {
        console.error('❌ Speech error:', event.error);
        AuraState.isSpeaking = false;
    };
    
    AuraState.synthesis.speak(utterance);
}

// Voice Control Functions
function toggleVoice() {
    if (AuraState.isListening) {
        stopVoiceRecognition();
    } else {
        startVoiceRecognition();
    }
}

function startVoiceRecognition() {
    if (!AuraState.recognition) {
        addSystemMessage('Speech recognition is not supported in this browser.');
        return;
    }
    
    if (AuraState.isSpeaking) {
        AuraState.synthesis.cancel();
    }
    
    try {
        AuraState.recognition.start();
    } catch (error) {
        console.error('❌ Failed to start voice recognition:', error);
        addSystemMessage('Failed to start voice recognition. Please try again.');
    }
}

function stopVoiceRecognition() {
    if (AuraState.recognition && AuraState.isListening) {
        AuraState.recognition.stop();
    }
}

function updateVoiceButton(isListening) {
    const voiceBtn = document.getElementById('voiceBtn');
    if (isListening) {
        voiceBtn.classList.add('active');
        voiceBtn.innerHTML = '<i class="fas fa-stop"></i> Stop';
    } else {
        voiceBtn.classList.remove('active');
        voiceBtn.innerHTML = '<i class="fas fa-microphone"></i> Voice';
    }
}

// Mode Management
function setMode(mode) {
    AuraState.currentMode = mode;
    
    // Update mode buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.mode === mode) {
            btn.classList.add('active');
        }
    });
    
    // Update mode indicator
    const modeNames = {
        normal: 'Normal Mode',
        dual: 'Dual Mode',
        multi: 'Multi Mode'
    };
    
    document.getElementById('currentMode').textContent = modeNames[mode];
    
    // Enable/disable clone based on mode
    const cloneBtn = document.getElementById('cloneBtn');
    if (mode === 'multi') {
        cloneBtn.disabled = false;
        cloneBtn.innerHTML = '<i class="fas fa-robot"></i> Activate AI Clone';
    } else {
        cloneBtn.disabled = true;
        cloneBtn.innerHTML = '<i class="fas fa-robot"></i> Requires Multi Mode';
    }
    
    console.log(`🎛️ Mode switched to: ${mode}`);
    addSystemMessage(`Switched to ${modeNames[mode]}. All corresponding systems are now active.`);
}

// Timer Functions
function startWorkSession() {
    const timerBtn = document.getElementById('timerBtn');
    
    if (AuraState.timerActive) {
        // Stop timer
        stopTimer();
        return;
    }
    
    // Send command to backend
    processMessage('start work session', 'text');
}

function startTimerDisplay() {
    AuraState.timerActive = true;
    AuraState.timeLeft = 2400; // 40 minutes
    AuraState.sessionNumber++;
    
    updateSessionDisplay();
    updateTimerButton(true);
    
    // Start countdown
    AuraState.timerInterval = setInterval(() => {
        AuraState.timeLeft--;
        updateTimerDisplay();
        updateTimerProgress();
        
        if (AuraState.timeLeft <= 0) {
            handleTimerComplete();
        }
    }, 1000);
    
    console.log('⏰ Timer started for 40 minutes');
}

function stopTimer() {
    AuraState.timerActive = false;
    
    if (AuraState.timerInterval) {
        clearInterval(AuraState.timerInterval);
        AuraState.timerInterval = null;
    }
    
    updateTimerButton(false);
    updateTimerDisplay('40:00');
    updateTimerProgress(0);
    
    console.log('⏰ Timer stopped');
}

function updateTimerDisplay(timeString = null) {
    const display = document.getElementById('timerDisplay');
    
    if (timeString) {
        display.textContent = timeString;
    } else {
        const minutes = Math.floor(AuraState.timeLeft / 60);
        const seconds = AuraState.timeLeft % 60;
        display.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
}

function updateTimerProgress(percentage = null) {
    const progressBar = document.getElementById('timerProgress');
    
    if (percentage !== null) {
        progressBar.style.width = `${percentage}%`;
    } else {
        const elapsed = 2400 - AuraState.timeLeft;
        const progress = (elapsed / 2400) * 100;
        progressBar.style.width = `${progress}%`;
    }
}

function updateSessionDisplay() {
    document.getElementById('sessionNumber').textContent = `Session ${AuraState.sessionNumber}`;
}

function updateTimerButton(isActive) {
    const timerBtn = document.getElementById('timerBtn');
    
    if (isActive) {
        timerBtn.innerHTML = '<i class="fas fa-stop"></i> Stop Session';
        timerBtn.classList.add('active');
    } else {
        timerBtn.innerHTML = '<i class="fas fa-play"></i> Start 40-Min Session';
        timerBtn.classList.remove('active');
    }
}

function handleTimerComplete() {
    stopTimer();
    AuraState.alarmCount++;
    
    document.getElementById('alarmCount').textContent = `${AuraState.alarmCount}/2`;
    
    if (AuraState.alarmCount >= 2) {
        // Activate AI Clone after 2 sessions
        activateCloneDisplay();
        addSystemMessage('Two work sessions completed! AI Clone is now taking over background tasks.');
        speak('Excellent work! You have completed 80 minutes of focused study. I am now activating your AI clone to handle background tasks while you take a well-deserved break.');
        AuraState.alarmCount = 0;
        document.getElementById('alarmCount').textContent = '0/2';
    } else {
        addSystemMessage(`Work session ${AuraState.alarmCount} completed! Take a 5-minute break before the next session.`);
        speak(`Great job! Session ${AuraState.alarmCount} is complete. Take a 5 minute break, then we will start your second focused session.`);
    }
}

// AI Clone Functions
function activateClone() {
    if (AuraState.currentMode !== 'multi') {
        addSystemMessage('AI Clone requires Multi Mode. Please switch modes first.');
        return;
    }
    
    processMessage('activate AI clone', 'text');
}

function activateCloneDisplay() {
    AuraState.cloneActive = true;
    
    const cloneDot = document.getElementById('cloneDot');
    const cloneStatus = document.getElementById('cloneStatusText');
    const cloneBtn = document.getElementById('cloneBtn');
    
    cloneDot.classList.add('active');
    cloneStatus.textContent = 'Active - Working';
    cloneBtn.innerHTML = '<i class="fas fa-robot"></i> Clone Active';
    cloneBtn.disabled = true;
    
    // Simulate clone activities
    simulateCloneActivities();
    
    console.log('🤖 AI Clone activated');
}

function simulateCloneActivities() {
    const activities = [
        'Analyzing your study materials...',
        'Creating document summaries...',
        'Organizing research notes...',
        'Preparing review questions...',
        'Scheduling optimal study times...',
        'Generating practice exercises...'
    ];
    
    let index = 0;
    const activityInterval = setInterval(() => {
        if (index < activities.length) {
            addCloneActivity(activities[index]);
            index++;
        } else {
            clearInterval(activityInterval);
            addCloneActivity('All tasks completed successfully!');
        }
    }, 3000);
}

function addCloneActivity(activity) {
    const activitiesContainer = document.getElementById('cloneActivities');
    const activityDiv = document.createElement('div');
    activityDiv.className = 'activity-item';
    activityDiv.textContent = activity;
    
    activitiesContainer.appendChild(activityDiv);
    
    // Remove old activities (keep only last 3)
    const activities = activitiesContainer.querySelectorAll('.activity-item');
    if (activities.length > 3) {
        activities[0].remove();
    }
}

function showCloneActivities(activities) {
    activities.forEach((activity, index) => {
        setTimeout(() => addCloneActivity(activity), index * 1000);
    });
}

// Camera Functions
function toggleCamera() {
    const modal = document.getElementById('cameraModal');
    
    if (modal.classList.contains('show')) {
        closeCamera();
    } else {
        openCamera();
    }
}

async function openCamera() {
    const modal = document.getElementById('cameraModal');
    const video = document.getElementById('cameraFeed');
    
    try {
        AuraState.cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = AuraState.cameraStream;
        modal.classList.add('show');
        
        console.log('📷 Camera opened');
    } catch (error) {
        console.error('❌ Camera access error:', error);
        addSystemMessage('Camera access denied. Please enable camera permissions for document scanning.');
    }
}

function closeCamera() {
    const modal = document.getElementById('cameraModal');
    
    if (AuraState.cameraStream) {
        AuraState.cameraStream.getTracks().forEach(track => track.stop());
        AuraState.cameraStream = null;
    }
    
    modal.classList.remove('show');
    console.log('📷 Camera closed');
}

async function captureDocument() {
    const video = document.getElementById('cameraFeed');
    const canvas = document.getElementById('captureCanvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    ctx.drawImage(video, 0, 0);
    
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    
    await processDocumentScan(imageData);
}

async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async function(e) {
        await processDocumentScan(e.target.result);
    };
    reader.readAsDataURL(file);
}

async function processDocumentScan(imageData) {
    showLoading(true);
    closeCamera();
    
    try {
        const response = await fetch('/api/scan/image', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                imageData: imageData,
                imageType: 'base64'
            })
        });
        
        const data = await response.json();
        
        if (data.success && data.scan) {
            const scan = data.scan;
            addMessage('aura', `Document scanned successfully! I found a ${scan.documentType} with ${scan.confidence}% confidence. ${scan.summary}`);
            
            if (scan.voiceMessage) {
                speak(scan.voiceMessage);
            }
            
            console.log('📄 Document scan result:', scan);
        } else {
            addMessage('aura', 'I had trouble analyzing that document. Please try again with better lighting or a clearer image.');
        }
        
    } catch (error) {
        console.error('❌ Document scan error:', error);
        addMessage('aura', 'Document scanning failed. Please check your connection and try again.');
    } finally {
        showLoading(false);
    }
}

// Safe Mode
function activateSafeMode() {
    processMessage('activate safe mode', 'text');
}

function activateSafeModeDisplay() {
    addSystemMessage('Safe Mode activated. Implementing stress reduction protocols.');
    
    // Visual feedback
    document.body.style.background = 'linear-gradient(135deg, #134e4a 0%, #065f46 100%)';
    
    setTimeout(() => {
        document.body.style.background = '';
    }, 10000);
}

// Utility Functions
function showLoading(show) {
    const loading = document.getElementById('loadingIndicator');
    if (show) {
        loading.classList.add('show');
    } else {
        loading.classList.remove('show');
    }
}

// Quick Actions
window.quickAction = function(action) {
    const actions = {
        stress: 'I am feeling stressed and need help',
        scan: 'scan document for me',
        status: 'what is my current status and timer info'
    };
    
    if (actions[action]) {
        addMessage('user', actions[action]);
        processMessage(actions[action], 'text');
    }
};

// Export functions for global access
window.sendMessage = sendMessage;
window.toggleVoice = toggleVoice;
window.toggleCamera = toggleCamera;
window.setMode = setMode;
window.startWorkSession = startWorkSession;
window.activateClone = activateClone;
window.activateSafeMode = activateSafeMode;
window.closeCamera = closeCamera;
window.captureDocument = captureDocument;
window.handleFileUpload = handleFileUpload;
window.handleKeyPress = handleKeyPress;
