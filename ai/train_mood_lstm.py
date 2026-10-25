"""
MindCare AI — PyTorch Mood & Stress LSTM 100-Epoch Training & Evaluation Pipeline
Trains a 2-layer Recurrent Neural Network (LSTM) to forecast future user mood scores,
stress probabilities, and 10-class dominant emotion trajectories over 100 full epochs.

Calculates comprehensive evaluation metrics:
- Mood: MSE, RMSE, MAE, R², Pearson Correlation
- Stress: BCE Loss, Accuracy, ROC-AUC, Precision, Recall, F1, Brier Score
- Emotion: Top-1/Top-2/Top-3 Accuracy, Macro/Weighted F1, Per-Class Classification Report, Confusion Matrix
- Epoch-by-epoch loss convergence
"""
import os
import sys
import json
import time
import random
import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np

from sklearn.metrics import (
    mean_squared_error,
    mean_absolute_error,
    r2_score,
    roc_auc_score,
    accuracy_score,
    precision_recall_fscore_support,
    confusion_matrix,
    classification_report,
    brier_score_loss,
)

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

# Set random seeds for reproducibility
SEED = 42
random.seed(SEED)
np.random.seed(SEED)
torch.manual_seed(SEED)
if torch.cuda.is_available():
    torch.cuda.manual_seed_all(SEED)

EMOTIONS = [
    "Happy", "Sad", "Angry", "Fear", "Anxiety",
    "Stress", "Lonely", "Hopeful", "Excited", "Neutral"
]


class MoodLSTM(nn.Module):
    """
    2-Layer PyTorch LSTM Architecture for Mood & Stress Forecasting.
    Input Feature Dimension (13):
      - Mood score (0.1 - 1.0)
      - Stress score (0.0 - 1.0)
      - Sentiment compound (-1.0 to 1.0)
      - 10-Class Emotion Probabilities
    """
    def __init__(self, input_size: int = 13, hidden_size: int = 64, num_layers: int = 2, dropout: float = 0.2):
        super().__init__()
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0.0
        )
        self.fc_mood = nn.Sequential(
            nn.Linear(hidden_size, 32),
            nn.ReLU(),
            nn.Linear(32, 1)
        )
        self.fc_stress = nn.Sequential(
            nn.Linear(hidden_size, 32),
            nn.ReLU(),
            nn.Linear(32, 1),
            nn.Sigmoid()
        )
        self.fc_emotion = nn.Linear(hidden_size, 10)

    def forward(self, x: torch.Tensor):
        # x shape: (batch_size, seq_len, input_size)
        lstm_out, _ = self.lstm(x)
        # Take hidden state of last timestep
        last_hidden = lstm_out[:, -1, :]
        
        pred_mood = self.fc_mood(last_hidden) * 10.0  # Scale to 1.0 - 10.0
        pred_stress = self.fc_stress(last_hidden)     # 0.0 - 1.0 probability
        pred_emotion_logits = self.fc_emotion(last_hidden)
        
        return pred_mood, pred_stress, pred_emotion_logits


