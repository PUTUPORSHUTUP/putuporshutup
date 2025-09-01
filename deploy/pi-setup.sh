#!/bin/bash

# Raspberry Pi 5 Production Deployment Script
# Gaming Platform - Match Royale Bets

set -e

echo "🎮 Setting up Gaming Platform on Raspberry Pi 5..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+ and npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install nginx
sudo apt-get install -y nginx

# Install PM2 for process management
sudo npm install -g pm2

# Create project directory
PROJECT_DIR="/opt/gaming-platform"
sudo mkdir -p $PROJECT_DIR
sudo chown $USER:$USER $PROJECT_DIR

echo "📁 Project directory created at $PROJECT_DIR"

# Clone or copy project files (you'll need to do this step)
echo "⚠️  Next steps:"
echo "1. Copy your project files to $PROJECT_DIR"
echo "2. Run: cd $PROJECT_DIR && npm install"
echo "3. Run: npm run build"
echo "4. Run: sudo ./deploy/configure-nginx.sh"
echo "5. Run: sudo ./deploy/setup-service.sh"

echo "✅ Basic setup complete!"