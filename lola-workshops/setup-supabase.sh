#!/bin/bash

# Setup script for Supabase integration in legacy website

echo "🚀 Setting up Supabase for Legacy Lola Workshops Website"
echo ""

# Check if .env.local exists
if [ -f ".env.local" ]; then
    echo "⚠️  .env.local already exists"
    read -p "Do you want to overwrite it? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Skipping .env.local creation"
    else
        cp .env.example .env.local
        echo "✅ Created .env.local from .env.example"
    fi
else
    cp .env.example .env.local
    echo "✅ Created .env.local from .env.example"
fi

echo ""
echo "📝 Next steps:"
echo ""
echo "1. Edit .env.local and add your Supabase credentials:"
echo "   - VUE_APP_SUPABASE_URL"
echo "   - VUE_APP_SUPABASE_ANON_KEY"
echo ""
echo "2. Get your credentials from:"
echo "   Supabase Dashboard → Project Settings → API"
echo ""
echo "3. Review the migration guide:"
echo "   cat SUPABASE_MIGRATION_GUIDE.md"
echo ""
echo "4. Check the example component:"
echo "   src/components/CalendarComponent.SUPABASE_EXAMPLE.vue"
echo ""
echo "5. Start the dev server:"
echo "   npm run serve"
echo ""
echo "✨ Happy coding!"

