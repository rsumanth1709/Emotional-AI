# MindCare AI — Multimodal Emotion-Aware Mental Health Companion & Predictive AI Platform

**MindCare AI** is an enterprise-grade, research-ready, multimodal AI mental-health support platform built for production deployments, capstone portfolios, and advanced AI research. It integrates real-time text NLP across **82+ languages** and code-switched dialects, **image-based facial expression recognition**, **video-based frame-by-frame face tracking**, **wearable health telemetry correlation**, a **multimodal emotion fusion engine**, an **adaptive AI companion personality engine**, and a **personalized wellness content generator**.

> [!IMPORTANT]
> **Non-Clinical Wellness Safeguard**: MindCare AI is designed as a supportive emotional wellness and self-reflection platform. It treats all emotion detection as probabilistic estimates and does **not** diagnose medical conditions, prescribe treatment, or replace qualified healthcare professionals.

---

## 🌟 Key Platform Capabilities & Modules

### 1. 🎬 Video-Based Emotion Analysis & Multi-Layer Timeline
- **Video Preprocessing & Sampling**: Supports MP4, MOV, WebM, and AVI formats with decodability validation, size checks (<100MB), and configurable frame sampling (default 5 FPS).
- **Anonymous Face Tracking**: Employs Intersection-over-Union (IoU) bounding box tracking to assign persistent anonymous IDs (`Face 1`, `Face 2`) across frames without identity recording.
- **Temporal Probability Smoothing**: Applies exponential moving window smoothing across frame predictions to eliminate transient noise and detect sustained transitions (`00:18 → Happy`, `00:31 → Sad`).
- **Speech Extraction & Audio Transcription**: Extracts speech audio tracks into timestamped transcript segments with integrated text NLP emotion and sentiment scoring.
- **Multi-Layer Interactive Timeline**: Renders multi-layer timelines (**Facial Layer**, **Speech Layer**, **Combined Multimodal Layer**) with agreement indicators (`✓ Agreed` vs `Mixed ⚠️`).
- **Privacy First**: Zero raw video or extracted frame disk retention.

---

### 2. 🔀 Multimodal Emotion Fusion Engine
- **Flexible 4-Modality Support**: Fuses any combination of **Text**, **Voice**, **Image**, and **Video** inputs without requiring all modalities to be present (supports Text-only, Text+Voice, Text+Image, Text+Video, Voice+Image, All 4).
- **7-Class Common Taxonomy**: Normalizes raw modality labels into a standard 7-class taxonomy: `Happy`, `Sad`, `Angry`, `Fear`, `Surprise`, `Disgust`, and `Neutral`.
- **Quality Assessment & Dynamic Weighting**: Calculates Effective Modality Weights:
  $$\text{Effective Weight} = \text{Base Weight} \times \text{Model Confidence} \times \text{Input Quality} \times \text{Availability}$$
- **Probability-Level Weighted Fusion**: Fuses probability distributions across available modalities and computes calibrated confidence levels.
- **Modality Agreement & Conflict Resolution**: Calculates agreement scores ($0.0 - 1.0$) and handles conflicting signals gracefully.
- **Explainability Engine**: Provides machine-readable and plain-English human-readable reasoning breakdowns ("Why this result?").

---

### 3. 🤖 Adaptive AI Companion Personality System
- **4 Selectable Personalities**:
  - `Supportive Friend`: Warm ($0.9$), empathetic, conversational, encouraging.
  - `Coach`: Action-oriented ($0.9$ directness), motivating, breaks tasks into 15-minute steps.
  - `Mentor`: Thoughtful, educational, decision-oriented, trade-off analysis.
  - `Professional Guide`: Clear, structured, concise, formal ($0.9$ formality) yet approachable.
- **Strict Priority Hierarchy**:
  $$\text{Safety Rules} \rightarrow \text{User Directives} \rightarrow \text{Temporary Style} \rightarrow \text{Personality} \rightarrow \text{Explicit Preferences} \rightarrow \text{Inferred} \rightarrow \text{Default}$$
- **Explicit Directive & Preference Learning**: Detects explicit directives (*"Keep answers short"*, *"Don't use emojis"*, *"Explain in detail"*) and stores explicit preferences ($1.0$ confidence).
- **Controlled Long-Term Memory**: Relevance-filtered memory retrieval with full user controls (View, Edit, Delete, Clear All, Toggle Personalization).
- **Safety Boundaries & Injection Protection**: Wraps memories inside untrusted contextual data tags (`<user_memories>`). Prohibits false human identity claims or emotional dependency.

---

### 4. 🌿 Personalized Wellness Content Generator
- **5 Supported Content Types**:
  - `Personalized Affirmations`: Realistic, short, supportive affirmations matching context (`stress`, `sadness`, `frustration`, `positive`) across 6 styles.
  - `Guided Breathing Scripts`: Configurable patterns (`4-4`, `4-6`, `4-2-6`, `Box Breathing`) with safety notes (*"Stop if you feel dizzy or uncomfortable"*).
  - `Mindfulness Exercises`: 9 exercise types (`5-Senses Grounding`, `Body Scan`, `Present-Moment Awareness`, etc.) with step-by-step instructions.
  - `Reflective Journal Prompts`: Context-aware prompts with follow-up questions and 1-click routing into MindCare Journal Editor (`/journal`).
  - `Daily Wellness Check-In Card`: 3-part daily plan (Morning Affirmation, Afternoon Reset, Evening Reflection).
- **Interactive Visual Breathing Guide UI**: Animated expanding/contracting breathing circle, live timer countdown (Inhale/Hold/Exhale), Pause, Resume, Stop, and Restart controls.
- **Emotion Confidence Thresholds**: High ($\ge 0.75$), Medium ($0.50-0.74$), and Low ($<0.50$) confidence adaptation.
- **Completion Tracking & Feedback**: Tracks status (`started`, `completed`, `saved`, `skipped`) and user ratings (`Helpful 👍` / `Not Helpful 👎`).

---

