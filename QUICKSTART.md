# Quick Start Guide - Model Deployment UI

## 🚀 Fast Track Installation (5 Minutes)

### Step 1: Download and Extract
```bash
# Navigate to where you want the project
cd ~

# If you received the files, extract them
# The folder should contain: package.json, src/, index.html, etc.
cd model-deployment-ui
```

### Step 2: Run Automated Installation
```bash
# Make the script executable (if not already)
chmod +x install.sh

# Run the installation script
./install.sh
```

The script will:
- ✓ Install Node.js 20 (if needed)
- ✓ Install Python 3 (if needed)
- ✓ Install all dependencies
- ✓ Build production files
- ✓ Optionally set up auto-start service
- ✓ Optionally configure firewall

**Total time: ~5 minutes** (depending on internet speed)

### Step 3: Start the Application

**Option A - Development Mode** (recommended for testing):
```bash
npm run dev
```

**Option B - Production Mode**:
```bash
npx serve -s dist -l 3000
```

**Option C - Background Service** (if you chose auto-start):
```bash
sudo systemctl status model-deployment-ui
# Already running!
```

### Step 4: Access the Interface

Open your browser:
- **Local**: http://localhost:3000
- **Remote**: http://YOUR_SERVER_IP:3000

---

## ⚡ Manual Installation (If Script Fails)

### 1. Install Node.js
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version  # Should be 18+
```

### 2. Install Dependencies
```bash
cd model-deployment-ui
npm install
```

### 3. Start Development Server
```bash
npm run dev
```

Access at: http://localhost:3000

---

## 📱 Using the Interface

### Deployment Wizard Flow:

1. **Model Selection**
   - Choose model source (HuggingFace, Local, Upload)
   - Enter model ID (e.g., `bert-base-uncased`)
   - Select model type (NLP, Vision, Audio, Multimodal)

2. **Hardware Configuration**
   - Select CPU or GPU
   - Set memory allocation
   - Choose precision (FP32, FP16, INT8)

3. **Dependencies**
   - Auto-detect packages
   - Select optional libraries
   - Add custom requirements

4. **Deployment Settings**
   - Choose API type (REST/gRPC)
   - Set port number
   - Configure workers and timeout
   - Select deployment target (Docker/Local)

5. **Review & Deploy**
   - Review all settings
   - Click "Deploy Model"
   - Watch real-time progress

6. **Success!**
   - Get API endpoint URL
   - Copy example code
   - Test your deployment

---

## 🔧 Common Commands

### Development
```bash
npm run dev          # Start dev server with hot reload
npm run build        # Build for production
npm run preview      # Preview production build
```

### Service Management (if installed)
```bash
sudo systemctl start model-deployment-ui      # Start service
sudo systemctl stop model-deployment-ui       # Stop service
sudo systemctl restart model-deployment-ui    # Restart service
sudo systemctl status model-deployment-ui     # Check status
journalctl -u model-deployment-ui -f          # View logs
```

### Manual Production Server
```bash
# Install serve globally (one time)
sudo npm install -g serve

# Run production server
serve -s dist -l 3000

# Run in background
nohup serve -s dist -l 3000 > frontend.log 2>&1 &
```

---

## 🐛 Troubleshooting

### "Port 3000 already in use"
```bash
# Find and kill the process
sudo lsof -i :3000
sudo kill -9 <PID>
```

### "Cannot find module"
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### "Permission denied"
```bash
# Fix ownership
sudo chown -R $USER:$USER ~/model-deployment-ui
```

### Cannot access remotely
```bash
# Open firewall port
sudo ufw allow 3000/tcp  # Ubuntu
sudo firewall-cmd --add-port=3000/tcp --permanent && sudo firewall-cmd --reload  # RHEL/CentOS

# Check if service is listening
sudo netstat -tlnp | grep 3000
```

### Backend not connecting
```bash
# Verify backend is running
curl http://localhost:8000/health

# Check backend logs
# (depends on how you started the backend)
```

---

## 📊 System Requirements

**Minimum**:
- 2 CPU cores
- 2 GB RAM
- 10 GB disk space

**Recommended**:
- 4+ CPU cores
- 4+ GB RAM
- 20 GB disk space

---

## 🔗 Important URLs

Once running:
- **Frontend UI**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

---

## ✅ Verification Checklist

After installation, verify:

- [ ] Can access http://localhost:3000
- [ ] Interface loads without errors (check browser console)
- [ ] Can navigate through wizard steps
- [ ] Backend API is running on port 8000
- [ ] Can see API documentation at http://localhost:8000/docs

---

## 📚 Next Steps

1. **Start Backend**: Set up the Python backend API server
2. **Deploy Model**: Use the wizard to deploy your first model
3. **Test API**: Use the provided curl/Python examples
4. **Production Setup**: Configure Nginx and SSL if needed

---

## 💡 Tips

- **Development**: Use `npm run dev` for auto-reload during development
- **Production**: Always use `npm run build` + serve or Nginx
- **Monitoring**: Check logs regularly for errors
- **Security**: Use firewall rules and consider SSL/TLS for production
- **Performance**: Production build is ~10x faster than dev mode

---

## 🆘 Getting Help

If something doesn't work:

1. Check the browser console for errors (F12)
2. Check the terminal output for backend errors
3. Verify all services are running
4. Review the full README.md for detailed instructions
5. Check firewall and network settings

---

## 🎉 You're Ready!

The interface should now be fully operational. Start deploying models!

**Quick Test**:
1. Open http://localhost:3000
2. Select "HuggingFace Hub" as source
3. Enter "distilbert-base-uncased" as model ID
4. Complete the wizard
5. Click "Deploy Model"
6. Watch the magic happen! ✨
