#!/bin/bash

echo "🌱 Starting Plant Identifier App..."
echo ""

# Check if Python is available
if command -v python3 &> /dev/null; then
    echo "🐍 Using Python 3"
    python3 server.py "$@"
elif command -v python &> /dev/null; then
    echo "🐍 Using Python 2"
    python server.py "$@"
else
    echo "❌ Python not found. Please install Python to run the server."
    echo ""
    echo "Alternative: Use any HTTP server:"
    echo "  - Node.js: npx http-server -p 8000"
    echo "  - PHP: php -S localhost:8000"
    echo "  - Or open index.html directly in your browser"
    exit 1
fi