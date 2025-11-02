# K-pop Anime Shop - Zerops.io Deployment Guide

## Overview

This guide will help you deploy the K-pop Anime Shop backend API to Zerops.io.

---

## Prerequisites

- ✅ Zerops.io account created
- ✅ Zerops CLI installed and logged in
- ✅ Firebase project configured (`kpopanimeshop`)
- ✅ Firebase database seeded with K-pop/anime data
- ✅ Frontend deployed to Hostinger (www.kpopanimeshop.com)

---

## Step 1: Add Domains to Firebase Authorized Domains

Before deploying, add your domains to Firebase so authentication works:

1. Go to Firebase Console: https://console.firebase.google.com/project/kpopanimeshop/authentication/settings

2. Scroll to "Authorized domains"

3. Click "Add domain" and add each of these:
   ```
   kpopanimeshop.com
   www.kpopanimeshop.com
   kpopanime.shop
   www.kpopanime.shop
   ```

4. **After deploying to Zerops**, also add your Zerops domain:
   ```
   api-kpopanimeshop.app.zerops.io
   (or whatever your Zerops assigns)
   ```

---

## Step 2: Prepare Firebase Credentials for Zerops

Extract the private key from `serviceAccountKey.json`:

```bash
# On Windows (PowerShell):
Get-Content serviceAccountKey.json | Select-String "private_key" | ForEach-Object { $_.ToString() }

# On Linux/Mac:
cat serviceAccountKey.json | grep "private_key"
```

You'll need these values:
- `project_id` → FIREBASE_PROJECT_ID
- `client_email` → FIREBASE_CLIENT_EMAIL
- `private_key` → FIREBASE_PRIVATE_KEY (keep the \n escape sequences)

---

## Step 3: Create Zerops Project

### Option A: Using Zerops Web UI

1. Go to https://app.zerops.io

2. Click "Create New Project"

3. Import project using `backend/zerops-project.yml`:
   - Upload the file or paste its contents
   - Project name: `kpopanimeshop`
   - Service: `api` (Node.js 20)

### Option B: Using Zerops CLI

```bash
cd backend
zcli project import zerops-project.yml
```

---

## Step 4: Configure Environment Variables in Zerops

Go to your project → Service `api` → Environment Variables

Add these variables (mark secrets as "Secret"):

### Required Variables

```env
# Server
NODE_ENV=production
PORT=5000

# URLs (update after deployment)
FRONTEND_URL=https://www.kpopanimeshop.com
API_URL=https://api-kpopanimeshop.app.zerops.io

# Firebase (from serviceAccountKey.json)
FIREBASE_PROJECT_ID=kpopanimeshop
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@kpopanimeshop.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=<paste the entire private_key value including -----BEGIN PRIVATE KEY----- and \n>

# JWT (generate a secure random string)
JWT_SECRET=<generate-with: openssl rand -base64 32>
JWT_EXPIRE=7d

# Admin
ADMIN_EMAIL=admin@kpopanimeshop.com
ADMIN_PASSWORD=<your-secure-password>

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads
```

### Optional Variables

```env
# Printful (if using print-on-demand)
PRINTFUL_API_KEY=<your-printful-key>
```

**IMPORTANT**: Mark these as "Secret" in Zerops:
- FIREBASE_PRIVATE_KEY
- JWT_SECRET
- ADMIN_PASSWORD
- PRINTFUL_API_KEY

---

## Step 5: Deploy to Zerops

### Option A: Deploy from Local Machine

```bash
# From the backend directory
cd backend

# Deploy using Zerops CLI
zcli push
```

### Option B: Deploy from Git (Recommended for CI/CD)

1. Push your code to GitHub/GitLab

2. In Zerops dashboard:
   - Go to your `api` service
   - Click "Git Integration"
   - Connect your repository
   - Select branch (e.g., `main`)
   - Set build path to `backend/`
   - Enable auto-deploy on push

3. Trigger deployment:
   - Push to your repository
   - Zerops will automatically build and deploy

---

## Step 6: Verify Deployment

After deployment completes:

1. **Check Health Endpoint**:
   ```bash
   curl https://<your-zerops-url>/api/health
   ```

   Expected response:
   ```json
   {
     "status": "ok",
     "timestamp": "2025-11-02T...",
     "uptime": 123.456,
     "environment": "production"
   }
   ```

2. **Test API Endpoints**:
   ```bash
   # Get categories
   curl https://<your-zerops-url>/api/categories

   # Get products
   curl https://<your-zerops-url>/api/products

   # Get blog posts
   curl https://<your-zerops-url>/api/blog
   ```

3. **Check Logs**:
   ```bash
   zcli service log api
   ```

   You should see:
   ```
   ✓ Firestore connection established
   🎌 Server running on port 5000
   🎌 Environment: production
   ```

---

## Step 7: Configure Custom Domain (Optional)

If you want `api.kpopanimeshop.com` instead of the Zerops subdomain:

1. In Zerops dashboard:
   - Go to `api` service → Domains
   - Click "Add Custom Domain"
   - Enter: `api.kpopanimeshop.com`

