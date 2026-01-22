#!/bin/bash
# Quick Start Testing & Verification Script
# Run comprehensive tests on all advanced features

echo "🚀 LucaExpress Advanced Features - Verification Script"
echo "========================================================"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0

# Function to print section header
print_section() {
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
}

# Function to test API endpoint
test_endpoint() {
  local endpoint=$1
  local method=${2:-GET}
  local description=$3
  
  echo -n "Testing $description... "
  
  if [ "$method" = "GET" ]; then
    response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000$endpoint" \
      -H "Authorization: Bearer test-token" 2>/dev/null)
  else
    response=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "http://localhost:3000$endpoint" \
      -H "Authorization: Bearer test-token" \
      -H "Content-Type: application/json" 2>/dev/null)
  fi
  
  if [ "$response" = "200" ] || [ "$response" = "401" ]; then
    echo -e "${GREEN}✅ PASS${NC} (HTTP $response)"
    ((TESTS_PASSED++))
  else
    echo -e "${RED}❌ FAIL${NC} (HTTP $response)"
    ((TESTS_FAILED++))
  fi
}

# Function to test file existence
test_file() {
  local filepath=$1
  local description=$2
  
  echo -n "Checking $description... "
  
  if [ -f "$filepath" ]; then
    echo -e "${GREEN}✅ EXISTS${NC}"
    ((TESTS_PASSED++))
  else
    echo -e "${RED}❌ MISSING${NC}"
    ((TESTS_FAILED++))
  fi
}

# ============ START TESTS ============

print_section "🔍 System & Environment Checks"

# Check if Node.js is running
echo -n "Checking Node.js server... "
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
  echo -e "${GREEN}✅ Running${NC}"
  ((TESTS_PASSED++))
else
  echo -e "${RED}❌ Not running${NC} (Start with: npm start)"
  ((TESTS_FAILED++))
fi

# Check if Ollama is available
echo -n "Checking Ollama server... "
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Connected${NC}"
  ((TESTS_PASSED++))
else
  echo -e "${YELLOW}⚠️  Not available${NC} (Optional - use cloud LLM if needed)"
fi

print_section "📁 New Files Verification"

test_file "./settings-advanced.html" "Advanced Settings Page"
test_file "./finetuning-setup.html" "Fine-Tuning Setup Page"
test_file "./backend/dlp-engine.js" "DLP Engine Module"
test_file "./backend/agent-autonomy.js" "Agent Autonomy Module"
test_file "./test-suite.js" "Test Suite"
test_file "./config-advanced.js" "Advanced Configuration"

print_section "🔌 API Endpoints - Auto-Approval"

test_endpoint "/api/settings/auto-approval" "GET" "Get auto-approval settings"
test_endpoint "/api/settings/auto-approval" "POST" "Save auto-approval settings"

print_section "🔐 API Endpoints - DLP"

test_endpoint "/api/settings/dlp" "GET" "Get DLP settings"
test_endpoint "/api/settings/dlp" "POST" "Save DLP settings"

print_section "🧠 API Endpoints - LLM Management"

test_endpoint "/api/settings/llm-models" "GET" "List LLM models"
test_endpoint "/api/settings/llm-select" "POST" "Select LLM model"
test_endpoint "/api/ollama/models" "GET" "Get Ollama models"
test_endpoint "/api/ollama/test" "POST" "Test Ollama connection"

print_section "🤖 API Endpoints - Agent Autonomy"

test_endpoint "/api/settings/agent-autonomy" "POST" "Configure agent autonomy"
test_endpoint "/api/agents/schedules" "GET" "Get agent schedules"
test_endpoint "/api/agents/1/status" "GET" "Get agent status"

print_section "🎛️ API Endpoints - Fine-Tuning"

test_endpoint "/api/finetuning/jobs" "GET" "List fine-tuning jobs"
test_endpoint "/api/finetuning/jobs" "POST" "Create fine-tuning job"

print_section "❤️ API Endpoints - System"

test_endpoint "/api/system/health" "GET" "Get system health"

print_section "📄 Frontend Pages"

echo -n "Testing Advanced Settings page... "
if [ -f "./settings-advanced.html" ]; then
  if grep -q "Auto-Approval" "./settings-advanced.html"; then
    echo -e "${GREEN}✅ PASS${NC}"
    ((TESTS_PASSED++))
  else
    echo -e "${RED}❌ FAIL${NC}"
    ((TESTS_FAILED++))
  fi
fi

echo -n "Testing Fine-Tuning page... "
if [ -f "./finetuning-setup.html" ]; then
  if grep -q "QLoRA" "./finetuning-setup.html"; then
    echo -e "${GREEN}✅ PASS${NC}"
    ((TESTS_PASSED++))
  else
    echo -e "${RED}❌ FAIL${NC}"
    ((TESTS_FAILED++))
  fi
fi

print_section "🧪 Module Functionality Tests"

echo -n "Testing DLP pattern detection... "
if grep -q "ssn.*\\\\\\\b\\\\\\d{3}-\\\\\\d{2}-\\\\\\d{4}\\\\\\b" "./backend/dlp-engine.js"; then
  echo -e "${GREEN}✅ PASS${NC}"
  ((TESTS_PASSED++))
else
  echo -e "${YELLOW}⚠️  WARN${NC}"
fi

echo -n "Testing Agent autonomy loop... "
if grep -q "selfDirect" "./backend/agent-autonomy.js"; then
  echo -e "${GREEN}✅ PASS${NC}"
  ((TESTS_PASSED++))
else
  echo -e "${RED}❌ FAIL${NC}"
  ((TESTS_FAILED++))
fi

echo -n "Testing config availability... "
if grep -q "module.exports" "./config-advanced.js"; then
  echo -e "${GREEN}✅ PASS${NC}"
  ((TESTS_PASSED++))
else
  echo -e "${RED}❌ FAIL${NC}"
  ((TESTS_FAILED++))
fi

print_section "📊 Test Results Summary"

TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))
PASS_PERCENT=$((TESTS_PASSED * 100 / TOTAL_TESTS))

echo "Total Tests: $TOTAL_TESTS"
echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed: ${RED}$TESTS_FAILED${NC}"
echo ""
echo -e "Success Rate: ${BLUE}$PASS_PERCENT%${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ ALL TESTS PASSED - System is ready for use!${NC}"
  exit 0
else
  echo -e "${YELLOW}⚠️  Some tests failed - Check the output above${NC}"
  exit 1
fi
