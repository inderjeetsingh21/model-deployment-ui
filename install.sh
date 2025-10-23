#!/bin/bash

# Model Deployment UI - Automated Installation Script
# This script installs all dependencies and sets up the frontend

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print functions
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    print_error "Please do not run this script as root (sudo)"
    echo "Run it as: ./install.sh"
    exit 1
fi

print_header "Model Deployment UI Installation"
echo ""

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    VERSION=$VERSION_ID
else
    print_error "Cannot detect OS. Exiting."
    exit 1
fi

print_info "Detected OS: $OS $VERSION"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check version
check_node_version() {
    if command_exists node; then
        NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_VERSION" -ge 18 ]; then
            return 0
        fi
    fi
    return 1
}

# Install Node.js
install_nodejs() {
    print_header "Installing Node.js"
    
    if check_node_version; then
        print_success "Node.js $(node -v) is already installed"
        return
    fi
    
    print_info "Installing Node.js 20.x..."
    
    if [[ "$OS" == "ubuntu" || "$OS" == "debian" ]]; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif [[ "$OS" == "rhel" || "$OS" == "centos" || "$OS" == "fedora" ]]; then
        curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
        sudo dnf install -y nodejs
    else
        print_error "Unsupported OS for automatic Node.js installation"
        print_info "Please install Node.js 18+ manually from https://nodejs.org"
        exit 1
    fi
    
    if check_node_version; then
        print_success "Node.js installed successfully: $(node -v)"
    else
        print_error "Node.js installation failed"
        exit 1
    fi
}

# Install Python
install_python() {
    print_header "Checking Python"
    
    if command_exists python3; then
        PYTHON_VERSION=$(python3 -V | cut -d' ' -f2 | cut -d'.' -f1,2)
        print_success "Python $PYTHON_VERSION is installed"
    else
        print_info "Installing Python..."
        if [[ "$OS" == "ubuntu" || "$OS" == "debian" ]]; then
            sudo apt-get update
            sudo apt-get install -y python3 python3-pip python3-venv
        elif [[ "$OS" == "rhel" || "$OS" == "centos" || "$OS" == "fedora" ]]; then
            sudo dnf install -y python3 python3-pip
        fi
        print_success "Python installed"
    fi
}

# Install system dependencies
install_dependencies() {
    print_header "Installing System Dependencies"
    
    if [[ "$OS" == "ubuntu" || "$OS" == "debian" ]]; then
        print_info "Updating package list..."
        sudo apt-get update -qq
        
        print_info "Installing build tools..."
        sudo apt-get install -y build-essential git curl wget
        
    elif [[ "$OS" == "rhel" || "$OS" == "centos" || "$OS" == "fedora" ]]; then
        print_info "Installing build tools..."
        sudo dnf groupinstall -y "Development Tools"
        sudo dnf install -y git curl wget
    fi
    
    print_success "System dependencies installed"
}

# Install npm packages
install_npm_packages() {
    print_header "Installing NPM Dependencies"
    
    if [ ! -f "package.json" ]; then
        print_error "package.json not found. Are you in the correct directory?"
        exit 1
    fi
    
    print_info "This may take a few minutes..."
    npm install
    
    print_success "NPM dependencies installed"
}

# Build for production
build_production() {
    print_header "Building Production Bundle"
    
    print_info "Optimizing and bundling..."
    npm run build
    
    if [ -d "dist" ]; then
        print_success "Production build created in ./dist"
    else
        print_error "Build failed"
        exit 1
    fi
}

# Setup systemd service
setup_service() {
    print_header "Setting Up System Service (Optional)"
    
    read -p "Do you want to set up auto-start on boot? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Install serve globally if not present
        if ! command_exists serve; then
            print_info "Installing serve globally..."
            sudo npm install -g serve
        fi
        
        SERVICE_FILE="/etc/systemd/system/model-deployment-ui.service"
        WORK_DIR=$(pwd)
        
        print_info "Creating systemd service..."
        
        sudo bash -c "cat > $SERVICE_FILE" << EOF
[Unit]
Description=Model Deployment UI
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$WORK_DIR
ExecStart=/usr/bin/serve -s dist -l 3000
Restart=always
RestartSec=10
Environment="NODE_ENV=production"

[Install]
WantedBy=multi-user.target
EOF
        
        sudo systemctl daemon-reload
        sudo systemctl enable model-deployment-ui
        sudo systemctl start model-deployment-ui
        
        print_success "Service installed and started"
        print_info "Service commands:"
        echo "  - Check status: sudo systemctl status model-deployment-ui"
        echo "  - Stop service: sudo systemctl stop model-deployment-ui"
        echo "  - Restart: sudo systemctl restart model-deployment-ui"
        echo "  - View logs: journalctl -u model-deployment-ui -f"
    fi
}

# Configure firewall
configure_firewall() {
    print_header "Firewall Configuration (Optional)"
    
    read -p "Do you want to open firewall ports? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if command_exists ufw; then
            print_info "Configuring UFW..."
            sudo ufw allow 3000/tcp comment "Model Deployment UI"
            sudo ufw allow 8000/tcp comment "Model Deployment Backend"
            print_success "UFW configured"
        elif command_exists firewall-cmd; then
            print_info "Configuring firewalld..."
            sudo firewall-cmd --permanent --add-port=3000/tcp
            sudo firewall-cmd --permanent --add-port=8000/tcp
            sudo firewall-cmd --reload
            print_success "Firewalld configured"
        else
            print_warning "No firewall detected. Ports may already be open."
        fi
    fi
}

# Main installation flow
main() {
    # Check if in correct directory
    if [ ! -f "package.json" ]; then
        print_error "package.json not found!"
        print_info "Please run this script from the project directory"
        exit 1
    fi
    
    # Install everything
    install_dependencies
    install_nodejs
    install_python
    install_npm_packages
    build_production
    
    echo ""
    print_header "Installation Complete!"
    echo ""
    
    # Get IP address
    IP_ADDR=$(hostname -I | awk '{print $1}')
    
    print_success "Frontend is ready to run!"
    echo ""
    echo "Choose how to run:"
    echo ""
    echo "1. Development Mode (with hot reload):"
    echo "   ${GREEN}npm run dev${NC}"
    echo "   Access at: http://localhost:3000"
    echo ""
    echo "2. Production Mode:"
    echo "   ${GREEN}npx serve -s dist -l 3000${NC}"
    echo "   Access at: http://localhost:3000"
    echo ""
    echo "3. Production with Nginx (recommended for production):"
    echo "   See README.md for Nginx setup instructions"
    echo ""
    
    if [ ! -z "$IP_ADDR" ]; then
        echo "Remote access: http://$IP_ADDR:3000"
        echo ""
    fi
    
    # Offer to setup service
    setup_service
    echo ""
    
    # Offer to configure firewall
    configure_firewall
    echo ""
    
    print_header "Next Steps"
    echo ""
    echo "1. Start the frontend:"
    echo "   ${BLUE}npm run dev${NC}"
    echo ""
    echo "2. Set up the backend API server on port 8000"
    echo ""
    echo "3. Access the interface:"
    echo "   Local:  http://localhost:3000"
    echo "   Remote: http://$IP_ADDR:3000"
    echo ""
    echo "For more details, see ${BLUE}README.md${NC}"
    echo ""
    
    print_success "Installation script completed successfully!"
}

# Run main installation
main
