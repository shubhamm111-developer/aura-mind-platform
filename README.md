<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12,13,14,15,17&height=220&section=header&text=AURA%202.0&fontSize=70&fontColor=ffffff&animation=fadeIn&desc=AI%20Unified%20Responsive%20Assistant&descAlignY=58&descSize=18" width="100%"/>

<a href="#">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=26&pause=1000&color=00F7FF&center=true&vCenter=true&width=700&lines=Your+AI+Companion+that+Sees%2C+Hears+%26+Feels;Multilingual+%E2%80%A2+Self-Healing+%E2%80%A2+Accessible;Built+for+Everyone%2C+Designed+to+Never+Fail" alt="Typing SVG" />
</a>

<br/>

![Status](https://img.shields.io/badge/Status-Active%20Development-brightgreen?style=for-the-badge&logo=git&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge&logo=open-source-initiative&logoColor=white)
![Stars](https://img.shields.io/github/stars/your-username/aura-ai?style=for-the-badge&color=yellow)
![Last Commit](https://img.shields.io/github/last-commit/your-username/aura-ai?style=for-the-badge&color=orange)

</div>

---

## 🌟 What is AURA?

> **AURA (AI Unified Responsive Assistant)** is not just another chatbot.
> It's a **living, breathing digital companion** — an animated avatar that lives on your screen, listens to you, watches your expressions, talks in *your* language, and **never goes offline**, because if one AI brain fails, another silently takes over.

<div align="center">

```mermaid
flowchart LR
    U([👤 User]) -->|Voice / Text / Camera| A[🎭 AURA Avatar]
    A --> O{Orchestrator}
    O -->|Primary| AI1[🤖 AI Provider 1]
    O -.fallback.-> AI2[🤖 AI Provider 2]
    O -.fallback.-> AI3[🤖 AI Provider 3 / Local LLM]
    O --> E[😊 Emotion Engine]
    E -->|Text Sentiment| O
    E -->|Facial Expression| O
    O --> R[🔊 Response: Voice + Animation]
    R --> A
```

</div>

---

## ✨ Core Features

<table>
<tr>
<td width="50%" valign="top">

### 🎭 Animated Living Avatar
A dynamic, expressive on-screen character that reacts in real time — idle, listening, thinking, and speaking animations bring AURA to life.

</td>
<td width="50%" valign="top">

### 🔄 Self-Healing AI Core
Multi-API failover with circuit-breaker logic. If one AI provider fails or rate-limits, AURA instantly switches to the next — **zero downtime, ever.**

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 🌍 True Multilingual Support
Speak in Hindi, English, or any regional language — AURA understands and replies fluently in the same language, voice and all.

</td>
<td width="50%" valign="top">

### ♿ Accessibility First
**Vision Mode** narrates your entire screen for visually impaired users. **Caption Mode** provides live captions and visual alerts for hearing-impaired users.

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 😊 Dual Emotion Detection
Reads your **mood from text/voice tone** AND your **facial expression via webcam** (with consent) — cross-checking both for genuinely empathetic responses.

</td>
<td width="50%" valign="top">

### 🖥️ Screen-Aware Intelligence
AURA can "see" your screen and explain errors, summarize documents, or guide you — like having a knowledgeable friend looking over your shoulder.

</td>
</tr>
</table>

---

## ⚙️ How AURA Works

```mermaid
sequenceDiagram
    participant You
    participant Avatar as 🎭 AURA Avatar
    participant Brain as 🧠 AI Orchestrator
    participant API as 🌐 AI Providers
    participant Emotion as 😊 Emotion Engine

    You->>Avatar: 🎤 Speak (any language)
    Avatar->>Brain: Send transcribed query
    You->>Emotion: 📷 Webcam + voice tone
    Emotion->>Brain: Mood signal (stressed/happy/neutral)
    Brain->>API: Query Provider #1
    API--xBrain: ❌ Timeout / Rate-limited
    Brain->>API: Auto-switch → Provider #2 ✅
    API->>Brain: Response generated
    Brain->>Avatar: Tone-adjusted reply
    Avatar->>You: 🔊 Speaks + animates expression
```

---

## 🏗️ Tech Stack

<div align="center">
  <img src="https://skillicons.dev/icons?i=python,fastapi,react,opencv,javascript,html,css,nodejs,docker,git&theme=dark" />
</div>

<div align="center">

![OpenAI](https://img.shields.io/badge/OpenAI%20API-412991?style=for-the-badge&logo=openai&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini%20API-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white)
![LangChain](https://img.shields.io/badge/LangChain-1C3C3C?style=for-the-badge&logo=langchain&logoColor=white)
![MediaPipe](https://img.shields.io/badge/MediaPipe-0097A7?style=for-the-badge&logo=google&logoColor=white)
![Whisper](https://img.shields.io/badge/Whisper-STT-orange?style=for-the-badge)

</div>

---

## 🎯 Architecture Overview

```mermaid
graph TB
    subgraph "Frontend Layer"
        UI[🎭 Animated Avatar UI]
        CAM[📷 Camera Module]
        MIC[🎤 Microphone Module]
    end

    subgraph "Backend - Orchestrator"
        ROUTER[Central Controller]
        FAILOVER[Failover Manager]
        LANG[Language Processor]
        EMO[Emotion Analyzer]
    end

    subgraph "AI Provider Pool"
        P1[OpenAI GPT]
        P2[Gemini]
        P3[Groq / Local LLM]
    end

    subgraph "Accessibility Layer"
        VISION[Vision Mode - Screen Reader]
        CAPTION[Caption Mode - Live Subtitles]
    end

    UI --> ROUTER
    CAM --> EMO
    MIC --> LANG
    LANG --> ROUTER
    EMO --> ROUTER
    ROUTER --> FAILOVER
    FAILOVER --> P1
    FAILOVER -.-> P2
    FAILOVER -.-> P3
    ROUTER --> VISION
    ROUTER --> CAPTION
    ROUTER --> UI

    style UI fill:#00F7FF,stroke:#000,color:#000
    style FAILOVER fill:#FF6B6B,stroke:#000,color:#000
    style EMO fill:#FFD93D,stroke:#000,color:#000
```

---

## 🚀 Getting Started

```bash
# Clone the repository
git clone https://github.com/your-username/aura-ai.git
cd aura-ai

# Install backend dependencies
pip install -r requirements.txt

# Install frontend dependencies
cd frontend
npm install

# Run the project
npm run dev
```

> 📝 Add your API keys (OpenAI, Gemini, Groq, etc.) in a `.env` file before running.

---

## 🗺️ Roadmap

- [x] Animated avatar with expression states
- [x] Multi-API failover engine
- [ ] Multilingual voice conversation
- [ ] Webcam-based emotion detection
- [ ] Screen-awareness (OCR + context reading)
- [ ] Full Vision Mode for visually impaired users
- [ ] Sign-language gesture responses

---

## 📊 Project Stats

<div align="center">

![GitHub repo size](https://img.shields.io/github/repo-size/your-username/aura-ai?style=for-the-badge&color=blueviolet)
![GitHub language count](https://img.shields.io/github/languages/count/your-username/aura-ai?style=for-the-badge&color=success)
![GitHub top language](https://img.shields.io/github/languages/top/your-username/aura-ai?style=for-the-badge&color=informational)

</div>

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
Feel free to check the [issues page](https://github.com/shubhamm111-developer/aura-ai/issues).

---

## 📜 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

### 💙 Built with passion to make AI accessible, reliable, and human.

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12,13,14,15,17&height=120&section=footer"/>

</div>
