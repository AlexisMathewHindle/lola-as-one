# Deployment Guide - Both Apps to Netlify

This repository contains **two separate applications** that will be deployed to **two different Netlify sites**:

## 📦 Applications

### 1. **New App** (`/app` directory)
- **Framework**: Vite + Vue 3
- **Config**: `netlify.toml` (root)
- **Netlify URL**: `https://lola-as-one.netlify.app`
- **Guide**: `NETLIFY-SETUP.md`
- **Status**: ✅ Ready to deploy

### 2. **Legacy App** (`/lola-workshops` directory)
- **Framework**: Vue CLI + Vue 3
- **Config**: `lola-workshops/netlify.toml`
- **Netlify URL**: `https://lola-workshops.netlify.app`
- **Guide**: `lola-workshops/NETLIFY-DEPLOY-GUIDE.md`
- **Status**: ✅ Ready to deploy (replaces Firebase)

---

## 🚀 Deploy BOTH Apps - Complete Guide

You'll create **TWO separate Netlify sites** from the same GitHub repository.

---

## Site 1: Legacy App (lola-workshops)

### Step 1A: Create First Netlify Site

1. Go to https://app.netlify.com/
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose **GitHub**
4. Select `lola-as-one` repository
5. **Important**: Configure these settings:
   - **Site name**: `lola-workshops` (or your preferred name)
   - **Base directory**: `lola-workshops`
   - **Build command**: `npm ci && npm run build:prod`
   - **Publish directory**: `lola-workshops/dist`
   - **Branch to deploy**: `main`
6. Click **"Deploy site"**

### Step 1B: Set Environment Variables (Legacy App)

In Netlify Dashboard → **Site settings** → **Environment variables**:

**Required:**
```
VUE_APP_SUPABASE_URL = https://hubbjhtjyubzczxengyo.supabase.co
VUE_APP_SUPABASE_ANON_KEY = [your-supabase-anon-key]
VUE_APP_DATA_SOURCE = supabase
VUE_APP_STRIPE_PUBLISHABLE_KEY = [your-stripe-key]
```

**Optional** (if still using Firebase Analytics):
```
VUE_APP_FIREBASE_API_KEY = AIzaSyCqirihlLIom4QR_bRsgUu8e-WcitVGJDg
VUE_APP_FIREBASE_AUTH_DOMAIN = lola-workshops.firebaseapp.com
VUE_APP_FIREBASE_PROJECT_ID = lola-workshops
VUE_APP_FIREBASE_STORAGE_BUCKET = lola-workshops.appspot.com
VUE_APP_FIREBASE_MESSAGING_SENDER_ID = 1034483765903
VUE_APP_FIREBASE_APP_ID = 1:1034483765903:web:00ed596cbbbbc6f3a516fa
VUE_APP_FIREBASE_MEASUREMENT_ID = G-ZM1D597JTP
```

### Step 1C: Verify Legacy App Deployment

Wait 2-5 minutes for the build to complete. You'll get a URL like:
- `https://lola-workshops.netlify.app` (or your custom name)

✅ Test the site to make sure it works!

---

## Site 2: New App (app)

### Step 2A: Create Second Netlify Site

1. Go back to https://app.netlify.com/
2. Click **"Add new site"** → **"Import an existing project"** again
3. Choose **GitHub**
4. Select `lola-as-one` repository **again** (yes, same repo!)
5. **Important**: Configure these settings:
   - **Site name**: `lola-as-one` (or your preferred name)
   - **Base directory**: `app`
   - **Build command**: `npm run build`
   - **Publish directory**: `app/dist`
   - **Branch to deploy**: `main`
6. Click **"Deploy site"**

### Step 2B: Set Environment Variables (New App)

In Netlify Dashboard → **Site settings** → **Environment variables**:

```
VITE_SUPABASE_URL = https://hubbjhtjyubzczxengyo.supabase.co
VITE_SUPABASE_ANON_KEY = [your-supabase-anon-key]
VITE_STRIPE_PUBLISHABLE_KEY = [your-stripe-key]
VITE_APP_URL = https://lola-as-one.netlify.app
```

