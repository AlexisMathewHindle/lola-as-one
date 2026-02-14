# Migration from Firebase Hosting to Netlify

## ✅ What's Been Done

1. ✅ Created `netlify.toml` configuration for the legacy app
2. ✅ Created deployment guide (`NETLIFY-DEPLOY-GUIDE.md`)
3. ✅ Created GitHub Actions workflow (optional)
4. ✅ Documented migration process

## 🚀 Next Steps (Do These Now)

### 1. Commit the New Configuration Files

```bash
# Make sure you're in the project root
cd /Users/alexishindle/repos/projects/lola-as-one

# Add the new files
git add lola-workshops/netlify.toml
git add lola-workshops/NETLIFY-DEPLOY-GUIDE.md
git add lola-workshops/MIGRATION-FROM-FIREBASE.md
git add .github/workflows/netlify-legacy-app.yml
git add DEPLOYMENT-GUIDE.md

# Commit
git commit -m "Add Netlify deployment configuration for legacy app"

# Push to GitHub
git push origin main
```

### 2. Create Netlify Site

1. Go to https://app.netlify.com/
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose **GitHub** as your Git provider
4. Select the `lola-as-one` repository
5. Netlify should auto-detect the settings from `netlify.toml`, but verify:
   - **Base directory**: `lola-workshops`
   - **Build command**: `npm ci && npm run build:prod`
   - **Publish directory**: `lola-workshops/dist`
   - **Branch to deploy**: `main`
6. Click **"Deploy site"**

### 3. Configure Environment Variables in Netlify

Go to **Site settings** → **Environment variables** and add:

#### Required:
```
VUE_APP_SUPABASE_URL = https://hubbjhtjyubzczxengyo.supabase.co
VUE_APP_SUPABASE_ANON_KEY = [get from Supabase dashboard]
VUE_APP_DATA_SOURCE = supabase
```

#### Optional (Stripe):
```
VUE_APP_STRIPE_PUBLISHABLE_KEY = [your-stripe-key]
```

#### Optional (Firebase Analytics - if still using):
```
VUE_APP_FIREBASE_API_KEY = AIzaSyCqirihlLIom4QR_bRsgUu8e-WcitVGJDg
VUE_APP_FIREBASE_AUTH_DOMAIN = lola-workshops.firebaseapp.com
VUE_APP_FIREBASE_PROJECT_ID = lola-workshops
VUE_APP_FIREBASE_STORAGE_BUCKET = lola-workshops.appspot.com
VUE_APP_FIREBASE_MESSAGING_SENDER_ID = 1034483765903
VUE_APP_FIREBASE_APP_ID = 1:1034483765903:web:00ed596cbbbbc6f3a516fa
VUE_APP_FIREBASE_MEASUREMENT_ID = G-ZM1D597JTP
```

### 4. Wait for First Deploy

Netlify will automatically build and deploy. This takes about 2-5 minutes.

### 5. Test the Deployed Site

Once deployed, you'll get a URL like: `https://[random-name].netlify.app`

Test:
- ✅ Homepage loads
- ✅ Navigation works
- ✅ Data loads from Supabase
- ✅ Forms work
- ✅ Service worker loads (check DevTools → Application → Service Workers)

### 6. Update External Services

#### Supabase:
1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add your new Netlify URL to **Site URL** and **Redirect URLs**

#### Stripe:
1. Go to Stripe Dashboard → Developers → Webhooks
2. Update webhook URLs if needed
3. Add new Netlify domain to allowed domains

### 7. (Optional) Set Up Custom Domain

In Netlify Dashboard:
1. Go to **Site settings** → **Domain management**
2. Click **"Add custom domain"**
3. Follow the instructions to point your DNS to Netlify

### 8. (Optional) Create Dev Branch for Stable Dev Environment

```bash
# Create a dev branch
git checkout -b dev
git push -u origin dev

# In Netlify Dashboard:
# Site settings → Build & deploy → Continuous deployment
# Under "Branch deploys", add: dev
```

This gives you a stable dev URL: `https://dev--[your-site].netlify.app`

---

## 🔄 New Deployment Workflow

### Before (Firebase + Bitbucket):
```bash
# Had to manually deploy or use Bitbucket Pipelines
firebase deploy --only hosting:dev-site --token $FIREBASE_TOKEN_DEV
```

### After (Netlify + GitHub):
```bash
# Just push to GitHub - Netlify auto-deploys!
git push origin main
```

That's it! No manual deployment needed.

---

## 📊 Comparison: Firebase vs Netlify

| Feature | Firebase | Netlify |
|---------|----------|---------|
| **Auto-deploy from Git** | ❌ (needs CI/CD) | ✅ Built-in |
| **Branch deploys** | ❌ | ✅ |
| **Deploy previews for PRs** | ❌ | ✅ |
| **Build logs** | ❌ (in CI/CD) | ✅ Built-in |
| **Rollback** | ⚠️ Manual | ✅ One-click |
| **Environment variables** | ⚠️ In code | ✅ Dashboard |
| **Custom domains** | ✅ | ✅ |
| **SSL** | ✅ | ✅ |
| **Cost** | Free tier | Free tier |

---

## 🗑️ What to Keep/Remove

### Keep (for now):
- ✅ `firebase.json` - Keep for reference
- ✅ `bitbucket-pipelines.yml` - Keep for reference
- ✅ Firebase Functions (if you're using them)
- ✅ Firestore/Firebase Auth (if still in use)

### Can Remove Later:
- ❌ `bitbucket-pipelines.yml` - Once Netlify is working
- ❌ Firebase hosting config in `firebase.json` - Once migrated

### Don't Remove:
- ✅ Firebase Functions - These are separate from hosting
- ✅ Firestore rules - If you're still using Firestore

---

## 🆘 Troubleshooting

### Build fails with "npm: command not found"
- Set `NODE_VERSION = "18"` in Netlify environment variables

### Build fails with dependency errors
- Delete `node_modules` and `package-lock.json` locally
- Run `npm install` to regenerate
- Commit the new `package-lock.json`

### App loads but shows errors
- Check browser console
- Verify all `VUE_APP_*` environment variables are set in Netlify
- Check that Supabase URL and keys are correct

### Service worker not loading
- Check Network tab in DevTools
- Verify `/service-worker.js` is being served from root
- The `netlify.toml` has a redirect for this

---

## ✅ Success Checklist

- [ ] Committed netlify.toml and guides to Git
- [ ] Pushed to GitHub
- [ ] Created Netlify site
- [ ] Set environment variables in Netlify
- [ ] First deploy succeeded
- [ ] Tested deployed site
- [ ] Updated Supabase redirect URLs
- [ ] Updated Stripe settings (if applicable)
- [ ] (Optional) Set up custom domain
- [ ] (Optional) Created dev branch for stable dev environment

---

## 🎉 You're Done!

Your legacy app is now deployed to Netlify and will auto-deploy on every push to GitHub. No more manual `firebase deploy` commands!

**Your new workflow:**
1. Make changes
2. Commit and push to GitHub
3. Netlify automatically builds and deploys
4. Done! ✨

