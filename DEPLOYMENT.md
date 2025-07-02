# Deployment Guide for Render.com

This guide will help you deploy the Hockey Stats Tracker application on Render.com.

## Prerequisites

1. **GitHub Repository**: Push your code to a GitHub repository
2. **Render.com Account**: Sign up at [render.com](https://render.com)
3. **Supabase Project**: Your existing Supabase database setup

## Option 1: Deploy using render.yaml (Recommended)

### Step 1: Prepare Environment Variables

Before deploying, gather these values from your Supabase project:

1. Go to your Supabase dashboard
2. Navigate to Settings > API
3. Copy the following values:
   - Project URL (`SUPABASE_URL`)
   - Project API Keys > anon public (`SUPABASE_KEY`)
   - Project API Keys > service_role (`SUPABASE_SERVICE_KEY`)

### Step 2: Generate JWT Secret

Generate a strong secret key for JWT tokens:
```bash
openssl rand -hex 32
```

### Step 3: Deploy to Render

1. **Connect Repository**:
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New" > "Blueprint"
   - Connect your GitHub repository
   - Select the repository containing your Hockey Stats app

2. **Configure Environment Variables**:
   
   The `render.yaml` file will automatically create two services, but you need to set environment variables:

   **For the Backend Service (hockey-stats-backend)**:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_KEY`: Your Supabase anon key
   - `SUPABASE_SERVICE_KEY`: Your Supabase service role key
   - `SECRET_KEY`: The JWT secret you generated

3. **Deploy**:
   - Render will automatically deploy both frontend and backend
   - The frontend will automatically get the backend URL via `VITE_API_URL`

## Option 2: Manual Deployment

### Deploy Backend (Web Service)

1. **Create New Web Service**:
   - Service Type: Web Service
   - Connect your repository
   - Root Directory: `backend`
   - Environment: Python
   - Python Version: 3.11

2. **Build & Start Commands**:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

3. **Environment Variables**:
   Add the same environment variables as listed above.

### Deploy Frontend (Static Site)

1. **Create New Static Site**:
   - Service Type: Static Site
   - Connect your repository
   - Root Directory: `frontend`
   - Environment: Node

2. **Build Settings**:
   - Build Command: `npm ci && npm run build`
   - Publish Directory: `dist`

3. **Environment Variables**:
   - `VITE_API_URL`: Set this to your backend service URL (e.g., `https://your-backend.onrender.com`)

## Database Setup

Your Supabase database should already be configured from local development. Make sure:

1. **Row Level Security**: 
   - Run the migration script `database/update_team_stats_schema.sql` in Supabase SQL Editor
   - Ensure RLS is properly configured or disabled as per your current setup

2. **Tables**: Verify all tables exist:
   - `users`
   - `games` 
   - `player_stats`
   - `team_stats`

## Post-Deployment

### Verify Deployment

1. **Backend Health Check**:
   - Visit `https://your-backend.onrender.com/docs`
   - You should see the FastAPI documentation

2. **Frontend**:
   - Visit your frontend URL
   - Try registering a new account
   - Test adding a game with a Hockey Reference URL

### Troubleshooting

**Common Issues**:

1. **CORS Errors**:
   - Ensure your backend CORS settings include your frontend URL
   - Check `main.py` CORS origins

2. **Database Connection**:
   - Verify all Supabase environment variables are correct
   - Check Supabase logs for connection issues

3. **Build Failures**:
   - Check build logs in Render dashboard
   - Ensure all dependencies are in requirements.txt

## Environment Variables Reference

### Backend Environment Variables
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key
SECRET_KEY=your_jwt_secret_32_chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

### Frontend Environment Variables
```
VITE_API_URL=https://your-backend.onrender.com
```

## Security Notes

- Never commit `.env` files to your repository
- Use Render's environment variable settings for sensitive data
- Rotate your JWT secret key periodically
- Monitor your Supabase usage and set up appropriate rate limiting

## Scaling

Render's starter plan should be sufficient for initial usage. Monitor your application and upgrade plans as needed based on:
- Request volume
- Database connections
- Storage requirements

Your application should now be live and accessible via the URLs provided by Render!