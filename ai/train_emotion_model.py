"""
MindCare AI — Custom Emotion Model Trainer
Trains a calibrated 10-class therapeutic emotion classifier using local GoEmotions
and Dair-AI Emotion datasets.

Outputs 10 Therapeutic Categories:
- Happy, Sad, Angry, Fear, Anxiety, Stress, Lonely, Hopeful, Excited, Neutral

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
from sklearn.linear_model import LogisticRegression
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

# Keywords for fine-grained subcategory refining
_LONELY_KWS = ["alone", "lonely", "nobody", "no one", "isolated", "abandoned", "empty", "miss him", "miss her"]
_ANXIETY_KWS = ["anxious", "anxiety", "panic", "nervous", "worry", "worried", "overthink", "terrified", "scared"]
_STRESS_KWS = ["stressed", "overwhelmed", "exhausted", "pressure", "too much", "can't cope", "burnout", "tired"]
_HOPEFUL_KWS = ["hope", "hopeful", "better", "improve", "looking forward", "optimistic", "believe", "healing"]
_EXCITED_KWS = ["excited", "amazing", "great", "fantastic", "thrilled", "can't wait", "awesome", "yay"]

# Map GoEmotions 28 labels to base categories
GO_LABEL_MAP = {
    0:  "Happy",    # admiration
    1:  "Happy",    # amusement
    2:  "Angry",    # anger
    3:  "Angry",    # annoyance
    4:  "Happy",    # approval
    5:  "Happy",    # caring
    6:  "Stress",   # confusion -> Stress/Anxiety adjacent
    7:  "Happy",    # curiosity
    8:  "Hopeful",  # desire
    9:  "Sad",      # disappointment
    10: "Sad",      # disapproval
    11: "Angry",    # disgust
    12: "Neutral",  # embarrassment
    13: "Excited",  # excitement
    14: "Fear",     # fear
    15: "Happy",    # gratitude
    16: "Sad",      # grief
    17: "Happy",    # joy
    18: "Happy",    # love
    19: "Anxiety",  # nervousness
    20: "Hopeful",  # optimism
    21: "Happy",    # pride
    22: "Neutral",  # realization
    23: "Neutral",  # relief
    24: "Sad",      # remorse
    25: "Sad",      # sadness
    26: "Excited",  # surprise
    27: "Neutral"   # neutral
}

DAIR_LABEL_MAP = {
    "sadness":  "Sad",
    "joy":      "Happy",
    "love":     "Happy",
    "anger":    "Angry",
    "fear":     "Fear",
    "surprise": "Excited"
}

def refine_label(text: str, base_cat: str) -> str:
    """Refine base category into 10 therapeutic subcategories based on text semantics."""
    text_lower = text.lower()
    
    if base_cat in ["Sad", "Neutral"]:
        if any(kw in text_lower for kw in _LONELY_KWS):
            return "Lonely"
            
    if base_cat in ["Fear", "Neutral"]:
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
        
        # Take primary emotion ID from comma-separated list
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

def load_data():
    print("Loading training, validation, and test datasets...")
    
    # 1. Load GoEmotions
    go_dir = os.path.join(DATASETS_DIR, "go_emotions")
    train_t, train_l = parse_go_emotions_file(os.path.join(go_dir, "go_emotions_train.csv"))
    dev_t, dev_l = parse_go_emotions_file(os.path.join(go_dir, "go_emotions_dev.csv"))
    test_t, test_l = parse_go_emotions_file(os.path.join(go_dir, "go_emotions_test.csv"))
    
    # 2. Load Dair-AI Emotion
    dair_dir = os.path.join(DATASETS_DIR, "emotion")
    d_train_t, d_train_l = parse_dair_emotion_file(os.path.join(dair_dir, "emotion_train.csv"))
    d_val_t, d_val_l = parse_dair_emotion_file(os.path.join(dair_dir, "emotion_validation.csv"))
    d_test_t, d_test_l = parse_dair_emotion_file(os.path.join(dair_dir, "emotion_test.csv"))
    
    # Combine train + dev for maximum training coverage
    all_train_texts = train_t + dev_t + d_train_t + d_val_t
    all_train_labels = train_l + dev_l + d_train_l + d_val_l
    
    all_test_texts = test_t + d_test_t
    all_test_labels = test_l + d_test_l
    
    print(f"Total Combined Training Samples: {len(all_train_texts)}")
    print(f"Total Combined Test Samples:     {len(all_test_texts)}")
    
    return all_train_texts, all_train_labels, all_test_texts, all_test_labels

def main():
    print("=" * 65)
    print(" MindCare AI — Training Custom 10-Class Emotion Model")
    print("=" * 65)
    
    train_texts, train_labels, test_texts, test_labels = load_data()
    
    print("\n[1/3] Extracting TF-IDF Features...")
    vectorizer = TfidfVectorizer(
        ngram_range=(1, 2),
        max_features=35000,
        sublinear_tf=True,
        min_df=2
    )
    X_train = vectorizer.fit_transform(train_texts)
    y_train = np.array(train_labels)
    
    X_test = vectorizer.transform(test_texts)
    y_test = np.array(test_labels)
    
    print(f"Feature matrix shape: {X_train.shape}")
    
    print("\n[2/3] Training Calibrated Classifier...")
    base_clf = LinearSVC(class_weight='balanced', C=1.0, max_iter=2000, random_state=42)
    clf = CalibratedClassifierCV(estimator=base_clf, method='sigmoid', cv=3)
    clf.fit(X_train, y_train)
    
    print("\n[3/3] Evaluating Model on Test Set...")
    y_pred = clf.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    macro_f1 = f1_score(y_test, y_pred, average='macro')
    weighted_f1 = f1_score(y_test, y_pred, average='weighted')
    
    print(f"\nTest Accuracy:        {acc * 100:.2f}%")
    print(f"Test Macro F1-Score:   {macro_f1:.4f}")
    print(f"Test Weighted F1:     {weighted_f1:.4f}")
    print("\nDetailed Classification Report:")
    print(classification_report(y_test, y_pred, target_names=CATEGORIES, zero_division=0))
    
    # Save artifacts
    os.makedirs(ARTIFACTS_DIR, exist_ok=True)
    model_path = os.path.join(ARTIFACTS_DIR, "emotion_classifier.joblib")
    vec_path = os.path.join(ARTIFACTS_DIR, "tfidf_vectorizer.joblib")
    meta_path = os.path.join(ARTIFACTS_DIR, "model_meta.json")
    
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
        "vocab_size": len(vectorizer.vocabulary_)
    }
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)
        
    print("\n" + "=" * 65)
    print(" ✅ MODEL TRAINING AND EXPORT COMPLETED SUCCESSFULLY!")
    print(f" Model Classifier: {model_path} ({os.path.getsize(model_path)} bytes)")
    print(f" TF-IDF Vectorizer: {vec_path} ({os.path.getsize(vec_path)} bytes)")
    print(f" Metadata:          {meta_path}")
    print("=" * 65)

if __name__ == "__main__":
    main()
