# MindCare AI — Emotion-Aware Mental Health Companion & Predictive AI System

**MindCare AI** is a full-stack, responsible AI companion system built for capstone portfolios, graduate research, and production deployments. It analyzes user emotional states in real-time across **82+ human-understandable languages** and **code-switched hybrid dialects** (Hinglish, Tenglish, Spanglish, Tanglish, etc.), responds empathetically using Google Gemini 1.5 Flash, tracks wellness analytics, provides PyTorch-powered mood forecasting, and delivers research-grade clinical capabilities.

---

## 🌟 Key System Capabilities & Highlights

### 1. 📖 AI-Powered Journaling Suite
- **Rich Text Editor**: Formatting toolbar with text highlighting, lists, headings, and CBT reflections.
- **AI Emotion Analysis**: Multi-tier emotion breakdown (Primary, Secondary, Stress score, Sentiment compound).
- **AI Writing Assistant**: Generates thought continuations, CBT cognitive reframing, and reflective questions.
- **Monthly Retrospective & Analytics**: Recharts mood progression trends, emotion distribution donuts, and AI monthly summaries.
- **Export & Search**: Search journal entries by tag or text, and export styled entries to PDF.

### 2. 🔮 Predictive AI Mood & Stress Forecasting
- **PyTorch 2-Layer MoodLSTM Model**: Multi-day recurrent sequence neural network (`nn.LSTM(input_size=13, hidden_size=64, num_layers=2)`).
- **Tomorrow's Mood & Stress Score**: Forecasts tomorrow's expected numerical mood (1-10), dominant emotion, and stress probability (0-100%).
- **7-Day Trajectory Forecasting**: Computes weekly emotional trends with **95% Monte Carlo Confidence Intervals** (`[confidence_min – confidence_max]`).
- **On-Demand Model Retraining**: Re-trains model weights on historical sequence data directly from the web interface.

### 3. 🔬 Phase 3 Research-Level Innovations
- **Multilingual Emotion Spectrum**: Classifies emotions across 82+ languages + transliterated code-switched dialects.
- **Emotion-Aware RAG Engine**: ChromaDB vector retrieval over clinical counseling QA and empathetic dialogue corpora, dynamically re-ranked based on user emotional context.
- **Federated Learning Engine**: FedAvg parameter aggregation paired with $(\epsilon=1.5, \delta=1e-5)$-Local Differential Privacy (LDP) noise injection for privacy-preserving collaborative learning.
- **Smartwatch Biometric Fusion**: Ingests smartwatch telemetry (PPG Heart Rate BPM, HRV ms, Sleep hours, REM %) and fuses physical biometrics with text sentiment to compute a **Bio-Emotional Stress Index**.
- **Therapeutic Knowledge Graphs**: Directed graph relating **Emotions $\rightarrow$ Triggers $\rightarrow$ Coping Strategies $\rightarrow$ Outcomes** with PageRank strategy recommendations.
- **On-Device AI (ONNX Runtime Web)**: Export PyTorch models to `.onnx` format for zero-latency, 100% privacy-preserving in-browser WASM execution.
- **Personalized Fine-Tuning & Feedback Loop**: Dynamic category preference weighting derived from user thumbs up (+1) / thumbs down (-1) feedback logs.

### 4. 🎨 UI/UX & Platform Usability
- **Redesigned Sidebar Navigation**: Translucent glassmorphism design with section grouping, active glowing indicators, and gamification user profile card (Level & XP progress).
- **HTML5 Push & Sound Notifications**: Real-time desktop push notifications and Web Audio synth chimes for stress alerts and wellness reminders.
- **Custom Brand Logo**: Embedded vector logo (`logo.png`) across sidebar, navbar, and favicons.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Recharts, Lucide Icons, ONNX Runtime Web.
- **Backend**: FastAPI, Python 3.11, PyTorch 2.6, SQLite + SQLAlchemy ORM, JWT Authentication (Jose + bcrypt).
- **AI / ML Engine**:
  - **PyTorch MoodLSTM**: 2-layer Recurrent Neural Network sequence model for predictive mood & stress forecasting.
  - **Emotion Classification Tier 1**: Calibrated Multilingual & Monolingual TF-IDF + `LinearSVC` classifiers.
  - **Emotion Classification Tier 2**: HuggingFace Transformers (`distilroberta-base`).
  - **On-Device AI**: ONNX Runtime Web (`mood_emotion_model.onnx`).
- **Vector Search & RAG**: ChromaDB, SentenceTransformers (`all-MiniLM-L6-v2`).
- **Generative LLM**: Google Gemini 1.5 Flash (Empathetic LLM persona engine).

---

## 📊 Datasets Repository & Taxonomy

MindCare AI includes an automated dataset pipeline stored under [`ai/datasets/`](file:///d:/Projects/EAI/ai/datasets/):

| Dataset | Format / Location | Records | Role & Usage |
|---|---|---|---|
| **GoEmotions** | `ai/datasets/go_emotions/` | **54,263** | Google Research 28 fine-grained emotion corpus mapped to 10 therapeutic categories. |
| **Empathetic Dialogues** | `ai/datasets/empathetic_dialogues/` | **88,687** | Facebook AI multi-turn conversational corpus used for RAG context and prompt patterns. |
| **Dair-AI Emotion** | `ai/datasets/emotion/` | **20,000** | Standard 6-class baseline evaluation benchmark (`sadness`, `joy`, `love`, `anger`, `fear`, `surprise`). |
| **Mental Health Counseling QA** | `ai/datasets/mental_health_qa/` | **3,512** | Clinical Q&A corpus for RAG vector retrieval, safety filtering, and grounding. |
| **Multilingual Benchmarks** | `ai/datasets/multilingual/` | **12,873** | Cross-lingual sentiment & emotion dataset across Spanish, French, German, Italian, Portuguese, Hindi, Arabic. |
| **Transliterated Hybrids** | `ai/datasets/multilingual/` | **13+ Lexicons** | Romanized code-switched dialect corpus (Hinglish, Tenglish, Spanglish, Tanglish). |

---

## 🚀 Quick Start Instructions

### 1. Download Datasets & Train Models

Run the training pipelines in `ai/` to train PyTorch and Scikit-learn models:

```bash
# Activate virtual environment
.\backend\venv\Scripts\activate

# Download datasets
python ai/download_datasets.py
python ai/download_multilingual_datasets.py

# Train custom emotion classification models
python ai/train_emotion_model.py
python ai/train_multilingual_emotion_model.py

# Train PyTorch MoodLSTM sequence model
python ai/train_mood_lstm.py
```

---

### 2. Run Application Locally

#### Backend Server (Port 8000)
```bash
cd backend
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
API endpoints available at `http://localhost:8000`.

#### Frontend Web App (Port 3000)
```bash
cd ../frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your web browser.

---

### 🧪 Running Verification Tests

Execute verification scripts to validate PyTorch models, RAG vector retrieval, and backend services:

```bash
# Test PyTorch Predictive LSTM Model
python scratch/test_predictive.py

# Test Retrain Endpoint & Weight Reloading
python scratch/test_retrain.py

# Test Phase 3 Research-Level Features
python scratch/test_research_features.py

# Test Notification Endpoints
python scratch/test_notifications.py
```
