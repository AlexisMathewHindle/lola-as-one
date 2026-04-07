#!/bin/bash

echo "🔄 Resetting .zshrc to a clean configuration..."

# Backup the current .zshrc
cp ~/.zshrc ~/.zshrc.old-backup-$(date +%Y%m%d-%H%M%S)
echo "✅ Backed up current .zshrc"

# Create a clean, minimal .zshrc
cat > ~/.zshrc << 'EOF'
# Path configuration
export PATH=$HOME/bin:/usr/local/bin:$PATH

# Oh My Zsh installation
export ZSH="$HOME/.oh-my-zsh"
ZSH_THEME="robbyrussell"
plugins=(git)

# Load Oh My Zsh if it exists
if [ -f "$ZSH/oh-my-zsh.sh" ]; then
  source $ZSH/oh-my-zsh.sh
fi

# Load nvm (Node Version Manager)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

# Set default Node version
nvm use 20 2>/dev/null || nvm use default 2>/dev/null

# Google Cloud SDK (if installed)
if [ -f "$HOME/google-cloud-sdk/path.zsh.inc" ]; then
  source "$HOME/google-cloud-sdk/path.zsh.inc"
fi
if [ -f "$HOME/google-cloud-sdk/completion.zsh.inc" ]; then
  source "$HOME/google-cloud-sdk/completion.zsh.inc"
fi

# Cursor editor function
function cursor {
  open -a "/Applications/Cursor.app" "$@"
}

# OpenAI API Key
export OPENAI_API_KEY="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"

# Langflow environment (if it exists)
[ -f "$HOME/.langflow/uv/env" ] && source "$HOME/.langflow/uv/env"
EOF

echo "✅ Created clean .zshrc configuration"
echo ""
echo "📋 The new .zshrc includes:"
echo "   - Oh My Zsh configuration"
echo "   - NVM (Node Version Manager) auto-loading"
echo "   - Automatic Node 20 selection"
echo "   - Google Cloud SDK (if installed)"
echo "   - Your existing API keys and functions"
echo ""
echo "🗑️  Removed problematic configurations:"
echo "   - Broken Homebrew path"
echo "   - Missing Angular CLI completion"
echo "   - .zshrc.pre-oh-my-zsh reference"
echo ""
echo "🔄 Please close and reopen your terminal for changes to take effect."
echo "   After that, npm will be available automatically!"

