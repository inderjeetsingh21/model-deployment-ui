# Model Deployment Interface - Complete Installation Guide

A complete, production-ready web interface for automated PyTorch model deployment on Linux.

## 📋 Prerequisites

### System Requirements
- **OS**: Ubuntu 20.04+ / Debian 11+ / RHEL 8+ / CentOS 8+
- **RAM**: Minimum 4GB, Recommended 8GB+
- **Disk**: 20GB+ free space
- **CPU**: 2+ cores recommended
- **Network**: Internet connection for package downloads

### Required Software
- Node.js 18+ and npm
- Python 3.9+
- Git

---

## 🚀 Complete Installation Guide

### Step 1: Install System Dependencies

#### For Ubuntu/Debian:
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Python and pip
sudo apt install -y python3 python3-pip python3-venv

# Install Git
sudo apt install -y git

# Install build tools
sudo apt install -y build-essential

# Verify installations
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
python3 --version  # Should show 3.9+
```

#### For RHEL/CentOS/Fedora:
```bash
# Install Node.js
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs

# Install Python
sudo dnf install -y python3 python3-pip

# Install Git and build tools
sudo dnf install -y git gcc gcc-c++ make

# Verify installations
node --version
npm --version
python3 --version
```

### Step 2: Clone or Download the Project

```bash
# Navigate to your projects directory
cd ~

# If you have the project files already, skip this
# Otherwise create the project directory
mkdir model-deployment-ui
cd model-deployment-ui

# If files were provided separately, ensure all files are in this directory
ls -la
# You should see: package.json, vite.config.js, index.html, src/
```

### Step 3: Install Frontend Dependencies

```bash
# Install all npm packages
npm install

# This will install:
# - React 18
# - Vite (build tool)
# - Axios (HTTP client)
# - Lucide React (icons)
```

### Step 4: Start the Development Server

```bash
# Start the frontend (development mode)
npm run dev

# The server will start on http://localhost:3000
# You should see output like:
#   VITE v5.0.0  ready in 500 ms
#   ➜  Local:   http://localhost:3000/
#   ➜  Network: http://192.168.1.x:3000/
```

**Keep this terminal open!** The frontend is now running.

---

## 🔧 Production Deployment

### Option 1: Build for Production (Recommended)

```bash
# Build the production-ready static files
npm run build

# This creates a 'dist' folder with optimized files
```

#### Serve with Built-in Server
```bash
# Install serve globally
sudo npm install -g serve

# Serve the production build
serve -s dist -l 3000

# Or run as background service
nohup serve -s dist -l 3000 > frontend.log 2>&1 &
```

#### Serve with Nginx (Professional Setup)

1. **Install Nginx:**
```bash
# Ubuntu/Debian
sudo apt install -y nginx

