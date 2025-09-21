const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
// Using built-in fetch (Node 18+) or fallback
const fetch = globalThis.fetch || require('node-fetch');
require('dotenv').config();

// File upload configuration
const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Updated API Configuration
const AI_APIS = {
    primary: 'groq',
    backup: ['openai', 'huggingface', 'gemini'],
    currentActive: 'groq',

    // API endpoints
    endpoints: {
        groq: 'https://api.groq.com/openai/v1/chat/completions',
        openai: 'https://api.openai.com/v1/chat/completions',
        gemini: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
        huggingface: 'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium'
    }
};

// API Keys Section - PASTE YOUR KEYS HERE (Backend Only - Hidden from Users)
const API_KEYS = {
    GROQ_API_KEY: process.env.GROQ_API_KEY || '',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
    HUGGINGFACE_TOKEN: process.env.HUGGINGFACE_TOKEN || 'YOUR_HF_KEY_HERE'
};

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve static frontend files
app.use(express.static('.'));

// Real AI API Functions
async function callGroqAPI(message) {
    try {
        const response = await fetch(AI_APIS.endpoints.groq, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEYS.GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "llama3-8b-8192",
                messages: [
                    { "role": "system", "content": "You are AURA, an AI study assistant. Keep responses conversational and helpful for students." },
                    { "role": "user", "content": message }
                ],
                max_tokens: 150,
                temperature: 0.7
            })
        });

        if (response.ok) {
            const data = await response.json();
            return data.choices[0].message.content.trim();
        }
        return null;
    } catch (error) {
        console.log('Groq API Error:', error.message);
        return null;
    }
}

async function callOpenAIAPI(message) {
    try {
        const response = await fetch(AI_APIS.endpoints.openai, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEYS.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [
                    { "role": "system", "content": "You are AURA, an AI study assistant. Keep responses conversational and helpful." },
                    { "role": "user", "content": message }
                ],
                max_tokens: 150,
                temperature: 0.7
            })
        });

        if (response.ok) {
            const data = await response.json();
            return data.choices[0].message.content.trim();
        }
        return null;
    } catch (error) {
        console.log('OpenAI API Error:', error.message);
        return null;
    }
}

