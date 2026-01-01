# AI Summary Bio Setup

This feature automatically generates an AI-powered summary of your bio that updates daily.

## How It Works

1. The system reads your `src/content/bio.md` file
2. Sends all bio sections to an AI (OpenAI or Anthropic)
3. Generates a concise, engaging summary
4. Saves it to `src/data/bio-ai-summary.json`
5. The summary appears as "AI Summary" in your bio slider

## Setup Instructions

### 1. Set Environment Variables

Add these to your Vercel project settings (or `.env` file for local development):

**Required (choose one):**
- `OPENAI_API_KEY` - Your OpenAI API key (uses GPT-4o)
- OR `ANTHROPIC_API_KEY` - Your Anthropic API key (uses Claude 3.5 Sonnet)

**Optional:**
- `BIO_UPDATE_SECRET` - A secret token to protect the API endpoint (recommended)

### 2. Deploy to Vercel

The cron job is already configured in `vercel.json` to run daily at midnight UTC.

### 3. Manual Trigger (Optional)

You can manually trigger the AI summary generation:

```bash
# Using curl
curl -X POST https://your-domain.com/api/generate-bio-summary \
  -H "Authorization: Bearer YOUR_SECRET_TOKEN"

# Or without auth (if BIO_UPDATE_SECRET is not set)
curl -X POST https://your-domain.com/api/generate-bio-summary
```

### 4. Local Testing

To test locally:

1. Set environment variables in `.env`:
   ```
   OPENAI_API_KEY=your_key_here
   # or
   ANTHROPIC_API_KEY=your_key_here
   BIO_UPDATE_SECRET=your_secret_here
   ```

2. Run Astro in dev mode:
   ```bash
   npm run dev
   ```

3. Trigger the endpoint:
   ```bash
   curl -X POST http://localhost:4321/api/generate-bio-summary \
     -H "Authorization: Bearer your_secret_here"
   ```

## Customization

### Change the AI Model

Edit `src/pages/api/generate-bio-summary.ts`:
- For OpenAI: Change `model: 'gpt-4o'` to your preferred model
- For Anthropic: Change `model: 'claude-3-5-sonnet-20241022'` to your preferred model

### Adjust the Prompt

Modify the prompt in the API route to change how the summary is generated. The current prompt asks for:
- 2-3 paragraphs
- First person tone
- Captures background, current role, and key interests

### Change Update Frequency

Edit `vercel.json` to change the cron schedule:
- Daily at midnight: `"0 0 * * *"`
- Every 12 hours: `"0 */12 * * *"`
- Weekly: `"0 0 * * 0"`

[Cron schedule format](https://crontab.guru/)

## Troubleshooting

### AI Summary Not Appearing

1. Check that `src/data/bio-ai-summary.json` exists and has content
2. Verify the API endpoint is accessible
3. Check Vercel function logs for errors

### API Errors

1. Verify your API key is set correctly
2. Check API rate limits
3. Review the error message in the API response

### Cron Job Not Running

1. Verify the cron configuration in `vercel.json`
2. Check Vercel dashboard for cron job status
3. Ensure the API route is deployed (not prerendered)

## Security Notes

- **Always set `BIO_UPDATE_SECRET`** to prevent unauthorized access
- The endpoint requires POST method
- Consider adding IP whitelisting for additional security
- API keys should never be committed to git

