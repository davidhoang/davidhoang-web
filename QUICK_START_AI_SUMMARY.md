# Quick Start: AI Bio Summary

Get your AI Summary up and running in 3 steps!

## Step 1: Get an API Key

Choose one:
- **OpenAI**: Get your key from https://platform.openai.com/api-keys
- **Anthropic**: Get your key from https://console.anthropic.com/

## Step 2: Set Environment Variables

### For Local Testing

Create a `.env` file in the project root:

```bash
# Choose one AI provider
OPENAI_API_KEY=sk-...
# OR
ANTHROPIC_API_KEY=sk-ant-...

# Optional: Protect the API endpoint
BIO_UPDATE_SECRET=your-secret-here
```

### For Vercel Deployment

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add the same variables as above

## Step 3: Test It!

### Local Testing

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. In another terminal, generate the summary:
   ```bash
   npm run bio:generate
   ```

3. Check status:
   ```bash
   npm run bio:status
   ```

4. Visit http://localhost:4321/about and check the bio slider - you should see "AI Summary"!

### Deploy to Vercel

1. Push your changes to GitHub
2. Vercel will automatically deploy
3. The cron job will run daily at midnight UTC
4. Or manually trigger it:
   ```bash
   curl -X POST https://your-domain.com/api/generate-bio-summary \
     -H "Authorization: Bearer YOUR_SECRET"
   ```

## Troubleshooting

**"No AI API key configured"**
- Make sure you set `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` in your `.env` file

**"AI Summary not appearing"**
- Run `npm run bio:generate` to create it
- Check `src/data/bio-ai-summary.json` exists and has content

**API errors**
- Verify your API key is correct
- Check you have credits/quota available
- Review the error message in the API response

## Next Steps

- Customize the AI prompt in `src/pages/api/generate-bio-summary.ts`
- Adjust the cron schedule in `vercel.json`
- See `BIO_AI_SUMMARY_SETUP.md` for advanced configuration