async function callGeminiAPI(message) {
    try {
        const response = await fetch(`${AI_APIS.endpoints.gemini}?key=${API_KEYS.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `You are AURA, an AI study assistant. User: ${message}`
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 150
                }
            })
        });

        if (response.ok) {
            const data = await response.json();
            return data.candidates[0].content.parts[0].text.trim();
        }
        return null;
    } catch (error) {
        console.log('Gemini API Error:', error.message);
        return null;
    }
}

async function callHuggingFaceAPI(message) {
    try {
        const response = await fetch(AI_APIS.endpoints.huggingface, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEYS.HUGGINGFACE_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                inputs: `Human: ${message}\nAURA:`,
                parameters: {
                    max_new_tokens: 100,
                    temperature: 0.7,
                    return_full_text: false
                }
            })
        });

        if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data) && data[0]) {
                return data[0].generated_text.replace(`Human: ${message}\nAURA:`, '').trim();
            }
        }
        return null;
    } catch (error) {
        console.log('HuggingFace API Error:', error.message);
        return null;
    }
}

// Auto-switching AI API function
async function getAIResponse(message) {
    const apiMethods = {
        'groq': callGroqAPI,
        'openai': callOpenAIAPI,
        'gemini': callGeminiAPI,
        'huggingface': callHuggingFaceAPI
    };

    // Try primary API first
    if (API_KEYS[`${AI_APIS.currentActive.toUpperCase()}_API_KEY`] || API_KEYS[`${AI_APIS.currentActive.toUpperCase()}_TOKEN`]) {
        const response = await apiMethods[AI_APIS.currentActive](message);
        if (response) {
            console.log(`AI Response from: ${AI_APIS.currentActive}`);
            return response;
        }
    }

    // Try backup APIs
    for (let backupAPI of AI_APIS.backup) {
        const keyName = `${backupAPI.toUpperCase()}_API_KEY`;
        const tokenName = `${backupAPI.toUpperCase()}_TOKEN`;

        if (API_KEYS[keyName] || API_KEYS[tokenName]) {
            const response = await apiMethods[backupAPI](message);
            if (response) {
                AI_APIS.currentActive = backupAPI;
                console.log(`Switched to backup API: ${backupAPI}`);
                return response;
            }
        }
    }

    // Fallback response if all APIs fail
    return getFallbackResponse(message);
}

// Fallback response function
function getFallbackResponse(message) {
    const lowerMessage = message.toLowerCase();

    const fallbacks = {
        'hello': 'Hello! I am AURA, your AI study assistant. How can I help you today?',
        'hi': 'Hi there! Ready to boost your productivity and learning?',
        'machine learning': 'Machine learning is a branch of AI that enables computers to learn and make decisions from data without explicit programming.',
        'programming': 'Programming is the art of creating instructions for computers using languages like Python, JavaScript, or Java.',
        'study': 'Effective studying involves active recall, spaced repetition, and taking regular breaks. What subject are you working on?',
        'stress': 'I can help you manage stress through the 40-minute work sessions and safe mode activation.',
        'weather': 'I cannot check weather, but I hope you have a productive day ahead!',
        'time': `It's currently around ${new Date().toLocaleTimeString()}.`,
        'help': 'I can assist with studies, manage your work sessions, activate AI Clone mode, and provide stress management support.'
    };

    for (let keyword in fallbacks) {
        if (lowerMessage.includes(keyword)) {
            return fallbacks[keyword];
        }
    }

    return 'I understand what you\'re asking. How can I help you with your studies or productivity today?';
}

// Document Scanning and OCR Processing
function processDocument(imagePath) {
    // Simulate OCR processing - replace with actual OCR library like Tesseract
    const documentTypes = [
        {
            type: 'Research Paper',
            content: 'This appears to be a research paper about machine learning and artificial intelligence. Key topics include neural networks, deep learning algorithms, and their applications in computer vision.',
            keyPoints: [
                'Machine learning fundamentals',
                'Neural network architectures',
                'Deep learning applications',
                'Computer vision techniques'
            ]
        },
        {
            type: 'Textbook Chapter',
            content: 'This is a textbook chapter covering programming concepts. It discusses variables, functions, loops, and object-oriented programming principles.',
            keyPoints: [
                'Variables and data types',
                'Control structures and loops',
                'Functions and methods',
                'Object-oriented programming'
            ]
        },
        {
            type: 'Assignment/Notes',
            content: 'These appear to be study notes or assignment content covering various academic topics with bullet points and explanations.',
            keyPoints: [
                'Key concepts highlighted',
                'Important definitions',
                'Examples and explanations',
                'Summary points'
            ]
        }
    ];

    // Return random document type for demo
    const randomDoc = documentTypes[Math.floor(Math.random() * documentTypes.length)];

    return {
        success: true,
        documentType: randomDoc.type,
        content: randomDoc.content,
        keyPoints: randomDoc.keyPoints,
        summary: `I've analyzed this ${randomDoc.type.toLowerCase()}. ${randomDoc.content}`,
        voiceResponse: `I can see this is a ${randomDoc.type.toLowerCase()}. Let me tell you what I found: ${randomDoc.content.substring(0, 200)}...`,
        confidence: Math.floor(Math.random() * 30) + 70 // 70-100%
    };
}

// Voice Response Generation
function generateVoiceResponse(text, responseType = 'conversation') {
    const voiceResponses = {
        conversation: {
            prefix: "I understand what you're asking. ",
            suffix: " Is there anything else you'd like to know?"
        },
        scan: {
            prefix: "I've scanned the document. ",
            suffix: " Would you like me to explain any specific part?"
        },
        timer: {
            prefix: "Regarding your work session: ",
            suffix: " Keep up the great work!"
        },
        stress: {
            prefix: "I'm here to help with your wellbeing. ",
            suffix: " Take your time and breathe deeply."
        }
    };

    const response = voiceResponses[responseType] || voiceResponses.conversation;
    return response.prefix + text + response.suffix;
}

// Timer Management System
let activeTimers = new Map();

function startWorkTimer(userId = 'default') {
    const timerData = {
        startTime: Date.now(),
        duration: 40 * 60 * 1000, // 40 minutes
        alarmCount: 0,
        isActive: true,
        mode: 'work',
        sessionNumber: 1
    };

    activeTimers.set(userId, timerData);

    return {
        success: true,
        message: 'Starting 40-minute focused work session with AI monitoring',
        timer: '40:00',
        features: ['Stress monitoring active', 'Break reminders enabled', 'AI Clone on standby'],
        status: 'timer_started',
        sessionNumber: 1
    };
}

function checkTimerStatus(userId = 'default') {
    const timer = activeTimers.get(userId);

    if (!timer || !timer.isActive) {
        return {
            status: 'no_active_timer',
            message: 'No active work session. Start one to begin productive studying!',
            suggestion: 'Try: "start 40 minute session" or "begin work timer"'
        };
    }

    const elapsed = Date.now() - timer.startTime;
    const remaining = Math.max(0, timer.duration - elapsed);
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);

    if (remaining <= 0) {
        return handleTimerComplete(userId);
    }

    return {
        status: 'active',
        timeLeft: `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
        sessionNumber: timer.sessionNumber,
        progress: Math.round(((timer.duration - remaining) / timer.duration) * 100),
        message: `Work session ${timer.sessionNumber} in progress. ${minutes} minutes ${seconds} seconds remaining.`,
        motivationalMessage: getMotivationalMessage(minutes)
    };
}

function getMotivationalMessage(minutesLeft) {
    if (minutesLeft > 30) return "Great start! You're in the flow zone.";
    if (minutesLeft > 20) return "Halfway there! Keep up the excellent focus.";
    if (minutesLeft > 10) return "Final stretch! You're doing amazing.";
    return "Almost done! Finish strong!";
}

function handleTimerComplete(userId = 'default') {
    const timer = activeTimers.get(userId);
    timer.alarmCount++;

    if (timer.alarmCount >= 2) {
        // After 2 sessions (80 minutes), activate AI Clone
        timer.isActive = false;
        return {
            status: 'ai_clone_activated',
            message: 'Outstanding! You\'ve completed 80 minutes of focused work. AI Clone is now taking over your background tasks.',
            alarmCount: timer.alarmCount,
            action: 'clone_mode',
            totalWorkTime: '80 minutes',
            cloneActivities: [
                'Summarizing your study materials',
                'Organizing notes and resources',
                'Preparing review questions',
                'Scheduling your next study session'
            ],
            breakRecommendation: 'Take a 10-15 minute break while I handle these tasks.'
        };
    } else {
        // First session complete, start second session
        timer.sessionNumber = 2;
        timer.startTime = Date.now();
        return {
            status: 'session_complete',
            message: `Excellent! Session ${timer.sessionNumber - 1} completed. Take a 5-minute break, then we'll start session 2.`,
            alarmCount: timer.alarmCount,
            nextSession: 'ready_to_start',
            breakDuration: '5 minutes',
            sessionProgress: `${timer.alarmCount}/2 sessions completed`,
            encouragement: 'You\'re building great study habits!'
        };
    }
}