# RHEL/CentOS
sudo dnf install -y nginx
```

2. **Configure Nginx:**
```bash
sudo nano /etc/nginx/sites-available/model-deployment
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your-server-ip;
    
    root /home/$USER/model-deployment-ui/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Proxy API requests to backend
    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # WebSocket support
    location /ws {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

3. **Enable and Start Nginx:**
```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/model-deployment /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx
```

4. **Configure Firewall:**
```bash
# Ubuntu/Debian (UFW)
sudo ufw allow 80/tcp
sudo ufw allow 8000/tcp
sudo ufw enable

# RHEL/CentOS (Firewalld)
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=8000/tcp
sudo firewall-cmd --reload
```

### Option 2: Development Mode (Testing)

```bash
# Just run the dev server
npm run dev
```

---

## 🔐 Running as a System Service

Create a systemd service for auto-start on boot:

### 1. Create Service File
```bash
sudo nano /etc/systemd/system/model-deployment-ui.service
```

### 2. Add Configuration
```ini
[Unit]
Description=Model Deployment UI
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/home/your-username/model-deployment-ui
ExecStart=/usr/bin/serve -s dist -l 3000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 3. Enable and Start Service
```bash
sudo systemctl daemon-reload
sudo systemctl enable model-deployment-ui
sudo systemctl start model-deployment-ui
sudo systemctl status model-deployment-ui
```

---

## 🌐 Accessing the Interface

### Local Access
- Development: http://localhost:3000
- Production: http://localhost:3000 (or port 80 with Nginx)

### Remote Access
- Replace `localhost` with your server's IP address
- Example: http://192.168.1.100:3000

### From Another Computer
1. Get your server's IP: `ip addr show` or `hostname -I`
2. Access: http://YOUR_SERVER_IP:3000

---

## 📦 Project Structure

```
model-deployment-ui/
├── package.json           # Dependencies and scripts
├── vite.config.js        # Vite configuration
├── index.html            # HTML entry point
├── src/
│   ├── main.jsx          # React entry point
│   ├── App.jsx           # Main App component
│   ├── components/       # React components
│   │   ├── DeploymentWizard.jsx
│   │   ├── ModelSelection.jsx
│   │   ├── HardwareConfig.jsx
│   │   ├── DependencyManager.jsx
│   │   ├── DeploymentConfig.jsx
│   │   ├── DeploymentSummary.jsx
│   │   └── DeploymentProgress.jsx
│   ├── services/         # API services
│   │   └── api.js
│   └── styles/          # CSS styles
│       └── App.css
└── dist/                # Production build (after npm run build)
```

---

## 🔧 Troubleshooting

### Port Already in Use
```bash
# Find process using port 3000
sudo lsof -i :3000

# Kill the process
sudo kill -9 <PID>
```

### Permission Denied
```bash
# Fix ownership
sudo chown -R $USER:$USER ~/model-deployment-ui

# Or run with sudo (not recommended)
sudo npm run dev
```

### Module Not Found
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Cannot Connect to Backend
```bash
# Verify backend is running on port 8000
curl http://localhost:8000/health

# Check firewall
sudo ufw status
sudo firewall-cmd --list-all
```

### Build Fails
```bash
# Clear Vite cache
rm -rf node_modules/.vite

# Rebuild
npm run build
```

---

## 📝 Available Scripts

```bash
npm run dev      # Start development server (hot reload)
npm run build    # Build for production
npm run preview  # Preview production build locally
```

---

## 🔗 Next Steps

After the frontend is running, you need to set up the backend:

1. **Install Backend Dependencies** (in a new terminal):
```bash
cd ~
mkdir model-deployment-backend
cd model-deployment-backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install FastAPI and dependencies
pip install fastapi uvicorn websockets python-multipart
```

2. **Start Backend Server**:
```bash
# The backend code should be in api_server.py
python api_server.py
```

3. **Verify Everything Works**:
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## 📊 Resource Usage

**Development Mode:**
- RAM: ~200MB
- CPU: 2-5% (idle)

**Production Mode:**
- RAM: ~50MB
- CPU: <1% (idle)

---

## 🆘 Support

If you encounter issues:

1. Check logs:
   - Frontend: Terminal output
   - Nginx: `/var/log/nginx/error.log`
   - Service: `journalctl -u model-deployment-ui -f`

2. Verify all services are running:
   ```bash
   # Frontend
   ps aux | grep serve
   
   # Backend
   ps aux | grep uvicorn
   
   # Nginx
   sudo systemctl status nginx
   ```

3. Test connectivity:
   ```bash
   # Test frontend
   curl http://localhost:3000
   
   # Test backend
   curl http://localhost:8000/health
   ```

---

## ✅ Installation Checklist

- [ ] Node.js 18+ installed
- [ ] Python 3.9+ installed
- [ ] Project files downloaded/extracted
- [ ] npm install completed successfully
- [ ] npm run dev starts without errors
- [ ] Can access http://localhost:3000
- [ ] Backend API running on port 8000
- [ ] WebSocket connection works
- [ ] Firewall ports open (if accessing remotely)

---

## 🎉 Success!

You should now have a fully functional model deployment interface running on your Linux system!

Access it at: **http://localhost:3000** (or your server IP)
