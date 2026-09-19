# Jev editorial router

`/experiments/jev-editorial-router` uses TypeSafe Jev to decide where a draft
idea belongs on davidhoang.com:

- `choice`: route to Writing, Notes, or Projects, including the full probability distribution
- `score`: estimate publishing readiness on a four-level rubric
- `boolean`: estimate the probability that the idea contains a clear claim

The page calls `POST /api/jev-editorial-triage`. The API keeps the 70% automatic
routing threshold in application code; lower-confidence choices remain in human
review.

## Enable Jev

AI Gateway with Vercel OIDC is the preferred production and local path. Vercel
deployments receive OIDC credentials automatically.

```bash
vercel link
vercel env pull .env.local
npm run dev
```

The pulled `VERCEL_OIDC_TOKEN` expires, so pull again if local requests begin
returning `401`. A static `AI_GATEWAY_API_KEY` also works outside Vercel.

For a direct TypeSafe connection, set either of these in `.env.local`:

```bash
TYPESAFE_AI_API_KEY=your-key
# Legacy alias accepted by this project:
TYPESAFE_API_KEY=your-key
```

Never commit `.env.local` or a real credential. `.env.example` lists supported
variables without values.

## Test the call path

Open `http://localhost:4321/experiments/jev-editorial-router`, load the example,
and evaluate it. You can also call the API directly:

```bash
curl http://localhost:4321/api/jev-editorial-triage \
  -H 'Content-Type: application/json' \
  -d '{
    "title": "Interfaces should know when to stay quiet",
    "excerpt": "Confidence should shape whether an AI interface answers, asks for context, or stays out of the way."
  }'
```

Without credentials, the route returns `503` with `JEV_NOT_CONFIGURED` instead
of failing during model initialization. Keep AI Gateway budgets or firewall rate
limits enabled before promoting the unlisted experiment to a public destination.
