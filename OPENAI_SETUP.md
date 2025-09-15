# OpenAI API Configuration Guide

This guide will help you set up the OpenAI API for natural language to KQL conversion in the Corvus ADX Teams application.

## 🔑 Step 1: Get Your OpenAI API Key

1. **Visit OpenAI Platform**: Go to https://platform.openai.com/api-keys
2. **Sign Up/Login**: Create an account or log in to your existing OpenAI account
3. **Create API Key**: 
   - Click "Create new secret key"
   - Name it something like "Corvus-ADX-Teams"
   - Copy the key (it starts with `sk-...`)
   - **IMPORTANT**: Save this key securely - you won't be able to see it again!

## ⚙️ Step 2: Configure the Application

### Option A: Using .env.local (Recommended)

1. **Open the `.env.local` file** in the project root
2. **Replace the placeholder** with your actual API key:
   ```env
   VITE_OPENAI_API_KEY=sk-your-actual-api-key-here
   ```

### Option B: Using environment variables
```bash
export VITE_OPENAI_API_KEY=sk-your-actual-api-key-here
```

## 🤖 Step 3: Choose Your Model

The application supports several OpenAI models. Edit `.env.local` to set your preferred model:

### **GPT-3.5 Turbo (Recommended for most users)**
```env
VITE_OPENAI_MODEL=gpt-3.5-turbo
```
- ✅ Good KQL generation performance
- ✅ Lower cost
- ✅ Available to most OpenAI plans

### **GPT-4 Turbo (Best performance)**
```env
VITE_OPENAI_MODEL=gpt-4-turbo-preview
```
- ✅ Excellent KQL generation
- ✅ Better understanding of complex queries
- ⚠️ Requires GPT-4 access
- ⚠️ Higher cost per request

### **GPT-4 (Standard)**
```env
VITE_OPENAI_MODEL=gpt-4
```
- ✅ Very good performance
- ⚠️ Requires GPT-4 access
- ⚠️ Slower than GPT-4 Turbo

## 🎛️ Step 4: Fine-tune Settings (Optional)

### Temperature Control
Controls creativity vs determinism:
```env
VITE_OPENAI_TEMPERATURE=0.2  # 0.1-0.3 recommended for KQL
```

### Advanced Settings
```env
VITE_OPENAI_MAX_TOKENS=1500
VITE_OPENAI_TIMEOUT=30000
```

## 🧪 Step 5: Test the Configuration

1. **Start the application**:
   ```bash
   npm run dev
   ```

2. **Try some test queries**:
   - "Show me all vessels starting with the letter A"
   - "Find vessels with low battery health"
   - "Show battery data from the last 24 hours"
   - "Which vessels need maintenance?"

3. **Check the console**: Look for any error messages about API key or model access

## 🔒 Security Best Practices

### ✅ DO:
- Use `.env.local` for local development (it's gitignored)
- Keep your API key private and secure
- Use environment variables in production
- Monitor your OpenAI usage and costs

### ❌ DON'T:
- Commit API keys to git repositories
- Share API keys in team chats or emails
- Use high temperature settings for KQL generation
- Use expensive models unnecessarily

## 💰 Cost Management

### Model Cost Comparison (approximate):
- **GPT-3.5 Turbo**: ~$0.002 per query
- **GPT-4**: ~$0.06 per query  
- **GPT-4 Turbo**: ~$0.03 per query

### Tips to Reduce Costs:
1. **Start with GPT-3.5 Turbo** - it performs well for most KQL tasks
2. **Set usage limits** in your OpenAI dashboard
3. **Monitor usage** regularly
4. **Use lower temperature** settings (0.1-0.3)

## 🐛 Troubleshooting

### Common Issues:

#### "OpenAI API key not configured" 
- ✅ Check that your API key starts with `sk-`
- ✅ Ensure no extra spaces in the key
- ✅ Verify the key is in `.env.local` or environment variables
- ✅ Restart the development server after changes

#### "Model not available" or "Invalid model"
- ✅ Check your OpenAI plan supports the chosen model
- ✅ Ensure the model name is correct (no typos)
- ✅ Try switching to `gpt-3.5-turbo` as a fallback

#### "Rate limit exceeded"
- ✅ Check your OpenAI usage limits
- ✅ Wait a few minutes and try again
- ✅ Consider upgrading your OpenAI plan

#### "Failed to parse AI response"
- ✅ Check if the model supports JSON response format
- ✅ Try using a different model
- ✅ Check your temperature setting (should be < 0.5)

### Getting Help:
1. Check the browser console for detailed error messages
2. Verify your OpenAI dashboard for API usage and errors
3. Test your API key with a simple curl request
4. Check OpenAI status page: https://status.openai.com/

## 📊 Expected Results

Once properly configured, you should see:

1. **Natural language queries converted to KQL**:
   ```
   Input: "Show me all vessels starting with A"
   Output: VesselInfo | where vesselName startswith "A" | project vesselId, vesselName, vesselType
   ```

2. **Intelligent query suggestions** in the UI
3. **Context-aware explanations** of generated queries
4. **Appropriate visualization recommendations**

## 🔄 Fallback Behavior

If OpenAI is unavailable, the app will automatically use a pattern-based fallback system, but the AI-powered system provides much better results for natural language understanding.

---

**Need help?** Check the troubleshooting section above or refer to the OpenAI documentation at https://platform.openai.com/docs