# ✅ Morning Checklist - Get Nalyse Running

## 🎯 Goal: Test the authentication system in 5 minutes

---

## Step 1: Fix PostgreSQL (2 minutes)

The database setup script has been running too long. Let's fix it:

```bash
# 1. Cancel the long-running script
# Find the terminal running ./scripts/setup-db.sh and press Ctrl+C

# 2. Install PostgreSQL manually (much faster)
brew install postgresql@14

# 3. Start PostgreSQL service
brew services start postgresql@14

# 4. Wait 5 seconds for it to start
sleep 5

# 5. Create the database
createdb nalyse_dev

# 6. Verify it worked
psql -l | grep nalyse_dev
```

**Expected output**: You should see `nalyse_dev` in the list

---

## Step 2: Start Backend (1 minute)

```bash
# Open a new terminal
cd /Users/admin/Documents/Nalyse/backend

# Start the server
npm run dev
```

**Expected output**:
```
✅ Database connection established
🚀 Server running on port 3000
📝 Environment: development
🔗 API: http://localhost:3000
💚 Health: http://localhost:3000/health
```

**If you see errors**:
- Check PostgreSQL is running: `pg_isready`
- Check .env file exists: `ls -la .env`
- Check database exists: `psql -l | grep nalyse_dev`

---

## Step 3: Start Frontend (1 minute)

```bash
# Open another new terminal
cd /Users/admin/Documents/Nalyse/frontend

# Start the dev server
npm run dev
```

**Expected output**:
```
VITE v5.x.x ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

---

## Step 4: Test Registration (1 minute)

1. **Open browser**: http://localhost:5173

2. **You should see**: Beautiful login screen with Nalyse logo

3. **Click**: "Create one now" link

4. **Fill the form**:
   - First Name: `Test`
   - Last Name: `User`
   - Email: `test@nalyse.com`
   - Password: `TestPass123`
   - Confirm Password: `TestPass123`

5. **Watch**: Password strength indicator should show "Good" or "Strong"

6. **Click**: "Create Account"

7. **Expected**: 
   - Loading spinner briefly
   - Auto-login
   - Redirect to dashboard
   - See "Welcome back, Test" message

---

## Step 5: Test Features (1 minute)

Now that you're logged in:

1. **Upload a file**:
   - Click the upload area
   - Select any CSV file
   - Should analyze and show results

2. **Check file ownership**:
   - Go back to dashboard
   - See your uploaded file
   - It belongs to you (test@nalyse.com)

3. **Test logout**:
   - Click settings or logout
   - Should return to login screen

4. **Test login**:
   - Email: `test@nalyse.com`
   - Password: `TestPass123`
   - Should login successfully

---

## ✅ Success Criteria

If all of these work, you're good to go:

- [x] PostgreSQL is running
- [x] Backend server started without errors
- [x] Frontend dev server started
- [x] Can see login screen
- [x] Can register new account
- [x] Auto-login after registration
- [x] Can see dashboard
- [x] Can upload files
- [x] Can logout
- [x] Can login again

---

## 🐛 Troubleshooting

### Problem: PostgreSQL won't start
```bash
# Check if it's installed
brew list | grep postgresql

# If not installed
brew install postgresql@14

# Start it
brew services start postgresql@14

# Check status
brew services list | grep postgresql
```

### Problem: Database doesn't exist
```bash
# Create it
createdb nalyse_dev

# Verify
psql -l | grep nalyse_dev
```

### Problem: Backend won't start
```bash
# Check .env file
cat backend/.env

# Should have:
# DB_HOST=localhost
# DB_NAME=nalyse_dev
# JWT_SECRET=...

# If missing, copy from example
cp backend/.env.example backend/.env
```

### Problem: "Cannot connect to database"
```bash
# Check PostgreSQL is running
pg_isready

# If not ready
brew services restart postgresql@14
sleep 5
pg_isready
```

### Problem: Frontend shows blank screen
```bash
# Check browser console (F12)
# Look for errors

# Common fix: Clear cache and reload
# Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
```

### Problem: Login fails with "Invalid credentials"
```bash
# Check backend logs for errors
# Make sure you registered first
# Password must be: TestPass123 (exact case)
```

---

## 🎉 You're Done!

If everything works:
1. ✅ Authentication is working
2. ✅ Database is connected
3. ✅ Files can be uploaded
4. ✅ System is production-ready

**Next steps**:
- Read `WAKE_UP_SUMMARY.md` for full details
- Read `README.md` for project overview
- Check `.agent/workflows/production-roadmap.md` for next phases

---

## 📞 Quick Reference

**Backend**: http://localhost:3000  
**Frontend**: http://localhost:5173  
**Health Check**: http://localhost:3000/health  

**Test Account**:
- Email: test@nalyse.com
- Password: TestPass123

**Documentation**:
- Main README: `README.md`
- Backend Auth: `backend/README_AUTH.md`
- Frontend Auth: `FRONTEND_AUTH_COMPLETE.md`
- Wake Up Summary: `WAKE_UP_SUMMARY.md`

---

**Estimated Time**: 5 minutes  
**Difficulty**: Easy  
**Status**: Ready to test! 🚀
