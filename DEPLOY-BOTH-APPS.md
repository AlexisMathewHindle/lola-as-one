# Quick Start: Deploy Both Apps to Netlify

This guide will help you deploy **both applications** to **two separate Netlify sites**.

## 🎯 What You'll Get

After following this guide, you'll have:

1. **Legacy App**: `https://lola-workshops.netlify.app`
   - Replaces Firebase hosting at `lola-workshops-dev.web.app`
   - Vue CLI app from `/lola-workshops` directory

2. **New App**: `https://lola-as-one.netlify.app`
   - Vite app from `/app` directory

Both will auto-deploy from the **same GitHub repository** on every push to `main`.

---

## 📋 Prerequisites

- ✅ GitHub account with this repository pushed
- ✅ Netlify account (free tier is fine)
- ✅ Supabase credentials
- ✅ Stripe credentials (optional)

---

## 🚀 Step-by-Step Deployment

### Step 1: Commit Configuration Files

```bash
# Make sure you're in the project root
cd /Users/alexishindle/repos/projects/lola-as-one

# Add all the new Netlify config files
git add lola-workshops/netlify.toml
git add netlify.toml
git add DEPLOYMENT-GUIDE.md
git add DEPLOY-BOTH-APPS.md
git add .github/workflows/netlify-legacy-app.yml

# Commit
git commit -m "Add Netlify configuration for both apps"

# Push to GitHub
git push origin main
```

---

### Step 2: Deploy Legacy App (lola-workshops)

#### 2.1: Create Netlify Site

1. Go to https://app.netlify.com/
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose **GitHub**
4. Select your `lola-as-one` repository
5. Configure:
   - **Site name**: `lola-workshops`
   - **Base directory**: `lola-workshops`
   - **Build command**: `npm ci && npm run build:prod`
   - **Publish directory**: `lola-workshops/dist`
   - **Branch**: `main`
6. Click **"Deploy site"**

#### 2.2: Set Environment Variables

Go to **Site settings** → **Environment variables** and add:

```
VUE_APP_SUPABASE_URL = https://hubbjhtjyubzczxengyo.supabase.co
VUE_APP_SUPABASE_ANON_KEY = [get from Supabase dashboard]
VUE_APP_DATA_SOURCE = supabase
VUE_APP_STRIPE_PUBLISHABLE_KEY = [get from Stripe dashboard]
```

#### 2.3: Wait for Build

The first build will start automatically. Wait 2-5 minutes.

#### 2.4: Test Legacy App

Once deployed, visit: `https://lola-workshops.netlify.app`

✅ Verify:
- Homepage loads
- Navigation works
- Data loads from Supabase

---

### Step 3: Deploy New App (app)

#### 3.1: Create Second Netlify Site

1. Go back to https://app.netlify.com/
2. Click **"Add new site"** → **"Import an existing project"** again
3. Choose **GitHub**
4. Select `lola-as-one` repository **again** (same repo, different site!)
5. Configure:
   - **Site name**: `lola-as-one`
   - **Base directory**: `app`
   - **Build command**: `npm run build`
   - **Publish directory**: `app/dist`
   - **Branch**: `main`
6. Click **"Deploy site"**

#### 3.2: Set Environment Variables

Go to **Site settings** → **Environment variables** and add:

```
VITE_SUPABASE_URL = https://hubbjhtjyubzczxengyo.supabase.co
VITE_SUPABASE_ANON_KEY = [get from Supabase dashboard]
VITE_STRIPE_PUBLISHABLE_KEY = [get from Stripe dashboard]
VITE_APP_URL = https://lola-as-one.netlify.app
```

#### 3.3: Wait for Build

The first build will start automatically. Wait 2-5 minutes.

#### 3.4: Test New App

Once deployed, visit: `https://lola-as-one.netlify.app`

✅ Verify:
- Homepage loads
- Navigation works
- Data loads from Supabase

---

## 🎉 You're Done!

You now have **two separate Netlify sites** deploying from the same GitHub repository!

### What Happens Next?

Every time you push to `main`:
- Both sites will automatically rebuild and deploy
- No manual deployment needed
- No `firebase deploy` commands

### Your URLs:

| App | URL |
|-----|-----|
| Legacy | https://lola-workshops.netlify.app |
| New | https://lola-as-one.netlify.app |

---

## 🔧 Post-Deployment Tasks

### Update External Services

#### Supabase:
1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add both Netlify URLs to **Redirect URLs**:
   - `https://lola-workshops.netlify.app/*`
   - `https://lola-as-one.netlify.app/*`

#### Stripe:
1. Go to Stripe Dashboard → Developers → Webhooks
2. Update webhook URLs if needed
3. Add both Netlify domains to allowed domains

---

## 📊 Deployment Comparison

| Before (Firebase) | After (Netlify) |
|-------------------|-----------------|
| Manual `firebase deploy` | Auto-deploy on `git push` |
| Bitbucket Pipelines | GitHub auto-deploy |
| One site | Two separate sites |
| `lola-workshops-dev.web.app` | `lola-workshops.netlify.app` |
| N/A | `lola-as-one.netlify.app` |

---

## 🆘 Troubleshooting

### Build fails
- Check Node version in environment variables (18 for legacy, 20 for new)
- Verify all environment variables are set
- Check build logs in Netlify dashboard

### Blank page after deployment
- Open browser console for errors
- Verify environment variables are correct
- Check that API URLs match your Supabase project

### Wrong app deployed
- Verify **Base directory** is correct:
  - Legacy: `lola-workshops`
  - New: `app`

---

## 📚 More Information

- **Detailed guides**:
  - Legacy app: `lola-workshops/NETLIFY-DEPLOY-GUIDE.md`
  - New app: `NETLIFY-SETUP.md`
  - Both apps: `DEPLOYMENT-GUIDE.md`

- **Netlify Dashboard**: https://app.netlify.com/