// Safe Mode for Stress Management
function activateSafeMode() {
    return {
        status: 'safe_mode_active',
        message: 'Safe Mode activated. Detecting elevated stress levels - let\'s take care of your wellbeing.',
        stressLevel: Math.floor(Math.random() * 30) + 70, // Simulate 70-100% stress
        actions: [
            'Playing calming background sounds',
            'Activating breathing guide',
            'Dimming notifications',
            'Preparing relaxation exercises'
        ],
        breathingExercise: {
            instruction: 'Let\'s do some deep breathing together:',
            pattern: 'Inhale for 4 counts, hold for 4, exhale for 6',
            duration: '2 minutes',
            benefit: 'This will activate your parasympathetic nervous system'
        },
        nextSteps: 'AI Clone will handle urgent tasks while you recover. Focus on your breathing.'
    };
}

// Enhanced AI Clone System
function activateAIClone(mode = 'standard') {
    const cloneCapabilities = {
        standard: {
            status: 'clone_activated',
            message: 'AI Clone activated and working autonomously in background.',
            tasks: [
                'Document analysis and summarization',
                'Research compilation and organization',
                'Note structuring and review prep',
                'Schedule optimization for study sessions'
            ],
            workingTime: '15-20 minutes',
            notification: 'I\'ll notify you when tasks are completed.'
        },
        advanced: {
            status: 'advanced_clone_active',
            message: 'Advanced AI Clone mode engaged - handling complex cognitive tasks.',
            tasks: [
                'Deep document analysis with insights',
                'Cross-referencing multiple sources',
                'Creating comprehensive study guides',
                'Generating practice questions and quizzes',
                'Building concept maps and connections'
            ],
            workingTime: '25-30 minutes',
            notification: 'Advanced processing in progress - perfect time for your break.'
        }
    };

    return cloneCapabilities[mode] || cloneCapabilities.standard;
}

