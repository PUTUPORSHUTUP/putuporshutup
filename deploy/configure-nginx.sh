#!/bin/bash

# Nginx configuration for Gaming Platform
# Run with sudo

set -e

PROJECT_DIR="/opt/gaming-platform"
NGINX_CONFIG="/etc/nginx/sites-available/gaming-platform"

echo "🌐 Configuring Nginx..."

# Create nginx configuration
cat > $NGINX_CONFIG << 'EOF'
server {
    listen 80;
    listen [::]:80;
    
    # Change this to your Pi's IP or domain
    server_name localhost 192.168.1.100;
    
    root /opt/gaming-platform/dist;
    index index.html;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;

    # Main location
    location / {
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; font-src 'self' https: data:; connect-src 'self' https: wss:;" always;

    # Disable server tokens
    server_tokens off;
}
EOF

# Enable the site
ln -sf $NGINX_CONFIG /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
nginx -t

# Reload nginx
systemctl reload nginx

echo "✅ Nginx configured successfully!"
echo "🌐 Your site will be available at http://your-pi-ip/"