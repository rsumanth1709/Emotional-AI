"""
MindCare AI — PyTorch Mood & Stress LSTM Training Script
Trains a 2-layer Recurrent Neural Network (LSTM) to forecast future user mood scores,
stress probabilities, and 10-class dominant emotion trajectories.
"""
import os
import random
import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np

# Set random seeds for reproducibility
SEED = 42
random.seed(SEED)
np.random.seed(SEED)
torch.manual_seed(SEED)

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


def generate_synthetic_sequences(num_sequences: int = 1200, seq_len: int = 14):
    """
    Generate realistic multi-day emotional sequences simulating
    user stress spikes, recovery curves, and mood fluctuations.
    """
    X_list = []
    y_mood_list = []
    y_stress_list = []
    y_emo_list = []

    for _ in range(num_sequences):
        # Base mood trajectory with momentum & noise
        base_mood = random.uniform(4.0, 8.0)
        trend = random.uniform(-0.15, 0.15)
        sequence = []

        curr_mood = base_mood
        curr_stress = max(0.1, min(0.9, 1.0 - (curr_mood / 10.0) + random.uniform(-0.1, 0.1)))

        for t in range(seq_len + 1): # seq_len timesteps input + 1 target
            curr_mood = max(1.0, min(10.0, curr_mood + trend + random.gauss(0, 0.4)))
            curr_stress = max(0.0, min(1.0, 1.0 - (curr_mood / 10.0) + random.gauss(0, 0.1)))
            sentiment_compound = (curr_mood - 5.5) / 4.5
            sentiment_compound = max(-1.0, min(1.0, sentiment_compound))

            # Generate 10-class emotion probabilities
            probs = np.zeros(10)
            if curr_mood >= 7.0:
                dominant_idx = random.choice([0, 7, 8]) # Happy, Hopeful, Excited
            elif curr_mood <= 4.0:
                dominant_idx = random.choice([1, 4, 5, 6]) # Sad, Anxiety, Stress, Lonely
            else:
                dominant_idx = 9 # Neutral

            probs[dominant_idx] = random.uniform(0.5, 0.8)
            remaining = 1.0 - probs[dominant_idx]
            other_indices = [i for i in range(10) if i != dominant_idx]
            dirichlet_others = np.random.dirichlet(np.ones(9)) * remaining
            for idx, other_idx in enumerate(other_indices):
                probs[other_idx] = dirichlet_others[idx]

            # Construct 13-dim feature vector
            feat = [curr_mood / 10.0, curr_stress, sentiment_compound] + list(probs)
            sequence.append((feat, curr_mood, curr_stress, dominant_idx))

        # Input X is sequence[0:seq_len]
        # Target y is sequence[seq_len]
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


def train_model():
    print("--- Initializing PyTorch Mood & Stress LSTM Training ---")
    X, y_mood, y_stress, y_emo = generate_synthetic_sequences(num_sequences=1500, seq_len=14)
    print(f"Generated dataset tensor shape: X={X.shape}, y_mood={y_mood.shape}")

    dataset = torch.utils.data.TensorDataset(X, y_mood, y_stress, y_emo)
    train_size = int(0.85 * len(dataset))
    val_size = len(dataset) - train_size
    train_dataset, val_dataset = torch.utils.data.random_split(dataset, [train_size, val_size])

    train_loader = torch.utils.data.DataLoader(train_dataset, batch_size=32, shuffle=True)
    val_loader = torch.utils.data.DataLoader(val_dataset, batch_size=32, shuffle=False)

    model = MoodLSTM(input_size=13, hidden_size=64, num_layers=2, dropout=0.2)
    optimizer = optim.Adam(model.parameters(), lr=0.002, weight_decay=1e-5)
    
    criterion_mood = nn.MSELoss()
    criterion_stress = nn.BCELoss()
    criterion_emo = nn.CrossEntropyLoss()

    best_val_loss = float('inf')
    epochs = 35

    print(f"Training MoodLSTM for {epochs} epochs...")
    for epoch in range(1, epochs + 1):
        model.train()
        total_loss = 0.0

        for batch_x, batch_y_mood, batch_y_stress, batch_y_emo in train_loader:
            optimizer.zero_grad()
            p_mood, p_stress, p_emo = model(batch_x)

            loss_m = criterion_mood(p_mood, batch_y_mood)
            loss_s = criterion_stress(p_stress, batch_y_stress)
            loss_e = criterion_emo(p_emo, batch_y_emo)

            loss = loss_m + 2.0 * loss_s + loss_e
            loss.backward()
            optimizer.step()

            total_loss += loss.item() * len(batch_x)

        avg_train_loss = total_loss / train_size

        # Validation phase
        model.eval()
        val_loss = 0.0
        with torch.no_grad():
            for batch_x, batch_y_mood, batch_y_stress, batch_y_emo in val_loader:
                p_mood, p_stress, p_emo = model(batch_x)
                loss_m = criterion_mood(p_mood, batch_y_mood)
                loss_s = criterion_stress(p_stress, batch_y_stress)
                loss_e = criterion_emo(p_emo, batch_y_emo)
                loss = loss_m + 2.0 * loss_s + loss_e
                val_loss += loss.item() * len(batch_x)

        avg_val_loss = val_loss / val_size

        if epoch % 5 == 0 or epoch == epochs:
            print(f"Epoch {epoch:02d}/{epochs} | Train Loss: {avg_train_loss:.4f} | Val Loss: {avg_val_loss:.4f}")

    # Ensure output directory exists
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    artifact_dir = os.path.join(project_root, "backend", "app", "ai", "artifacts")
    os.makedirs(artifact_dir, exist_ok=True)
    artifact_path = os.path.join(artifact_dir, "mood_lstm.pt")

    # Save model weights & metadata dictionary
    torch.save({
        "model_state_dict": model.state_dict(),
        "input_size": 13,
        "hidden_size": 64,
        "num_layers": 2,
        "emotions": EMOTIONS,
        "rmse_mood": float(np.sqrt(avg_val_loss)),
    }, artifact_path)

    print(f"[SUCCESS] Trained MoodLSTM model saved successfully to: {artifact_path}")


if __name__ == "__main__":
    train_model()