2. Add DNS record in your domain provider:
   ```
   Type: CNAME
   Name: api
   Value: <your-zerops-cname-from-dashboard>
   TTL: 3600
   ```

3. Wait for DNS propagation (5-30 minutes)

4. Update environment variables:
   - API_URL → `https://api.kpopanimeshop.com`

5. Add to Firebase Authorized Domains:
   - `api.kpopanimeshop.com`

---

## Step 8: Update Frontend to Use Backend API

Your frontend on Hostinger needs to know where the backend is:

1. Find where API endpoints are configured in your frontend code

2. Update to point to your Zerops URL:
   ```javascript
   const API_URL = 'https://api-kpopanimeshop.app.zerops.io/api';
   // or if using custom domain:
   const API_URL = 'https://api.kpopanimeshop.com/api';
   ```

3. Re-upload frontend to Hostinger

---

## Troubleshooting

### CORS Errors

If you see CORS errors in browser console:

1. Check that your frontend URL is in the `allowedOrigins` in `server.js`
2. Verify FRONTEND_URL environment variable in Zerops
3. Check browser console for the exact origin being blocked

### Firebase Connection Errors

```bash
# Check if Firebase credentials are set correctly
zcli service log api | grep "Firebase"

# Should see:
✓ Firestore connection established
```

If connection fails:
- Verify FIREBASE_PRIVATE_KEY includes the full key with `-----BEGIN PRIVATE KEY-----`
- Check that `\n` escape sequences are preserved
- Ensure `serviceAccountKey.json` is in deployFiles

### 404 on API Routes

If API routes return 404:
- Check that the service is running: `zcli service ls`
- Verify PORT is set to 5000
- Check logs for startup errors

### Memory or Performance Issues

If service is slow or crashing:
- Upgrade Zerops service tier (more RAM/CPU)
- Check for memory leaks in logs
- Monitor usage in Zerops dashboard

---

## Deployment Checklist

Before going live:

- [ ] Firebase Authorized Domains updated with all production domains
- [ ] All environment variables set in Zerops (especially secrets)
- [ ] serviceAccountKey.json is in backend root
- [ ] CORS configured for production domains
- [ ] API health check returns 200 OK
- [ ] Test all major endpoints (categories, products, blog, auth)
- [ ] Frontend updated to use production API URL
- [ ] SSL/HTTPS working correctly
- [ ] Monitoring and logging configured
- [ ] Backup strategy in place (Firebase exports)

---

## Useful Commands

```bash
# View logs
zcli service log api

# View service status
zcli service ls

# View environment variables
zcli service env-var list api

# Update environment variable
zcli service env-var set api JWT_SECRET=<new-value>

# Restart service
zcli service restart api

# View build history
zcli service build ls api

# Connect to service shell (for debugging)
zcli service exec api
```

---

## Continuous Deployment

For automatic deployments when you push code:

1. **Set up Git Integration** in Zerops dashboard

2. **Create GitHub Actions workflow** (optional):
   ```yaml
   # .github/workflows/deploy.yml
   name: Deploy to Zerops
   on:
     push:
       branches: [main]

   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - name: Deploy to Zerops
           env:
             ZEROPS_TOKEN: ${{ secrets.ZEROPS_TOKEN }}
           run: |
             npm install -g @zerops/zcli
             zcli push
   ```

3. **Push to trigger deployment**:
   ```bash
   git add .
   git commit -m "Update backend"
   git push origin main
   ```

---

## Production Best Practices

1. **Environment Secrets**:
   - Never commit `.env` or `serviceAccountKey.json` to git
   - Use Zerops secrets for sensitive data
   - Rotate JWT_SECRET and Firebase keys periodically

2. **Monitoring**:
   - Set up Zerops monitoring alerts
   - Monitor Firebase usage and quotas
   - Track API response times

3. **Backups**:
   - Regular Firestore exports (automated via Firebase)
   - Backup environment variable configuration
   - Document deployment process

4. **Security**:
   - Review Firestore security rules before launch
   - Enable rate limiting (already configured)
   - Use HTTPS only
   - Keep dependencies updated

---

## Cost Optimization

Zerops pricing tips:
- Start with smallest tier, scale up as needed
- Use auto-scaling for traffic spikes
- Monitor resource usage in dashboard
- Optimize Firebase reads/writes to reduce costs

Firebase free tier includes:
- 50K reads/day
- 20K writes/day
- 20K deletes/day
- 1GB storage

---

## Next Steps After Deployment

1. Test all functionality with production data
2. Set up monitoring and alerts
3. Configure backups and disaster recovery
4. Implement analytics (Google Analytics, Mixpanel, etc.)
5. Set up error tracking (Sentry, Rollbar, etc.)
6. Performance optimization based on real usage
7. SEO optimization for product pages
8. Set up automated testing in CI/CD

---

## Support and Resources

- **Zerops Docs**: https://docs.zerops.io
- **Zerops Discord**: https://discord.gg/zerops
- **Firebase Docs**: https://firebase.google.com/docs
- **Node.js Best Practices**: https://github.com/goldbergyoni/nodebestpractices

---

**Last Updated**: 2025-11-02
**Version**: 1.0.0