### 5. 📚 AI Emotional Storytelling Engine
- **13 Supported Story Types & Multiple Genres**: Generates short, uplifting narratives across 13 story types (Uplifting, Motivational, Self-Growth, Resilience, Friendship, Confidence, Hopeful, Gratitude, New Beginning, Personal Achievement, Overcoming Challenges, Calm/Peaceful, Interactive Choice-Based) and genres (Realistic, Fantasy, Adventure, Slice of Life, Futuristic, Nature, Inspirational, Mystery).
- **Interactive Choice Narratives**: Pauses at decision points with 2-3 choices, maintaining persistent story state (`story_id`, `chapter`, `characters`, `location`, `decisions`) across chapters.
- **Story Reader UI & Audio Player**: Distraction-free reader with built-in Web Speech API **Text-to-Speech (TTS) Audio Player** (Play/Pause/Stop), favorite star saving, story continuation, and alternative ending generation.
- **Reflection & Journal Integration**: Contextual story reflection prompts with direct 1-click routing into MindCare Journal Editor (`/journal`).

---

### 6. ⚙️ Automated Model Retraining & MLOps Pipeline
- **Generic Model Registry & Semantic Versioning**: Manages model definitions and immutable versions across `text_emotion_classifier`, `multilingual_emotion_classifier`, and `mood_lstm`.
- **Population Stability Index (PSI) Drift Detection**: Computes feature and prediction distribution drift ($\text{PSI} > 0.20$ trigger).
- **Data Quality & PII Audit**: Validates dataset completeness, missing label rates, duplicate rates, and enforces a zero-PII policy.
- **5-Layer Quality & Safety Gates**: Validates accuracy, Macro F1, minority class recall, P95 latency ($<300\text{ms}$), and safety/fairness tests.
- **Mandatory Human Review Gate**: Enforces explicit reviewer approval before any candidate model can be deployed to production.
- **Canary Rollout & Automatic Rollback**: Staged canary deployment ($5\% \rightarrow 25\% \rightarrow 50\% \rightarrow 100\%$) with automatic rollback if error rates exceed $5\%$ or latency exceeds $500\text{ms}$.
- **Immutable MLOps Audit Log**: Audit trail for all registry events, approvals, deployments, and rollbacks.

---

### 7. 📊 AI Monitoring & Observability Platform
- **Non-Blocking Telemetry Ingestion SDK**: Collects inference latencies, predictions, confidences, and status codes asynchronously without blocking application responses.
- **Accuracy vs Proxy Metric Distinction**: Explicitly separates verified ground-truth accuracy from proxy confidence metrics.
- **Percentile Latency & End-to-End Timing**: Calculates P50, P90, P95, and P99 latency percentiles and provides end-to-end breakdown timing (Preprocessing, Model Inference, Database, Postprocessing).
- **Delayed Ground-Truth Matching**: Matches delayed human labels with predictions to calculate true Macro F1 accuracy.
- **Alert Engine & Deduplication**: Manages alert lifecycles (`TRIGGERED`, `ACKNOWLEDGED`, `INVESTIGATING`, `RESOLVED`, `SUPPRESSED`) with 10-minute deduplication cooldowns.
- **Health Check Probes**: Native `/health`, `/ready`, and `/live` system probes.

---

### 8. 🧪 A/B Testing & Experimentation Platform
- **Deterministic Hashing Assignment**: Stable `hash(user_id + experiment_id) mod 100` bucket assignment guaranteeing consistent user experience across sessions.
- **Fast Configuration Resolver**: Resolves active variant configurations or gracefully falls back to production Control ($<10\text{ms}$ overhead).
- **Statistical z-Tests & 95% Confidence Intervals**: Computes Proportion $z$-scores, $p$-values, effect sizes, and $95\%$ Confidence Intervals ($\text{Mean} \pm 1.96 \times \text{SE}$).
- **Mandatory Safety Guardrails**: Safety rule enforcement prevents variant recommendation if safety violation rate is degraded, even if satisfaction improves.
- **1-Click Winner Deployment**: Promotes statistically validated winning configurations directly to active production.

---

### 9. 🛍️ API Marketplace & Developer Platform
- **Public REST & GraphQL APIs**: Versioned REST endpoints (`/api/v1/emotions/text`, `/api/v1/chat`) and strongly typed GraphQL schema (`POST /graphql`).
- **Secure API Key Lifecycle**: Key generation with prefixes (`mk_live_`, `mk_test_`), SHA256 hashing in DB (`key_hash`), masked display (`mk_live_************9x2a`), key rotation, and revocation.
- **Rate Limiting & Tiered Quotas**: Sliding window rate limiting (FREE: 60 RPM, DEVELOPER: 300 RPM, PRO: 1000 RPM) returning `X-RateLimit-*` headers and `HTTP 429` on overflow.
- **SDK Generators**: Interactive code generators for Python, JavaScript (Node.js/TypeScript), and cURL.
- **Developer Marketplace Dashboard**: Searchable API catalog across 16 categories with an interactive API console tester and monthly quota usage monitor.

---

### 10. 🏆 AI Emotion Detection Benchmarking Suite
- **Model-Agnostic Adapter Architecture**: Standardized adapter interface (`EmotionModelAdapter`) evaluating PyTorch, TensorFlow, Scikit-Learn, CNNs, EfficientNet, and Vision Transformers.
- **Standardized Datasets & Label Taxonomy**: Unified 7-class label taxonomy (`Happy`, `Sad`, `Angry`, `Fear`, `Surprise`, `Disgust`, `Neutral`) mapped across FER2013 and GoEmotions.
- **Multi-Objective Leaderboard & Metrics**: Measures Accuracy, Precision/Recall/F1 (Macro & Weighted), P50/P90/P95/P99 latencies, Throughput (TPS), Peak RAM, and Multi-Objective Weighted Scores.
- **Confusion Matrix & Per-Class Breakdown**: Interactive per-class precision/recall/F1 inspector and raw/normalized confusion matrices.
- **Reproducibility Guarantee**: Verifies random seed (`42`), dataset versions (`v1.0`), SHA256 checksums, and Git commit hashes (`a91f83c`) with 1-click reproduction.

---

