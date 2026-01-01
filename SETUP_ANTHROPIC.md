# Setting Up Anthropic API Key

## Step 1: Get Your Anthropic API Key

1. Go to https://console.anthropic.com/
2. Sign in or create an account
3. Navigate to **API Keys** in the sidebar
4. Click **"Create Key"**
5. Give it a name (e.g., "Bio Summary Generator")
6. Copy the key (it starts with `sk-ant-`)

⚠️ **Important**: Copy the key immediately - you won't be able to see it again!

## Step 2: Add to Your .env File

Add this line to your `.env` file:

```bash
ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
```

Also add a secret for API protection (optional but recommended):

```bash
BIO_UPDATE_SECRET=your-random-secret-here
```

## Step 3: Verify Setup

Run this to check if it's working:

```bash
npm run bio:status
```

Then generate your first summary:

```bash
npm run bio:generate
```

## For Vercel Deployment

1. Go to your Vercel project dashboard
2. Click on **Settings** → **Environment Variables**
3. Add:
   - **Key**: `ANTHROPIC_API_KEY`
   - **Value**: Your API key (starts with `sk-ant-`)
   - **Environment**: Production, Preview, Development (select all)
4. Add `BIO_UPDATE_SECRET` if you want to protect the endpoint

## Troubleshooting

**"No AI API key configured"**
- Make sure the key is in your `.env` file
- Restart your dev server after adding the key
- Check for typos in the variable name

**"Anthropic API error"**
- Verify your API key is correct
- Check you have credits/quota available
- Make sure you're using the correct key format (starts with `sk-ant-`)

## Need Help?

- Anthropic Docs: https://docs.anthropic.com/
- API Status: https://status.anthropic.com/

