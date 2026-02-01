#!/bin/bash

# Test script for create-case API endpoint
# Usage: ./test-api.sh YOUR_API_KEY

API_KEY="${1:-YOUR_API_KEY_HERE}"
SUPABASE_URL="https://qfbrsodxhyzvqxuxpdik.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmYnJzb2R4aHl6dnF4dXhwZGlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4MTMyMTUsImV4cCI6MjA3ODM4OTIxNX0.jezots4CfS95RUNWgOL96_OmOpDrbDnj5u8opQdBUlQ"

echo "🧪 Testing create-case API endpoint..."
echo ""

# Test 1: Basic case creation
echo "Test 1: Creating case with temporary health insurance ID..."
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST \
  "${SUPABASE_URL}/functions/v1/create-case" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "apikey: ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "intakeData": {
      "dateOfLoss": "2024-12-01",
      "timeOfWreck": "2:30 PM",
      "wreckType": "Rear End",
      "wreckCity": "Oklahoma City",
      "wreckState": "Oklahoma",
      "signUpDate": "2024-12-08",
      "clients": [
        {
          "isDriver": true,
          "firstName": "Test",
          "lastName": "User",
          "dateOfBirth": "1990-01-15",
          "streetAddress": "123 Test St",
          "city": "Oklahoma City",
          "state": "Oklahoma",
          "zipCode": "73101",
          "primaryPhone": "405-555-9999",
          "email": "test@example.com",
          "hasHealthInsurance": true,
          "healthInsuranceId": "temp-test-insurance",
          "healthMemberId": "TEST123456"
        }
      ],
      "defendants": []
    }
  }')

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

echo "HTTP Status: $HTTP_STATUS"
echo "Response:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_STATUS" = "201" ]; then
  echo "✅ Test 1 PASSED: Case created successfully"
  CASEFILE_ID=$(echo "$BODY" | jq -r '.casefileId' 2>/dev/null)
  echo "Casefile ID: $CASEFILE_ID"
else
  echo "❌ Test 1 FAILED: HTTP $HTTP_STATUS"
  if [ "$HTTP_STATUS" = "401" ]; then
    echo "   → Authentication failed. Check:"
    echo "     1. API key is correct"
    echo "     2. JWT verification is disabled in Supabase Dashboard"
    echo "     3. API key is active in database"
  fi
fi

echo ""
echo "---"
echo ""

# Test 2: Validation error
echo "Test 2: Testing validation (missing required field)..."
RESPONSE2=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST \
  "${SUPABASE_URL}/functions/v1/create-case" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "apikey: ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "intakeData": {
      "dateOfLoss": "2024-12-01",
      "clients": []
    }
  }')

HTTP_STATUS2=$(echo "$RESPONSE2" | grep "HTTP_STATUS" | cut -d: -f2)
BODY2=$(echo "$RESPONSE2" | sed '/HTTP_STATUS/d')

echo "HTTP Status: $HTTP_STATUS2"
if [ "$HTTP_STATUS2" = "400" ]; then
  echo "✅ Test 2 PASSED: Validation error returned correctly"
else
  echo "⚠️  Test 2: Expected 400, got $HTTP_STATUS2"
fi
echo ""

echo "Done! Check the Supabase Dashboard to verify:"
echo "1. Case was created in casefiles table"
echo "2. Health insurance was created (if temp ID used)"
echo "3. UI shows the new case automatically"

