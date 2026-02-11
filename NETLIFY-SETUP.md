# Netlify Deployment Setup

This guide explains how to deploy Lola As One to Netlify with stable URLs for both production and staging.

## 🌐 URL Structure

With this setup, you'll get:

- **Production** (main branch): `https://lola-as-one.netlify.app`
- **Staging** (staging branch): `https://staging--lola-as-one.netlify.app` ⭐ **Stable staging URL!**
- **Deploy Previews** (PRs/other branches): `https://deploy-preview-123--lola-as-one.netlify.app`

## 📋 Setup Steps

### 1. Create a Staging Branch

```bash
# Create and push a staging branch
git checkout -b staging
git push -u origin staging
git checkout main
```

### 2. Connect to Netlify

1. Go to [Netlify](https://app.netlify.com/)
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect your Git provider (GitHub/GitLab/Bitbucket)
4. Select the `lola-as-one` repository
5. Netlify will auto-detect the `netlify.toml` configuration
6. Click **"Deploy site"**

### 3. Configure Branch Deploys

In Netlify Dashboard:

1. Go to **Site settings** → **Build & deploy** → **Continuous deployment**
2. Under **"Branch deploys"**, click **"Configure"**
3. Select **"Let me add individual branches"**
4. Add: `staging`
5. Save

Now both `main` and `staging` branches will get stable URLs!

### 4. Set Environment Variables

In Netlify Dashboard:

1. Go to **Site settings** → **Environment variables**
2. Add these variables:

#### For All Deploys:
```
VITE_SUPABASE_URL = https://hubbjhtjyubzczxengyo.supabase.co
VITE_SUPABASE_ANON_KEY = [your-anon-key]
VITE_STRIPE_PUBLISHABLE_KEY = [your-stripe-key]
```

#### Optional: Different values per context
You can set different values for production vs staging:
- Click **"Add a variable"**
- Set **"Values"** → Choose **"Same value for all deploy contexts"** or set different values
- For staging, you might want to use Stripe test keys

### 5. Deploy!

```bash
# Deploy to production
git checkout main
git push origin main

# Deploy to staging
git checkout staging
git merge main  # or make staging-specific changes
git push origin staging
```

## 🔄 Workflow

### For Stable Staging Deploys:
```bash
# Work on a feature branch
git checkout -b feature/new-feature
# ... make changes ...
git commit -m "Add new feature"

# Merge to staging for testing
git checkout staging
git merge feature/new-feature
git push origin staging
# → Deploys to https://staging--lola-as-one.netlify.app

# After testing, merge to production
git checkout main
git merge staging
git push origin main
# → Deploys to https://lola-as-one.netlify.app
```

### For Quick PR Previews:
```bash
# Just create a PR from any branch
# → Automatically gets a preview URL like:
# https://deploy-preview-42--lola-as-one.netlify.app
```

## 🎯 URL Patterns

| Branch/Context | URL Pattern | Stability |
|----------------|-------------|-----------|
| `main` | `lola-as-one.netlify.app` | ✅ Permanent |
| `staging` | `staging--lola-as-one.netlify.app` | ✅ Permanent |
| Pull Requests | `deploy-preview-[PR#]--lola-as-one.netlify.app` | 🔄 Changes per PR |
| Other branches | `[branch]--lola-as-one.netlify.app` | 🔄 Only if enabled |

## 🔧 Advanced: Multiple Stable Environments

If you want more stable environments (e.g., `dev`, `qa`, `staging`):

1. Create the branches:
```bash
git checkout -b dev
git push -u origin dev
git checkout -b qa
git push -u origin qa
```

2. In Netlify → **Branch deploys**, add: `dev`, `qa`, `staging`

3. You'll get:
   - `dev--lola-as-one.netlify.app`
   - `qa--lola-as-one.netlify.app`
   - `staging--lola-as-one.netlify.app`

## 📝 Notes

- The `netlify.toml` file is already configured in the repo root
- Netlify automatically detects the Vue app in the `/app` directory
- SPA routing is configured with redirects
- Static assets are cached for 1 year
- Security headers are automatically added

## 🚀 Next Steps

1. Set up the staging branch
2. Connect to Netlify
3. Configure environment variables
4. Test a deploy to staging
5. Share the stable staging URL with your team!

