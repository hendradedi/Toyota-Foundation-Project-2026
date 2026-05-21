#!/bin/bash

# Registration Code System - Integration Test Script
# This script tests the complete registration code flow

set -e

BASE_URL="http://localhost:3000"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="admin123"

echo "=========================================="
echo "Registration Code System - Integration Test"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Admin Login
echo -e "${YELLOW}[TEST 1] Admin Login${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$ADMIN_EMAIL\",
    \"password\": \"$ADMIN_PASSWORD\"
  }")

ADMIN_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$ADMIN_TOKEN" ]; then
  echo -e "${RED}✗ Failed to get admin token${NC}"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✓ Admin login successful${NC}"
echo "Token: ${ADMIN_TOKEN:0:20}..."
echo ""

# Test 2: Create Neighborhood with Auto-Generated Code
echo -e "${YELLOW}[TEST 2] Create Neighborhood with Auto-Generated Code${NC}"
NEIGHBORHOOD_RESPONSE=$(curl -s -X POST "$BASE_URL/api/users/management/neighborhoods" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "RT 001 Test Neighborhood",
    "type": "RT",
    "country": "Indonesia",
    "province": "DKI Jakarta",
    "city": "Jakarta Selatan",
    "district": "Kebayoran Baru",
    "sub_district": "Senayan",
    "postal_code": "12190",
    "description": "Test neighborhood for registration code system"
  }')

NEIGHBORHOOD_ID=$(echo $NEIGHBORHOOD_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
REGISTRATION_CODE=$(echo $NEIGHBORHOOD_RESPONSE | grep -o '"registration_code":"[^"]*' | cut -d'"' -f4)

if [ -z "$NEIGHBORHOOD_ID" ] || [ -z "$REGISTRATION_CODE" ]; then
  echo -e "${RED}✗ Failed to create neighborhood${NC}"
  echo "Response: $NEIGHBORHOOD_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✓ Neighborhood created successfully${NC}"
echo "Neighborhood ID: $NEIGHBORHOOD_ID"
echo "Registration Code: $REGISTRATION_CODE"
echo ""

# Test 3: Verify Code Format
echo -e "${YELLOW}[TEST 3] Verify Registration Code Format${NC}"
if [[ $REGISTRATION_CODE =~ ^RT[A-Z0-9]{6}$ ]]; then
  echo -e "${GREEN}✓ Registration code format is valid${NC}"
  echo "Format: RT + 6 alphanumeric characters"
else
  echo -e "${RED}✗ Registration code format is invalid${NC}"
  echo "Expected: RT + 6 alphanumeric characters"
  echo "Got: $REGISTRATION_CODE"
  exit 1
fi
echo ""

# Test 4: User Registration with Valid Code
echo -e "${YELLOW}[TEST 4] User Registration with Valid Code${NC}"
TEST_EMAIL="testuser_$(date +%s)@example.com"
TEST_PHONE="+628123456789$(date +%s | tail -c 3)"

REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"TestPass123!\",
    \"phone\": \"$TEST_PHONE\",
    \"firstName\": \"Test\",
    \"lastName\": \"User\",
    \"registrationCode\": \"$REGISTRATION_CODE\",
    \"householdNumber\": \"15\",
    \"languagePreference\": \"id\"
  }")

USER_ID=$(echo $REGISTER_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
USER_NEIGHBORHOOD_ID=$(echo $REGISTER_RESPONSE | grep -o '"neighborhoodId":"[^"]*' | cut -d'"' -f4)

if [ -z "$USER_ID" ]; then
  echo -e "${RED}✗ User registration failed${NC}"
  echo "Response: $REGISTER_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✓ User registration successful${NC}"
echo "User ID: $USER_ID"
echo "User Neighborhood ID: $USER_NEIGHBORHOOD_ID"

if [ "$USER_NEIGHBORHOOD_ID" = "$NEIGHBORHOOD_ID" ]; then
  echo -e "${GREEN}✓ User correctly linked to neighborhood${NC}"
else
  echo -e "${RED}✗ User not linked to correct neighborhood${NC}"
  exit 1
fi
echo ""

# Test 5: User Registration with Invalid Code
echo -e "${YELLOW}[TEST 5] User Registration with Invalid Code${NC}"
TEST_EMAIL_INVALID="testuser_invalid_$(date +%s)@example.com"
TEST_PHONE_INVALID="+628123456780$(date +%s | tail -c 3)"

INVALID_REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL_INVALID\",
    \"password\": \"TestPass123!\",
    \"phone\": \"$TEST_PHONE_INVALID\",
    \"firstName\": \"Invalid\",
    \"lastName\": \"User\",
    \"registrationCode\": \"INVALID123\",
    \"languagePreference\": \"id\"
  }")

