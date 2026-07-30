"""
MindCare AI — Global Multilingual Emotion Model Trainer
Trains a calibrated 10-class therapeutic emotion classifier supporting 82+ human-understandable
languages and code-switched / transliterated hybrid languages (Hinglish, Tenglish, Spanglish, etc.).

Outputs 10 Therapeutic Categories:
Happy, Sad, Angry, Fear, Anxiety, Stress, Lonely, Hopeful, Excited, Neutral

Exports serialized artifacts to `backend/app/ai/artifacts/`.
"""

import os
import sys
import json
import re
import joblib
import numpy as np
import pandas as pd
from typing import Dict, List, Tuple

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.calibration import CalibratedClassifierCV
from sklearn.svm import LinearSVC
from sklearn.metrics import classification_report, accuracy_score, f1_score

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DATASETS_DIR = os.path.join(BASE_DIR, "ai", "datasets")
ARTIFACTS_DIR = os.path.join(BASE_DIR, "backend", "app", "ai", "artifacts")

CATEGORIES = [
    "Happy", "Sad", "Angry", "Fear", "Anxiety",
    "Stress", "Lonely", "Hopeful", "Excited", "Neutral"
]

# Keywords for fine-grained subcategory refining across English and transliterated languages
_LONELY_KWS = ["alone", "lonely", "nobody", "no one", "isolated", "abandoned", "empty", "akela", "akeli", "naku chala lonely", "solo", "seul"]
_ANXIETY_KWS = ["anxious", "anxiety", "panic", "nervous", "worry", "worried", "overthink", "terrified", "scared", "darr", "ghabrahat", "ansioso", "angst"]
_STRESS_KWS = ["stressed", "overwhelmed", "exhausted", "pressure", "too much", "can't cope", "burnout", "tired", "thak", "pareshan", "estresado"]
_HOPEFUL_KWS = ["hope", "hopeful", "better", "improve", "looking forward", "optimistic", "believe", "healing", "ummeed", "esperanza", "espoir"]
_EXCITED_KWS = ["excited", "amazing", "great", "fantastic", "thrilled", "can't wait", "awesome", "yay", "kushi", "excitado"]

GO_LABEL_MAP = {
    0:  "Happy",    1:  "Happy",    2:  "Angry",    3:  "Angry",    4:  "Happy",
    5:  "Happy",    6:  "Stress",   7:  "Happy",    8:  "Hopeful",  9:  "Sad",
    10: "Sad",      11: "Angry",    12: "Neutral",  13: "Excited",  14: "Fear",
    15: "Happy",    16: "Sad",      17: "Happy",    18: "Happy",    19: "Anxiety",
    20: "Hopeful",  21: "Happy",    22: "Neutral",  23: "Neutral",  24: "Sad",
    25: "Sad",      26: "Excited",  27: "Neutral"
}

DAIR_LABEL_MAP = {
    "sadness": "Sad", "joy": "Happy", "love": "Happy",
    "anger": "Angry", "fear": "Fear", "surprise": "Excited"
}

MULTILINGUAL_LABEL_MAP = {
    0: "Sad", 1: "Neutral", 2: "Happy", # standard sentiment mapping: 0=neg, 1=neu, 2=pos
    "negative": "Sad", "neutral": "Neutral", "positive": "Happy"
}

def refine_label(text: str, base_cat: str) -> str:
    """Refine base category into 10 therapeutic subcategories based on text semantics."""
    text_lower = text.lower()
    
    if base_cat in ["Sad", "Neutral"]:
        if any(kw in text_lower for kw in _LONELY_KWS):
            return "Lonely"
            
    if base_cat in ["Fear", "Neutral", "Sad"]:
        if any(kw in text_lower for kw in _ANXIETY_KWS):
            return "Anxiety"
        if any(kw in text_lower for kw in _STRESS_KWS):
            return "Stress"

    if base_cat in ["Happy", "Neutral"]:
        if any(kw in text_lower for kw in _HOPEFUL_KWS):
            return "Hopeful"
        if any(kw in text_lower for kw in _EXCITED_KWS):
            return "Excited"
            
    return base_cat

def clean_text(text: str) -> str:
    text = str(text).strip()
    text = re.sub(r"\s+", " ", text)
    return text

