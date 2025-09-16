# Azure Static Web Apps Deployment Guide

This guide walks you through deploying the Corvus ADX Teams application to Azure Static Web Apps.

## Prerequisites

1. **Azure Account** with active subscription
2. **GitHub Repository** (already configured: https://github.com/TorgeirI/corvus-data-client.git)
3. **Azure CLI** (optional, for advanced configuration)

## Deployment Steps

### 1. Create Azure Static Web App

1. **Sign in to Azure Portal**: https://portal.azure.com
2. **Create a resource** → Search "Static Web Apps"
3. **Configure the Static Web App**:
   - **Subscription**: Choose your Azure subscription
   - **Resource Group**: Create new or use existing
   - **Name**: `corvus-adx-teams-app`
   - **Plan type**: Free (for development) or Standard (for production)
   - **Region**: Choose closest region (e.g., West Europe)

### 2. GitHub Integration

4. **Source Configuration**:
   - **Source**: GitHub
   - **GitHub account**: Connect your GitHub account
   - **Organization**: TorgeirI
   - **Repository**: corvus-data-client
   - **Branch**: main

5. **Build Configuration**:
   - **Build Presets**: React
   - **App location**: `/`
   - **API location**: `` (leave empty)
   - **Output location**: `build`

### 3. Configure Secrets

After deployment, add these secrets to your GitHub repository:

1. Go to **GitHub Repository** → Settings → Secrets and variables → Actions
2. Add the following secrets:

```
VITE_OPENAI_API_KEY=your_openai_api_key_here
VITE_OPENAI_MODEL=gpt-3.5-turbo
VITE_OPENAI_TEMPERATURE=0.2
VITE_FORCE_OPENAI=true
```

The `AZURE_STATIC_WEB_APPS_API_TOKEN` will be automatically added by Azure.

### 4. Verify Deployment

1. **Check GitHub Actions**: Go to Actions tab in your repository
2. **Monitor Build**: Watch the Azure Static Web Apps CI/CD workflow
3. **Access Application**: Azure will provide a URL like `https://nice-beach-xxxx.azurestaticapps.net`

## Configuration Files Created

### `staticwebapp.config.json`
- Configures routing for Single Page Application
- Sets up Teams-compatible headers (X-Frame-Options, CSP)
- Handles 404 redirects to index.html

### `.github/workflows/azure-static-web-apps.yml`
- Automated CI/CD pipeline
- Builds and deploys on every push to main
- Includes type checking and linting
- Configures environment variables

## Teams Integration

Once deployed, you'll need to:

1. **Update Teams Manifest** with the Azure URL
2. **Regenerate Teams Package**
3. **Test in Microsoft Teams**

The Azure Static Web App will automatically:
- ✅ Handle HTTPS (required for Teams)
- ✅ Set proper headers for iframe embedding
- ✅ Support SPA routing
- ✅ Serve static assets efficiently

## Custom Domain (Optional)

For production use, you can configure a custom domain:

1. **Azure Portal** → Your Static Web App → Custom domains
2. **Add custom domain** → Follow verification steps
3. **Update Teams manifest** with custom domain

## Environment Variables

The application supports these environment variables:

- `VITE_OPENAI_API_KEY`: OpenAI API key for natural language processing
- `VITE_OPENAI_MODEL`: OpenAI model to use (default: gpt-3.5-turbo)
- `VITE_OPENAI_TEMPERATURE`: Temperature for AI responses (default: 0.2)
- `VITE_FORCE_OPENAI`: Force OpenAI usage over fallback (default: true)

## Monitoring and Logs

- **Azure Portal**: Monitor application performance and errors
- **GitHub Actions**: View build and deployment logs
- **Browser DevTools**: Debug client-side issues

## Troubleshooting

### Common Issues:

1. **Build Fails**: Check Node.js version (should be 18+)
2. **Environment Variables**: Ensure all secrets are properly set
3. **Teams Integration**: Verify headers are set correctly
4. **CORS Issues**: Check domain configuration in staticwebapp.config.json

### Support Resources:

- [Azure Static Web Apps Documentation](https://docs.microsoft.com/azure/static-web-apps/)
- [GitHub Actions Documentation](https://docs.github.com/actions)
- [Microsoft Teams App Development](https://docs.microsoft.com/microsoftteams/platform/)

---

## Next Steps After Deployment

1. Note the Azure URL from the deployment
2. Update the Teams manifest with the new URL
3. Generate a new Teams app package
4. Test the application in Microsoft Teams
5. Configure any additional Azure services as needed

**Expected Azure URL format**: `https://[generated-name].azurestaticapps.net`