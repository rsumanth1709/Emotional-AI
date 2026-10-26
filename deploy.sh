#!/usr/bin/env bash
# MindCare AI — Production Update & Redeployment Script
set -e

echo "=================================================="
echo "  MindCare AI Production Deployment / Update"
echo "=================================================="

# Check if .env exists
if [ ! -f .env ]; then
    echo "[!] .env file not found. Creating from .env.example..."
    cp .env.example .env
    RANDOM_KEY=$(openssl rand -hex 32 2>/dev/null || cat /proc/sys/kernel/random/uuid | tr -d '-')
    sed -i "s/change-this-to-a-secure-random-64-character-hex-string/$RANDOM_KEY/g" .env
    echo "[*] Generated fresh SECRET_KEY in .env. Please update GEMINI_API_KEY before running."
fi

echo "[*] Pulling latest updates from GitHub..."
git pull origin main

echo "[*] Building container images..."
docker compose build

echo "[*] Starting services with Docker Compose..."
docker compose up -d

echo "[*] Pruning unused dangling images..."
docker image prune -f

echo "=================================================="
echo "  Deployment Complete! Status:"
echo "=================================================="
docker compose ps