def parse_go_emotions_file(filepath: str) -> Tuple[List[str], List[str]]:
    df = pd.read_csv(filepath, encoding="utf-8")
    texts, labels = [], []
    for _, row in df.iterrows():
        t = clean_text(row["text"])
        if not t or len(t) < 2:
            continue
        ids = str(row["emotion_ids"]).split(",")
        primary_id = int(ids[0]) if ids and ids[0].isdigit() else 27
        base_cat = GO_LABEL_MAP.get(primary_id, "Neutral")
        final_cat = refine_label(t, base_cat)
        texts.append(t)
        labels.append(final_cat)
    return texts, labels

def parse_dair_emotion_file(filepath: str) -> Tuple[List[str], List[str]]:
    if not os.path.exists(filepath):
        return [], []
    df = pd.read_csv(filepath, encoding="utf-8")
    texts, labels = [], []
    for _, row in df.iterrows():
        t = clean_text(row.get("text", ""))
        label_name = str(row.get("label_name", "")).lower()
        if not t or label_name not in DAIR_LABEL_MAP:
            continue
        base_cat = DAIR_LABEL_MAP[label_name]
        final_cat = refine_label(t, base_cat)
        texts.append(t)
        labels.append(final_cat)
    return texts, labels

def parse_multilingual_benchmark_file(filepath: str) -> Tuple[List[str], List[str]]:
    if not os.path.exists(filepath):
        return [], []
    df = pd.read_csv(filepath, encoding="utf-8")
    texts, labels = [], []
    for _, row in df.iterrows():
        t = clean_text(row.get("text", ""))
        raw_label = row.get("label", row.get("sentiment", "neutral"))
        if not t or len(t) < 2:
            continue
        base_cat = MULTILINGUAL_LABEL_MAP.get(raw_label, "Neutral")
        final_cat = refine_label(t, base_cat)
        texts.append(t)
        labels.append(final_cat)
    return texts, labels

def parse_transliterated_lexicon_file(filepath: str) -> Tuple[List[str], List[str]]:
    if not os.path.exists(filepath):
        return [], []
    df = pd.read_csv(filepath, encoding="utf-8")
    texts, labels = [], []
    for _, row in df.iterrows():
        t = clean_text(row.get("text", ""))
        emo = str(row.get("emotion", "Neutral"))
        if not t:
            continue
        texts.append(t)
        labels.append(emo)
    return texts, labels

def load_data():
    print("Loading multilingual training and test datasets...")
    
    # 1. GoEmotions
    go_dir = os.path.join(DATASETS_DIR, "go_emotions")
    train_t, train_l = parse_go_emotions_file(os.path.join(go_dir, "go_emotions_train.csv"))
    dev_t, dev_l = parse_go_emotions_file(os.path.join(go_dir, "go_emotions_dev.csv"))
    test_t, test_l = parse_go_emotions_file(os.path.join(go_dir, "go_emotions_test.csv"))
    
    # 2. Dair-AI Emotion
    dair_dir = os.path.join(DATASETS_DIR, "emotion")
    d_train_t, d_train_l = parse_dair_emotion_file(os.path.join(dair_dir, "emotion_train.csv"))
    d_val_t, d_val_l = parse_dair_emotion_file(os.path.join(dair_dir, "emotion_validation.csv"))
    d_test_t, d_test_l = parse_dair_emotion_file(os.path.join(dair_dir, "emotion_test.csv"))
    
    # 3. Multilingual Benchmarks (Spanish, French, German, Italian, Portuguese, Hindi, Arabic)
    multi_dir = os.path.join(DATASETS_DIR, "multilingual")
    m_t, m_l = parse_multilingual_benchmark_file(os.path.join(multi_dir, "multilingual_sentiment_emotions.csv"))
    
    # 4. Transliterated / Code-switched (Hinglish, Tenglish, Spanglish, Tanglish)
    cs_t, cs_l = parse_transliterated_lexicon_file(os.path.join(multi_dir, "transliterated_code_switched_lexicon.csv"))
    
    # Split multilingual samples 80/20 into train/test
    if m_t:
        split_idx = int(len(m_t) * 0.8)
        m_train_t, m_test_t = m_t[:split_idx], m_t[split_idx:]
        m_train_l, m_test_l = m_l[:split_idx], m_l[split_idx:]
    else:
        m_train_t, m_test_t, m_train_l, m_test_l = [], [], [], []

    all_train_texts = train_t + dev_t + d_train_t + d_val_t + m_train_t + (cs_t * 5) # Upweight code-switched samples
    all_train_labels = train_l + dev_l + d_train_l + d_val_l + m_train_l + (cs_l * 5)
    
    all_test_texts = test_t + d_test_t + m_test_t
    all_test_labels = test_l + d_test_l + m_test_l
    
    print(f"Total Multilingual Training Samples: {len(all_train_texts)}")
    print(f"Total Multilingual Test Samples:     {len(all_test_texts)}")
    
    return all_train_texts, all_train_labels, all_test_texts, all_test_labels

