#!/bin/bash

# Auto-Fix Script - Reorganizes files into correct folder structure
# Use this if files were downloaded flat without folders

echo "================================================"
echo "  AUTO-FIX: Folder Structure Organizer"
echo "================================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}This script will organize your files into the correct structure.${NC}"
echo ""

# Check if package.json exists (to confirm we're in the right directory)
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found!${NC}"
    echo "Please run this script from the model-deployment-ui directory"
    exit 1
fi

echo -e "${YELLOW}Step 1: Creating directory structure...${NC}"

# Create directories if they don't exist
mkdir -p src/components
mkdir -p src/services
mkdir -p src/styles

echo -e "${GREEN}✓ Directories created${NC}"
echo ""

echo -e "${YELLOW}Step 2: Organizing files...${NC}"

# Function to move file safely
move_file() {
    local file=$1
    local dest=$2
    
    if [ -f "$file" ]; then
        # Check if file is already in correct location
        if [ "$file" = "$dest" ]; then
            echo -e "${GREEN}✓${NC} $file - already in place"
        else
            mv "$file" "$dest" 2>/dev/null
            if [ $? -eq 0 ]; then
                echo -e "${GREEN}✓${NC} Moved $file → $dest"
            else
                echo -e "${YELLOW}⚠${NC} Could not move $file (may already be there)"
            fi
        fi
    else
        echo -e "${RED}✗${NC} File not found: $file"
    fi
}

# Move main entry files
move_file "main.jsx" "src/main.jsx"
move_file "App.jsx" "src/App.jsx"

# Move component files
move_file "DeploymentWizard.jsx" "src/components/DeploymentWizard.jsx"
move_file "ModelSelection.jsx" "src/components/ModelSelection.jsx"
move_file "HardwareConfig.jsx" "src/components/HardwareConfig.jsx"
move_file "DependencyManager.jsx" "src/components/DependencyManager.jsx"
move_file "DeploymentConfig.jsx" "src/components/DeploymentConfig.jsx"
move_file "DeploymentSummary.jsx" "src/components/DeploymentSummary.jsx"
move_file "DeploymentProgress.jsx" "src/components/DeploymentProgress.jsx"

# Move service file
move_file "api.js" "src/services/api.js"

# Move style file
move_file "App.css" "src/styles/App.css"

echo ""
echo -e "${YELLOW}Step 3: Verifying structure...${NC}"
echo ""

# Verification
all_good=true

# Check directories
if [ -d "src" ]; then
    echo -e "${GREEN}✓${NC} src/ directory exists"
else
    echo -e "${RED}✗${NC} src/ directory MISSING"
    all_good=false
fi

if [ -d "src/components" ]; then
    echo -e "${GREEN}✓${NC} src/components/ directory exists"
else
    echo -e "${RED}✗${NC} src/components/ directory MISSING"
    all_good=false
fi

if [ -d "src/services" ]; then
    echo -e "${GREEN}✓${NC} src/services/ directory exists"
else
    echo -e "${RED}✗${NC} src/services/ directory MISSING"
    all_good=false
fi

if [ -d "src/styles" ]; then
    echo -e "${GREEN}✓${NC} src/styles/ directory exists"
else
    echo -e "${RED}✗${NC} src/styles/ directory MISSING"
    all_good=false
fi

echo ""

# Check critical files
critical_files=(
    "src/main.jsx"
    "src/App.jsx"
    "src/components/DeploymentWizard.jsx"
    "src/components/ModelSelection.jsx"
    "src/components/HardwareConfig.jsx"
    "src/components/DependencyManager.jsx"
    "src/components/DeploymentConfig.jsx"
    "src/components/DeploymentSummary.jsx"
    "src/components/DeploymentProgress.jsx"
    "src/services/api.js"
    "src/styles/App.css"
)

missing_files=()

for file in "${critical_files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file"
    else
        echo -e "${RED}✗${NC} $file - MISSING"
        missing_files+=("$file")
        all_good=false
    fi
done

echo ""
echo "================================================"

if [ "$all_good" = true ]; then
    echo -e "${GREEN}✓ SUCCESS! All files are in the correct structure!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Run: npm install"
    echo "2. Run: npm run dev"
    echo "3. Open: http://localhost:3000"
else
    echo -e "${RED}⚠ WARNING: Some files are missing!${NC}"
    echo ""
    echo "Missing files:"
    for file in "${missing_files[@]}"; do
        echo "  - $file"
    done
    echo ""
    echo "Solutions:"
    echo "1. Re-download the tar.gz archive"
    echo "2. Check if files have different names"
    echo "3. Manually create missing files"
fi

echo "================================================"
echo ""

# Show current structure
echo "Current structure:"
echo ""
if command -v tree >/dev/null 2>&1; then
    tree -L 2 -I 'node_modules|dist'
else
    find . -type d -not -path "./node_modules/*" -not -path "./dist/*" -not -path "./.git/*" | sort | sed 's|^\./||'
fi

echo ""
echo "================================================"
echo "Script complete!"
echo "================================================"