def generate_synthetic_sequences(num_sequences: int = 2500, seq_len: int = 14):
    """
    Generate realistic multi-day emotional sequences simulating
    user stress spikes, recovery curves, and mood fluctuations.
    """
    X_list = []
    y_mood_list = []
    y_stress_list = []
    y_emo_list = []

    for _ in range(num_sequences):
        base_mood = random.uniform(3.5, 8.5)
        trend = random.uniform(-0.15, 0.15)
        sequence = []

        curr_mood = base_mood
        curr_stress = max(0.05, min(0.95, 1.0 - (curr_mood / 10.0) + random.uniform(-0.08, 0.08)))

        for t in range(seq_len + 1):  # seq_len timesteps input + 1 target
            curr_mood = max(1.0, min(10.0, curr_mood + trend + random.gauss(0, 0.35)))
            curr_stress = max(0.0, min(1.0, 1.0 - (curr_mood / 10.0) + random.gauss(0, 0.08)))
            sentiment_compound = (curr_mood - 5.5) / 4.5
            sentiment_compound = max(-1.0, min(1.0, sentiment_compound))

            # Generate 10-class emotion probabilities
            probs = np.zeros(10)
            if curr_mood >= 7.5:
                dominant_idx = random.choice([0, 8])  # Happy, Excited
            elif curr_mood >= 6.0:
                dominant_idx = random.choice([0, 7, 9])  # Happy, Hopeful, Neutral
            elif curr_mood <= 3.0:
                dominant_idx = random.choice([1, 4, 6])  # Sad, Anxiety, Lonely
            elif curr_mood <= 4.5:
                dominant_idx = random.choice([1, 2, 3, 5])  # Sad, Angry, Fear, Stress
            else:
                dominant_idx = 9  # Neutral

            probs[dominant_idx] = random.uniform(0.55, 0.85)
            remaining = 1.0 - probs[dominant_idx]
            other_indices = [i for i in range(10) if i != dominant_idx]
            dirichlet_others = np.random.dirichlet(np.ones(9)) * remaining
            for idx, other_idx in enumerate(other_indices):
                probs[other_idx] = dirichlet_others[idx]

            # Construct 13-dim feature vector
            feat = [curr_mood / 10.0, curr_stress, sentiment_compound] + list(probs)
            sequence.append((feat, curr_mood, curr_stress, dominant_idx))

        seq_feats = [item[0] for item in sequence[:seq_len]]
        target = sequence[seq_len]

        X_list.append(seq_feats)
        y_mood_list.append(target[1])
        y_stress_list.append(target[2])
        y_emo_list.append(target[3])

    return (
        torch.tensor(X_list, dtype=torch.float32),
        torch.tensor(y_mood_list, dtype=torch.float32).unsqueeze(1),
        torch.tensor(y_stress_list, dtype=torch.float32).unsqueeze(1),
        torch.tensor(y_emo_list, dtype=torch.long)
    )


