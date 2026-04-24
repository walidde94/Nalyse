npm run build
node dist/src/index.js &
SERVER_PID=$!
sleep 5
TOKEN=$(npx ts-node test-api-token.ts)
curl -v -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/admin/organizations
kill $SERVER_PID
