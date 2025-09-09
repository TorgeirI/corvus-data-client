@echo off
setlocal enabledelayedexpansion

REM Corvus ADX Teams App - Test Environment Deployment Script (Windows)
REM This script sets up the app in test mode with mock vessel battery data

echo 🚢 Setting up Corvus ADX Teams App for Testing...
echo This will configure the app with simulated vessel battery data
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo ✅ Node.js and npm are available

REM Install dependencies
echo 📦 Installing dependencies...
call npm install
if errorlevel 1 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo ✅ Dependencies installed successfully

REM Setup test environment configuration
echo ⚙️ Setting up test environment configuration...

if exist ".env" (
    echo ⚠️  .env file already exists. Creating backup...
    set timestamp=%date:~6,4%%date:~3,2%%date:~0,2%_%time:~0,2%%time:~3,2%%time:~6,2%
    set timestamp=!timestamp: =0!
    copy .env .env.backup.!timestamp! >nul
)

REM Copy test configuration
copy .env.test .env >nul
echo ✅ Test environment configuration applied

REM Prompt for OpenAI API key
echo.
echo 🤖 Optional: OpenAI Integration
echo For natural language query processing, you can add your OpenAI API key.
echo You can skip this and add it later in the .env file.
echo.
set /p openai_key="Enter your OpenAI API key (or press Enter to skip): "

if not "!openai_key!"=="" (
    REM Update the .env file with the provided API key
    powershell -Command "(gc .env) -replace 'your-openai-api-key-here', '!openai_key!' | Out-File -encoding ASCII .env"
    echo ✅ OpenAI API key configured
)

echo.
echo 🎉 Test environment setup complete!
echo.
echo 📊 Mock Data Features:
echo   • 13 realistic vessels with battery monitoring systems
echo   • Time series data with operational patterns
echo   • Cargo, passenger, tanker, fishing, and research vessels
echo   • Realistic battery metrics (voltage, current, temperature, health)
echo.
echo 🚀 To start the development server:
echo   npm run dev
echo.
echo 🧪 The app will run in TEST MODE with simulated data
echo    Look for the blue 'TEST MODE' banner when the app loads
echo.
echo 📖 Try these sample queries:
echo   • 'Show battery voltage for Atlantic Carrier over the last 24 hours'
echo   • 'Which vessels have battery health below 85%?'
echo   • 'Compare charging patterns between cargo and passenger vessels'
echo.
echo 🔧 Configuration files:
echo   • .env (current test configuration)
echo   • .env.example (production template)
echo   • .env.test (test template)
echo.

REM Ask if user wants to start the dev server
echo.
set /p start_server="Start the development server now? (y/n): "

if /i "!start_server!"=="y" (
    echo.
    echo 🚀 Starting development server...
    echo    The app will be available at https://localhost:3000
    echo    Press Ctrl+C to stop the server
    echo.
    call npm run dev
) else (
    echo.
    echo ✅ Setup complete! Run 'npm run dev' when you're ready to start.
)

pause