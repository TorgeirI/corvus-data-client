# Corvus ADX Teams Application

A Microsoft Teams application that enables natural language querying of Azure Data Explorer (ADX) databases with interactive visualizations for vessel battery monitoring systems.

## 🚢 Features

- **Natural Language Processing**: Convert English queries to KQL using OpenAI GPT-4
- **Vessel Battery Monitoring**: Specialized for maritime battery systems across 13 realistic vessels
- **Interactive Visualizations**: Multiple chart types (bar, line, pie, table) with automatic type detection
- **Data Export**: CSV, JSON, TSV export capabilities with validation
- **Microsoft Teams Integration**: Native Teams app with SSO authentication
- **Mock Data System**: Comprehensive testing environment without Azure dependencies

## 🧪 Mock Data Features

- **13 Realistic Vessels** across 5 categories (cargo, passenger, tanker, fishing, research)
- **Comprehensive Battery Metrics**: voltage, current, temperature, state of charge, health
- **Operational Patterns**: Seasonal variations, daily cycles, and realistic fault scenarios
- **Time Series Generation**: Production-quality mock data with correlations

### Sample Vessels
- **Cargo**: Atlantic Carrier, Pacific Trader, Global Express
- **Passenger**: Island Hopper, Coastal Cruiser
- **Tanker**: Oil Pioneer, Fuel Master, Energy Transporter
- **Fishing**: Sea Hunter, Ocean Harvester, Deep Blue
- **Research**: Marine Explorer, Ocean Lab

## 🚀 Quick Start

### Test Environment (Recommended)
```bash
# Automated setup
./scripts/deploy-test-env.sh    # Linux/Mac
scripts\deploy-test-env.bat     # Windows

# Manual setup
npm install
cp .env.test .env
npm run dev
# Visit http://localhost:3000
```

### Production Setup
1. Copy `.env.example` to `.env`
2. Configure real Azure AD, ADX, and OpenAI credentials
3. Update Teams manifest with your app registration
4. Deploy to Azure Web Apps or Static Web Apps

## 🔧 Configuration

### Environment Variables
```bash
# Azure AD Authentication
VITE_AZURE_CLIENT_ID=your-azure-client-id
VITE_AZURE_TENANT_ID=your-azure-tenant-id
VITE_AZURE_REDIRECT_URI=https://your-domain.com

# Azure Data Explorer
VITE_ADX_CLUSTER_URL=https://your-cluster.kusto.windows.net
VITE_ADX_DATABASE_NAME=YourDatabase

# OpenAI for Natural Language Processing
VITE_OPENAI_API_KEY=sk-your-openai-api-key
VITE_OPENAI_MODEL=gpt-4-turbo-preview

# Teams Integration
VITE_TEAMS_APP_ID=your-teams-app-id

# Mock Data (for testing)
VITE_USE_MOCK_DATA=true
VITE_MOCK_VESSEL_COUNT=13
VITE_MOCK_DATA_DAYS=30
```

## 📊 Sample Queries

Try these natural language queries in the app:

### Monitoring
- "Show battery voltage for Atlantic Carrier over the last 24 hours"
- "What is the current battery health for all vessels?"
- "Which vessels are currently charging their batteries?"

### Troubleshooting
- "Which vessels have battery health below 85%?"
- "Show me battery temperature anomalies this week"
- "Show me all battery faults and their patterns"

### Analytics
- "Compare battery performance between cargo and passenger vessels"
- "Show daily battery usage patterns for the fleet"
- "Show battery efficiency trends for the last month"

## 🏗️ Architecture

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Chart.js** for interactive visualizations
- **Microsoft Teams SDK** for Teams integration

### Services
- **ADXService**: Azure Data Explorer connectivity with mock mode
- **MockDataService**: Realistic vessel battery data generation
- **NLToKqlService**: OpenAI integration for natural language processing
- **AuthService**: Azure AD authentication with Teams SSO

### Components
- **QueryInterface**: Main application interface
- **ChartRenderer**: Multi-format visualization engine
- **ConfigurationPanel**: ADX connection management
- **SavedQueries**: Query library system

## 🔒 Security

**⚠️ IMPORTANT SECURITY NOTES:**

1. **Never commit real API keys or secrets to version control**
2. **The `.env` file is git-ignored by default**
3. **Use `.env.example` as a template for production configuration**
4. **Current repository contains only mock/placeholder values for testing**

### Files Containing Secrets (Git-Ignored)
- `.env` - Environment configuration
- `.env.local` - Local overrides
- `.env.production.local` - Production secrets
- `config/production.json` - Production configuration
- `secrets/` - Any secret files directory

## 🧪 Testing

### Mock Mode
The application includes a comprehensive mock data system:
- Automatic activation when `VITE_USE_MOCK_DATA=true`
- Visual "TEST MODE" banner in the UI
- No Azure dependencies required
- Realistic vessel battery data for demonstration

### Static Demo
A static HTML demo is available at `test-server.html` for presentations without running the full React app.

## 📦 Deployment

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Teams App Package
1. Update `public/manifest.json` with your configuration
2. Zip the manifest and icons
3. Upload to Microsoft Teams admin center

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Ensure no real secrets are committed
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section
2. Review environment configuration
3. Ensure mock mode is enabled for testing
4. Check browser console for detailed error messages

---

**🧪 Current Status**: Ready for testing and demonstration with comprehensive mock vessel battery data system.