#!/bin/bash

# Setup systemd service for the gaming platform
# Run with sudo

set -e

PROJECT_DIR="/opt/gaming-platform"
SERVICE_FILE="/etc/systemd/system/gaming-platform.service"

echo "⚙️  Setting up systemd service..."

# Create systemd service file
cat > $SERVICE_FILE << EOF
[Unit]
Description=Gaming Platform - Match Royale Bets
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=$PROJECT_DIR
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=gaming-platform

[Install]
WantedBy=multi-user.target
EOF

# Create a simple server.js for serving static files (fallback)
cat > $PROJECT_DIR/server.js << 'EOF'
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const DIST_DIR = path.join(__dirname, 'dist');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  let filePath = path.join(DIST_DIR, req.url === '/' ? 'index.html' : req.url);
  
  // For SPA routing, serve index.html for non-file requests
  if (!path.extname(filePath) && !fs.existsSync(filePath)) {
    filePath = path.join(DIST_DIR, 'index.html');
  }
  
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // Serve index.html for 404s (SPA routing)
        fs.readFile(path.join(DIST_DIR, 'index.html'), (err, content) => {
          if (err) {
            res.writeHead(500);
            res.end('Server Error');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(content);
          }
        });
      } else {
        res.writeHead(500);
        res.end('Server Error');
      }
    } else {
      const ext = path.extname(filePath);
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Gaming Platform server running on port ${PORT}`);
});
EOF

# Set permissions
chmod 644 $SERVICE_FILE
chown www-data:www-data $PROJECT_DIR/server.js

# Reload systemd and enable service
systemctl daemon-reload
systemctl enable gaming-platform.service

echo "✅ Service setup complete!"
echo "🎯 Use these commands:"
echo "   Start:   sudo systemctl start gaming-platform"
echo "   Stop:    sudo systemctl stop gaming-platform" 
echo "   Status:  sudo systemctl status gaming-platform"
echo "   Logs:    sudo journalctl -u gaming-platform -f"