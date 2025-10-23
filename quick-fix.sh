#!/bin/bash

# Quick Fix Script for Vite Import Errors
# This fixes the most common installation issues

set -e

echo "🔧 Running Quick Fix for Vite Import Error..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found!${NC}"
    echo "Please run this script from the model-deployment-ui directory"
    echo "Example: cd ~/model-deployment-ui && ./quick-fix.sh"
    exit 1
fi

echo -e "${BLUE}Step 1: Checking directory structure...${NC}"
if [ ! -d "src" ]; then
    echo -e "${RED}Error: src/ directory not found!${NC}"
    exit 1
fi
if [ ! -f "src/main.jsx" ]; then
    echo -e "${RED}Error: src/main.jsx not found!${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Directory structure OK${NC}"
echo ""

echo -e "${BLUE}Step 2: Fixing index.html path...${NC}"
# Fix the script tag in index.html
if grep -q 'src="/src/main.jsx"' index.html 2>/dev/null; then
    sed -i 's|src="/src/main.jsx"|src="./src/main.jsx"|g' index.html
    echo -e "${GREEN}✓ Fixed absolute path to relative path${NC}"
elif grep -q 'src="./src/main.jsx"' index.html 2>/dev/null; then
    echo -e "${GREEN}✓ Path already correct${NC}"
else
    echo -e "${YELLOW}⚠ Could not find script tag. Creating new index.html...${NC}"
    cat > index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Model Deployment Interface</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./src/main.jsx"></script>
  </body>
</html>
EOF
    echo -e "${GREEN}✓ Created new index.html${NC}"
fi
echo ""

echo -e "${BLUE}Step 3: Cleaning previous builds...${NC}"
rm -rf node_modules/.vite dist 2>/dev/null || true
echo -e "${GREEN}✓ Cleaned cache and build files${NC}"
echo ""

echo -e "${BLUE}Step 4: Checking Node.js version...${NC}"
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}✗ Node.js version is too old: $(node -v)${NC}"
    echo -e "${YELLOW}Please upgrade to Node.js 18 or higher${NC}"
    echo "Run: curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
    echo "     sudo apt install -y nodejs"
    exit 1
else
    echo -e "${GREEN}✓ Node.js version OK: $(node -v)${NC}"
fi
echo ""

echo -e "${BLUE}Step 5: Reinstalling dependencies...${NC}"
rm -rf node_modules package-lock.json 2>/dev/null || true
npm install --legacy-peer-deps
echo -e "${GREEN}✓ Dependencies reinstalled${NC}"
echo ""

echo -e "${BLUE}Step 6: Verifying installation...${NC}"
if [ -d "node_modules/react" ] && [ -d "node_modules/vite" ]; then
    echo -e "${GREEN}✓ Critical packages installed${NC}"
else
    echo -e "${RED}✗ Some packages missing${NC}"
    exit 1
fi
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Quick Fix Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Next steps:"
echo ""
echo "1. Start the development server:"
echo -e "   ${BLUE}npm run dev${NC}"
echo ""
echo "2. Open your browser to:"
echo -e "   ${BLUE}http://localhost:3000${NC}"
echo ""
echo "3. If you still see errors:"
echo -e "   ${YELLOW}Check browser console (F12) for details${NC}"
echo -e "   ${YELLOW}See TROUBLESHOOTING.md for more help${NC}"
echo ""

# Optional: Start the server automatically
read -p "Do you want to start the dev server now? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}Starting development server...${NC}"
    npm run dev
fi
