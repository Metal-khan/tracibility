#!/usr/bin/env bash
# Usage: ./set_github_secrets.sh <repo> <EAS_TOKEN> <EXPO_TOKEN>
# Requires: gh (GitHub CLI) installed and authenticated, or export GITHUB_TOKEN with repo:repo scope

REPO="$1"
EAS_TOKEN="$2"
EXPO_TOKEN="$3"

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI not found. Install GitHub CLI or set secrets via API."
  exit 1
fi

if [ -z "$REPO" ] || [ -z "$EAS_TOKEN" ] || [ -z "$EXPO_TOKEN" ]; then
  echo "Usage: $0 owner/repo EAS_TOKEN EXPO_TOKEN"
  exit 1
fi

gh secret set EAS_TOKEN -b"$EAS_TOKEN" -R "$REPO"
gh secret set EXPO_TOKEN -b"$EXPO_TOKEN" -R "$REPO"

echo "Secrets set for $REPO"
