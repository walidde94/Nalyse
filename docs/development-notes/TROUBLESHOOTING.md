# 🐛 Troubleshooting Guide - Advanced Analytics

## Issue: "Unexpected end of JSON input"

This error means the backend isn't responding with valid JSON. Here's how to fix it:

### Step 1: Restart Backend Server ⚠️ **MOST LIKELY FIX**

The backend needs to be restarted to pick up the new routes and controllers.

**In your terminal:**
1. Stop the backend server (Ctrl+C in the backend terminal)
2. Restart it: `cd backend && npm run dev`
3. Wait for "Server running on port 3001" message
4. Try the forecast again

### Step 2: Check Browser Console

Open browser console (F12) and look for these logs:
```
Sending forecast request: { dateColumn: "...", valueColumn: "...", dataLength: 500 }
Response status: 200
Response text: { "success": true, ... }
```

**If you see:**
- `Response status: 404` → Backend route not found (restart backend)
- `Response status: 500` → Backend error (check backend console)
- `Response text: <empty>` → Backend crashed (check backend console)

### Step 3: Check Backend Console

Look at the backend terminal for errors like:
```
Error: Cannot find module '../services/analysis/forecasting'
```

**If you see this:**
- The TypeScript files need to be compiled
- Run: `cd backend && npm run build`
- Then restart: `npm run dev`

### Step 4: Verify Files Exist

Check that these files exist:
```
backend/src/services/analysis/
├── forecasting.ts ✅
├── abTesting.ts ✅
├── regression.ts ✅
├── cohortAnalysis.ts ✅
└── funnelAnalysis.ts ✅

backend/src/controllers/
└── advancedAnalytics.ts ✅

backend/src/routes/
└── bi.ts ✅ (updated with new routes)
```

### Step 5: Test API Directly

Test the API endpoint directly using curl:

```bash
curl -X POST http://localhost:3001/api/bi/forecast \
  -H "Content-Type: application/json" \
  -d '{
    "dateColumn": "date",
    "valueColumn": "value",
    "periods": 7,
    "data": [
      {"date": "2024-01-01", "value": 100},
      {"date": "2024-01-02", "value": 110},
      {"date": "2024-01-03", "value": 105}
    ]
  }'
```

**Expected response:**
```json
{
  "success": true,
  "forecast": {
    "historical": [...],
    "forecast": [...],
    "metrics": {...}
  }
}
```

### Step 6: Common Issues & Fixes

#### Issue: Module not found
**Error:** `Cannot find module '../services/analysis/forecasting'`
**Fix:** 
```bash
cd backend
npm install
npm run build
npm run dev
```

#### Issue: TypeScript compilation error
**Error:** `TS2307: Cannot find module`
**Fix:**
```bash
cd backend
rm -rf dist
npm run build
```

#### Issue: Port already in use
**Error:** `EADDRINUSE: address already in use :::3001`
**Fix:**
```bash
# Find and kill the process
lsof -ti:3001 | xargs kill -9
# Then restart
npm run dev
```

#### Issue: CORS error
**Error:** `Access to fetch at '...' has been blocked by CORS policy`
**Fix:** Backend CORS is already configured, but verify in `backend/src/index.ts`

### Step 7: Quick Fix Checklist

- [ ] Backend server is running (`npm run dev` in backend folder)
- [ ] No errors in backend console
- [ ] Browser console shows the request being sent
- [ ] Response status is 200 (not 404 or 500)
- [ ] Response text is valid JSON

### Step 8: Nuclear Option (If Nothing Works)

```bash
# Stop both servers
# In backend terminal: Ctrl+C
# In frontend terminal: Ctrl+C

# Clean and rebuild backend
cd backend
rm -rf node_modules dist
npm install
npm run build
npm run dev

# In another terminal, restart frontend
cd frontend
npm run dev
```

---

## Expected Behavior

When working correctly, you should see:

1. **Browser Console:**
   ```
   Sending forecast request: {...}
   Response status: 200
   Response text: {"success":true,"forecast":{...}}
   ```

2. **Backend Console:**
   ```
   Forecast request received
   Generating forecast for 500 rows
   Forecast generated successfully
   ```

3. **UI:**
   - No error message
   - Forecast chart appears
   - Metrics show (Trend, Confidence, R², MAPE)

---

## Still Not Working?

If you've tried all the above and it's still not working:

1. **Check the exact error message** in browser console
2. **Check backend console** for any errors
3. **Share the console output** so I can help debug

The most common fix is simply **restarting the backend server**! 🔄