### 11. 🏷️ Dataset Annotation Platform
- **Multi-Turn Conversation Emotion Labeling**: Turn-by-turn and primary conversation emotion annotation across 10-class taxonomy.
- **Multi-Annotator Workflow & Consensus**: Assigns multiple annotators per sample and computes majority voting consensus labels (`is_consensus_reached`).
- **Inter-Annotator Agreement Engine**: Calculates **Fleiss' Kappa** ($\kappa$), **Cohen's Kappa** ($\kappa$), and Percentage Agreement ($85\%$) with qualitative level mapping (`Substantial Agreement`).
- **Multi-Format Dataset Exporters**: Exporters for **JSON**, **JSONL**, and **CSV** dataset formats with 1-click downloading.

---

### 12. 🔥 Emotion Intensity Detection Module
- **13-Emotion Taxonomy & 0–100 Continuous Score**: Predicts primary emotion and continuous intensity mapped to 5 descriptive levels (`very_low`, `mild`, `moderate`, `high`, `very_high`).
- **Multi-Emotion & Evidence Extraction**: Detects simultaneous emotions and extracts contributing linguistic phrases, intensifiers (*extremely/completely*), diminishers (*slightly*), and negations (*not angry*).
- **Historical Trajectory & Trend Analytics**: Tracks daily/weekly/monthly moving averages, min/max, trend direction (`increasing`, `decreasing`, `stable`), and non-clinical wellness insights.
- **Baseline Benchmarking Engine**: Evaluates Proposed Model against Baselines 1–4 across MAE, MSE, RMSE, Pearson $r$, Spearman $\rho$, Accuracy, and Macro F1.
- **Non-Blocking Chat Pipeline Integration**: Automatically records intensity during chat interactions with zero impact on chat latency or availability.

---

### 13. 🔀 Emotion Transition Detection System
- **Turn-by-Turn Emotion State Storage**: Stores conversation turn states (`conversation_emotion_states` table) reusing intensity, confidence, and timestamp fields.
- **Transition Engine & Same-Emotion Suppression**: Detects emotion transitions between turns (e.g. `neutral` $\rightarrow$ `stress`, `stress` $\rightarrow$ `anxiety`). Suppresses false transitions on identical consecutive emotions while tracking duration.
- **Sudden Change & Prolonged Negative Period Alerts**: Flags sudden changes (strength $\ge 0.70$ or $|\Delta \text{Intensity}| \ge 30$) and prolonged negative periods ($\ge 4$ consecutive negative turns with average intensity $\ge 50$).
- **Emotional Volatility Score (0–100)**: Computes normalized volatility score ($0–100$) over a configurable turn window (e.g. 10 turns) with 5 descriptive categories (`very_low` to `very_high`).
- **Interactive Emotion Timeline & Node Graph**: Provides an interactive turn-by-turn connected node graph and timeline events table.
- **Response Generator Context Integration**: Passes `EmotionTransitionContext` as supplementary context to the chatbot response generator.

---

### 14. ⚡ Emotional Trigger Detection Module
- **Category Classification & Evidence Extraction**: Classifies triggers across 9 configurable categories (`academics`, `work`, `relationships`, `family`, `financial_concerns`, `social_situations`, `sleep`, `health_concerns`, `other`), extracts supporting evidence spans, and computes confidence ($0.0 - 1.0$).
- **Negation & Explicit Statement Analyzer**: Filters out false triggers under negation ("not worried about money") and boosts confidence for explicit statements ("Exams make me anxious").
- **Source & Status State Machine**: Strictly distinguishes AI-inferred (`unconfirmed`) from user-confirmed (`confirmed_by_user`), user-edited (`user_edited`), user-created (`user_created`), and deleted/rejected (`deleted`, `rejected`).
- **User Lifecycle Workflow**: 1-click Confirm, Reject, Edit, Delete, and Manual Create actions on the dashboard with instant analytics exclusion for deleted/rejected triggers.
- **Frequency, Matrix & Recurring Pattern Analytics**: Computes Category Frequency, Trigger-Emotion Heatmap Matrix, and Recurring Trigger-Emotion Patterns ($\ge 3$ occurrences).

---

### 15. 🛡️ Automated Conversation Quality Evaluation System
- **7-Dimension Scoring Engine (0–100)**: Evaluates Empathy ($15\%$), Relevance ($20\%$), Helpfulness ($20\%$), Safety ($20\%$), Factual Reliability ($15\%$), Repetition ($5\%$), and Tone Appropriateness ($5\%$).
- **Safety-First Hard Gating & Fallback Strategy**: Hard safety rules and safety score thresholds ($\ge 80$). If safety fails (`status = "unsafe"`), the system immediately delivers a dedicated Safe Fallback Response without exposing internal reasoning.
- **Targeted Prompt Regeneration (Max 2 Attempts)**: If quality evaluation fails thresholds (`status = "fail"`), targeted prompt directives are generated based on the specific failing dimension (e.g. low empathy, high repetition).
- **Pre-Delivery Validation Interceptor**: Evaluates every generated chatbot response BEFORE delivery to the user in `chat_service.py`.
- **Operations & Evaluation Dashboard**: Interactive operational dashboard displaying 7-dimension score radar/gauges, pass rates, fallback rates, and internal evaluation logs.

---

### 16. 🔎 Hallucination and Unsupported-Claim Detection Layer
- **Claim Extraction & Classification**: Extracts and classifies candidate response claims into `medical_claim`, `statistical_claim`, `study_claim`, and `conversational`.
- **Knowledge Base Retrieval & Evidence Verification**: Verifies claims against trusted MindCare knowledge base and assigns status (`supported`, `unsupported`, `refuted`, `uncertain`).
- **Hallucination Severity Score (0.0–1.0)**: Computes continuous hallucination score ($0.0 - 1.0$) and maps to severity levels (`none`, `low`, `moderate`, `high`).
- **Uncertainty-Aware Response Rewriting**: Automatically rewrites unsupported/refuted claims into non-diagnostic, uncertainty-aware language with non-clinical disclaimers prior to delivery.
- **Operations & Audit Dashboard**: Interactive operational inspector displaying claim verification breakdowns, hallucination rates, and audit logs.

---

