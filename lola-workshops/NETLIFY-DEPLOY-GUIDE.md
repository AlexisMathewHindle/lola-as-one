# Netlify Deployment Guide for Legacy Lola Workshops

This guide explains how to deploy the legacy Lola Workshops app (Vue CLI) to Netlify, replacing the Firebase deployment.

## 🌐 What You'll Get

- **Production** (main branch): `https://lola-workshops.netlify.app` (or your custom domain)
- **Development** (dev branch): `https://dev--lola-workshops.netlify.app`
- **Deploy Previews** (PRs): `https://deploy-preview-123--lola-workshops.netlify.app`

## 📋 Setup Steps

### 1. Create a New Netlify Site

1. Go to [Netlify](https://app.netlify.com/)
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect your **GitHub** account
4. Select the `lola-as-one` repository
5. Configure the build settings:
   - **Base directory**: `lola-workshops`
   - **Build command**: `npm ci && npm run build:prod`
   - **Publish directory**: `lola-workshops/dist`
   - **Branch to deploy**: `main`

6. Click **"Deploy site"**

> **Note**: Netlify will auto-detect the `netlify.toml` file in the `lola-workshops` directory.

### 2. Configure Branch Deploys (Optional)

If you want a stable dev environment:

1. In Netlify Dashboard → **Site settings** → **Build & deploy** → **Continuous deployment**
2. Under **"Branch deploys"**, click **"Configure"**
3. Select **"Let me add individual branches"**
4. Add: `dev` (or whatever branch you want for development)
5. Save

### 3. Set Environment Variables

In Netlify Dashboard → **Site settings** → **Environment variables**, add:

#### Required Variables:

```
VUE_APP_SUPABASE_URL = https://hubbjhtjyubzczxengyo.supabase.co
VUE_APP_SUPABASE_ANON_KEY = [your-supabase-anon-key]
VUE_APP_DATA_SOURCE = supabase
```

#### Optional (if using Stripe):

```
VUE_APP_STRIPE_PUBLISHABLE_KEY = [your-stripe-publishable-key]
```

#### Optional (if using Firebase Analytics):

```
VUE_APP_FIREBASE_API_KEY = AIzaSyCqirihlLIom4QR_bRsgUu8e-WcitVGJDg
VUE_APP_FIREBASE_AUTH_DOMAIN = lola-workshops.firebaseapp.com
VUE_APP_FIREBASE_PROJECT_ID = lola-workshops
VUE_APP_FIREBASE_STORAGE_BUCKET = lola-workshops.appspot.com
VUE_APP_FIREBASE_MESSAGING_SENDER_ID = 1034483765903
VUE_APP_FIREBASE_APP_ID = 1:1034483765903:web:00ed596cbbbbc6f3a516fa
VUE_APP_FIREBASE_MEASUREMENT_ID = G-ZM1D597JTP
```

### 4. Deploy!

```bash
# Make sure you're on the main branch
git checkout main

# Commit the netlify.toml file
git add lola-workshops/netlify.toml
git commit -m "Add Netlify configuration for legacy app"

# Push to GitHub
git push origin main
```

Netlify will automatically detect the push and start building!

## 🔄 Deployment Workflow

### Deploy to Production:
```bash
git checkout main
git push origin main
# → Deploys to https://lola-workshops.netlify.app
```

### Deploy to Development:
```bash
git checkout dev  # or create it: git checkout -b dev
git push origin dev
# → Deploys to https://dev--lola-workshops.netlify.app
```

### Create a Deploy Preview:
```bash
# Just create a PR from any branch
# → Automatically gets a preview URL
```

## 🔧 Build Configuration

The `netlify.toml` file in the `lola-workshops` directory configures:

- **Production builds**: Uses `npm run build:prod` → outputs to `dist/`
- **Dev/preview builds**: Uses `npm run build:dev` → outputs to `dist-dev/`
- **SPA routing**: All routes redirect to `index.html`
- **Service Worker**: Properly served at `/service-worker.js`
- **Security headers**: X-Frame-Options, CSP, etc.
- **Asset caching**: 1-year cache for static assets

## 🚨 Migrating from Firebase

### What to Update:

1. **Remove Firebase deployment** from your workflow
2. **Update any hardcoded URLs** from `lola-workshops-dev.web.app` to your new Netlify URL
3. **Update CORS settings** in Supabase/Stripe to allow your new Netlify domain
4. **Update OAuth redirect URLs** if using authentication

### Firebase vs Netlify:

| Feature | Firebase | Netlify |
|---------|----------|---------|
| Hosting | ✅ | ✅ |
| Auto-deploy from Git | ❌ (needs CI/CD) | ✅ Built-in |
| Branch deploys | ❌ | ✅ |
| Deploy previews | ❌ | ✅ |
| Custom domains | ✅ | ✅ |
| SSL | ✅ | ✅ |

## 📝 Notes

- The legacy app uses **Vue CLI** (not Vite)
- Build output goes to `dist/` for production, `dist-dev/` for development
- Node version is set to 18 (matching your Firebase functions)
- The app is a **PWA** with a service worker

## 🎯 Next Steps

1. ✅ Create Netlify site
2. ✅ Configure environment variables
3. ✅ Push to GitHub
4. ✅ Verify deployment works
5. ✅ Update any external services (Stripe, Supabase) with new URLs
6. ✅ Test the deployed app
7. ✅ Update documentation with new URLs
8. ✅ (Optional) Set up custom domain

## 🆘 Troubleshooting

### Build fails with "command not found"
- Make sure `NODE_VERSION = "18"` is set in environment variables

### App shows blank page
- Check browser console for errors
- Verify environment variables are set correctly
- Check that `VUE_APP_*` variables are prefixed correctly

### Service worker not loading
- The `netlify.toml` has a specific redirect for `/service-worker.js`
- Check the Network tab to ensure it's being served from the root

### Routes return 404
- The SPA redirect should handle this, but verify the `[[redirects]]` section in `netlify.toml`

## 🔗 Useful Links

- [Netlify Dashboard](https://app.netlify.com/)
- [Netlify Docs - Vue Apps](https://docs.netlify.com/frameworks/vue/)
- [Netlify Docs - Environment Variables](https://docs.netlify.com/environment-variables/overview/)

