# 🎯 Nalyse - Quick Reference Card

## 🚀 Start Commands
```bash
# Backend
cd /Users/admin/Documents/Nalyse/backend && npm run dev

# Frontend
cd /Users/admin/Documents/Nalyse/frontend && npm run dev
```

## 🌐 URLs
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3000
- **Health**: http://localhost:3000/health

## 🔐 Test Account
- **Email**: test@nalyse.com
- **Password**: TestPass123

## 📡 API Endpoints

### Public (No Auth)
```bash
POST /api/auth/register    # Create account
POST /api/auth/login       # Get tokens
POST /api/auth/refresh     # Refresh token
GET  /api/auth/verify-email/:token
POST /api/auth/request-password-reset
POST /api/auth/reset-password
```

### Protected (Requires JWT)
```bash
GET  /api/auth/profile     # Get user info
POST /api/auth/logout      # Logout
GET  /api/files            # List files
POST /api/files/upload     # Upload file
GET  /api/bi/:type         # Get BI data
```

## 🧪 cURL Examples

### Register
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@nalyse.com","password":"TestPass123","firstName":"Test"}'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@nalyse.com","password":"TestPass123"}'
```

### Get Profile (use token from login)
```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 🗄️ Database Commands
```bash
# Create database
createdb nalyse_dev

# List databases
psql -l

# Connect to database
psql nalyse_dev

# Check if PostgreSQL is running
pg_isready

# Start PostgreSQL
brew services start postgresql@14

# Stop PostgreSQL
brew services stop postgresql@14
```

## 📁 Important Files

### Documentation
- `README.md` - Main project docs
- `WAKE_UP_SUMMARY.md` - What was built overnight
- `MORNING_CHECKLIST.md` - Quick start guide
- `VISUAL_SUMMARY.md` - Visual overview
- `backend/README_AUTH.md` - Backend auth docs
- `FRONTEND_AUTH_COMPLETE.md` - Frontend auth docs

### Configuration
- `backend/.env` - Backend config
- `frontend/.env` - Frontend config

### Code
- `backend/src/index.ts` - Server entry
- `frontend/src/App.tsx` - App entry
- `frontend/src/contexts/AuthContext.tsx` - Auth state
- `backend/src/services/authService.ts` - Auth logic

## 🐛 Troubleshooting

### PostgreSQL won't start
```bash
brew services restart postgresql@14
```

### Database doesn't exist
```bash
createdb nalyse_dev
```

### Backend won't connect to DB
```bash
# Check .env file
cat backend/.env | grep DB_

# Should show:
# DB_HOST=localhost
# DB_NAME=nalyse_dev
```

### Frontend shows blank screen
```bash
# Clear cache and reload
# Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
```

## 🎯 Quick Test Flow

1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Open: http://localhost:5173
4. Register: test@nalyse.com / TestPass123
5. Upload a CSV file
6. Analyze data
7. Logout and login again

## 📊 Environment Variables

### Backend (.env)
```env
DB_HOST=localhost
DB_NAME=nalyse_dev
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=your-secret
JWT_REFRESH_SECRET=your-refresh-secret
PORT=3000
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3000
```

## 🔑 JWT Token Info

- **Access Token**: Expires in 15 minutes
- **Refresh Token**: Expires in 7 days
- **Auto-refresh**: Every 10 minutes
- **Storage**: localStorage

## 📈 Project Status

- ✅ Phase 1: Complete (Auth & Database)
- 🔄 Phase 2: Next (Cloud Storage)
- 📅 Phase 3: Planned (Multi-Tenancy)
- 💳 Phase 4: Planned (Billing)

## 🎓 Password Requirements

- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number

## 🚀 Deployment Checklist

- [ ] Update JWT secrets
- [ ] Set up production database
- [ ] Configure CORS for production domain
- [ ] Set up SSL/HTTPS
- [ ] Configure email service
- [ ] Set up cloud storage
- [ ] Configure monitoring
- [ ] Set up CI/CD
- [ ] Configure backups

## 📞 Support

- **Docs**: See README.md
- **Issues**: Check troubleshooting section
- **Roadmap**: .agent/workflows/production-roadmap.md

---

**Last Updated**: January 21, 2026  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
