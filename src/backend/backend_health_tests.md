T1: WORKS
curl -X POST "http://localhost:3000/trpc/waitlist.join" \
-H "Content-Type: application/json" \
-d '{"json":{"email":"test1@example.com","username":"testuser1","firstName":"John","lastName":"Doe","marketingOptIn":true}}'
T2: WORKS
curl -X POST http://localhost:3000/trpc/waitlist.join \
-H "Content-Type: application/json" \
-d '{
"json": {
"email": "friend@example.com",
"referralCode": "ABC12XYZ"
}
}'

T3: WORKS
curl -X POST http://localhost:3000/trpc/waitlist.join \
-H "Content-Type: application/json" \
-d '{
"json": {
"email": "friend@example.com",
"referralCode": "rsucReqQ"
}
}'
}

T4:WORKS
curl -X POST http://localhost:3000/trpc/waitlist.join \
-H "Content-Type: application/json" \
-d '{
"json": {
"email": "friend@example.com",
"referralCode": "rsucReqQ"
}
}'
}

T5: WORKS
curl -X POST http://localhost:3000/trpc/waitlist.validateReferralCode \
  -H "Content-Type: application/json" \
  -d '{"json":{"code":"ABC12XYZ"}}'

T6: WORKS
curl -X POST http://localhost:3000/trpc/waitlist.authenticateWithMagicLink \
  -H "Content-Type: application/json" \
  -d '{
    "json": {
      "token": "abc123def456789abcdef0123456789abcdef0123456789abcdef012345678"
    }
  }'

T7: WORKS
curl -X POST http://localhost:3000/trpc/waitlist.authenticateWithMagicLink \
  -H "Content-Type: application/json" \
  -d '{
    "json": {
      "token": "38f1ceb9f767b43c8d720819a9719b1bd2852d024615125874e2a50be7bf5877"
    }
  }'

T8: WORKING
curl -G "http://localhost:3000/trpc/waitlist.validateReferralCode" \
  --data-urlencode 'input={"json":{"code":"rsucReqQ"}}'

