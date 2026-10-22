# Vercel Deployment Guide

Since your project is a monorepo containing two separate folders (`frontend` and `express-backend`), the recommended deployment strategy is to create **two separate Vercel projects** connected to the same GitHub repository.

---

## Step 1: Push to GitHub
Make sure all your latest changes are pushed to your GitHub repository (`puitandysatyam/Hungry_Labs`).

---

## Step 2: Deploy the Backend
1. Go to your [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New > Project**.
2. Import your `Hungry_Labs` repository.
3. In the **Configure Project** screen:
   - **Project Name**: `hungry-labs-backend` (or similar)
   - **Framework Preset**: `Other` (Vercel will auto-detect the Node.js API)
   - **Root Directory**: Click "Edit" and select the `express-backend` folder!
4. Expand the **Environment Variables** section and configure all backend variables:
   - `DATABASE_URL`
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
   - `B2_APPLICATION_KEY_ID`
   - `B2_APPLICATION_KEY`
   - `B2_BUCKET_NAME`
   - `B2_ENDPOINT`
   - `JWT_SECRET`
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`
   - `RAZORPAY_WEBHOOK_SECRET` (The custom secret you set when creating the webhook in Razorpay dashboard)
   *(Note: You can skip `FRONTEND_URL` for now, we will add it after Step 3)*
5. Under **Settings > Deployment Protection**, ensure **Vercel Authentication** is turned **OFF** so public API requests are not blocked with a 302 redirect.
6. Click **Deploy**.
7. Once deployed, copy your backend URL (e.g., `https://hungry-labs-backend.vercel.app`).

---

## Step 3: Deploy the Frontend
1. Go back to your Vercel Dashboard and click **Add New > Project**.
2. Import the exact same `Hungry_Labs` repository again.
3. In the **Configure Project** screen:
   - **Project Name**: `hungry-labs-frontend`
   - **Framework Preset**: `Vite` (Vercel should auto-detect this)
   - **Root Directory**: Click "Edit" and select the `frontend` folder!
4. Expand the **Environment Variables** section and add:
   - `VITE_API_URL`: Paste the backend URL you copied in Step 2 (e.g., `https://hungry-labs-backend.vercel.app`).
   *(Note: `VITE_RAZORPAY_KEY_ID` is not required on the frontend as the key is securely fetched dynamically from `/api/orders/config`)*
5. Click **Deploy**.
6. Once deployed, copy your frontend URL (e.g., `https://hungry-labs-frontend.vercel.app`).

---

## Step 4: Link Backend & Frontend (CORS)
1. Go to your **Backend Project** in the Vercel Dashboard.
2. Navigate to **Settings > Environment Variables**.
3. Add a new variable named `FRONTEND_URL` and set its value to your frontend URL (e.g., `https://hungry-labs-frontend.vercel.app`).
4. Go to the **Deployments** tab and click **Redeploy** on your latest backend deployment so it picks up the updated environment variable.

---

That's it! Your Vue frontend and Express backend will now communicate seamlessly in production.
