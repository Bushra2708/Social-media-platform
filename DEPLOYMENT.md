# Deployment Guide

This project has two deploys:

- Backend: Render Web Service from `backend`
- Frontend: Vercel project from `frontend`

## 1. Prepare MongoDB

1. Create a MongoDB Atlas cluster.
2. Create a database user.
3. Allow network access from Render. For a simple student/demo deploy, allow `0.0.0.0/0`. For production, restrict this later.
4. Copy the MongoDB connection string and replace username, password, and database name.

## 2. Deploy Backend On Render

1. Push this repository to GitHub.
2. In Render, create a new **Web Service**.
3. Connect the GitHub repo.
4. Set the root directory to `backend`.
5. Use these settings:
   - Runtime: Node
   - Build Command: `npm install`
   - Start Command: `npm start`
6. Add environment variables:
   - `MONGO_URI`: your MongoDB Atlas connection string
   - `JWT_SECRET`: a long random secret
   - `CLIENT_URL`: your local frontend during development, for example `http://localhost:5173`
   - `FRONTEND_URL`: your final Vercel URL after frontend deploy
   - `CORS_ORIGIN`: optional comma-separated extra allowed origins
   - `CLOUDINARY_CLOUD_NAME`: optional, for Cloudinary uploads
   - `CLOUDINARY_API_KEY`: optional
   - `CLOUDINARY_API_SECRET`: optional
7. Deploy and copy the Render backend URL, for example:
   - `https://your-backend.onrender.com`

Backend health check:

```txt
https://your-backend.onrender.com/
```

It should return:

```json
{
  "success": true,
  "message": "Social Media API Running"
}
```

## 3. Deploy Frontend On Vercel

1. In Vercel, create a new project from the same GitHub repo.
2. Set the root directory to `frontend`.
3. Use these settings:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Add environment variables:
   - `VITE_API_URL`: `https://your-backend.onrender.com/api`
   - `VITE_SOCKET_URL`: `https://your-backend.onrender.com`
5. Deploy and copy the Vercel URL.

## 4. Update Backend After Frontend Deploy

After Vercel gives you the frontend URL, go back to Render and update:

```txt
FRONTEND_URL=https://your-frontend.vercel.app
```

If you use preview deployments on Vercel, add those URLs to `CORS_ORIGIN` as a comma-separated list:

```txt
CORS_ORIGIN=https://your-frontend.vercel.app,https://your-preview.vercel.app
```

Then redeploy the backend.

## 5. Code Changes You Must Remember After Deployment

You should not hard-code deployment URLs inside React or Express files. Use environment variables instead:

- Frontend API calls use `VITE_API_URL`.
- Frontend socket connection uses `VITE_SOCKET_URL`.
- Backend allowed frontend origins use `FRONTEND_URL`, `CLIENT_URL`, and `CORS_ORIGIN`.

If you change your Render backend URL later, update these in Vercel:

```txt
VITE_API_URL=https://new-backend-url.onrender.com/api
VITE_SOCKET_URL=https://new-backend-url.onrender.com
```

If you change your Vercel frontend URL later, update these in Render:

```txt
FRONTEND_URL=https://new-frontend-url.vercel.app
```

After changing Vercel environment variables, redeploy the frontend. After changing Render environment variables, redeploy the backend.

## 6. Local Development

Backend:

```bash
cd backend
copy .env.example .env
npm install
npm run dev
```

Frontend:

```bash
cd frontend
copy .env.example .env
npm install
npm run dev
```

Local frontend URL:

```txt
http://localhost:5173
```

Local backend URL:

```txt
http://localhost:5000
```
