# 🚀 Deployment Guide - Entrenate.net

This guide will help you deploy both the frontend and backend to production.

## 📋 Prerequisites

1. ✅ **Go Backend working** with JWKS authentication
2. ✅ **React Frontend** with Supabase integration
3. ✅ **Supabase database** configured
4. ✅ **Google OAuth** configured in Supabase

## 🔧 Backend Deployment (Railway)

### 1. Create a Railway account

- Go to [railway.app](https://railway.app)
- Connect your GitHub account

### 2. Deploy the Backend

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Deploy from the project root directory
railway up
```

### 3. Configure Environment Variables in Railway

In the Railway dashboard, configure:

```env
PORT=3210
SUPABASE_DB_URL=postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres
SUPABASE_URL=https://PROJECT.supabase.co
SUPABASE_ANON_KEY=your_publishable_key_here
GO_VERSION=1.21
CORS_ALLOWED_ORIGINS=http://localhost:3210,http://localhost:5173,https://entrenate.net,https://www.entrenate.net
```

### 4. Configure Custom Domain (Optional)

- In Railway dashboard → Settings → Domains
- Add your custom domain (e.g., `api.entrenate.net`)

---

## 🌐 Frontend Deployment (Vercel)

### 1. Create a Vercel account

- Go to [vercel.com](https://vercel.com)
- Connect your GitHub account

### 2. Deploy the Frontend

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Deploy from the frontend directory
cd frontend
vercel --prod
```

### 3. Configure Environment Variables in Vercel

In the Vercel dashboard → Settings → Environment Variables:

```env
VITE_SUPABASE_URL=https://PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your_publishable_key_here
VITE_API_BASE_URL=https://entrenate-backend.up.railway.app
```

### 4. Configure Custom Domain (Optional)

- In Vercel dashboard → Settings → Domains
- Add your custom domain (e.g., `www.entrenate.net`)

---

## 🔐 Google OAuth Production Setup

### 1. Configure OAuth in Google Cloud Console

```text
1. Go to Google Cloud Console → APIs & Services → Credentials
2. Edit your OAuth 2.0 Client ID
3. Add authorized redirect URIs:
   - https://PROJECT.supabase.co/auth/v1/callback
   - https://www.entrenate.net
```

### 2. Update Supabase

```text
1. Supabase Dashboard → Authentication → Providers → Google
2. Verify that the Client ID and Secret are correct
3. Add your production domain to "Site URL": https://www.entrenate.net
```

---

## 🧪 Production Testing

### 1. Backend Health Check

```bash
curl https://entrenate-backend.up.railway.app/api/health
```

### 2. Frontend

- Visit https://www.entrenate.net
- Test Google OAuth
- Verify connection with the backend

---

## 📊 Monitoring and Logs

### Railway (Backend)

- Dashboard → Deployments → Logs
- Automatic monitoring included
- Health checks configured

### Vercel (Frontend)

- Dashboard → Functions → Logs
- Automatic analytics included
- Performance monitoring

---

## 🔄 Automatic CI/CD

### Automatic Configuration

- **Railway**: Automatic deploy on push to `main`
- **Vercel**: Automatic deploy on push to `main`
- **Preview**: Branches automatically create previews

### Environment Variables

```env
# Production
VITE_API_BASE_URL=https://entrenate-backend.up.railway.app

# Development
VITE_API_BASE_URL=http://localhost:3210/api
```

---

## ⚡ Performance Optimizations

### Backend (Railway)

- **Auto-scaling**: Configured automatically
- **Health checks**: Configured in `railway.toml`
- **Resource limits**: Adjust according to usage
- **Docker optimization**: Multi-stage build

### Frontend (Vercel)

- **Edge Network**: Automatic global CDN
- **Image optimization**: Enabled by default
- **Code splitting**: Configured with Vite
- **Bundle analysis**: Automatic optimization

---

## 🆘 Troubleshooting

### Common Errors

**❌ CORS Error**

```go
// In backend/main.go, verify:
c.AllowedOrigins = []string{
    "http://localhost:5173",
    "https://entrenate.net",
    "https://www.entrenate.net"
}
```

**❌ 404 on routes**

```json
// In frontend/vercel.json
"rewrites": [
  { "source": "/(.*)", "destination": "/index.html" }
]
```

**❌ Environment variables**

```bash
# Verify that the variables are configured:
vercel env ls
railway variables
```

**❌ Railway deployment issues**

```bash
# Verify build logs
railway logs

# Verify service status
railway status
```

---

## 🎯 Production URLs (Current)

```text
Frontend: https://www.entrenate.net
Backend:  https://entrenate-backend.up.railway.app/
API:      https://entrenate-backend.up.railway.app/api/health
```

## 📁 Important File Structure

```text
├── railway.toml              # Railway Configuration
├── backend/
│   ├── Dockerfile            # Backend build
│   ├── main.go               # Go server
│   └── nginx.conf            # nginx configuration (optional)
└── frontend/
    ├── vercel.json           # Vercel Configuration
    └── src/lib/api.ts        # API Client
```

With this, you will have your Entrenate.net app completely deployed in production! 🚀
