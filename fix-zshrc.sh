#!/bin/bash

# Backup the current .zshrc
cp ~/.zshrc ~/.zshrc.backup-$(date +%Y%m%d-%H%M%S)

# Read the file and fix the problematic lines
awk '
NR==106 && /eval.*brew/ {
    print "# FIXED: Homebrew path does not exist - comment out to prevent errors"
    print "# " $0
    next
}
NR==110 && /ng completion/ {
    print "# FIXED: Angular CLI not installed globally - comment out to prevent errors"
    print "# " $0
    next
}
{print}
' ~/.zshrc > ~/.zshrc.tmp

# Replace the original file
mv ~/.zshrc.tmp ~/.zshrc

echo "✅ Fixed ~/.zshrc file!"
echo "The following lines have been commented out:"
echo "  - Line 106: eval \$(/opt/homebrew/bin/brew shellenv)"
echo "  - Line 110: source <(ng completion script)"
echo ""
echo "🔄 Please close and reopen your terminal for changes to take effect."
echo "   After that, npm will be available automatically in every new terminal!"