ERROR_CODE=$(echo $INVALID_REGISTER_RESPONSE | grep -o '"code":"[^"]*' | cut -d'"' -f4)

if [ "$ERROR_CODE" = "INVALID_REGISTRATION_CODE" ]; then
  echo -e "${GREEN}✓ Invalid code correctly rejected${NC}"
  echo "Error Code: $ERROR_CODE"
else
  echo -e "${RED}✗ Invalid code was not rejected${NC}"
  echo "Response: $INVALID_REGISTER_RESPONSE"
  exit 1
fi
echo ""

# Test 6: User Registration Without Code
echo -e "${YELLOW}[TEST 6] User Registration Without Code${NC}"
TEST_EMAIL_NO_CODE="testuser_nocode_$(date +%s)@example.com"
TEST_PHONE_NO_CODE="+628123456781$(date +%s | tail -c 3)"

NO_CODE_REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL_NO_CODE\",
    \"password\": \"TestPass123!\",
    \"phone\": \"$TEST_PHONE_NO_CODE\",
    \"firstName\": \"NoCode\",
    \"lastName\": \"User\",
    \"languagePreference\": \"id\"
  }")

USER_ID_NO_CODE=$(echo $NO_CODE_REGISTER_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
USER_NEIGHBORHOOD_ID_NO_CODE=$(echo $NO_CODE_REGISTER_RESPONSE | grep -o '"neighborhoodId":"[^"]*' | cut -d'"' -f4)

if [ -z "$USER_ID_NO_CODE" ]; then
  echo -e "${RED}✗ User registration without code failed${NC}"
  echo "Response: $NO_CODE_REGISTER_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✓ User registration without code successful${NC}"
echo "User ID: $USER_ID_NO_CODE"

if [ -z "$USER_NEIGHBORHOOD_ID_NO_CODE" ] || [ "$USER_NEIGHBORHOOD_ID_NO_CODE" = "null" ]; then
  echo -e "${GREEN}✓ User correctly not linked to any neighborhood${NC}"
else
  echo -e "${RED}✗ User should not be linked to neighborhood${NC}"
  exit 1
fi
echo ""

# Test 7: Verify Code Uniqueness
echo -e "${YELLOW}[TEST 7] Verify Code Uniqueness${NC}"
NEIGHBORHOOD_RESPONSE_2=$(curl -s -X POST "$BASE_URL/api/users/management/neighborhoods" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "RT 002 Test Neighborhood",
    "type": "RT",
    "country": "Indonesia",
    "province": "DKI Jakarta",
    "city": "Jakarta Selatan"
  }')

REGISTRATION_CODE_2=$(echo $NEIGHBORHOOD_RESPONSE_2 | grep -o '"registration_code":"[^"]*' | cut -d'"' -f4)

if [ "$REGISTRATION_CODE" != "$REGISTRATION_CODE_2" ]; then
  echo -e "${GREEN}✓ Each neighborhood has unique registration code${NC}"
  echo "Code 1: $REGISTRATION_CODE"
  echo "Code 2: $REGISTRATION_CODE_2"
else
  echo -e "${RED}✗ Registration codes are not unique${NC}"
  exit 1
fi
echo ""

# Summary
echo "=========================================="
echo -e "${GREEN}All Tests Passed! ✓${NC}"
echo "=========================================="
echo ""
echo "Summary:"
echo "  ✓ Admin login successful"
echo "  ✓ Neighborhood creation with auto-generated code"
echo "  ✓ Registration code format validation"
echo "  ✓ User registration with valid code"
echo "  ✓ User correctly linked to neighborhood"
echo "  ✓ Invalid code rejection"
echo "  ✓ Registration without code"
echo "  ✓ Code uniqueness verification"
echo ""
echo "Registration Code System is fully operational!"
