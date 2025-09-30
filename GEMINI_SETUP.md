# Getting Started with Google Gemini AI

This guide will walk you through the steps to get a Google Gemini API key and integrate it with the Versus comparison app.

## Why Choose Gemini?

Google's Gemini models offer:
- **Fast performance**: Gemini 2.0 Flash is optimized for speed
- **Advanced reasoning**: Gemini 2.0 Flash Thinking provides enhanced reasoning capabilities
- **Generous free tier**: Get started at no cost with significant monthly quotas
- **Multimodal capabilities**: Process text, images, and more
- **Competitive pricing**: Cost-effective for production use

## Step-by-Step Guide to Getting Your API Key

### 1. Access Google AI Studio

Visit the Google AI Studio at: **https://aistudio.google.com/app/apikey**

### 2. Sign In

- If you don't have a Google account, you'll need to create one first
- Sign in with your Google account credentials

### 3. Create an API Key

1. Click on the **"Get API key"** or **"Create API key"** button
2. You may be prompted to:
   - Accept terms of service
   - Select or create a Google Cloud project (a default project will be created if you don't have one)
3. Your API key will be generated and displayed

### 4. Copy Your API Key

- **Important**: Your API key will look something like: `AIzaSyA...` (starts with `AIzaSy`)
- Copy this key immediately and store it securely
- **Security Note**: Treat this key like a password - don't share it or commit it to version control

### 5. Configure in Versus App

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to **AI Settings** in the app (usually accessible from the home page or settings menu)

3. Locate the **Google Gemini API Key** section

4. Paste your API key into the input field

5. Check the **"Enabled"** checkbox to activate Gemini

6. Click the **"Test"** button to verify your connection

7. Select a Gemini model from the **Default AI Model** dropdown:
   - **Gemini 2.0 Flash** (Recommended for most use cases - fast and efficient)
   - **Gemini 2.0 Flash Thinking** (Best for complex reasoning tasks)
   - **Gemini 1.5 Pro** (Most capable, balanced performance)
   - **Gemini 1.5 Flash** (Fast and efficient)
   - **Gemini 1.5 Flash-8B** (Fastest and cheapest option)

8. Click **"Save"** to apply your settings

## Understanding Gemini Models

### Gemini 2.0 Flash (Experimental)
- **Best for**: General tasks, fast responses
- **Speed**: Very fast
- **Cost**: Low
- **Ideal use cases**: Property extraction, quick summaries

### Gemini 2.0 Flash Thinking
- **Best for**: Complex reasoning, analysis
- **Speed**: Fast with enhanced thinking
- **Cost**: Moderate
- **Ideal use cases**: Deep content analysis, logical comparisons

### Gemini 1.5 Pro
- **Best for**: Highest quality results, complex tasks
- **Speed**: Moderate
- **Cost**: Higher
- **Ideal use cases**: Critical analysis, detailed extraction

### Gemini 1.5 Flash
- **Best for**: Balanced speed and quality
- **Speed**: Very fast
- **Cost**: Low
- **Ideal use cases**: Standard property extraction

### Gemini 1.5 Flash-8B
- **Best for**: Maximum speed, cost efficiency
- **Speed**: Fastest
- **Cost**: Lowest
- **Ideal use cases**: Simple tasks, high-volume processing

## Free Tier Information

Google provides a generous free tier for Gemini API:

- **Free requests per minute**: 15 RPM for Flash models, 2 RPM for Pro models
- **Free tokens per minute**: 1M for Flash models, 32K for Pro models
- **No credit card required** to start

For the latest pricing and limits, visit: https://ai.google.dev/pricing

## Troubleshooting

### Connection Test Fails

If the test fails:

1. **Verify your API key**:
   - Make sure it starts with `AIzaSy`
   - Check for extra spaces or characters
   - Try generating a new key if the old one doesn't work

2. **Check API access**:
   - Ensure the Gemini API is enabled in your Google Cloud project
   - Visit: https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com

3. **Review quota limits**:
   - Check if you've exceeded free tier limits
   - Visit: https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas

### Error: "API key not valid"

- Regenerate your API key at https://aistudio.google.com/app/apikey
- Make sure you're copying the complete key
- Verify the API is enabled in your Google Cloud Console

### Error: "Quota exceeded"

- You've hit the free tier limit
- Wait for the quota to reset (usually per minute or per day)
- Consider upgrading to a paid plan if needed

## Upgrading to Paid Tier

If you need higher limits:

1. Visit Google Cloud Console: https://console.cloud.google.com/
2. Select your project
3. Navigate to **Billing** → **Link a billing account**
4. Add payment information

**Note**: You'll still benefit from free tier quotas even with billing enabled - you only pay for usage beyond free limits.

## Security Best Practices

1. **Never commit API keys to Git**:
   - The app stores keys in browser localStorage only
   - Don't hardcode keys in source code

2. **Use environment-specific keys**:
   - Use different keys for development and production
   - Rotate keys periodically

3. **Monitor usage**:
   - Check your usage at: https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/metrics
   - Set up billing alerts to avoid unexpected charges

4. **Restrict API key** (optional, for production):
   - Go to API key settings in Google Cloud Console
   - Add application restrictions (HTTP referrers, IP addresses)
   - Add API restrictions (limit to Gemini API only)

## Getting Help

- **Google AI Documentation**: https://ai.google.dev/docs
- **Google AI Forum**: https://discuss.ai.google.dev/
- **Pricing & Quotas**: https://ai.google.dev/pricing

## Next Steps

Once configured:
1. Try extracting properties from a contender description
2. Upload a document and let AI analyze it
3. Use AI-powered suggestions for property values
4. Compare Gemini's results with OpenAI or Claude to find your preferred model

Happy comparing! 🚀
