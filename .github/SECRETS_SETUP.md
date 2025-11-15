# GitHub Secrets Setup Guide

This document describes how to configure GitHub Secrets required for CI/CD pipelines.

## Required Secrets

### For CI Pipeline (E2E Tests)

Navigate to your GitHub repository: **Settings → Secrets and variables → Actions → New repository secret**

Add the following secrets:

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `SUPABASE_URL` | Your Supabase project URL | `https://xxxxx.supabase.co` |
| `SUPABASE_KEY` | Your Supabase anonymous key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `TEST_USER_EMAIL` | Test user email for E2E tests | `test@example.com` |
| `TEST_USER_PASSWORD` | Test user password for E2E tests | `SecurePassword123!` |

### For Deployment Pipeline (Vercel)

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `VERCEL_TOKEN` | Vercel authentication token | [Vercel Account Settings → Tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | Your Vercel organization ID | Run `vercel project ls` or check project settings |
| `VERCEL_PROJECT_ID` | Your Vercel project ID | Run `vercel project ls` or check project settings |

## Setting Up Test User

1. **Create a test user in Supabase:**
   - Go to your Supabase project dashboard
   - Navigate to **Authentication → Users**
   - Click **Add user** → **Create new user**
   - Enter email and password
   - Make sure to verify the email (or disable email verification for test users)

2. **Add credentials to GitHub Secrets:**
   - Use the same credentials in `TEST_USER_EMAIL` and `TEST_USER_PASSWORD` secrets

3. **Local testing:**
   - Copy `env.example` to `.env.test`
   - Add the same test user credentials to `.env.test`

## Verifying Setup

### Test CI Pipeline Locally

```bash
# Set environment variables
export SUPABASE_URL="your_supabase_url"
export SUPABASE_KEY="your_supabase_key"
export TEST_USER_EMAIL="test@example.com"
export TEST_USER_PASSWORD="test_password"

# Run tests
npm run test:run
npm run test:e2e
npm run build
```

### Test in GitHub Actions

1. Push changes to a feature branch
2. Create a Pull Request to `main`
3. Check the **Actions** tab to see if all checks pass
4. Review the Playwright test report in artifacts

## Troubleshooting

### E2E Tests Fail in CI

- ✅ Verify `SUPABASE_URL` and `SUPABASE_KEY` are correct
- ✅ Ensure test user exists and email is verified
- ✅ Check if test user credentials match secrets
- ✅ Review Playwright report artifacts for detailed error logs

### Deployment Fails

- ✅ Verify Vercel tokens are correct and not expired
- ✅ Check Vercel project is properly connected to GitHub
- ✅ Ensure all environment variables are set in Vercel dashboard

## Security Best Practices

- ⚠️ Never commit `.env`, `.env.test`, or `.env.local` files
- ⚠️ Use separate test users with limited permissions
- ⚠️ Rotate secrets regularly
- ⚠️ Use read-only keys where possible
- ⚠️ Monitor secret usage in GitHub Actions logs

## Additional Resources

- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Playwright CI Configuration](https://playwright.dev/docs/ci)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)
