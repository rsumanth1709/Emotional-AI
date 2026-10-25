"""
MindCare AI — Model Training & Calibration Script
Trains, evaluates, calibrates, and exports the 10-class Multilingual & Monolingual Emotion Classifiers
to backend/app/ai/artifacts.
"""
import os
import sys
import json
from pathlib import Path
from datetime import datetime

# Ensure backend root is in sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

import joblib
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import LinearSVC
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import classification_report, accuracy_score, f1_score
from sklearn.model_selection import train_test_split

ARTIFACTS_DIR = os.path.join(backend_dir, "app", "ai", "artifacts")
os.makedirs(ARTIFACTS_DIR, exist_ok=True)

# Comprehensive 10-Class Therapeutic Training Dataset
TRAINING_DATA = [
    # ── Happy ──
    ("I am so happy, joyful, and grateful today!", "Happy"),
    ("I am very happy", "Happy"),
    ("I am happy", "Happy"),
    ("I feel very happy today!", "Happy"),
    ("Feeling very happy and peaceful.", "Happy"),
    ("Everything is going wonderfully well!", "Happy"),
    ("Naaku chala kushi ga undhi ee roju!", "Happy"),
    ("Bohot khush hoon aaj, sab thik hai!", "Happy"),
    ("Me siento muy feliz y agradecido hoy!", "Happy"),
    ("Je suis tellement heureux et reconnaissant!", "Happy"),
    ("Feeling blessed and smiling all day!", "Happy"),
    ("Had a fantastic time with my family!", "Happy"),
    ("Thank you.", "Happy"),
    ("Thank you so much for your help!", "Happy"),
    ("Thanks a lot, I appreciate it!", "Happy"),

    # ── Excited ──
    ("Can't wait for the trip tomorrow! Super thrilled and excited!", "Excited"),
    ("This new project is incredible! So excited!", "Excited"),
    ("Chala excited ga unna brother!", "Excited"),
    ("Bohot maza aane wala hai, so excited!", "Excited"),
    ("Estoy muy emocionado por el concierto!", "Excited"),
    ("Je suis tellement excite pour ce voyage!", "Excited"),
    ("Got selected for the job! Woohoo!", "Excited"),

    # ── Hopeful ──
    ("I believe things will get better step by step.", "Hopeful"),
    ("Looking forward to a brighter future ahead.", "Hopeful"),
    ("Ummeed hai sab thik ho jayega.", "Hopeful"),
    ("Nammakam undhi, thondaralone thagguthundhi.", "Hopeful"),
    ("Tengo esperanza en un futuro mejor.", "Hopeful"),
    ("J'ai l'espoir d'un avenir meilleur.", "Hopeful"),
    ("Keeping a positive mindset through tough times.", "Hopeful"),

    # ── Sad ──
    ("I feel deeply heartbroken, sad, and crying today.", "Sad"),
    ("Nothing seems to bring me joy anymore.", "Sad"),
    ("Naku chala badha ga undhi, edusthunnanu.", "Sad"),
    ("Bohot udas hoon, rona aa raha hai.", "Sad"),
    ("Me siento muy triste y desconsolado.", "Sad"),
    ("Je suis tellement triste et en pleurs.", "Sad"),
    ("Feelin down and hopeless about everything.", "Sad"),
    ("I'm feeling sad today.", "Sad"),
    ("I feel so sad today and down.", "Sad"),
    ("I am very sad today.", "Sad"),

    # ── Lonely ──
    ("Nobody understands me, I feel so isolated and alone.", "Lonely"),
    ("Surrounded by people yet feeling so empty and lonely.", "Lonely"),
    ("Naku chala lonely ga undhi, evaru leru.", "Lonely"),
    ("Bohot akela feel ho raha hai aaj.", "Lonely"),
    ("Me siento solo y abandonado por todos.", "Lonely"),
    ("Je me sens tellement seul et isole.", "Lonely"),
    ("Wish I had someone to talk to right now.", "Lonely"),

    # ── Angry ──
    ("I am furious and mad about how unfair this is!", "Angry"),
    ("Stop annoying me! I am so irritated!", "Angry"),
    ("Naku chala gussa ga chiraku ga undhi!", "Angry"),
    ("Bohot gussa aa raha hai is baat par!", "Angry"),
    ("Estoy muy enojado y furioso!", "Angry"),
    ("Je suis tellement en colere et irrite!", "Angry"),
    ("How dare they insult me like that!", "Angry"),
    ("I am very angry and mad right now!", "Angry"),

    # ── Fear ──
    ("I am terrified of what might happen next.", "Fear"),
    ("Feeling unsafe and scared in this place.", "Fear"),
    ("Naku chala bhayanga undhi, em avuthundho.", "Fear"),
    ("Bohot darr lag raha hai mujhe.", "Fear"),
    ("Tengo mucho miedo de lo que pueda pasar.", "Fear"),
    ("J'ai tellement peur de ce qui peut arriver.", "Fear"),
    ("Shaking with fear right now.", "Fear"),

    # ── Anxiety ──
    ("I feel so anxious and overwhelmed by my upcoming exams and pressure.", "Anxiety"),
    ("Estoy muy ansioso y preocupado por mi examen de mañana.", "Anxiety"),
    ("I am very anxious and worried about my exam tomorrow.", "Anxiety"),
    ("Having a severe panic attack, heart racing, overthinking.", "Anxiety"),
    ("My mind won't stop racing with anxious thoughts.", "Anxiety"),
    ("Naku chala anxiety ga ghabrahat ga undhi.", "Anxiety"),
    ("Bohot anxiety ho rahi hai, heart rate fast hai.", "Anxiety"),
    ("Tengo mucha ansiedad y ataques de panico.", "Anxiety"),
    ("Je suis tres anxieux et j'ai des crises de panique.", "Anxiety"),
    ("Can't catch my breath, feeling panicked.", "Anxiety"),

    # ── Stress ──
    ("Aaj mujhe bohot stress ho raha hai, hopeless lag raha hai.", "Stress"),
    ("Today I am feeling very stressed, feeling hopeless.", "Stress"),
    ("Work load is overwhelming, exhausted and burnt out.", "Stress"),
    ("Too much deadline pressure, can't handle it.", "Stress"),
    ("Chala stress ga text tension ga undhi.", "Stress"),
    ("Bohot pressure aur stress hai office me.", "Stress"),
    ("Mucho estres y agotamiento por el trabajo.", "Stress"),
    ("Trop de stress et de pression au travail.", "Stress"),
    ("Feeling totally burnt out and drained.", "Stress"),
    ("I'm feeling stressed about my exams.", "Stress"),
    ("So stressed about my upcoming test and deadlines.", "Stress"),
    ("I am very stressed with everything right now.", "Stress"),

    # ── Neutral ──
    ("I am currently reading a book on the sofa.", "Neutral"),
    ("The weather today is cloudy with light wind.", "Neutral"),
    ("Nenu 8 o clock ki dinner thinnanu.", "Neutral"),
    ("Main abhi office kaam kar raha hoon.", "Neutral"),
    ("Estoy sentado en el parque leyendo un libro.", "Neutral"),
    ("Je lis un livre dans le salon.", "Neutral"),
    ("Just checking in on the daily routine.", "Neutral"),
    ("Hi, how are you?", "Neutral"),
    ("Hello, how are you doing today?", "Neutral"),
    ("Hey there, how are you?", "Neutral"),
    ("Why are you so angry?", "Neutral"),
    ("Are you mad at me?", "Neutral"),
    ("Can you explain anxiety?", "Neutral"),
    ("Give me a simple grounding exercise.", "Neutral"),
    ("yes", "Neutral"),
    ("no", "Neutral"),
    ("yeah", "Neutral"),
    ("nope", "Neutral"),
    ("sure", "Neutral"),
    ("okay", "Neutral"),
    ("no problem", "Neutral"),
]

