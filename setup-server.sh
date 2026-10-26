#!/usr/bin/env bash
# MindCare AI — Automated Ubuntu Server Provisioning & Deployment Script
# Supports: Ubuntu 22.04 / 24.04 LTS
set -e

echo "=========================================================="
echo "  MindCare AI Automated Server Setup & Docker Deployment"
echo "=========================================================="

if [ "$EUID" -ne 0 ]; then
    echo "[!] Please run this script as root or with sudo."
    exit 1
fi

echo "[1/6] Updating system packages..."
apt-get update && apt-get upgrade -y
apt-get install -y curl git ufw fail2ban htop openssl ca-certificates

echo "[2/6] Configuring 4GB Swap Space (for memory-intensive AI builds)..."
if [ ! -f /swapfile ]; then
    fallocate -l 4G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=4096
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    echo "Swap configured successfully."
else
    echo "Swap file already exists. Skipping."
fi

echo "[3/6] Configuring Firewall (UFW)..."
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "[4/6] Installing official Docker Engine & Docker Compose plugin..."
if ! command -v docker &> /dev/null; then
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
    chmod a+r /etc/apt/keyrings/docker.asc

    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
      tee /etc/apt/sources.list.d/docker.list > /dev/null

    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    systemctl enable --now docker
    echo "Docker installed successfully."
else
    echo "Docker is already installed."
fi

echo "[5/6] Setting up project directory and environment..."
DEPLOY_DIR="/opt/mindcare"
if [ ! -d "$DEPLOY_DIR" ]; then
    git clone https://github.com/rsumanth1709/MindCare-AI.git "$DEPLOY_DIR"
fi
cd "$DEPLOY_DIR"
git pull origin main

if [ ! -f .env ]; then
    cp .env.example .env
    RANDOM_KEY=$(openssl rand -hex 32)
    sed -i "s/change-this-to-a-secure-random-64-character-hex-string/$RANDOM_KEY/g" .env
    echo "[*] Created .env with secure random SECRET_KEY."
fi

echo "----------------------------------------------------------"
read -p "Enter your Domain name (e.g., mindcare.example.com) or press Enter for 'localhost': " USER_DOMAIN
USER_DOMAIN=${USER_DOMAIN:-localhost}
sed -i "s/DOMAIN=localhost/DOMAIN=$USER_DOMAIN/g" .env

if [ "$USER_DOMAIN" != "localhost" ]; then
    sed -i "s|FRONTEND_URL=https://localhost|FRONTEND_URL=https://$USER_DOMAIN|g" .env
    sed -i "s|NEXT_PUBLIC_API_URL=https://localhost|NEXT_PUBLIC_API_URL=https://$USER_DOMAIN|g" .env
fi

read -p "Enter your Google Gemini API Key (or press Enter to configure later): " USER_GEMINI_KEY
if [ -n "$USER_GEMINI_KEY" ]; then
    sed -i "s/GEMINI_API_KEY=your_gemini_api_key_here/GEMINI_API_KEY=$USER_GEMINI_KEY/g" .env
fi

echo "[6/6] Launching MindCare AI via Docker Compose..."
docker compose up -d --build

echo "=========================================================="
echo "  MindCare AI is now deployed and running!"
echo "  URL: https://$USER_DOMAIN (or http://SERVER_IP)"
echo "=========================================================="
docker compose ps