### Step 2C: Verify New App Deployment

Wait 2-5 minutes for the build to complete. You'll get a URL like:
- `https://lola-as-one.netlify.app` (or your custom name)

✅ Test the site to make sure it works!

---

## ✅ Final Step: Commit and Push

```bash
# Make sure all config files are committed
git add .
git commit -m "Add Netlify configuration for both apps"
git push origin main
```

**Both sites will auto-deploy on every push to `main`!** 🎉

---

## 🔄 Migration from Firebase to Netlify

### What Changed:

| Before (Firebase) | After (Netlify) |
|-------------------|-----------------|
| `lola-workshops-dev.web.app` | `lola-workshops.netlify.app` |
| Manual deploy with `firebase deploy` | Auto-deploy on git push |
| Bitbucket Pipelines | GitHub Actions (optional) |
| Separate dev/prod sites | Branch-based deploys |

### What to Update:

1. ✅ **CORS Settings**: Update Supabase/Stripe to allow new Netlify domain
2. ✅ **OAuth Redirects**: Update any OAuth redirect URLs
3. ✅ **Documentation**: Update any references to old Firebase URLs
4. ✅ **Environment Variables**: Set in Netlify dashboard

### What Stays the Same:

- ✅ Firebase Functions (if you're still using them)
- ✅ Firestore/Firebase Auth (if still in use)
- ✅ Supabase backend
- ✅ Stripe integration
- ✅ All application code

---

## 📁 Repository Structure

```
lola-as-one/
├── app/                          # New Vite app
│   ├── netlify.toml             # (uses root netlify.toml)
│   └── ...
├── lola-workshops/              # Legacy Vue CLI app
│   ├── netlify.toml             # ← Netlify config for legacy app
│   ├── NETLIFY-DEPLOY-GUIDE.md  # ← Detailed deployment guide
│   ├── bitbucket-pipelines.yml  # (deprecated - kept for reference)
│   ├── firebase.json            # (deprecated - kept for reference)
│   └── ...
├── netlify.toml                 # Netlify config for new app
├── NETLIFY-SETUP.md             # Guide for new app
└── DEPLOYMENT-GUIDE.md          # This file
```

---

## 🎯 Deployment URLs

### Legacy App (lola-workshops):
- **Production**: `https://lola-workshops.netlify.app`
- **Dev branch**: `https://dev--lola-workshops.netlify.app`
- **PR previews**: `https://deploy-preview-[#]--lola-workshops.netlify.app`

### New App (app):
- **Production**: `https://lola-as-one.netlify.app`
- **Staging**: `https://staging--lola-as-one.netlify.app`
- **PR previews**: `https://deploy-preview-[#]--lola-as-one.netlify.app`

---

## 🔧 Troubleshooting

### Build fails on Netlify
- Check Node version is set to 18 in environment variables
- Verify all environment variables are set
- Check build logs in Netlify dashboard

### App shows blank page
- Open browser console and check for errors
- Verify `VUE_APP_*` environment variables are set correctly
- Check that API URLs are correct

### Routes return 404
- Verify `netlify.toml` has SPA redirect configured
- Check that `publish` directory is correct

---

## 📚 Additional Resources

- [Netlify Dashboard](https://app.netlify.com/)
- [Netlify Docs - Vue Apps](https://docs.netlify.com/frameworks/vue/)
- [Netlify Docs - Environment Variables](https://docs.netlify.com/environment-variables/overview/)
- [Netlify Docs - Deploy Contexts](https://docs.netlify.com/site-deploys/overview/#deploy-contexts)

---

## 🆘 Need Help?

1. Check the detailed guides:
   - Legacy app: `lola-workshops/NETLIFY-DEPLOY-GUIDE.md`
   - New app: `NETLIFY-SETUP.md`

2. Check Netlify build logs in the dashboard

3. Verify environment variables are set correctly

4. Check that the correct branch is being deployed

