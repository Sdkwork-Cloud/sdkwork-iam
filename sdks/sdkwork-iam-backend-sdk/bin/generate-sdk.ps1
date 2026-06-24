param(
    [string[]]$Languages = @("typescript", "dart", "python", "go", "java", "kotlin", "swift", "csharp", "flutter", "rust", "php", "ruby"),
    [string]$BaseUrl = "http://localhost:8080",
    [string]$SdkVersion = "1.0.0"
)

$ErrorActionPreference = "Stop"

function Resolve-PackageName {
    param([string]$Language)

    switch ($Language) {
        "typescript" { return "@sdkwork/iam-backend-sdk" }
        "dart" { return "sdkwork_iam_backend_sdk" }
        "flutter" { return "sdkwork_iam_backend_sdk" }
        "python" { return "sdkwork-iam-backend-sdk" }
        "go" { return "github.com/sdkwork/sdkwork-iam-backend-sdk" }
        "java" { return "com.sdkwork:sdkwork-iam-backend-sdk" }
        "kotlin" { return "com.sdkwork:sdkwork-iam-backend-sdk" }
        "swift" { return "sdkwork-iam-backend-sdk" }
        "csharp" { return "SDKWork.Iam.BackendSdk" }
        "rust" { return "sdkwork-iam-backend-sdk" }
        "php" { return "sdkwork/iam-backend-sdk" }
        "ruby" { return "sdkwork-iam-backend-sdk" }
        default { return "sdkwork-iam-backend-sdk-$Language" }
    }
}

function Resolve-NamespaceArgs {
    param([string]$Language)

    switch ($Language) {
        "java" { return @("--namespace", "com.sdkwork.iam.backend.sdk") }
        "kotlin" { return @("--namespace", "com.sdkwork.iam.backend.sdk") }
        "csharp" { return @("--namespace", "SDKWork.Iam.BackendSdk") }
        "php" { return @("--namespace", "SDKWork\\Iam\\BackendSdk") }
        default { return @() }
    }
}

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$FamilyRoot = (Get-Item $ScriptDir).Parent.FullName
$IamRoot = (Get-Item $FamilyRoot).Parent.Parent.FullName
$WorkspaceRoot = (Get-Item (Join-Path $FamilyRoot "..\..\..")).FullName
$GeneratorPath = Join-Path $WorkspaceRoot "sdkwork-sdk-generator\bin\sdkgen.js"
$InputPath = Join-Path $FamilyRoot "openapi\sdkwork-iam-backend-api.sdkgen.yaml"
$SdkName = "sdkwork-iam-backend-sdk"
$ApiPrefix = "/backend/v3/api"

if (-not (Test-Path $GeneratorPath)) {
    throw "Canonical SDK generator not found: $GeneratorPath"
}
if (-not (Test-Path $InputPath)) {
    & node (Join-Path $IamRoot "tools\generators\materialize-iam-v3-openapi-boundaries.mjs")
}
if (-not (Test-Path $InputPath)) {
    throw "OpenAPI sdkgen input not found: $InputPath"
}

foreach ($LanguageValue in $Languages) {
    foreach ($LanguagePart in "$LanguageValue".Split(",")) {
        $Language = $LanguagePart.Trim()
        if ([string]::IsNullOrWhiteSpace($Language)) {
            continue
        }

        $LanguageWorkspace = Join-Path $FamilyRoot "$SdkName-$Language"
        $OutputPath = Join-Path $LanguageWorkspace "generated\server-openapi"
        $PackageName = Resolve-PackageName $Language
        $NamespaceArgs = Resolve-NamespaceArgs $Language
        $ResolvedLanguageWorkspace = [System.IO.Path]::GetFullPath($LanguageWorkspace)
        $ResolvedOutputPath = [System.IO.Path]::GetFullPath($OutputPath)
        $LanguageWorkspacePrefix = $ResolvedLanguageWorkspace.TrimEnd([System.IO.Path]::DirectorySeparatorChar, [System.IO.Path]::AltDirectorySeparatorChar) + [System.IO.Path]::DirectorySeparatorChar

        if (-not $ResolvedOutputPath.StartsWith($LanguageWorkspacePrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
            throw "Refusing to clean SDK output outside language workspace: $ResolvedOutputPath"
        }

        if (Test-Path $OutputPath) {
            Remove-Item -LiteralPath $OutputPath -Recurse -Force
        }
        Write-Host "Generating $Language SDK at $OutputPath" -ForegroundColor Cyan
        & node $GeneratorPath generate `
            -i $InputPath `
            -o $OutputPath `
            -n $SdkName `
            -t backend `
            -l $Language `
            --fixed-sdk-version $SdkVersion `
            --base-url $BaseUrl `
            --api-prefix $ApiPrefix `
            --package-name $PackageName `
            --standard-profile sdkwork-v3 `
            --sdk-root $FamilyRoot `
            --sdk-name $SdkName `
            --no-sync-published-version `
            @NamespaceArgs

        if ($LASTEXITCODE -ne 0) {
            exit $LASTEXITCODE
        }
    }
}
