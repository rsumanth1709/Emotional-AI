# MindCare AI: Emotion-Aware Mental Health Chatbot

MindCare AI is a full-stack, responsible AI companion system designed for final-year ML/AI capstone portfolios. It analyzes user emotional state in real-time, responds empathetically using Google Gemini, tracks user wellness analytics, and implements active crisis safety interceptors.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion, Recharts
- **Backend**: FastAPI, Python 3.11, SQLite + SQLAlchemy ORM, JWT authentication (Jose + bcrypt)
- **AI/ML Layer**: HuggingFace Transformers (DistilRoBERTa for 10-Class Emotion Analysis), VADER (Sentiment analysis), Google Gemini 1.5 Flash (Empathetic LLM engine)

---

## 🔒 Healthcare Ethics & Responsible AI

1. **Safety Interceptor (Crisis Override)**: Scans all user text using regex & keyword maps. If self-harm intent is triggered, it logs a crisis alert, blocks LLM prompt generation, and forces a crisis support display.
2. **Clinical Disclaimer**: Clear UI indicators stating this is a wellness app, not a licensed medical substitute.
3. **Privacy by Design**: Mandatory user consent check before saving any chat history for model processing. Database soft-deletes completely wipe logs upon account removal.

---

## 🚀 Quick Start Instructions

### Docker Compose (Recommended)
Launch the complete development environment with one command:
```bash
docker-compose up --build
```
The backend API starts at `http://localhost:8000`.

### Manual Startup

#### 1. Start the Backend
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
# Populate .env file with GEMINI_API_KEY
uvicorn app.main:app --reload
```

#### 2. Start the Frontend
```bash
cd ../frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.