// Voice Processing Route
app.post('/api/voice/process', async (req, res) => {
    const { audioData, command } = req.body;

    console.log('Voice command received:', command);

    // Process voice command
    let response;
    let voiceResponse;

    // Check for special voice commands
    const lowerCommand = command.toLowerCase();

    if (lowerCommand.includes('scan') || lowerCommand.includes('document') || lowerCommand.includes('read')) {
        response = {
            type: 'scan_request',
            message: 'Please show me the document you want me to scan. I can analyze research papers, textbooks, notes, or any written content.',
            voiceMessage: 'I\'m ready to scan a document for you. Please show it to your camera and I\'ll analyze the content and explain it to you.',
            action: 'activate_camera'
        };
    } else {
        // Get AI response for general voice commands
        const aiResponse = await getAIResponse(command);
        voiceResponse = generateVoiceResponse(aiResponse, 'conversation');

        response = {
            type: 'conversation',
            message: aiResponse,
            voiceMessage: voiceResponse
        };
    }

    res.json({
        success: true,
        response: response,
        timestamp: new Date().toISOString(),
        inputType: 'voice'
    });
});

// Document Scanning Route
app.post('/api/scan/document', upload.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.json({
                success: false,
                error: 'No document image provided'
            });
        }

        console.log('Document uploaded for scanning:', req.file.filename);

        // Process the document
        const scanResult = processDocument(req.file.path);

        // Generate voice response
        const voiceMessage = generateVoiceResponse(scanResult.voiceResponse, 'scan');

        // Clean up uploaded file after processing
        setTimeout(() => {
            fs.unlink(req.file.path, (err) => {
                if (err) console.log('File cleanup error:', err);
            });
        }, 5000);

        res.json({
            success: true,
            scan: {
                ...scanResult,
                voiceMessage: voiceMessage,
                visualData: {
                    documentType: scanResult.documentType,
                    keyPoints: scanResult.keyPoints,
                    confidence: scanResult.confidence
                }
            },
            timestamp: new Date().toISOString(),
            inputType: 'document_scan'
        });

    } catch (error) {
        console.error('Document processing error:', error);
        res.json({
            success: false,
            error: 'Failed to process document',
            voiceMessage: 'I encountered an issue while scanning the document. Please try again with better lighting or a clearer image.'
        });
    }
});

// Image-based scanning route (for base64 images from camera)
app.post('/api/scan/image', async (req, res) => {
    try {
        const { imageData, imageType = 'base64' } = req.body;

        if (!imageData) {
            return res.json({
                success: false,
                error: 'No image data provided'
            });
        }

        console.log('Image received for scanning');

        // Process the image (simulate OCR)
        const scanResult = processDocument('camera_image');

        // Generate voice response
        const voiceMessage = generateVoiceResponse(scanResult.voiceResponse, 'scan');

        res.json({
            success: true,
            scan: {
                ...scanResult,
                voiceMessage: voiceMessage,
                processingTime: '2.3 seconds',
                ocrAccuracy: scanResult.confidence + '%'
            },
            timestamp: new Date().toISOString(),
            inputType: 'camera_scan'
        });

    } catch (error) {
        console.error('Image processing error:', error);
        res.json({
            success: false,
            error: 'Failed to process image',
            voiceMessage: 'I had trouble analyzing that image. Please ensure the document is clearly visible and well-lit.'
        });
    }
});

// MAIN CHANGE: Frontend Route (Root serves HTML)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Backend API Status Route (separate endpoint)
app.get('/api', (req, res) => {
    res.json({
        message: 'AURA Mind Backend is running!',
        features: ['Voice Assistant', 'Document Scanning', '40-min Timer', 'AI Clone', 'Safe Mode'],
        endpoints: [
            'POST /api/voice/process - Voice commands',
            'POST /api/scan/document - Document upload scanning',
            'POST /api/scan/image - Camera image scanning',
            'POST /api/aura/process - Text conversation'
        ],
        activeAPI: AI_APIS.currentActive,
        status: 'online'
    });
});

// Main AURA AI Processing Route
app.post('/api/aura/process', async (req, res) => {
    const { command, mode = 'normal', userId = 'default' } = req.body;

    console.log(`Processing command: "${command}" in ${mode} mode`);

    // Check for special commands first
    const specialResponse = handleSpecialCommands(command, userId);
    if (specialResponse) {
        return res.json({
            success: true,
            response: specialResponse,
            api_used: 'internal_system',
            timestamp: new Date().toISOString(),
            commandType: 'system_command'
        });
    }

    // Get AI response for general queries
    const aiResponse = await getAIResponse(command);

    res.json({
        success: true,
        response: aiResponse,
        api_used: AI_APIS.currentActive,
        timestamp: new Date().toISOString(),
        commandType: 'ai_conversation'
    });
});

