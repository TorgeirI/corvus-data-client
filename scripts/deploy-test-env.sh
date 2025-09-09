#!/bin/bash

# Corvus ADX Teams App - Test Environment Deployment Script
# This script sets up the app in test mode with mock vessel battery data

echo "🚢 Setting up Corvus ADX Teams App for Testing..."
echo "This will configure the app with simulated vessel battery data"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are available"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Setup test environment configuration
echo "⚙️ Setting up test environment configuration..."

if [ -f ".env" ]; then
    echo "⚠️  .env file already exists. Creating backup..."
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
fi

# Copy test configuration
cp .env.test .env
echo "✅ Test environment configuration applied"

# Prompt for OpenAI API key if user wants AI features
echo ""
echo "🤖 Optional: OpenAI Integration"
echo "For natural language query processing, you can add your OpenAI API key."
echo "You can skip this and add it later in the .env file."
echo ""
read -p "Enter your OpenAI API key (or press Enter to skip): " openai_key

if [ ! -z "$openai_key" ]; then
    # Update the .env file with the provided API key
    sed -i.bak "s/your-openai-api-key-here/$openai_key/" .env
    echo "✅ OpenAI API key configured"
fi

echo ""
echo "🎉 Test environment setup complete!"
echo ""
echo "📊 Mock Data Features:"
echo "  • 13 realistic vessels with battery monitoring systems"
echo "  • Time series data with operational patterns"
echo "  • Cargo, passenger, tanker, fishing, and research vessels"
echo "  • Realistic battery metrics (voltage, current, temperature, health)"
echo ""
echo "🚀 To start the development server:"
echo "  npm run dev"
echo ""
echo "🧪 The app will run in TEST MODE with simulated data"
echo "   Look for the blue 'TEST MODE' banner when the app loads"
echo ""
echo "📖 Try these sample queries:"
echo "  • 'Show battery voltage for Atlantic Carrier over the last 24 hours'"
echo "  • 'Which vessels have battery health below 85%?'"
echo "  • 'Compare charging patterns between cargo and passenger vessels'"
echo ""
echo "🔧 Configuration files:"
echo "  • .env (current test configuration)"
echo "  • .env.example (production template)"
echo "  • .env.test (test template)"
echo ""

# Ask if user wants to start the dev server
echo ""
read -p "Start the development server now? (y/n): " start_server

if [ "$start_server" = "y" ] || [ "$start_server" = "Y" ]; then
    echo ""
    echo "🚀 Starting development server..."
    echo "   The app will be available at https://localhost:3000"
    echo "   Press Ctrl+C to stop the server"
    echo ""
    npm run dev
else
    echo ""
    echo "✅ Setup complete! Run 'npm run dev' when you're ready to start."
fi