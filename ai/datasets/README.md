# MindCare AI -- Local Datasets Repository

All required emotion, sentiment, and mental health conversational datasets are downloaded and stored locally in this directory.

## Datasets Summary & Manifest

| Dataset | Local Path | Splits / Format | Total Records | Description |
|---|---|---|---|---|
| **GoEmotions** | `ai/datasets/go_emotions/` | CSV & TSV (`train`, `dev`, `test`) | 54263 | 28 fine-grained emotion categories mapped to 10 therapeutic classes |
| **Empathetic Dialogues** | `ai/datasets/empathetic_dialogues/` | CSV (`train`, `valid`, `test`) | 88687 | 25,000+ empathetic multi-turn conversation turns |
| **Dair-AI Emotion** | `ai/datasets/emotion/` | Parquet & CSV (`train`, `validation`, `test`) | 0 | 6 baseline emotion categories (sadness, joy, love, anger, fear, surprise) |
| **Mental Health Counseling QA** | `ai/datasets/mental_health_qa/` | Parquet & CSV | 0 | Clinical Q&A corpus for RAG, crisis interception, & empathetic prompt tuning |

## MindCare AI Pipeline Usage
1. **GoEmotions**: Fine-tuning HuggingFace DistilRoBERTa (`j-hartmann/emotion-english-distilroberta-base`) and BiLSTM emotion classification heads.
2. **Empathetic Dialogues**: Few-shot prompt engineering examples and RAG context for Gemini 1.5 Flash empathetic responses.
3. **Dair-AI Emotion**: Standardized 6-class baseline evaluation benchmark.
4. **Mental Health Counseling QA**: Grounding knowledge base for crisis interceptor, emotion refinement, and stress scoring.
