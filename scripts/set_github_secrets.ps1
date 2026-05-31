param(
  [Parameter(Mandatory=$true)] [string] $repo,
  [Parameter(Mandatory=$true)] [string] $easToken,
  [Parameter(Mandatory=$true)] [string] $expoToken
)

# Requires GitHub CLI installed and authenticated
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  Write-Error "gh CLI not found. Install GitHub CLI or set secrets via API."
  exit 1
}

gh secret set EAS_TOKEN -b $easToken -R $repo
gh secret set EXPO_TOKEN -b $expoToken -R $repo
Write-Output "Secrets set for $repo"
