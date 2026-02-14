# Deployment Checklist - Both Apps to Netlify

Use this checklist to track your deployment progress.

---

## 📋 Pre-Deployment

- [ ] GitHub repository is up to date
- [ ] You have a Netlify account (free tier is fine)
- [ ] You have Supabase credentials ready
- [ ] You have Stripe credentials ready (optional)

---

## 🔧 Step 1: Commit Configuration Files

- [ ] Run: `git add .`
- [ ] Run: `git commit -m "Add Netlify configuration for both apps"`
- [ ] Run: `git push origin main`
- [ ] Verify files are on GitHub:
  - [ ] `netlify.toml` (root)
  - [ ] `lola-workshops/netlify.toml`
  - [ ] All documentation files

---

## 🌐 Step 2: Deploy Legacy App (lola-workshops)

### Create Site
- [ ] Go to https://app.netlify.com/
- [ ] Click "Add new site" → "Import an existing project"
- [ ] Choose GitHub
- [ ] Select `lola-as-one` repository
- [ ] Configure settings:
  - [ ] Site name: `lola-workshops`
  - [ ] Base directory: `lola-workshops`
  - [ ] Build command: `npm ci && npm run build:prod`
  - [ ] Publish directory: `lola-workshops/dist`
  - [ ] Branch: `main`
- [ ] Click "Deploy site"

### Set Environment Variables
Go to Site settings → Environment variables:

- [ ] `VUE_APP_SUPABASE_URL` = `https://hubbjhtjyubzczxengyo.supabase.co`
- [ ] `VUE_APP_SUPABASE_ANON_KEY` = [your-key]
- [ ] `VUE_APP_DATA_SOURCE` = `supabase`
- [ ] `VUE_APP_STRIPE_PUBLISHABLE_KEY` = [your-key]

Optional (Firebase Analytics):
- [ ] `VUE_APP_FIREBASE_API_KEY`
- [ ] `VUE_APP_FIREBASE_AUTH_DOMAIN`
- [ ] `VUE_APP_FIREBASE_PROJECT_ID`
- [ ] `VUE_APP_FIREBASE_STORAGE_BUCKET`
- [ ] `VUE_APP_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `VUE_APP_FIREBASE_APP_ID`
- [ ] `VUE_APP_FIREBASE_MEASUREMENT_ID`

### Verify Deployment
- [ ] Wait for build to complete (2-5 minutes)
- [ ] Visit: `https://lola-workshops.netlify.app`
- [ ] Test homepage loads
- [ ] Test navigation works
- [ ] Test data loads from Supabase
- [ ] Test forms work
- [ ] Check browser console for errors

---

## 🌐 Step 3: Deploy New App (app)

### Create Site
- [ ] Go to https://app.netlify.com/
- [ ] Click "Add new site" → "Import an existing project"
- [ ] Choose GitHub
- [ ] Select `lola-as-one` repository (same repo!)
- [ ] Configure settings:
  - [ ] Site name: `lola-as-one`
  - [ ] Base directory: `app`
  - [ ] Build command: `npm run build`
  - [ ] Publish directory: `app/dist`
  - [ ] Branch: `main`
- [ ] Click "Deploy site"

### Set Environment Variables
Go to Site settings → Environment variables:

- [ ] `VITE_SUPABASE_URL` = `https://hubbjhtjyubzczxengyo.supabase.co`
- [ ] `VITE_SUPABASE_ANON_KEY` = [your-key]
- [ ] `VITE_STRIPE_PUBLISHABLE_KEY` = [your-key]
- [ ] `VITE_APP_URL` = `https://lola-as-one.netlify.app`

### Verify Deployment
- [ ] Wait for build to complete (2-5 minutes)
- [ ] Visit: `https://lola-as-one.netlify.app`
- [ ] Test homepage loads
- [ ] Test navigation works
- [ ] Test data loads from Supabase
- [ ] Test forms work
- [ ] Check browser console for errors

---

## 🔄 Step 4: Update External Services

### Supabase
- [ ] Go to Supabase Dashboard → Authentication → URL Configuration
- [ ] Add to Redirect URLs:
  - [ ] `https://lola-workshops.netlify.app/*`
  - [ ] `https://lola-as-one.netlify.app/*`
- [ ] Update Site URL if needed

### Stripe
- [ ] Go to Stripe Dashboard → Developers → Webhooks
- [ ] Update webhook URLs if needed
- [ ] Add Netlify domains to allowed domains:
  - [ ] `lola-workshops.netlify.app`
  - [ ] `lola-as-one.netlify.app`

---

## ✅ Step 5: Final Verification

### Test Auto-Deploy
- [ ] Make a small change to legacy app
- [ ] Commit and push to main
- [ ] Verify legacy site auto-deploys
- [ ] Make a small change to new app
- [ ] Commit and push to main
- [ ] Verify new site auto-deploys

### Test Both Sites
- [ ] Legacy app works correctly
- [ ] New app works correctly
- [ ] Both sites load data from Supabase
- [ ] Both sites handle authentication (if applicable)
- [ ] Both sites process payments (if applicable)

---

## 📝 Step 6: Documentation

- [ ] Update any internal documentation with new URLs
- [ ] Update README files if needed
- [ ] Share new URLs with team
- [ ] Update bookmarks/favorites

---

## 🗑️ Step 7: Cleanup (Optional)

### Can Remove Later:
- [ ] `lola-workshops/bitbucket-pipelines.yml` (keep for reference initially)
- [ ] Firebase hosting config in `firebase.json` (keep Firebase Functions if using)

### Keep:
- [ ] Firebase Functions (if still using)
- [ ] Firestore rules (if still using)
- [ ] All Netlify configuration files

---

## 🎉 Success Criteria

You're done when:

- ✅ Both sites are live on Netlify
- ✅ Both sites auto-deploy on git push
- ✅ All functionality works on both sites
- ✅ External services (Supabase, Stripe) are updated
- ✅ Team is aware of new URLs

---

## 📊 Deployment Summary

| Item | Legacy App | New App |
|------|------------|---------|
| **URL** | lola-workshops.netlify.app | lola-as-one.netlify.app |
| **Directory** | /lola-workshops | /app |
| **Framework** | Vue CLI | Vite |
| **Node Version** | 18 | 20 |
| **Env Prefix** | VUE_APP_ | VITE_ |
| **Status** | ⏳ | ⏳ |

Update status to ✅ when deployed!

---

## 🆘 Troubleshooting

If something goes wrong:

1. Check build logs in Netlify dashboard
2. Verify environment variables are set correctly
3. Check base directory is correct
4. Verify Node version matches requirements
5. Read the detailed guides:
   - `DEPLOY-BOTH-APPS.md`
   - `DEPLOYMENT-GUIDE.md`
   - `lola-workshops/NETLIFY-DEPLOY-GUIDE.md`

---

**Good luck! 🚀**

