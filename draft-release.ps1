Write-Host "Bumping version with `"npm version`", input options: patch, minor, major..."
$userInput = Read-Host
npm version $userInput