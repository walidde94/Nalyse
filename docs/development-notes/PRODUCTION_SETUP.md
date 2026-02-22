# 🚀 Nalyse Production Deployment Guide (Free Tier)

This guide helps you move Nalyse from your laptop to the cloud so it runs 24/7 and is accessible from your phone anywhere.

## 1. Database: Set up Supabase (Free Forever)
1. Go to [Supabase](https://supabase.com/) and create a free account.
2. Create a new project called `nalyse-prod`.
3. Go to **Project Settings** > **Database**.
4. Copy the **Connection String** (URI format). It looks like:
   `postgresql://postgres:[YOUR-PASSWORD]@db.[REF].supabase.co:5432/postgres`
5. **Note this down** as `DATABASE_URL`.

## 2. GitHub: Push your code
1. Create a new private repository on GitHub called `nalyse`.
2. Push your current code to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Prepare for production"
   git remote add origin https://github.com/YOUR_USERNAME/nalyse.git
   git push -u origin main
   ```

## 3. Backend: Deploy to Render (Free)
1. Go to [Render](https://render.com/) and connect your GitHub.
2. Click **New** > **Web Service**.
3. Select your `nalyse` repository.
4. Settings:
   - **Root Directory:** `backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
5. Add **Environment Variables**:
   - `NODE_ENV`: `production`
   - `DATABASE_URL`: (Paste your Supabase URL from Step 1)
   - `JWT_SECRET`: (Generate a random string)
   - `FRONTEND_URL`: (You will get this after Step 4)

## 4. Frontend: Deploy to Vercel (Free)
1. Go to [Vercel](https://vercel.com/) and connect your GitHub.
2. Click **Add New** > **Project**.
3. Select the `nalyse` repository.
4. Settings:
   - **Root Directory:** `frontend`
   - **Framework Preset:** `Vite`
5. Add **Environment Variables**:
   - `VITE_API_URL`: (Your Render URL from Step 3, e.g., `https://nalyse-backend.onrender.com`)
6. Click **Deploy**.

## 5. Final Connection
Once Vercel gives you a URL (e.g., `https://nalyse-app.vercel.app`), go back to Render and update the `FRONTEND_URL` variable to match it.

---
**Your app will now be live on your phone via the Vercel URL!**
