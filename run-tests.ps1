# Quick Start Testing & Verification Script for Windows PowerShell
# Run comprehensive tests on all advanced features

Write-Host "🚀 LucaExpress Advanced Features - Verification Script" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

# Test counters
$testsPasssed = 0
$testsFailed = 0

# Function to print section header
function Print-Section {
    param([string]$Title)
    Write-Host ""
    Write-Host ("━" * 50) -ForegroundColor Blue
    Write-Host $Title -ForegroundColor Blue
    Write-Host ("━" * 50) -ForegroundColor Blue
    Write-Host ""
}

# Function to test API endpoint
function Test-Endpoint {
    param(
        [string]$Endpoint,
        [string]$Method = "GET",
        [string]$Description
    )
    
    Write-Host -NoNewline "Testing $Description... "
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000$Endpoint" `
            -Method $Method `
            -Headers @{"Authorization" = "Bearer test-token"; "Content-Type" = "application/json"} `
            -ErrorAction SilentlyContinue
        
        if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 401) {
            Write-Host "✅ PASS" -ForegroundColor Green -NoNewline
            Write-Host " (HTTP $($response.StatusCode))" -ForegroundColor Green
            $script:testsPassed++
        } else {
            Write-Host "❌ FAIL" -ForegroundColor Red -NoNewline
            Write-Host " (HTTP $($response.StatusCode))" -ForegroundColor Red
            $script:testsFailed++
        }
    } catch {
        Write-Host "❌ FAIL" -ForegroundColor Red -NoNewline
        Write-Host " (Connection error)" -ForegroundColor Red
        $script:testsFailed++
    }
}

# Function to test file existence
function Test-File {
    param(
        [string]$FilePath,
        [string]$Description
    )
    
    Write-Host -NoNewline "Checking $Description... "
    
    if (Test-Path $FilePath) {
        Write-Host "✅ EXISTS" -ForegroundColor Green
        $script:testsPassed++
    } else {
        Write-Host "❌ MISSING" -ForegroundColor Red
        $script:testsFailed++
    }
}

# Function to test file content
function Test-FileContent {
    param(
        [string]$FilePath,
        [string]$Pattern,
        [string]$Description
    )
    
    Write-Host -NoNewline "Checking $Description... "
    
    if (Test-Path $FilePath) {
        $content = Get-Content $FilePath -Raw
        if ($content -match $Pattern) {
            Write-Host "✅ PASS" -ForegroundColor Green
            $script:testsPassed++
        } else {
            Write-Host "❌ FAIL" -ForegroundColor Red
            $script:testsFailed++
        }
    } else {
        Write-Host "❌ FILE NOT FOUND" -ForegroundColor Red
        $script:testsFailed++
    }
}

# ============ START TESTS ============

Print-Section "🔍 System & Environment Checks"

# Check if Node.js is running
Write-Host -NoNewline "Checking Node.js server... "
$nodeRunning = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($nodeRunning) {
    Write-Host "✅ Running" -ForegroundColor Green
    $script:testsPassed++
} else {
    Write-Host "❌ Not running" -ForegroundColor Red
    Write-Host "     Start with: npm start" -ForegroundColor Yellow
    $script:testsFailed++
}

# Check if Ollama is available
Write-Host -NoNewline "Checking Ollama server... "
try {
    $response = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -ErrorAction SilentlyContinue
    Write-Host "✅ Connected" -ForegroundColor Green
    $script:testsPassed++
} catch {
    Write-Host "⚠️  Not available" -ForegroundColor Yellow
    Write-Host "     (Optional - use cloud LLM if needed)" -ForegroundColor Yellow
}

Print-Section "📁 New Files Verification"

# Define base path
$basePath = "C:\Users\Jerem\OneDrive\Software\LucaExpress 2nd\opt\luca-express"

Test-File "$basePath\settings-advanced.html" "Advanced Settings Page"
Test-File "$basePath\finetuning-setup.html" "Fine-Tuning Setup Page"
Test-File "$basePath\backend\dlp-engine.js" "DLP Engine Module"
Test-File "$basePath\backend\agent-autonomy.js" "Agent Autonomy Module"
Test-File "$basePath\test-suite.js" "Test Suite"
Test-File "$basePath\config-advanced.js" "Advanced Configuration"

Print-Section "🔌 API Endpoints - Auto-Approval"

Test-Endpoint "/api/settings/auto-approval" "GET" "Get auto-approval settings"
Test-Endpoint "/api/settings/auto-approval" "POST" "Save auto-approval settings"

Print-Section "🔐 API Endpoints - DLP"

Test-Endpoint "/api/settings/dlp" "GET" "Get DLP settings"
Test-Endpoint "/api/settings/dlp" "POST" "Save DLP settings"

Print-Section "🧠 API Endpoints - LLM Management"

Test-Endpoint "/api/settings/llm-models" "GET" "List LLM models"
Test-Endpoint "/api/settings/llm-select" "POST" "Select LLM model"
Test-Endpoint "/api/ollama/models" "GET" "Get Ollama models"
Test-Endpoint "/api/ollama/test" "POST" "Test Ollama connection"

Print-Section "🤖 API Endpoints - Agent Autonomy"

Test-Endpoint "/api/settings/agent-autonomy" "POST" "Configure agent autonomy"
Test-Endpoint "/api/agents/schedules" "GET" "Get agent schedules"
Test-Endpoint "/api/agents/1/status" "GET" "Get agent status"

Print-Section "🎛️ API Endpoints - Fine-Tuning"

Test-Endpoint "/api/finetuning/jobs" "GET" "List fine-tuning jobs"
Test-Endpoint "/api/finetuning/jobs" "POST" "Create fine-tuning job"

Print-Section "❤️ API Endpoints - System"

Test-Endpoint "/api/system/health" "GET" "Get system health"

Print-Section "📄 Frontend Pages"

Test-FileContent "$basePath\settings-advanced.html" "Auto-Approval" "Advanced Settings content"
Test-FileContent "$basePath\finetuning-setup.html" "QLoRA" "Fine-Tuning setup content"
Test-FileContent "$basePath\finetuning-setup.html" "HuggingFace" "HuggingFace integration"

Print-Section "🧪 Module Functionality Tests"

Test-FileContent "$basePath\backend\dlp-engine.js" "ssn.*\\d{3}-\\d{2}-\\d{4}" "DLP SSN pattern"
Test-FileContent "$basePath\backend\dlp-engine.js" "ccNumber" "DLP CC pattern"
Test-FileContent "$basePath\backend\agent-autonomy.js" "decideNextAction\(\)" "Agent autonomy loop"
Test-FileContent "$basePath\backend\agent-autonomy.js" "RAG" "RAG memory integration"
Test-FileContent "$basePath\config-advanced.js" "module.exports" "Config exports"

Print-Section "📊 Test Results Summary"

$totalTests = $script:testsPassed + $script:testsFailed
$passPercent = if ($totalTests -gt 0) { [math]::Round(($script:testsPassed * 100 / $totalTests)) } else { 0 }

Write-Host "Total Tests: $totalTests" -ForegroundColor White
Write-Host "Passed: $($script:testsPassed)" -ForegroundColor Green
Write-Host "Failed: $($script:testsFailed)" -ForegroundColor Red
Write-Host ""
Write-Host "Success Rate: $passPercent%" -ForegroundColor Cyan
Write-Host ""

if ($script:testsFailed -eq 0) {
    Write-Host "✅ ALL TESTS PASSED - System is ready for use!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "⚠️  Some tests failed - Check the output above" -ForegroundColor Yellow
    exit 1
}
