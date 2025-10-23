#!/bin/bash
# Setup script for AI Model Deployment Backend

echo "=========================================="
echo "AI Model Deployment Backend Setup"
echo "=========================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check Python version
echo -e "${BLUE}Checking Python version...${NC}"
python3 --version

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Python 3 is not installed${NC}"
    exit 1
fi

# Create virtual environment
echo -e "${BLUE}Creating virtual environment...${NC}"
python3 -m venv venv

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to create virtual environment${NC}"
    exit 1
fi

# Activate virtual environment
echo -e "${BLUE}Activating virtual environment...${NC}"
source venv/bin/activate

# Upgrade pip
echo -e "${BLUE}Upgrading pip...${NC}"
pip install --upgrade pip

# Install requirements
echo -e "${BLUE}Installing requirements...${NC}"
pip install -r requirements.txt

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to install requirements${NC}"
    exit 1
fi

# Create necessary directories
echo -e "${BLUE}Creating directories...${NC}"
mkdir -p deployed_models
mkdir -p uploads
mkdir -p logs

# Set permissions
chmod +x setup.sh 2>/dev/null

echo ""
echo -e "${GREEN}=========================================="
echo "Setup completed successfully!"
echo "==========================================${NC}"
echo ""
echo "Next steps:"
echo "  1. Activate the virtual environment:"
echo "     source venv/bin/activate"
echo ""
echo "  2. Start the backend server:"
echo "     python3 api_server.py"
echo ""
echo "  3. Access the API at:"
echo "     - API: http://localhost:8000"
echo "     - Docs: http://localhost:8000/docs"
echo ""
echo "  4. In another terminal, start your frontend:"
echo "     cd [your-frontend-directory]"
echo "     npm run dev"
echo ""
