#!/bin/bash

# Test curl command for create-case API endpoint
# Replace YOUR_API_KEY with your generated API key from the UI

API_KEY="tdA1KA8jcgszFPVE5sLNHHZCGivFTRpCvasrAfYgFp7fSRVP48fCKFUFrGGHAEpT"
SUPABASE_URL="https://qfbrsodxhyzvqxuxpdik.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmYnJzb2R4aHl6dnF4dXhwZGlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4MTMyMTUsImV4cCI6MjA3ODM4OTIxNX0.jezots4CfS95RUNWgOL96_OmOpDrbDnj5u8opQdBUlQ"

curl -X POST \
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
          "firstName": "John",
          "lastName": "Doe",
          "dateOfBirth": "1985-05-15",
          "streetAddress": "123 Main St",
          "city": "Oklahoma City",
          "state": "Oklahoma",
          "zipCode": "73101",
          "primaryPhone": "405-555-1234",
          "email": "john.doe@example.com",
          "hasHealthInsurance": true,
          "healthInsuranceId": "temp-12345",
          "healthMemberId": "ABC123456"
        }
      ],
      "defendants": []
    }
  }'

