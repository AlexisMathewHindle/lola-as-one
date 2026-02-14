# Netlify Setup Summary

## 🎯 Goal

Deploy **TWO separate apps** from this repository to **TWO different Netlify sites**.

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Repository                         │
│                    lola-as-one                              │
│                                                             │
│  ┌──────────────────┐         ┌──────────────────┐        │
│  │  /lola-workshops │         │      /app        │        │
│  │  (Legacy Vue CLI)│         │   (Vite + Vue 3) │        │
│  └──────────────────┘         └──────────────────┘        │
│          │                             │                   │
└──────────┼─────────────────────────────┼───────────────────┘
           │                             │
           │ Auto-deploy                 │ Auto-deploy
           │ on push                     │ on push
           ▼                             ▼
  ┌─────────────────┐          ┌─────────────────┐
  │  Netlify Site 1 │          │  Netlify Site 2 │
  │                 │          │                 │
  │ lola-workshops  │          │  lola-as-one    │
  │   .netlify.app  │          │   .netlify.app  │
  └─────────────────┘          └─────────────────┘
```

---

## 📦 Two Apps, Two Sites

### Site 1: Legacy App
- **Directory**: `/lola-workshops`
- **Framework**: Vue CLI + Vue 3
- **Config**: `lola-workshops/netlify.toml`
- **URL**: `https://lola-workshops.netlify.app`
- **Replaces**: `lola-workshops-dev.web.app` (Firebase)

### Site 2: New App
- **Directory**: `/app`
- **Framework**: Vite + Vue 3
- **Config**: `netlify.toml` (root)
- **URL**: `https://lola-as-one.netlify.app`
- **New**: Fresh deployment

---

## ✅ What's Ready

All configuration files are created and ready:

```
lola-as-one/
├── netlify.toml                      ✅ Config for new app
├── DEPLOY-BOTH-APPS.md              ✅ Quick start guide
├── DEPLOYMENT-GUIDE.md              ✅ Detailed guide
├── NETLIFY-SETUP-SUMMARY.md         ✅ This file
│
├── app/
│   ├── dist/                        (build output)
│   └── ...
│
├── lola-workshops/
│   ├── netlify.toml                 ✅ Config for legacy app
│   ├── NETLIFY-DEPLOY-GUIDE.md      ✅ Legacy app guide
│   ├── MIGRATION-FROM-FIREBASE.md   ✅ Migration checklist
│   ├── dist/                        (build output)
│   └── ...
│
└── .github/
    └── workflows/
        └── netlify-legacy-app.yml   ✅ Optional CI workflow
```

---

## 🚀 Quick Start (3 Steps)

### 1. Commit & Push
```bash
git add .
git commit -m "Add Netlify configuration for both apps"
git push origin main
```

### 2. Create Two Netlify Sites

#### Site 1 (Legacy):
- Go to https://app.netlify.com/
- Import from GitHub: `lola-as-one`
- Base directory: `lola-workshops`
- Build: `npm ci && npm run build:prod`
- Publish: `lola-workshops/dist`

#### Site 2 (New):
- Go to https://app.netlify.com/
- Import from GitHub: `lola-as-one` (same repo!)
- Base directory: `app`
- Build: `npm run build`
- Publish: `app/dist`

### 3. Set Environment Variables

#### Legacy App:
```
VUE_APP_SUPABASE_URL
VUE_APP_SUPABASE_ANON_KEY
VUE_APP_DATA_SOURCE = supabase
VUE_APP_STRIPE_PUBLISHABLE_KEY
```

#### New App:
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_STRIPE_PUBLISHABLE_KEY
VITE_APP_URL
```

---

## 📖 Documentation

| Guide | Purpose |
|-------|---------|
| **DEPLOY-BOTH-APPS.md** | 👈 **START HERE** - Step-by-step for both apps |
| **DEPLOYMENT-GUIDE.md** | Comprehensive guide with troubleshooting |
| **lola-workshops/NETLIFY-DEPLOY-GUIDE.md** | Legacy app specific details |
| **lola-workshops/MIGRATION-FROM-FIREBASE.md** | Firebase → Netlify migration |
| **NETLIFY-SETUP.md** | New app specific details |

---

## 🔑 Key Differences

### Legacy App (lola-workshops)
- Uses `VUE_APP_*` environment variables
- Node 18
- Vue CLI build system
- Outputs to `dist/` or `dist-dev/`
- Has service worker

### New App (app)
- Uses `VITE_*` environment variables
- Node 20
- Vite build system
- Outputs to `dist/`
- Modern build tooling

---

## 🎉 After Deployment

Once both sites are deployed:

1. ✅ Both auto-deploy on every `git push origin main`
2. ✅ No more manual `firebase deploy` commands
3. ✅ Get deploy previews for every PR
4. ✅ One-click rollbacks in Netlify dashboard
5. ✅ Build logs and analytics in Netlify

---

## 🆘 Need Help?

1. **Quick start**: Read `DEPLOY-BOTH-APPS.md`
2. **Detailed guide**: Read `DEPLOYMENT-GUIDE.md`
3. **Legacy app issues**: Read `lola-workshops/NETLIFY-DEPLOY-GUIDE.md`
4. **Build fails**: Check Netlify dashboard build logs
5. **Environment variables**: Verify in Netlify site settings

---

## 📊 Migration Status

| Task | Status |
|------|--------|
| Create Netlify configs | ✅ Done |
| Create documentation | ✅ Done |
| Commit to Git | ⏳ Next step |
| Create Netlify sites | ⏳ Next step |
| Set environment variables | ⏳ Next step |
| Test deployments | ⏳ Next step |
| Update external services | ⏳ After deployment |

---

## 🚦 Next Action

**👉 Follow the guide in `DEPLOY-BOTH-APPS.md` to deploy both apps!**