# Multiply dataset for robust vectorization
EXPANDED_DATA = TRAINING_DATA * 40


def train_and_export():
    print("[+] Starting MindCare AI Model Training & Calibration Pipeline...")

    texts, labels = zip(*EXPANDED_DATA)

    # Split train & validation
    X_train, X_val, y_train, y_val = train_test_split(
        texts, labels, test_size=0.2, random_state=42, stratify=labels
    )

    # 1. TF-IDF Vectorizer
    vectorizer = TfidfVectorizer(
        ngram_range=(1, 2),
        max_features=5000,
        sublinear_tf=True,
        lowercase=True,
    )
    X_train_vec = vectorizer.fit_transform(X_train)
    X_val_vec = vectorizer.transform(X_val)

    # 2. Linear Model + Calibrated Probability Classifier
    base_svc = LinearSVC(C=1.0, max_iter=2000, random_state=42)
    calibrated_model = CalibratedClassifierCV(estimator=base_svc, cv=3, method="sigmoid")
    calibrated_model.fit(X_train_vec, y_train)

    # 3. Validation Evaluation
    preds = calibrated_model.predict(X_val_vec)
    acc = accuracy_score(y_val, preds)
    f1 = f1_score(y_val, preds, average="macro")

    print("[SUCCESS] Training Complete!")
    print(f"[*] Accuracy: {acc * 100:.2f}%")
    print(f"[*] Macro F1 Score: {f1 * 100:.2f}%")

    # 4. Export Artifacts
    multi_model_path = os.path.join(ARTIFACTS_DIR, "multilingual_emotion_classifier.joblib")
    multi_vec_path = os.path.join(ARTIFACTS_DIR, "multilingual_tfidf_vectorizer.joblib")
    mono_model_path = os.path.join(ARTIFACTS_DIR, "emotion_classifier.joblib")
    mono_vec_path = os.path.join(ARTIFACTS_DIR, "tfidf_vectorizer.joblib")

    joblib.dump(calibrated_model, multi_model_path)
    joblib.dump(vectorizer, multi_vec_path)
    joblib.dump(calibrated_model, mono_model_path)
    joblib.dump(vectorizer, mono_vec_path)

    # Save metadata
    meta = {
        "accuracy": round(acc, 4),
        "macro_f1": round(f1, 4),
        "classes": list(calibrated_model.classes_),
        "num_features": len(vectorizer.get_feature_names_out()),
        "trained_at": datetime.now().isoformat(),
    }
    with open(os.path.join(ARTIFACTS_DIR, "multilingual_model_meta.json"), "w") as f:
        json.dump(meta, f, indent=2)

    print(f"[EXPORT] Exported model artifacts to: {ARTIFACTS_DIR}")
    print("[FINISHED] Model training & export finished successfully!")


if __name__ == "__main__":
    train_and_export()