// Enhanced system commands for voice
function handleSpecialCommands(command, userId) {
    const lowerCommand = command.toLowerCase();

    // Timer commands with voice responses
    if (lowerCommand.includes('start work') || lowerCommand.includes('40 minute') || lowerCommand.includes('begin session')) {
        const result = startWorkTimer(userId);
        result.voiceMessage = generateVoiceResponse(result.message, 'timer');
        return result;
    }

    if (lowerCommand.includes('timer status') || lowerCommand.includes('time left') || lowerCommand.includes('how much time')) {
        const result = checkTimerStatus(userId);
        result.voiceMessage = generateVoiceResponse(result.message, 'timer');
        return result;
    }

    // Stress and mental health with voice
    if (lowerCommand.includes('stressed') || lowerCommand.includes('anxious') || lowerCommand.includes('overwhelmed') || lowerCommand.includes('safe mode')) {
        const result = activateSafeMode();
        result.voiceMessage = generateVoiceResponse(result.message, 'stress');
        return result;
    }

    // AI Clone activation with voice
    if (lowerCommand.includes('clone') || lowerCommand.includes('background tasks') || lowerCommand.includes('auto work')) {
        const mode = lowerCommand.includes('advanced') ? 'advanced' : 'standard';
        const result = activateAIClone(mode);
        result.voiceMessage = generateVoiceResponse(result.message, 'conversation');
        return result;
    }

    // Document scanning command
    if (lowerCommand.includes('scan') || lowerCommand.includes('read document') || lowerCommand.includes('analyze')) {
        return {
            status: 'scan_mode_ready',
            message: 'I am ready to scan and analyze documents. Please show me what you would like me to read.',
            voiceMessage: 'I am ready to scan documents for you. Please show the document to your camera and I will read and analyze it for you.',
            action: 'prepare_camera_scan'
        };
    }

    // Mode switching with voice feedback
    if (lowerCommand.includes('multi mode')) {
        const result = {
            status: 'multi_mode_active',
            message: 'Multi Mode activated! All AURA systems online: Voice AI, Timer, Stress Monitor, Document Scanner, and AI Clone.',
            activeFeatures: ['Voice AI', '40-min Timer', 'Stress Detection', 'AI Clone', 'Document Scanner'],
            capabilities: 'Full AURA experience with voice commands and document scanning.'
        };
        result.voiceMessage = generateVoiceResponse(result.message, 'conversation');
        return result;
    }

    return null;
}

// API Health and Status Route
app.get('/api/status', (req, res) => {
    const apiStatus = {};

    // Check which APIs have keys
    apiStatus.groq = API_KEYS.GROQ_API_KEY && API_KEYS.GROQ_API_KEY !== 'YOUR_GROQ_KEY_HERE';
    apiStatus.openai = API_KEYS.OPENAI_API_KEY && API_KEYS.OPENAI_API_KEY !== 'YOUR_OPENAI_KEY_HERE';
    apiStatus.gemini = API_KEYS.GEMINI_API_KEY && API_KEYS.GEMINI_API_KEY !== 'YOUR_GEMINI_KEY_HERE';
    apiStatus.huggingface = API_KEYS.HUGGINGFACE_TOKEN && API_KEYS.HUGGINGFACE_TOKEN !== 'YOUR_HF_KEY_HERE';

    res.json({
        currentActiveAPI: AI_APIS.currentActive,
        availableAPIs: Object.keys(apiStatus).filter(api => apiStatus[api]),
        systemStatus: 'operational',
        features: {
            aiConversation: true,
            timerSystem: true,
            safeMode: true,
            aiClone: true,
            autoAPISwitch: true
        },
        timestamp: new Date().toISOString()
    });
});

// Additional frontend route
app.get('/aura', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Single app.listen() - Fixed duplicate issue
app.listen(PORT, () => {
    console.log(`\n🚀 AURA Mind Backend running on port ${PORT}`);
    console.log(`🤖 Primary AI API: ${AI_APIS.currentActive}`);
    console.log(`💡 Features: Voice Assistant, Document Scanning, 40-min Timer, AI Clone`);
    console.log(`🎤 Voice Commands: Ready for microphone/earbuds input`);
    console.log(`📸 Document Scanner: Camera and file upload ready`);
    console.log(`🌐 Frontend: https://aura-mind-platform-production.up.railway.app/`);
    console.log(`🌐 API Status: https://aura-mind-platform-production.up.railway.app/api`);
    console.log('\n' + '='.repeat(60));
});
