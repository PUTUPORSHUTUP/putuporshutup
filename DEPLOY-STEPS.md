# Step-by-Step Raspberry Pi 5 Deployment

## 🎯 Goal
Deploy the Gaming Platform as a full-time server on your Raspberry Pi 5

---

## STEP 1: Prepare Your Raspberry Pi 5

### 1.1 Connect to your Pi
```bash
ssh pi@YOUR_PI_IP_ADDRESS
# Replace YOUR_PI_IP_ADDRESS with your actual Pi IP (like 192.168.1.100)
```

### 1.2 Update your Pi
```bash
sudo apt update
sudo apt upgrade -y
```

### 1.3 Install Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 1.4 Verify installation
```bash
node --version
npm --version
```
*You should see version numbers like v18.x.x*

---

## STEP 2: Get the Project Files

### 2.1 Create project directory
```bash
sudo mkdir -p /opt/gaming-platform
sudo chown $USER:$USER /opt/gaming-platform
cd /opt/gaming-platform
```

### 2.2 Clone or copy the project
**Option A - If you have the code on GitHub:**
```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git .
```

**Option B - Copy from your computer to Pi:**
From your computer (new terminal):
```bash
scp -r /path/to/your/project/* pi@YOUR_PI_IP:/opt/gaming-platform/
```

**Option C - Manual file transfer:**
Use FileZilla, WinSCP, or similar to copy all project files to `/opt/gaming-platform/`

---

## STEP 3: Install Dependencies and Build

### 3.1 Install project dependencies
```bash
cd /opt/gaming-platform
npm install
```
*This will take 5-10 minutes*

### 3.2 Build the production version
```bash
npm run build
```
*This creates optimized files in the `dist/` folder*

---

## STEP 4: Install Web Server

### 4.1 Install Nginx
```bash
sudo apt-get install -y nginx
```

### 4.2 Start Nginx
```bash
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 4.3 Test Nginx is working
Open browser and go to `http://YOUR_PI_IP` - you should see nginx welcome page

---

## STEP 5: Configure Web Server

### 5.1 Create nginx configuration
```bash
sudo nano /etc/nginx/sites-available/gaming-platform
```

### 5.2 Paste this configuration:
```nginx
server {
    listen 80;
    listen [::]:80;
    
    # Replace with your Pi's IP address
    server_name YOUR_PI_IP_ADDRESS;
    
    root /opt/gaming-platform/dist;
    index index.html;
    
    # Handle React Router
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static files
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 5.3 Enable the site
```bash
sudo ln -s /etc/nginx/sites-available/gaming-platform /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
```

### 5.4 Test and restart nginx
```bash
sudo nginx -t
sudo systemctl restart nginx
```

---

## STEP 6: Test Your Deployment

### 6.1 Check if it's working
Open browser and go to: `http://YOUR_PI_IP_ADDRESS`

You should see your Gaming Platform website!

### 6.2 Test different pages
- Try navigating to different sections
- Check if tournaments load
- Test the games section

---

## STEP 7: Make It Permanent (Optional)

### 7.1 Install PM2 for process management
```bash
sudo npm install -g pm2
```

### 7.2 Create PM2 ecosystem file
```bash
nano /opt/gaming-platform/ecosystem.config.js
```

Paste this content:
```javascript
module.exports = {
  apps: [{
    name: 'gaming-platform',
    script: 'serve',
    args: '-s dist -l 3000',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    }
  }]
}
```

### 7.3 Install serve and start with PM2
```bash
npm install -g serve
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## STEP 8: Security & Performance

### 8.1 Setup firewall
```bash
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80/tcp
```

### 8.2 Set up auto-updates
```bash
sudo apt install unattended-upgrades
sudo dpkg-reconfigure unattended-upgrades
```

---

## TROUBLESHOOTING

### If nginx shows error:
```bash
sudo systemctl status nginx
sudo tail -f /var/log/nginx/error.log
```

### If build fails:
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Check if files exist:
```bash
ls -la /opt/gaming-platform/dist/
```

### Test nginx configuration:
```bash
sudo nginx -t
```

---

## ✅ FINAL CHECK

1. Open browser: `http://YOUR_PI_IP_ADDRESS`
2. See Gaming Platform homepage ✓
3. Navigate to different pages ✓
4. Check tournaments section ✓
5. Test games section ✓

**🎉 Your Gaming Platform is now live on your Raspberry Pi 5!**

---

## MAINTENANCE COMMANDS

### View logs:
```bash
sudo tail -f /var/log/nginx/access.log
pm2 logs gaming-platform
```

### Restart services:
```bash
sudo systemctl restart nginx
pm2 restart gaming-platform
```

### Update the site:
```bash
cd /opt/gaming-platform
git pull  # or copy new files
npm run build
sudo systemctl reload nginx
```