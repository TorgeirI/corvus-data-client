# Microsoft Teams Tab Setup Guide

## Overview
This guide helps you set up and test the Corvus ADX application as a Microsoft Teams tab locally.

## Prerequisites
- Node.js and npm installed
- Microsoft Teams (desktop or web)
- Access to a Microsoft Teams organization where you can sideload apps

## Quick Start

### 1. Start the Development Server
```bash
# The app now runs on HTTPS (required for Teams)
npm run dev
```
The server will start at `https://localhost:3000`

### 2. Generate Teams App Package
```bash
# Creates a .zip file ready for Teams sideloading
npm run teams:package
```
This creates `teams-package/corvus-adx-teams-app.zip`

### 3. Sideload in Microsoft Teams
1. Open Microsoft Teams (desktop or web)
2. Go to **Apps** → **Manage your apps**
3. Click **"Upload an app"** → **"Upload a custom app"**
4. Select the generated `corvus-adx-teams-app.zip` file
5. Click **"Add"** to install the app

## Features

### Teams Integration
- ✅ **HTTPS Development Server** - Required for Teams apps
- ✅ **Teams Context Detection** - Detects when running in Teams vs browser
- ✅ **Theme Support** - Automatically adapts to Teams light, dark, and high-contrast themes
- ✅ **User Context** - Displays logged-in Teams user information
- ✅ **Responsive Design** - Optimized for Teams tab containers

### Visual Indicators
- **🎯 Teams Tab** - Shows when running in Teams with user name
- **🌐 Browser Mode** - Shows when running in regular browser
- **Theme Adaptation** - Seamlessly switches between Teams themes

### Teams Themes Supported
- **Default/Light Theme** - Standard Teams appearance
- **Dark Theme** - Dark mode with adjusted colors
- **High Contrast** - Accessibility-focused high contrast mode

## Development Workflow

### Build and Package for Teams
```bash
# Build production version and create Teams package
npm run teams:build
```

### Local Testing
1. **Browser Testing**: Visit `https://localhost:3000` directly
2. **Teams Testing**: Use sideloaded app in Teams

### SSL Certificate
The app automatically generates SSL certificates using `mkcert` for HTTPS support. You may need to:
1. Accept the browser security warning for localhost
2. Or install the certificate in your system keychain for seamless operation

## Troubleshooting

### Common Issues

#### 1. Certificate Warnings
**Problem**: Browser shows SSL certificate warnings
**Solution**: 
- Click "Advanced" → "Proceed to localhost" in your browser
- Or run `mkcert -install` to trust the local CA

#### 2. Teams App Won't Load
**Problem**: Blank screen or loading issues in Teams
**Solution**:
- Ensure development server is running on `https://localhost:3000`
- Check browser console for JavaScript errors
- Verify Teams has network access to localhost

#### 3. App Package Upload Fails
**Problem**: Teams rejects the app package
**Solution**:
- Ensure all required files are in the package (manifest.json, color.png, outline.png)
- Check manifest.json for syntax errors
- Verify icons are correct dimensions (96x96 for color, 32x32 for outline)

### Development Tips

#### Testing Both Modes
- **Teams Mode**: Install app in Teams to test full integration
- **Browser Mode**: Access `https://localhost:3000` to test without Teams context

#### Theme Testing
Switch Teams themes to test visual adaptation:
- Teams Settings → General → Theme

#### User Context Testing
The app displays different information based on Teams user context:
- In Teams: Shows user name and Teams-specific UI
- In Browser: Shows browser mode indicator

## File Structure

### Teams-Related Files
```
public/
├── manifest.json       # Teams app manifest
├── color.png          # 96x96 color icon
└── outline.png        # 32x32 outline icon

scripts/
└── package-teams-app.js  # Teams packaging script

teams-package/
└── corvus-adx-teams-app.zip  # Generated app package
```

### Key Configuration Files
- `vite.config.ts` - HTTPS development server configuration
- `package.json` - Teams build scripts
- `src/App.tsx` - Teams integration logic
- `src/index.css` - Teams theme support

## Next Steps

### Production Deployment
For production Teams deployment:
1. Deploy app to Azure App Service or similar
2. Update manifest.json with production URLs
3. Register app in Teams App Studio or Developer Portal
4. Submit to Teams App Store (optional)

### Enhanced Features
Consider adding:
- Teams SSO integration
- Teams notifications
- Deep linking from Teams conversations
- Teams meeting tabs

## Support

For issues with Teams integration:
- Check the browser console for errors
- Verify Teams manifest schema compliance
- Test in both Teams and browser modes
- Review Microsoft Teams developer documentation