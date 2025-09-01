# Raspberry Pi 5 Deployment Guide

## Gaming Platform - Match Royale Bets

This guide will help you deploy the gaming platform on your Raspberry Pi 5 as a production server.

## Quick Start

1. **Initial Setup**
   ```bash
   chmod +x deploy/pi-setup.sh
   ./deploy/pi-setup.sh
   ```

2. **Copy Project Files**
   ```bash
   # Copy your project to the Pi
   scp -r . pi@your-pi-ip:/opt/gaming-platform/
   # Or clone from git
   git clone https://github.com/your-repo/gaming-platform.git /opt/gaming-platform
   ```

3. **Install Dependencies & Build**
   ```bash
   cd /opt/gaming-platform
   npm install
   npm run build
   ```

4. **Configure Web Server**
   ```bash
   sudo chmod +x deploy/configure-nginx.sh
   sudo ./deploy/configure-nginx.sh
   ```

5. **Setup Service (Optional)**
   ```bash
   sudo chmod +x deploy/setup-service.sh
   sudo ./deploy/setup-service.sh
   ```

## Configuration

### Environment Variables

Create `/opt/gaming-platform/.env.production`:

```bash
NODE_ENV=production
VITE_SUPABASE_URL=https://mwuakdaogbywysjplrmx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-key-here
```

### Network Setup

1. **Find your Pi's IP address:**
   ```bash
   hostname -I
   ```

2. **Update nginx configuration:**
   Edit `/etc/nginx/sites-available/gaming-platform` and update the `server_name` directive with your Pi's IP address.

3. **Restart nginx:**
   ```bash
   sudo systemctl restart nginx
   ```

## Monitoring & Maintenance

### Check Status
```bash
# Web server status
sudo systemctl status nginx

# Application logs (if using systemd service)
sudo journalctl -u gaming-platform -f

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Updates
```bash
cd /opt/gaming-platform
git pull origin main  # or your main branch
npm install
npm run build
sudo systemctl reload nginx
```

### Performance Monitoring
```bash
# Check CPU/Memory usage
htop

# Check disk space
df -h

# Network monitoring
sudo netstat -tulpn | grep :80
```

## Security Considerations

1. **Firewall Setup:**
   ```bash
   sudo ufw enable
   sudo ufw allow ssh
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp  # if using HTTPS
   ```

2. **SSL/HTTPS Setup:**
   Consider using Let's Encrypt for HTTPS:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```

3. **Regular Updates:**
   ```bash
   sudo apt update && sudo apt upgrade
   ```

## Troubleshooting

### Common Issues

1. **Permission Errors:**
   ```bash
   sudo chown -R www-data:www-data /opt/gaming-platform
   sudo chmod -R 755 /opt/gaming-platform
   ```

2. **Port Already in Use:**
   ```bash
   sudo netstat -tulpn | grep :80
   sudo systemctl stop apache2  # if Apache is running
   ```

3. **Build Failures:**
   ```bash
   # Clear cache and rebuild
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

## Performance Optimization

### For Raspberry Pi 5

1. **Increase swap space:**
   ```bash
   sudo dphys-swapfile swapoff
   sudo nano /etc/dphys-swapfile  # Set CONF_SWAPSIZE=1024
   sudo dphys-swapfile setup
   sudo dphys-swapfile swapon
   ```

2. **GPU memory split:**
   ```bash
   sudo raspi-config
   # Advanced Options > Memory Split > 64
   ```

3. **Enable hardware acceleration:**
   ```bash
   echo 'gpu_mem=128' | sudo tee -a /boot/config.txt
   ```

## Access Your Platform

Once deployed, access your gaming platform at:
- Local network: `http://[PI_IP_ADDRESS]`
- If domain configured: `http://yourdomain.com`

The platform will be fully functional with all gaming features, tournaments, and wallet functionality.