def train_100_epochs():
    total_start = time.time()
    epochs = 100

    print("=" * 80)
    print("MINDCARE AI — PYTORCH MOOD & STRESS LSTM 100-EPOCH TRAINING PIPELINE")
    print("=" * 80)

    # 1. Dataset Generation & Splitting
    num_sequences = 2500
    seq_len = 14
    X, y_mood, y_stress, y_emo = generate_synthetic_sequences(num_sequences=num_sequences, seq_len=seq_len)
    
    total_samples = len(X)
    train_size = int(0.85 * total_samples)
    val_size = total_samples - train_size

    dataset = torch.utils.data.TensorDataset(X, y_mood, y_stress, y_emo)
    train_dataset, val_dataset = torch.utils.data.random_split(dataset, [train_size, val_size])

    train_loader = torch.utils.data.DataLoader(train_dataset, batch_size=32, shuffle=True)
    val_loader = torch.utils.data.DataLoader(val_dataset, batch_size=32, shuffle=False)

    print(f"Dataset summary:")
    print(f"  • Total sequences   : {total_samples}")
    print(f"  • Sequence length   : {seq_len} days")
    print(f"  • Feature dimension : 13 (Mood, Stress, Compound Sentiment + 10 Emotion Probs)")
    print(f"  • Training set      : {train_size} sequences ({train_size/total_samples*100:.1f}%)")
    print(f"  • Validation set    : {val_size} sequences ({val_size/total_samples*100:.1f}%)")
    print(f"  • Target Epochs     : {epochs}")
    print("-" * 80)

    # 2. Model & Optimizer Setup
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Hardware compute device: {device}")

    model = MoodLSTM(input_size=13, hidden_size=64, num_layers=2, dropout=0.2).to(device)
    optimizer = optim.Adam(model.parameters(), lr=0.003, weight_decay=1e-5)
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs, eta_min=1e-5)

    criterion_mood = nn.MSELoss()
    criterion_stress = nn.BCELoss()
    criterion_emo = nn.CrossEntropyLoss()

    best_val_loss = float('inf')
    best_model_weights = None
    best_epoch = 0

    convergence_history = []

    print(f"Starting {epochs}-epoch optimization...")
    print(f"{'Epoch':^7} | {'Train Loss':^12} | {'Val Loss':^10} | {'Mood RMSE':^10} | {'Stress BCE':^11} | {'Emo Top-1 Acc':^14} | {'LR':^9}")
    print("-" * 82)

    for epoch in range(1, epochs + 1):
        model.train()
        train_loss_total = 0.0

        for b_x, b_y_mood, b_y_stress, b_y_emo in train_loader:
            b_x = b_x.to(device)
            b_y_mood = b_y_mood.to(device)
            b_y_stress = b_y_stress.to(device)
            b_y_emo = b_y_emo.to(device)

            optimizer.zero_grad()
            p_mood, p_stress, p_emo = model(b_x)

            loss_m = criterion_mood(p_mood, b_y_mood)
            loss_s = criterion_stress(p_stress, b_y_stress)
            loss_e = criterion_emo(p_emo, b_y_emo)

            loss = loss_m + 2.0 * loss_s + loss_e
            loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            optimizer.step()

            train_loss_total += loss.item() * len(b_x)

        scheduler.step()
        avg_train_loss = train_loss_total / train_size

        # Validation Phase
        model.eval()
        val_loss_total = 0.0
        val_mood_losses = []
        val_stress_losses = []
        val_emo_preds = []
        val_emo_trues = []

        with torch.no_grad():
            for b_x, b_y_mood, b_y_stress, b_y_emo in val_loader:
                b_x = b_x.to(device)
                b_y_mood = b_y_mood.to(device)
                b_y_stress = b_y_stress.to(device)
                b_y_emo = b_y_emo.to(device)

                p_mood, p_stress, p_emo = model(b_x)
                loss_m = criterion_mood(p_mood, b_y_mood)
                loss_s = criterion_stress(p_stress, b_y_stress)
                loss_e = criterion_emo(p_emo, b_y_emo)

                loss = loss_m + 2.0 * loss_s + loss_e
                val_loss_total += loss.item() * len(b_x)

                val_mood_losses.append(loss_m.item())
                val_stress_losses.append(loss_s.item())
                val_emo_preds.extend(torch.argmax(p_emo, dim=1).cpu().numpy())
                val_emo_trues.extend(b_y_emo.cpu().numpy())

        avg_val_loss = val_loss_total / val_size
        epoch_rmse = np.sqrt(np.mean(val_mood_losses))
        epoch_stress_bce = np.mean(val_stress_losses)
        epoch_emo_acc = accuracy_score(val_emo_trues, val_emo_preds)
        current_lr = scheduler.get_last_lr()[0]

        convergence_history.append({
            "epoch": epoch,
            "train_loss": round(avg_train_loss, 4),
            "val_loss": round(avg_val_loss, 4),
            "mood_rmse": round(float(epoch_rmse), 4),
            "stress_bce": round(float(epoch_stress_bce), 4),
            "emotion_acc": round(float(epoch_emo_acc), 4),
            "lr": round(current_lr, 6)
        })

        if avg_val_loss < best_val_loss:
            best_val_loss = avg_val_loss
            best_epoch = epoch
            best_model_weights = {k: v.cpu().clone() for k, v in model.state_dict().items()}

        if epoch in [1, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100] or epoch == best_epoch:
            best_indicator = " *" if epoch == best_epoch else ""
            print(f"{epoch:^7d} | {avg_train_loss:^12.4f} | {avg_val_loss:^10.4f} | {epoch_rmse:^10.4f} | {epoch_stress_bce:^11.4f} | {epoch_emo_acc*100:^13.1f}% | {current_lr:^9.6f}{best_indicator}")

    print("-" * 82)
    print(f"Optimal checkpoint reached at Epoch {best_epoch:02d} with minimum validation loss: {best_val_loss:.4f}")

    # Load best weights for comprehensive evaluation
    model.load_state_dict(best_model_weights)
    model.eval()

    # 3. Comprehensive Final Evaluation on Validation Set
    all_mood_pred = []
    all_mood_true = []
    all_stress_pred = []
    all_stress_true = []
    all_emo_logits = []
    all_emo_pred = []
    all_emo_true = []

    with torch.no_grad():
        for b_x, b_y_mood, b_y_stress, b_y_emo in val_loader:
            b_x = b_x.to(device)
            p_mood, p_stress, p_emo = model(b_x)

            all_mood_pred.extend(p_mood.cpu().numpy().flatten())
            all_mood_true.extend(b_y_mood.numpy().flatten())

            all_stress_pred.extend(p_stress.cpu().numpy().flatten())
            all_stress_true.extend(b_y_stress.numpy().flatten())

            probs_emo = torch.softmax(p_emo, dim=1).cpu().numpy()
            all_emo_logits.extend(probs_emo)
            all_emo_pred.extend(np.argmax(probs_emo, axis=1))
            all_emo_true.extend(b_y_emo.numpy())

    all_mood_pred = np.array(all_mood_pred)
    all_mood_true = np.array(all_mood_true)
    all_stress_pred = np.array(all_stress_pred)
    all_stress_true = np.array(all_stress_true)
    all_emo_logits = np.array(all_emo_logits)
    all_emo_pred = np.array(all_emo_pred)
    all_emo_true = np.array(all_emo_true)

    # Mood Regression Metrics
    mood_mse = mean_squared_error(all_mood_true, all_mood_pred)
    mood_rmse = np.sqrt(mood_mse)
    mood_mae = mean_absolute_error(all_mood_true, all_mood_pred)
    mood_r2 = r2_score(all_mood_true, all_mood_pred)
    mood_corr = float(np.corrcoef(all_mood_true, all_mood_pred)[0, 1])

    # Stress Metrics (Binary threshold 0.5)
    stress_bce = float(nn.BCELoss()(torch.tensor(all_stress_pred), torch.tensor(all_stress_true)).item())
    stress_bin_true = (all_stress_true >= 0.5).astype(int)
    stress_bin_pred = (all_stress_pred >= 0.5).astype(int)
    stress_acc = accuracy_score(stress_bin_true, stress_bin_pred)
    stress_auc = roc_auc_score(stress_bin_true, all_stress_pred)
    stress_prec, stress_rec, stress_f1, _ = precision_recall_fscore_support(stress_bin_true, stress_bin_pred, average="binary")
    stress_brier = brier_score_loss(stress_bin_true, all_stress_pred)

    # 10-Class Emotion Metrics
    emo_top1 = accuracy_score(all_emo_true, all_emo_pred)
    emo_top2 = float(np.mean([all_emo_true[i] in np.argsort(all_emo_logits[i])[-2:] for i in range(len(all_emo_true))]))
    emo_top3 = float(np.mean([all_emo_true[i] in np.argsort(all_emo_logits[i])[-3:] for i in range(len(all_emo_true))]))
    emo_prec_macro, emo_rec_macro, emo_f1_macro, _ = precision_recall_fscore_support(all_emo_true, all_emo_pred, average="macro", zero_division=0)
    emo_prec_weighted, emo_rec_weighted, emo_f1_weighted, _ = precision_recall_fscore_support(all_emo_true, all_emo_pred, average="weighted", zero_division=0)

    class_report_dict = classification_report(all_emo_true, all_emo_pred, target_names=EMOTIONS, output_dict=True, zero_division=0)
    conf_mat = confusion_matrix(all_emo_true, all_emo_pred).tolist()

    # Save artifact
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    artifact_dir = os.path.join(project_root, "backend", "app", "ai", "artifacts")
    os.makedirs(artifact_dir, exist_ok=True)
    artifact_path = os.path.join(artifact_dir, "mood_lstm.pt")

    torch.save({
        "model_state_dict": model.state_dict(),
        "input_size": 13,
        "hidden_size": 64,
        "num_layers": 2,
        "emotions": EMOTIONS,
        "epochs_trained": 100,
        "best_epoch": best_epoch,
        "rmse_mood": float(mood_rmse),
        "mae_mood": float(mood_mae),
        "r2_mood": float(mood_r2),
        "stress_auc": float(stress_auc),
        "emotion_top1_acc": float(emo_top1),
        "emotion_f1_macro": float(emo_f1_macro),
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }, artifact_path)

    report_path = os.path.join(artifact_dir, "mood_lstm_evaluation_100epochs.json")
    full_report = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "model_architecture": "PyTorch 2-Layer LSTM (Hidden: 64, Dropout: 0.2)",
        "epochs_trained": 100,
        "best_epoch": best_epoch,
        "total_parameters": sum(p.numel() for p in model.parameters()),
        "training_time_seconds": round(time.time() - total_start, 2),
        "mood_regression_metrics": {
            "rmse": round(float(mood_rmse), 4),
            "mae": round(float(mood_mae), 4),
            "mse": round(float(mood_mse), 4),
            "r2_score": round(float(mood_r2), 4),
            "pearson_r": round(float(mood_corr), 4),
        },
        "stress_classification_metrics": {
            "bce_loss": round(float(stress_bce), 4),
            "accuracy": round(float(stress_acc) * 100, 2),
            "roc_auc": round(float(stress_auc), 4),
            "precision": round(float(stress_prec), 4),
            "recall": round(float(stress_rec), 4),
            "f1_score": round(float(stress_f1), 4),
            "brier_score": round(float(stress_brier), 4),
        },
        "emotion_classification_metrics": {
            "top1_accuracy": round(float(emo_top1) * 100, 2),
            "top2_accuracy": round(float(emo_top2) * 100, 2),
            "top3_accuracy": round(float(emo_top3) * 100, 2),
            "macro_f1": round(float(emo_f1_macro), 4),
            "weighted_f1": round(float(emo_f1_weighted), 4),
            "macro_precision": round(float(emo_prec_macro), 4),
            "macro_recall": round(float(emo_rec_macro), 4),
        },
        "per_class_classification_report": {
            emo: {
                "precision": round(class_report_dict[emo]["precision"], 4),
                "recall": round(class_report_dict[emo]["recall"], 4),
                "f1_score": round(class_report_dict[emo]["f1-score"], 4),
                "support": class_report_dict[emo]["support"]
            }
            for emo in EMOTIONS if emo in class_report_dict
        },
        "confusion_matrix": conf_mat,
        "convergence_log": convergence_history,
    }

    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(full_report, f, indent=2)

    # 4. Print Beautiful Terminal Dashboard
    total_elapsed = time.time() - total_start
    print("=" * 80)
    print("MINDCARE AI — 100-EPOCH EVALUATION METRICS DASHBOARD")
    print("=" * 80)
    print(f"Total Training Duration : {total_elapsed:.2f} seconds ({total_elapsed/100:.3f} s/epoch)")
    print(f"Optimal Checkpoint      : Epoch {best_epoch:02d} / 100")
    print(f"Artifact Saved To       : {artifact_path}")
    print(f"Metrics Report Saved    : {report_path}")
    print()
    print("── 1. MOOD TRAJECTORY REGRESSION METRICS (Scale: 1.0 - 10.0) ──")
    print(f"  • RMSE (Root Mean Sq Error) : {mood_rmse:.4f}  (Lower is better)")
    print(f"  • MAE (Mean Absolute Error) : {mood_mae:.4f}  (Lower is better)")
    print(f"  • MSE (Mean Squared Error)  : {mood_mse:.4f}")
    print(f"  • R² Score (Variance Exp.)  : {mood_r2:.4f}  (Target: >0.80)")
    print(f"  • Pearson Correlation (r)   : {mood_corr:.4f}  (Linear tracking fidelity)")
    print()
    print("── 2. STRESS PROBABILITY CLASSIFICATION METRICS (Threshold: 0.5) ──")
    print(f"  • Binary Accuracy           : {stress_acc * 100:.2f}%")
    print(f"  • ROC-AUC Score             : {stress_auc:.4f}  (Discriminative power)")
    print(f"  • Precision                 : {stress_prec:.4f}")
    print(f"  • Recall                    : {stress_rec:.4f}")
    print(f"  • F1-Score                  : {stress_f1:.4f}")
    print(f"  • Brier Calibration Score   : {stress_brier:.4f}  (Lower is better)")
    print()
    print("── 3. 10-CLASS EMOTION TRAJECTORY METRICS ──")
    print(f"  • Top-1 Categorical Accuracy: {emo_top1 * 100:.2f}%")
    print(f"  • Top-2 Categorical Accuracy: {emo_top2 * 100:.2f}%")
    print(f"  • Top-3 Categorical Accuracy: {emo_top3 * 100:.2f}%")
    print(f"  • Macro F1-Score            : {emo_f1_macro:.4f}")
    print(f"  • Weighted F1-Score         : {emo_f1_weighted:.4f}")
    print()
    print("── 4. PER-CLASS CLASSIFICATION BREAKDOWN ──")
    print(f"{'Emotion Category':<15} | {'Precision':<10} | {'Recall':<10} | {'F1-Score':<10} | {'Support':<8}")
    print("-" * 62)
    for emo in EMOTIONS:
        stats = class_report_dict.get(emo, {"precision": 0, "recall": 0, "f1-score": 0, "support": 0})
        print(f"{emo:<15} | {stats['precision']:<10.4f} | {stats['recall']:<10.4f} | {stats['f1-score']:<10.4f} | {int(stats['support']):<8d}")
    print("=" * 80)


if __name__ == "__main__":
    train_100_epochs()
