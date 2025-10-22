# Vercel Deployment Guide

## Prerequisites

1. **Vercel Account**: Utwórz konto na [vercel.com](https://vercel.com)
2. **GitHub Repository**: Projekt musi być połączony z repozytorium GitHub
3. **Environment Variables**: Skonfiguruj zmienne środowiskowe w Vercel

## Setup Steps

### 1. Install Vercel CLI (Optional)
```bash
npm i -g vercel
```

### 2. Configure Environment Variables

W panelu Vercel, przejdź do **Settings > Environment Variables** i dodaj:

```
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
OPENROUTER_API_KEY=your_openrouter_api_key
AI_MODEL=gpt-4
AI_TEMPERATURE=0.7
AI_MAX_TOKENS=2000
AI_ENABLE_USAGE_LOGGING=true
```

### 3. GitHub Secrets Configuration

W repozytorium GitHub, przejdź do **Settings > Secrets and variables > Actions** i dodaj:

```
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_vercel_org_id
VERCEL_PROJECT_ID=your_vercel_project_id
```

### 4. Deploy

#### Automatic Deployment (via GitHub Actions)
- Push do branch `main` automatycznie uruchomi deployment
- Workflow: `.github/workflows/master.yml`

#### Manual Deployment
```bash
vercel --prod
```

## Project Configuration

### astro.config.mjs
- Adapter: `@astrojs/vercel/serverless`
- Output: `server`
- Web Analytics: enabled

### vercel.json
- Framework: `astro`
- Build Command: `npm run build`
- Output Directory: `dist`
- Runtime: `nodejs20.x` for API functions

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_KEY` | Supabase anonymous key | Yes |
| `OPENROUTER_API_KEY` | OpenRouter API key for AI features | Yes |
| `AI_MODEL` | Default AI model (default: gpt-4) | No |
| `AI_TEMPERATURE` | AI temperature setting (default: 0.7) | No |
| `AI_MAX_TOKENS` | Max tokens for AI (default: 2000) | No |
| `AI_ENABLE_USAGE_LOGGING` | Enable AI usage logging (default: true) | No |

## Local Testing

### Development vs Production Build

**For local development:**
```bash
npm run dev
```
- Uruchamia serwer deweloperski z hot reload
- Dostępny na `http://localhost:3000`
- Używa adaptera Node.js dla lokalnego testowania

**For production build testing:**
```bash
npm run build
```
- Tworzy produkcyjną wersję w `dist/`
- **Uwaga**: `npm run preview` nie działa z adapterem Vercel
- Użyj `npm run dev` do testowania funkcjonalności

**For Vercel-specific testing:**
```bash
# Deploy to Vercel preview environment
vercel

# Deploy to production
vercel --prod
```

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version (22.14.0)
   - Verify all dependencies are installed
   - Check environment variables

2. **Runtime Errors**
   - Verify environment variables are set correctly
   - Check Supabase connection
   - Verify API keys

3. **Deployment Issues**
   - Check GitHub Actions logs
   - Verify Vercel project settings
   - Ensure proper permissions

### Useful Commands

```bash
# Check build locally
npm run build

# Note: npm run preview is not supported with @astrojs/vercel adapter
# Use npm run dev for local development instead

# Check Vercel deployment status
vercel ls

# View deployment logs
vercel logs [deployment-url]

# Deploy to Vercel preview
vercel

# Deploy to Vercel production
vercel --prod
```

## CI/CD Pipeline

The deployment pipeline includes:
- ✅ Code checkout
- ✅ Node.js setup (22.14.0)
- ✅ Dependency installation
- ✅ Production build
- ✅ Vercel deployment

**Note**: E2E tests are excluded from the deployment pipeline as requested.
