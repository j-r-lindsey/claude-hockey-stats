# Free Tier Deployment Guide

This guide helps you deploy the Hockey Stats Tracker on Render's free tier, which has these limitations:
- 750 free instance hours per month
- Services "spin down" after 15 minutes of inactivity
- Only 1 web service to stay within limits

## Strategy: Single Service Deployment

Instead of separate frontend/backend services, we serve the React app as static files from the FastAPI backend.

## Option 1: Use render-free.yaml (Recommended)

1. **Rename render-free.yaml to render.yaml:**
   ```bash
   mv render-free.yaml render.yaml
   ```

2. **Create a new Web Service on Render:**
   - Connect your GitHub repository
   - Render will automatically detect the `render.yaml` file
   - Set your environment variables:
     - `SUPABASE_URL`
     - `SUPABASE_KEY` 
     - `SUPABASE_SERVICE_KEY`
     - `SECRET_KEY`

3. **Deploy:**
   - Render will build both frontend and backend
   - Copy React build files to backend/static/
   - Serve everything from one Python service

## Option 2: Manual Web Service

If the blueprint doesn't work, create manually:

1. **New Web Service:**
   - Runtime: Python
   - Build Command: 
     ```bash
     cd backend && pip install -r requirements.txt && cd ../frontend && npm ci && npm run build && cp -r dist/* ../backend/static/
     ```
   - Start Command:
     ```bash
     cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT
     ```

2. **Environment Variables:**
   - Add the same variables as above

## Benefits of This Approach:

✅ **Single service** - Uses only 1 of your free instances  
✅ **No CORS issues** - Frontend and backend on same domain  
✅ **Cost effective** - Maximizes your 750 free hours  
✅ **Simple deployment** - One service to manage  

## Development vs Production:

- **Development:** Run frontend (`npm run dev`) and backend (`python main.py`) separately
- **Production:** Single service serves both from `/backend/static/`

## Free Tier Considerations:

- Service will sleep after 15 minutes of inactivity
- First request after sleep will be slower (cold start)
- Perfect for demos, portfolios, and testing
- Consider upgrading for production use

## Alternative: Static Site Only

For even more cost savings, you could:
1. Deploy frontend as a Render Static Site (free)
2. Use a different backend service or serverless functions
3. But you'd need to modify the backend architecture