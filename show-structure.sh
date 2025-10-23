#!/bin/bash

# Folder Structure Viewer
# This script displays the actual folder structure of your project

echo "================================================"
echo "  MODEL DEPLOYMENT UI - Folder Structure"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "Error: Not in project directory!"
    echo "Please run: cd ~/model-deployment-ui && ./show-structure.sh"
    exit 1
fi

echo -e "${BLUE}Current Directory: $(pwd)${NC}"
echo ""
echo "================================================"
echo ""

# Function to display file count and size
show_stats() {
    local dir=$1
    local label=$2
    if [ -d "$dir" ]; then
        local count=$(find "$dir" -type f 2>/dev/null | wc -l)
        local size=$(du -sh "$dir" 2>/dev/null | cut -f1)
        echo -e "${CYAN}$label${NC}: $count files, $size total"
    fi
}

# Display the tree structure
if command -v tree >/dev/null 2>&1; then
    echo -e "${GREEN}Full Structure (using tree command):${NC}"
    echo ""
    tree -L 3 -I 'node_modules|dist' --dirsfirst
    echo ""
else
    echo -e "${GREEN}Full Structure:${NC}"
    echo ""
    echo "model-deployment-ui/"
    echo "├── Configuration Files:"
    [ -f "package.json" ] && echo "│   ├── ✓ package.json"
    [ -f "vite.config.js" ] && echo "│   ├── ✓ vite.config.js"
    [ -f "index.html" ] && echo "│   ├── ✓ index.html"
    [ -f ".gitignore" ] && echo "│   └── ✓ .gitignore"
    echo "│"
    
    echo "├── Documentation:"
    [ -f "README.md" ] && echo "│   ├── ✓ README.md"
    [ -f "QUICKSTART.md" ] && echo "│   ├── ✓ QUICKSTART.md"
    [ -f "DEPLOYMENT_GUIDE.md" ] && echo "│   ├── ✓ DEPLOYMENT_GUIDE.md"
    [ -f "FIX_NOW.md" ] && echo "│   ├── ✓ FIX_NOW.md"
    [ -f "TROUBLESHOOTING.md" ] && echo "│   ├── ✓ TROUBLESHOOTING.md"
    [ -f "PROJECT_STRUCTURE.md" ] && echo "│   ├── ✓ PROJECT_STRUCTURE.md"
    [ -f "FOLDER_STRUCTURE.md" ] && echo "│   └── ✓ FOLDER_STRUCTURE.md"
    echo "│"
    
    echo "├── Scripts:"
    [ -f "install.sh" ] && echo "│   ├── ✓ install.sh"
    [ -f "quick-fix.sh" ] && echo "│   ├── ✓ quick-fix.sh"
    [ -f "package.sh" ] && echo "│   └── ✓ package.sh"
    echo "│"
    
    if [ -d "src" ]; then
        echo "└── src/"
        [ -f "src/main.jsx" ] && echo "    ├── ✓ main.jsx"
        [ -f "src/App.jsx" ] && echo "    ├── ✓ App.jsx"
        
        if [ -d "src/components" ]; then
            echo "    ├── components/"
            [ -f "src/components/DeploymentWizard.jsx" ] && echo "    │   ├── ✓ DeploymentWizard.jsx"
            [ -f "src/components/ModelSelection.jsx" ] && echo "    │   ├── ✓ ModelSelection.jsx"
            [ -f "src/components/HardwareConfig.jsx" ] && echo "    │   ├── ✓ HardwareConfig.jsx"
            [ -f "src/components/DependencyManager.jsx" ] && echo "    │   ├── ✓ DependencyManager.jsx"
            [ -f "src/components/DeploymentConfig.jsx" ] && echo "    │   ├── ✓ DeploymentConfig.jsx"
            [ -f "src/components/DeploymentSummary.jsx" ] && echo "    │   ├── ✓ DeploymentSummary.jsx"
            [ -f "src/components/DeploymentProgress.jsx" ] && echo "    │   └── ✓ DeploymentProgress.jsx"
        fi
        
        if [ -d "src/services" ]; then
            echo "    ├── services/"
            [ -f "src/services/api.js" ] && echo "    │   └── ✓ api.js"
        fi
        
        if [ -d "src/styles" ]; then
            echo "    └── styles/"
            [ -f "src/styles/App.css" ] && echo "        └── ✓ App.css"
        fi
    fi
    echo ""
fi

echo ""
echo "================================================"
echo -e "${YELLOW}Statistics:${NC}"
echo "================================================"
echo ""

# Count different file types
jsx_count=$(find src -name "*.jsx" 2>/dev/null | wc -l)
js_count=$(find src -name "*.js" 2>/dev/null | wc -l)
css_count=$(find src -name "*.css" 2>/dev/null | wc -l)
md_count=$(find . -maxdepth 1 -name "*.md" 2>/dev/null | wc -l)
sh_count=$(find . -maxdepth 1 -name "*.sh" 2>/dev/null | wc -l)

echo "React Components (JSX):  $jsx_count files"
echo "JavaScript Files (JS):   $js_count files"
echo "Stylesheets (CSS):       $css_count files"
echo "Documentation (MD):      $md_count files"
echo "Scripts (SH):            $sh_count files"
echo ""

# Show directory sizes
show_stats "src" "Source Code"
show_stats "node_modules" "Dependencies"
show_stats "dist" "Production Build"
echo ""

# Check for missing critical files
echo "================================================"
echo -e "${YELLOW}Critical Files Check:${NC}"
echo "================================================"
echo ""

critical_files=(
    "package.json:Configuration"
    "vite.config.js:Build Config"
    "index.html:Entry Point"
    "src/main.jsx:React Entry"
    "src/App.jsx:Root Component"
    "src/components/DeploymentWizard.jsx:Main Wizard"
    "src/services/api.js:API Service"
    "src/styles/App.css:Styles"
)

all_good=true
for item in "${critical_files[@]}"; do
    IFS=':' read -r file label <<< "$item"
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $label: $file"
    else
        echo -e "${RED}✗${NC} $label: $file ${RED}MISSING${NC}"
        all_good=false
    fi
done

echo ""
if [ "$all_good" = true ]; then
    echo -e "${GREEN}✓ All critical files present!${NC}"
else
    echo -e "${RED}⚠ Some critical files are missing!${NC}"
    echo "Run: ./install.sh to fix"
fi

echo ""
echo "================================================"
echo -e "${CYAN}Path Information:${NC}"
echo "================================================"
echo ""
echo "Project Root:    $(pwd)"
echo "Source Code:     $(pwd)/src"
echo "Components:      $(pwd)/src/components"
echo "Services:        $(pwd)/src/services"
echo "Styles:          $(pwd)/src/styles"
echo ""

# Check if dependencies are installed
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓ Dependencies installed${NC}"
    echo "  Location: $(pwd)/node_modules"
else
    echo -e "${YELLOW}⚠ Dependencies not installed${NC}"
    echo "  Run: npm install"
fi
echo ""

# Check if build exists
if [ -d "dist" ]; then
    echo -e "${GREEN}✓ Production build exists${NC}"
    echo "  Location: $(pwd)/dist"
else
    echo -e "${YELLOW}⚠ No production build${NC}"
    echo "  Run: npm run build"
fi
echo ""

echo "================================================"
echo "To view this again, run: ./show-structure.sh"
echo "To install tree command: sudo apt install tree"
echo "================================================"