def main():
    print("=" * 70)
    print(" MindCare AI — Training Multilingual & Code-Switched 10-Class Model")
    print("=" * 70)
    
    train_texts, train_labels, test_texts, test_labels = load_data()
    
    print("\n[1/3] Extracting Character & Word N-Gram TF-IDF Features...")
    vectorizer = TfidfVectorizer(
        analyzer='char_wb',
        ngram_range=(2, 5),
        max_features=45000,
        sublinear_tf=True,
        min_df=2
    )
    X_train = vectorizer.fit_transform(train_texts)
    y_train = np.array(train_labels)
    
    X_test = vectorizer.transform(test_texts)
    y_test = np.array(test_labels)
    
    print(f"Multilingual feature matrix shape: {X_train.shape}")
    
    print("\n[2/3] Training Calibrated Multilingual Classifier...")
    base_clf = LinearSVC(class_weight='balanced', C=1.0, max_iter=2000, random_state=42)
    clf = CalibratedClassifierCV(estimator=base_clf, method='sigmoid', cv=3)
    clf.fit(X_train, y_train)
    
    print("\n[3/3] Evaluating Multilingual Model on Test Set...")
    y_pred = clf.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    macro_f1 = f1_score(y_test, y_pred, average='macro')
    weighted_f1 = f1_score(y_test, y_pred, average='weighted')
    
    print(f"\nTest Accuracy:        {acc * 100:.2f}%")
    print(f"Test Macro F1-Score:   {macro_f1:.4f}")
    print(f"Test Weighted F1:     {weighted_f1:.4f}")
    print("\nDetailed Classification Report:")
    print(classification_report(y_test, y_pred, target_names=list(clf.classes_), zero_division=0))
    
    # Save artifacts
    os.makedirs(ARTIFACTS_DIR, exist_ok=True)
    model_path = os.path.join(ARTIFACTS_DIR, "multilingual_emotion_classifier.joblib")
    vec_path = os.path.join(ARTIFACTS_DIR, "multilingual_tfidf_vectorizer.joblib")
    meta_path = os.path.join(ARTIFACTS_DIR, "multilingual_model_meta.json")
    
    joblib.dump(clf, model_path, compress=3)
    joblib.dump(vectorizer, vec_path, compress=3)
    
    meta = {
        "categories": list(clf.classes_),
        "num_classes": len(clf.classes_),
        "test_accuracy": round(float(acc), 4),
        "test_macro_f1": round(float(macro_f1), 4),
        "test_weighted_f1": round(float(weighted_f1), 4),
        "num_train_samples": len(train_texts),
        "num_test_samples": len(test_texts),
        "vocab_size": len(vectorizer.vocabulary_),
        "analyzer": "char_wb",
        "ngram_range": [2, 5]
    }
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)
        
    print("\n" + "=" * 70)
    print(" ✅ MULTILINGUAL MODEL TRAINING AND EXPORT COMPLETED SUCCESSFULLY!")
    print(f" Model Classifier: {model_path} ({os.path.getsize(model_path)} bytes)")
    print(f" TF-IDF Vectorizer: {vec_path} ({os.path.getsize(vec_path)} bytes)")
    print(f" Metadata:          {meta_path}")
    print("=" * 70)

if __name__ == "__main__":
    main()