### 17. 🧠 Emotion-Aware Retrieval-Augmented Generation (RAG) Architecture
- **Intent & Risk Classification**: Classifies user query intent (`academic_stress`, `sleep_support`, `coping_strategy`, `breathing_exercise`, `mindfulness`) and safety risk level (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
- **Emotion-Aware Query Construction & Hybrid Ranking**: Constructs normalized search query combining intent + emotion, and ranks candidates using hybrid scoring:
  $$\text{Final Score} = 0.40 \cdot \text{Semantic} + 0.20 \cdot \text{Intent} + 0.15 \cdot \text{Emotion} + 0.15 \cdot \text{Trust} + 0.10 \cdot \text{Freshness}$$
- **Source Allowlist & Metadata Filtering**: Restricts retrieval to approved sources (`trusted_sources` table) from government, medical institutions, and mental health organizations (`trust_level` 1–3).
- **Strict Separation of Memory & Knowledge**: Personal conversation memory is isolated by `user_id` and is **NEVER** treated as medical evidence for claims.
- **No-Trusted-Evidence Handling**: Returns `status = "NO_TRUSTED_EVIDENCE"` when evidence is below threshold ($0.65$), delivering a safe, cautious response without inventing citations.
- **Admin Ingestion & Approval Workflow**: Document ingestion API (`POST /api/v1/admin/knowledge/documents`) entering `PENDING_REVIEW` prior to approval and vector indexing.

---

### 18. 📈 Personal Emotional Baseline System
- **Observation Storage & Confidence Filtering**: Stores eligible conversation-turn observations (`confidence` $\ge 0.70$) across 11 emotions.
- **Establishment Thresholds & Lifecycle States**: Enforces configurable baseline establishment requirements ($\ge 20$ observations across $\ge 7$ distinct active days) before transitioning status from `COLLECTING_DATA` to `ESTABLISHED`.
- **Robust Baseline Vector & Typical Ranges**: Computes normalized emotion distribution percentages and typical intensity ranges ($\text{Mean} \pm 1.5 \times \text{StdDev}$) per emotion using decay weighting ($0.95$).
- **Personal Deviation Scoring (0–100) & Types**: Calculates personal deviation score ($0–100$) mapped to 4 non-clinical levels (`minimal`, `mild`, `moderate`, `significant`), detecting `sudden_change` ($\Delta \ge 30$) and `sustained_deviation`.
- **1-Click Reset Workflow & Historical Archiving**: Archives previous baseline version, resets active calculations, and transitions status to `COLLECTING_DATA`.
- **Non-Clinical Behavioral Guarantee**: Clear user-facing disclaimers stating that baselines describe interaction patterns and are **NOT** medical assessments or diagnoses.

---

### 19. ⚙️ User Response-Preference Learning System
- **Tracked Preference Categories**: Tracks response length (`very_short` to `very_detailed`), tone (`warm`, `friendly`, `calm`, `professional`, etc.), advice style (`advice_first`, `listening_first`, `ask_before_advice`, `balanced`), wellness activities (multi-select), language (`en`, `te`, `hi`), and persona (`coach`, `mentor`, `supportive_friend`, `professional_guide`).
- **Conflict Resolution Hierarchy**: Enforces strict resolution priority:
  $$\text{Current Request} > \text{Explicit Setting} > \text{Explicit Feedback} > \text{Strong Learned Preference} > \text{Weak Learned Preference} > \text{Default}$$
- **Explicit Feedback Learning Engine**: Feedback events (e.g. `response_too_long`, `response_too_short`) trigger preference updates with source tracking (`explicit_feedback`) and confidence scoring.
- **No Sensitive Inference Protection**: Restricts preference learning strictly to communication style and wellness choices without inferring medical, identity, or psychological traits.
- **Personalization Settings UI**: Full-featured UI (`/settings/personalization`) with style selectors, multi-select wellness activity checkboxes, transparency audit card, and 1-click Reset/Delete controls.

---

### 20. 🌐 Multilingual and Code-Mixed Conversational AI Platform
- **5 Supported Languages**: Full support for **English**, **Telugu**, **Hindi**, **Tamil**, and **Kannada** across native scripts and Romanized transliterated forms.
- **Language Detection & Code-Mixing Engine**: Detects `primary_language`, `secondary_languages`, `script`, `is_code_mixed`, and token-level language breakdowns.
- **Transliteration Normalizer**: Generates canonical script representations (e.g. *"naaku chala kastam ga undhi"* $\rightarrow$ *"నాకు చాలా కష్టం గా ఉంది"*) while preserving original user text.
- **Multilingual Emotion, Sentiment & Risk Analysis**: Classifies 11 emotions, continuous sentiment scores ($[-1.0, +1.0]$), and safety risk levels (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) with pre-translated safety resources in all 5 languages.
- **Admin Multilingual Model Evaluation Dashboard**: Interactive benchmark dashboard (`/admin/multilingual`) displaying performance metrics (Emotion F1, Sentiment F1, Risk Recall, Code-Mix F1, Latency ms) per language.

---

### 21. 🔒 Privacy-First & Data-Minimization Architecture
- **Data Minimization & Optionality**: Minimal data collection policy. Unnecessary fields (full name, phone, address, location, device details) are excluded.
- **Authentication Data Separation**: Authentication database (`users_auth`) is strictly separated from conversation database (`conversations`). Authentication credentials are never stored in conversation records.
- **Pseudonymous User Identifiers**: Maps authentication identities to deterministic internal pseudonymous identifiers (`usr_7f82a9c1`). Conversations, emotions, memories, and analytics reference `usr_...` instead of email addresses.
- **Application-Level Encryption at Rest & TLS in Transit**: Encrypts sensitive conversation content, memories, baseline records, and export archives using AES-256 / Fernet cryptography with secure key references.
- **Configurable Conversation Retention Policies**: `7_days`, `30_days` (default), `90_days`, `1_year`, `forever`, `do_not_retain`.
- **Automated Retention Worker Cleanup**: Background worker automatically purges expired messages, emotion observations, transitions, triggers, vector embeddings, and temporary media.
- **1-Click "Delete My Data" & Account Deletion Workflows**: Idempotent 1-click purge across database tables, vector embeddings, and temporary caches with audit logging (`SecurityAuditLog`).
- **Data Export Engine (`POST /api/v1/privacy/export`)**: Generates password-protected/encrypted ZIP archive containing `profile.json`, `conversations.json`, `emotions.json`, `memories.json`, `preferences.json`, and `consent.json` with auto-expiring download links (24 hours).
- **Consent Management Engine (`consent_records`)**: Granular versioned consent tracking (`conversation_storage`, `memory`, `personalization`, `analytics`, `voice_processing`, `media_processing`).
- **Log Sanitizer & Immutable Security Audit Trail (`audit_records`)**: Automatically redacts tokens, credentials, and conversation text from logs. Audits all privacy actions (`CONSENT_UPDATED`, `DATA_EXPORTED`, `CONVERSATION_DELETED`, `DATA_PURGED`).
- **Privacy Dashboard UI**: Interactive dashboard (`/settings/privacy`) with pseudonymous ID display, retention selector, consent toggles, transparent data inventory, 1-click export, and Delete My Data controls.

---

### 22. 📊 Privacy-Preserving Admin Analytics System
- **Data Minimization & Aggregation**: Raw conversation content, individual timelines, memories, triggers, baselines, or emails NEVER enter the analytics database.
- **PII Sanitization Service (`PIISanitizationService`)**: Detects and redacts emails, tokens, IP addresses, names, phone numbers, and URLs from analytics payloads.
- **Minimum Group Size Enforcement (`MIN_ANALYTICS_GROUP_SIZE = 20`)**: Automatically suppresses query filters with $N < 20$ contributing records, returning `"insufficient_data"` without revealing true counts or zero values.
- **Differential Privacy Engine (`DifferentialPrivacyEngine`)**: Applies formal Laplace noise ($\epsilon = 0.5$, $\Delta = 1.0$) to statistical outputs and tracks privacy budget ($B_{max} = 10.0$) per reporting period.
- **Differencing & Repeated Query Protection**: Prevents subtraction attacks ($A - B$) and tracks query budgets to block reconstruction attempts.
- **Role-Based Admin Access Control**: Restricts admin analytics APIs (`GET /api/v1/admin/analytics/*`) to authenticated admins; regular users receive `HTTP 403 Forbidden`.
- **Privacy Observability & Export**: Provides metrics on PII records blocked, small groups suppressed, remaining privacy budget, and 1-click privacy-protected JSON exports.
- **Admin Analytics Dashboard UI**: Interactive dashboard (`/admin/analytics`) with system overview cards, noised emotion & intensity tables, multilingual breakdown, quality scores, and differential privacy status monitoring.

---

### 23. 🛡️ Comprehensive LLM Security Layer
- **Defense-in-Depth Pipeline**: Input validation $\rightarrow$ Prompt injection detection $\rightarrow$ Jailbreak defense $\rightarrow$ Prompt boundary formatting $\rightarrow$ Secret scanning $\rightarrow$ Tool authorization $\rightarrow$ Output validation $\rightarrow$ Audit logging.
- **Direct & Indirect Prompt Injection Protection**: Detects direct instruction overrides (`"Ignore previous instructions"`, `"Act as system"`, `"Reveal system prompt"`) and indirect injection inside PDFs, OCR text, images, or RAG content.
- **Jailbreak & System Prompt Extraction Defense**: Blocks roleplay framing, hypothetical scenarios (`"Pretend you have no rules"`), instruction hierarchy attacks, and secret extraction.
- **Application-Level Output Validation & Secret Scanning (`SecretScanner`)**: Scans LLM output for API keys (`mk_live_`, `AIzaSy...`, `sk-proj...`), JWT tokens, database connection strings, passwords, and system prompts. Redacts detected secrets with `[REDACTED_SECRET]`.
- **Cross-User Data Isolation & Pre-Retrieval Authorization**: Authorization occurs *before* database/memory/RAG retrieval. The LLM NEVER determines access control or authorization.
- **Upload & Media Security (`UploadSecurityService`)**: Validates MIME types, extensions, magic numbers, file sizes (`MAX_UPLOAD_SIZE = 10MB`), sanitizes filenames (prevents path traversal `../`), and isolates uploads outside web root.
- **Tool Authorization & Parameter Validation (`ToolAuthorizationService`)**: Strict tool allowlist (`trusted_knowledge_search`, `user_preference_lookup`, `wellness_content_generator`). Validates arguments and ownership before execution.
- **Multilingual Attack Defense**: Detects injection and jailbreak attacks across English, Telugu, Hindi, Tamil, Kannada, Romanized transliterated forms, and code-mixed inputs.
- **Admin LLM Security Dashboard UI**: Interactive dashboard (`/admin/security`) with system security overview metrics, prompt injection tester, sanitized audit logs, and threat state monitoring.

---

### 24. 🔥 Automated AI Red-Team Testing Framework
- **Red-Team Pipeline**: Test case generator $\rightarrow$ Validator $\rightarrow$ Runner $\rightarrow$ Production Chat API $\rightarrow$ Response capture $\rightarrow$ Multi-evaluators (Rule-based, Safety, Quality) $\rightarrow$ PASS / FAIL / REVIEW $\rightarrow$ Regression detector $\rightarrow$ Deployment gate.
- **10 Adversarial Test Categories (`redteam/tests/*.json`)**: Harmful requests, Crisis scenarios, Medical misinformation, Prompt injection, Manipulation, Toxic language, Ambiguous emotions, Sarcasm, Code-mixed, and Adversarial inputs.
- **Multi-Layer Evaluators (`redteam/evaluators/`)**: `RuleBasedEvaluator`, `SafetyEvaluator`, and `QualityEvaluator` evaluating 7 dimensions (Empathy, Relevance, Helpfulness, Safety, Factual reliability, Repetition, Tone) on a 0–100 scale.
- **Regression Detection & Deployment Gate**: Compares current benchmark runs against approved reference baselines. Automatically blocks model deployment (`BLOCKED`) if average pass rate drops below threshold ($90.0\%$) or safety regressions occur.
- **Admin Red-Team Dashboard UI**: Interactive dashboard (`/admin/redteam`) with benchmark suite runner, metrics cards, run execution table, and reference baseline controls.

---

### 25. 🚨 Conservative Mental Health Safety Risk Engine
- **4-Tier Conservative Classification Architecture**: `SAFE`, `CONCERNING`, `HIGH_RISK`, `IMMEDIATE_RISK` (*Internal Status*: `REVIEW`). Non-diagnostic safety support system.
- **Context-Aware Signal Extraction & Window Tracking (`RiskSignalExtractor`)**: Analyzes 10-turn context window (`RISK_CONTEXT_WINDOW = 10`), extracting structured signals (`suicide_reference`, `self_harm_reference`, `current_danger`, `hopelessness`, `emotional_distress`).
- **Temporal Analysis & Rapid Escalation Detection (`SafetyRiskEngine`)**: Tracks risk transitions across turns and detects rapid escalation (`RISK_CHANGE_THRESHOLD = 30.0`). Conservative de-escalation requires positive contextual evidence before downgrading risk level.
- **Safety Override Engine (`SafetyOverrideEngine`)**: Automatically escalates high-severity rule combinations (`current_danger` + `suicide_reference` $\rightarrow$ `IMMEDIATE_RISK`).
- **Emergency Resource Database & Verified Regional Lookup (`EmergencyResourceService`)**: Maintains verified regional crisis helplines (`US 988`, `IN KIRAN 1800-599-0019`, `UK Samaritans 116 123`, `INTL 112`). Never invents unverified numbers.
- **Non-Diagnostic Safety Response Router (`SafetyResponseRouter`)**: Overrides normal RAG/chat response generation during `HIGH_RISK` or `IMMEDIATE_RISK`. Uses empathetic, calm, non-diagnostic, supportive safety templates.
- **Admin Safety Risk Dashboard UI**: Interactive dashboard (`/admin/safety`) with system overview cards, live risk analyzer console, verified helpline registry table, and safety response flow previews.

---

### 26. 👤 Human-in-the-Loop (HITL) Architecture
- **Authorized, Consent-Aware, Minimal Oversight Architecture**: `ReviewEligibilityEngine` evaluates review cases (`HIGH_RISK`, `IMMEDIATE_RISK`, low confidence $< 0.75$, disagreement) and assigns priority (`CRITICAL`, `HIGH`, `MEDIUM`).
- **Consent Verification (`ReviewConsentService`)**: Checks explicit user consent (`GRANTED`, `DENIED`, `REVOKED`, `EXPIRED`) before exposing conversation context to reviewers. Unconsented cases conceal private conversation text.
- **Server-Side RBAC (`HITLRBACService`)**: Enforces granular role permissions for `SUPPORT_REVIEWER`, `SAFETY_REVIEWER`, `CLINICAL_REVIEWER`, `SENIOR_REVIEWER`, `ADMIN`, and `AUDITOR` roles.
- **Data Model Separation & Async Interventions**: Original AI assessments are NEVER overwritten by human decisions. Immediate safety interventions (`IMMEDIATE_RISK`) NEVER wait for human review (review happens asynchronously).
- **Immutable Audit Trail (`HITLAuditService`)**: Appends records for every reviewer access event, context expansion, approval, rejection, and escalation without raw PII.
- **Admin HITL Review Dashboard UI**: Interactive dashboard (`/admin/review`) with queue metrics, minimal context inspector, consent verification status, decision forms, annotations, escalation controls, and immutable audit logs.

---

### 27. 📊 Emotional Pattern Visualization System
- **Privacy-First, Self-Awareness Tracking Architecture**: `EmotionalPatternService` aggregates emotion distribution, tracked intensity trends (0–100 scale over time), mood trends, trigger patterns, habit correlations, wellness activity participation, and conversation frequency.
- **Non-Diagnostic Safety Boundaries**: Features non-diagnostic terminology ("Your tracked emotional patterns", "Observed trends", "AI-generated pattern summary"). Never claims a medical diagnosis or clinical assessment.
- **Correlation vs Causation Enforcement**: Habit vs emotion correlations (Pearson / Spearman $r \in [-1.0, 1.0]$ with `MIN_CORRELATION_OBSERVATIONS = 7`) explicitly state *"Association does not establish cause and effect"*.
- **AI-Inferred vs User-Confirmed Triggers**: Clearly demarcates AI-inferred triggers from user-confirmed ones, allowing users to confirm, edit, or delete tags.
- **Complete User Data Controls & Exports**: Edit records, delete individual records, bulk-delete date ranges, reset visualization history, and export data in JSON or CSV format.
- **Emotional Pattern Dashboard UI**: Interactive dashboard (`/dashboard/emotional-patterns`) with period overview cards, non-diagnostic safety guidance banners, emotion distribution bars, intensity trend lines, trigger breakdowns, habit correlation cards, multi-metric timelines, and user data control actions.

---

### 28. 🧪 Emotion Model Research Laboratory
- **Reproducible Multi-Architecture Research Environment**: `ResearchLabService` evaluates 8 emotion-classification model architectures across Classical Deep Learning (`CNN`, `LSTM`, `BiLSTM`, `CNN-LSTM`) and Transformers (`BERT`, `DistilBERT`, `RoBERTa`, `DeBERTa`).
- **Unified Model Protocol**: Standardized interface for `train()`, `evaluate()`, `predict()`, `save_checkpoint()`, `get_model_size()`, `get_memory_usage()`, and `benchmark_latency()`.
- **Immutable Dataset Registry & Leakage Prevention**: Manages versioned datasets (`v1.2`, SHA-256 checksums, 80/10/10 splits) ensuring reproducible evaluation without test-set leakage.
- **Predictive & Resource Performance Metrics**: Calculates Accuracy, Precision, Recall, Macro F1, Weighted F1, P95/P99 Latency, Model Parameter Count (M), File Size (MB), Peak Memory (MB), and 6x6 Confusion Matrices.
- **Exact Reproducibility Engine & Statistical Analysis**: Restores random seeds (42) and configurations to verify exact reproducibility (`EXACT_MATCH`) and evaluates Pareto trade-offs.
- **Research Laboratory Dashboard UI**: Interactive dashboard (`/research/emotion-models`) with executive summary cards, model family filter tabs, 8-architecture comparison table, interactive experiment runner & batch submitter, confusion matrix inspector, and exact reproducibility controls.

---

### 29. 🔍 Automated Error Analysis & Model Improvement System
- **8 Core Error Categories**: `ErrorAnalysisService` automatically identifies False Positives, False Negatives, Confused Emotion Pairs, Sarcasm Failures, Negation Failures, Code-Mixed Language Failures, Short-Message Failures, and Ambiguous-Message Failures.
- **Privacy Redaction Engine (`ErrorPrivacyRedactor`)**: Automatically redacts emails (`[REDACTED_EMAIL]`), phone numbers (`[REDACTED_PHONE]`), URLs (`[REDACTED_URL]`), and sensitive tokens before displaying representative error examples.
- **Actionable Research Recommendations & Regression Tracking**: Generates priority-ranked research hypotheses (`HIGH`, `MEDIUM`, `LOW`) with potential technical explanations and suggested actions while detecting error regressions across model iterations.
- **Error Analysis Dashboard UI**: Interactive dashboard (`/research/error-analysis`) with summary overview cards, error category breakdown bars, confusion pair tables, PII-redacted representative examples drawer, and actionable research recommendations.

---

### 30. ⌚ Wearable Device Integration & Telemetry Correlation
- **Provider Abstraction Factory**: Unified provider layer supporting **Google Health Connect**, **Apple Health**, **Fitbit**, and **Garmin**.
- **Telemetry Ingestion**: Ingests Heart Rate (BPM), Sleep duration (hours), Heart Rate Variability (HRV ms), and Step counts.
- **Pearson $r$ Correlation Engine**: Correlates biometric physiological signals with text/visual emotion scores ($r \in [-1.0, 1.0]$).
- **Personal Baselines**: Computes 30-day baseline vs 7-day recent average vs deviations.
- **Privacy Controls**: 1-click provider disconnection and complete telemetry data purge APIs.

---

### 31. 📷 Image-Based Facial Emotion Recognition
- **Multi-Cascade OpenCV Face Detector**: Frontal Default, Frontal Alt 2, Profile, and Center ROI cascades.
- **7-Class Expression Classifier**: Predicts probability distribution across `Happy`, `Sad`, `Angry`, `Fear`, `Surprise`, `Disgust`, and `Neutral`.
- **Text + Image Multimodal Fusion**: Weighted fusion of text sentiment and visual expression with agreement/disagreement detection.

---

### 32. 🔮 Hybrid AI & Self-Evaluation Architecture
- **Hybrid AI Router**: Combines rule-based reasoning with deep learning transformers and safety-critical expert rules.
- **AI Self-Evaluation**: Automated quality scoring, hallucination detection, empathy checking, medical safety validation, and prompt refinement loop.

---

### 33. 🛡️ Enterprise Security & Health Data Privacy
- **Encryption & Access Audit**: Field-level sensitive data encryption and comprehensive audit logging (`audit_logs`).
- **Secure Backups & Data Retention**: Automated database backups and user consent management.
- **Role-Based Access Control**: Granular user permission roles.

---

### 34. 📈 AI Risk Prediction & Anonymized Population Analytics
- **Risk Prediction Dashboard**: Predicts stress and burnout risk probabilities, forecasts emotional decline, explains contributing factors, and provides preventive suggestions.
- **Anonymized Population Analytics**: Aggregates emotion trends across user cohorts, strips PII, and generates reports by age group, region, and time period.

---

## 🛠️ Tech Stack & Architecture

```text
                     MindCare AI Client (Next.js 14 / TypeScript)
                                         │
                                         ▼
                     FastAPI REST Backend (Python 3.10 / PyTorch)
                                         │
       ┌───────────────────┬─────────────┼─────────────┬───────────────────┐
       ▼                   ▼             ▼             ▼                   ▼
Video Emotion        Multimodal     Companion     Wellness Content     Wearable Health
  Analysis          Fusion Engine  Personality       Generator           Correlation
       │                   │             │             │                   │
       └───────────────────┴─────────────┼─────────────┴───────────────────┘
                                         ▼
                             SQLite DB / SQLAlchemy ORM
```

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Recharts, Lucide Icons, Axios.
- **Backend**: FastAPI, Python 3.10, PyTorch 2.6 (CPU/GPU), OpenCV 4.11, Pillow, SQLite + SQLAlchemy ORM, JWT (Jose + bcrypt).
- **AI & ML Models**:
  - **PyTorch MoodLSTM**: 2-layer Recurrent Neural Network sequence model.
  - **Emotion Classification**: Scikit-Learn Multilingual & Monolingual TF-IDF + `LinearSVC` classifiers.
  - **Transformers**: HuggingFace (`distilroberta-base`).
  - **Computer Vision**: OpenCV Multi-cascade Face Detector & IoU Face Tracker.
  - **Generative Persona**: Google Gemini 1.5 Flash API.

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

### 1. Backend Setup & Local Server (Port 8000)

```bash
# Navigate to backend directory
cd backend

# Activate Python Virtual Environment (Windows)
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server gracefully on port 8000
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

```
- **Interactive Swagger API Documentation**: `http://localhost:8000/docs`
- **Health Check Endpoint Verification**: `http://localhost:8000/health` (returns `{"status": "healthy"}`)
- **Troubleshooting Connection Errors**: If the frontend displays *"Cannot connect to the server. Please ensure the backend server is running on port 8000"*, ensure the Uvicorn process is running on port 8000 and verify connectivity via `curl http://127.0.0.1:8000/health`.

---

### 2. Frontend Setup & Web Application (Port 3000)

```bash
# Navigate to frontend directory
cd frontend

# Install Node modules
npm install

# Run Next.js development server
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 🧪 Running Automated Unit & Integration Tests

Run PyTest suites across all modules in `backend/`:

```bash
cd backend
.\venv\Scripts\activate

# Test Facial Emotion Recognition
python -m pytest tests/test_facial_emotion.py

# Test Wearable Integration & Pearson Correlation Engine
python -m pytest tests/test_wearable_integration.py

# Test Video-Based Emotion Analysis & Timeline
python -m pytest tests/test_video_emotion.py

# Test Multimodal Emotion Fusion Engine
python -m pytest tests/test_emotion_fusion.py

# Test Adaptive AI Companion Personality System
python -m pytest tests/test_companion_personality.py

# Test Personalized Wellness Content Generator
python -m pytest tests/test_wellness_generator.py

# Test AI Emotional Storytelling Engine
python -m pytest tests/test_story_engine.py

# Test Automated MLOps Pipeline
python -m pytest tests/test_mlops_pipeline.py

# Test AI Monitoring and Observability Platform
python -m pytest tests/test_monitoring_platform.py

# Test A/B Testing and Experimentation Platform
python -m pytest tests/test_experimentation_engine.py

# Test API Marketplace and Developer Platform
python -m pytest tests/test_api_marketplace.py

# Test AI Emotion Detection Benchmarking Suite
python -m pytest tests/test_benchmarking_suite.py

# Test Dataset Annotation Platform
python -m pytest tests/test_dataset_annotation.py

# Test Emotion Intensity Detection Module
python -m pytest tests/test_emotion_intensity.py

# Test Emotion Transition Detection System
python -m pytest tests/test_emotion_transitions.py

# Test Emotional Trigger Detection Module
python -m pytest tests/test_emotional_triggers.py

# Test Automated Conversation Quality Evaluation System
python -m pytest tests/test_conversation_evaluation.py

# Test Hallucination and Unsupported-Claim Detection Layer
python -m pytest tests/test_hallucination_detection.py

# Test Emotion-Aware Retrieval-Augmented Generation (RAG) Architecture
python -m pytest tests/test_emotion_rag.py

# Test Personal Emotional Baseline System
python -m pytest tests/test_personal_baseline.py

# Test User Response-Preference Learning System
python -m pytest tests/test_response_preferences.py

# Test Multilingual and Code-Mixed Conversational AI Platform
python -m pytest tests/test_multilingual_platform.py

# Test Privacy-First and Data-Minimization Architecture
python -m pytest tests/test_privacy_architecture.py

# Test Privacy-Preserving Admin Analytics System
python -m pytest tests/test_privacy_analytics.py

# Test Comprehensive LLM Security Layer
python -m pytest tests/test_llm_security.py

# Test Automated AI Red-Team Testing Framework
python -m pytest tests/test_redteam.py

# Test Conservative Mental Health Safety Risk Engine
python -m pytest tests/test_safety_risk_engine.py

# Test Human-in-the-Loop (HITL) Architecture
python -m pytest tests/test_hitl_architecture.py

# Test Emotional Pattern Visualization System
python -m pytest tests/test_emotional_patterns.py

# Test Emotion Model Research Laboratory
python -m pytest tests/test_emotion_research_lab.py

# Test Error Analysis and Model Improvement System
python -m pytest tests/test_error_analysis.py
```

# Test Role-Based Access Control (RBAC) & Multi-Role Security Suite
python -m pytest tests/test_rbac_security.py -v

# Test Emotional Wellness Games & Dataset Suite
python -m pytest tests/test_games.py -v
```

Check TypeScript compilation on frontend:

```bash
cd frontend
npx tsc --noEmit
```

---

## 🛡️ Enterprise Multi-Role Access Control (RBAC) System

MindCare AI incorporates an enterprise-grade, production-oriented Role-Based Access Control (RBAC) architecture designed around strict HIPAA and GDPR privacy guarantees, zero-trust backend authorization, and granular resource ownership protection.

### 👥 User Roles & Permission Matrix

| Role | Primary Responsibilities | Core Permissions | Key Restrictions |
| :--- | :--- | :--- | :--- |
| **Guest / Public Visitor** | Exploration & Onboarding | `public:read`, `auth:register`, `auth:login` | Cannot access private chats, journals, or privileged APIs |
| **Registered User** | Personalized Emotional Wellness | `chat:*`, `journal:*`, `mood:*`, `consent:*`, `data:export`, `account:delete` | Isolated to own records; cross-user ID tampering returns `404 Not Found` |
| **Healthcare Professional** | Client Support & Consultation | `professional:profile`, `professional:clients:read`, `professional:notes:create` | Minimum necessary access only; requires `VERIFIED` status + active consent |
| **Administrator** | Governance & Operations | `admin:dashboard`, `admin:users:manage`, `admin:professionals:verify`, `admin:audit:read` | **Zero automatic access to private chats, journals, or emotional history** |
| **System Owner / Super Admin** | Platform Trust & Recovery | `owner:admins:manage`, `owner:security:configure`, `owner:audit:read` | MFA-enforced, single-owner bootstrap, audited privileged operations |

### 🔐 Healthcare Professional Verification Lifecycle
Healthcare Professionals transition through explicit lifecycle states:
- `PENDING`: Application submitted with license credentials; cannot access client records.
- `VERIFIED`: Approved by Administrator after credential validation; unlocks assigned consented client summaries.
- `REJECTED`: Application denied with an audited reason.
- `SUSPENDED`: Temporarily revoked due to licensing or policy review; immediate access termination.

### 🔑 Security & Authentication Architecture
- **Password Protection**: Multi-round Bcrypt with SHA-256 pre-hashing to protect against long-password truncation vulnerabilities.
- **Progressive Account Lockout**: 5 consecutive failed attempts trigger an automated 15-minute account lockout with progressive delays.
- **Session Security**: 30-minute JWT access tokens paired with rotating refresh tokens stored with SHA-256 database hashing.
- **Zero-Dependency TOTP MFA**: RFC 6238-compliant Time-based One-Time Password authentication for privileged administrator and system owner roles.
- **Audit Logging**: Tamper-evident, zero-PHI audit trail scrubbing all passwords, session tokens, and clinical conversation text before persistence.

### ⚡ System Owner Provisioning
System Owner accounts are provisioned exclusively through audited server-side utilities or environment configurations:
```bash
# Bootstrap or promote a System Owner account
python scripts/bootstrap_owner.py --email rsumanth4377@gmail.com --password "MindCare#Owner2026!" --username rsumanth4377 --force
```

---

## 📄 License & Ethical Use

MindCare AI is developed for non-clinical research, educational capstones, and ethical AI applications. It adheres strictly to data minimization, user consent, local privacy, and non-diagnostic mental health safeguards.
