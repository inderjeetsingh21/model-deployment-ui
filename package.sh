#!/bin/bash

# Package the entire project for deployment to another Linux system

set -e

PACKAGE_NAME="model-deployment-ui-package.tar.gz"
TEMP_DIR="model-deployment-ui-package"

echo "Creating deployment package..."

# Create temporary directory
mkdir -p "$TEMP_DIR"

# Copy all necessary files
cp -r src "$TEMP_DIR/"
cp package.json "$TEMP_DIR/"
cp vite.config.js "$TEMP_DIR/"
cp index.html "$TEMP_DIR/"
cp README.md "$TEMP_DIR/"
cp QUICKSTART.md "$TEMP_DIR/"
cp install.sh "$TEMP_DIR/"
cp .gitignore "$TEMP_DIR/" 2>/dev/null || true

# Make install script executable
chmod +x "$TEMP_DIR/install.sh"

# Create archive
tar -czf "$PACKAGE_NAME" "$TEMP_DIR"

# Clean up
rm -rf "$TEMP_DIR"

echo "✓ Package created: $PACKAGE_NAME"
echo ""
echo "To deploy on another Linux system:"
echo "1. Transfer the file: scp $PACKAGE_NAME user@server:~/"
echo "2. Extract: tar -xzf $PACKAGE_NAME"
echo "3. Enter directory: cd $TEMP_DIR"
echo "4. Run installer: ./install.sh"
echo ""
echo "Package size: $(du -h $PACKAGE_NAME | cut -f1)"
