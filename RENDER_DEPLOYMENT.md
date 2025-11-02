# K-pop Anime Shop - Render.com Deployment Guide

## Overview

This guide will help you deploy the K-pop Anime Shop backend API to Render.com. Your frontend is already live on Hostinger at www.kpopanimeshop.com.

---

## Prerequisites

- ✅ Render.com account created
- ✅ Firebase project configured (`kpopanimeshop`)
- ✅ Firebase database seeded with K-pop/anime data
- ✅ Frontend deployed to Hostinger (www.kpopanimeshop.com)
- ✅ GitHub repository (optional, but recommended for auto-deploy)

---

## Step 1: Add Domains to Firebase Authorized Domains

Before deploying, ensure your domains are authorized in Firebase:

1. Go to Firebase Console: https://console.firebase.google.com/project/kpopanimeshop/authentication/settings

2. Scroll to "Authorized domains"

3. Verify these domains are added:
   ```
   kpopanimeshop.com
   www.kpopanimeshop.com
   kpopanime.shop
   www.kpopanime.shop
   localhost (for local development)
   ```

4. **After deploying to Render**, also add your Render domain:
   ```
   kpopanimeshop-api.onrender.com
   (or whatever Render assigns you)
   ```

---

## Step 2: Prepare Firebase Private Key

You'll need to set the Firebase private key as an environment variable in Render.

Extract the private key from your `serviceAccountKey.json`:

### On Windows (PowerShell):
```powershell
Get-Content serviceAccountKey.json | Select-String "private_key"
```

### On Linux/Mac:
```bash
cat serviceAccountKey.json | grep "private_key"
```

**IMPORTANT**: Copy the entire private key value including:
- `-----BEGIN PRIVATE KEY-----`
- The key content (with `\n` escape sequences)
- `-----END PRIVATE KEY-----`

Example:
```
"-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC/bMBH...\n-----END PRIVATE KEY-----\n"
```

---

## Step 3: Deploy to Render

### Option A: Deploy from GitHub (Recommended)

1. **Push your code to GitHub** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit for Render deployment"
   git branch -M main
   git remote add origin https://github.com/yourusername/kpopanimeshop.git
   git push -u origin main
   ```

2. **Go to Render Dashboard**:
   - Visit https://dashboard.render.com
   - Click "New +" → "Web Service"

3. **Connect your repository**:
   - Connect your GitHub account if not already connected
   - Select your `kpopanimeshop` repository
   - Click "Connect"

4. **Configure the service**:
   - **Name**: `kpopanimeshop-api`
   - **Region**: Choose closest to your users (e.g., Oregon)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm ci`
   - **Start Command**: `npm start`
   - **Plan**: Free (or paid if needed)

5. **Advanced Settings**:
   - **Health Check Path**: `/api/health`
   - **Auto-Deploy**: Enable (deploys automatically on git push)

### Option B: Deploy from Local Files

1. Go to https://dashboard.render.com

2. Click "New +" → "Web Service"

3. Choose "Deploy an existing image from a registry" or "Public Git repository"

4. If deploying without Git:
   - You'll need to use Render's Blueprint feature with the `render.yaml` file
   - Upload via Render dashboard

---

## Step 4: Configure Environment Variables

In Render dashboard, go to your service → "Environment" tab.

Add these environment variables:

### Required Variables

```env
NODE_ENV=production
PORT=5000

# Frontend URL (for CORS)
FRONTEND_URL=https://www.kpopanimeshop.com

# API URL (will be your Render URL)
API_URL=https://kpopanimeshop-api.onrender.com

# Firebase Configuration
FIREBASE_PROJECT_ID=kpopanimeshop
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@kpopanimeshop.iam.gserviceaccount.com

# Firebase Private Key (paste the ENTIRE key from serviceAccountKey.json)
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC/bMBHYaixPxVb\nS2VDyCykwGTriqHOBdkpV6VvRAKPK/RZnZwwQ0a8Jm6KIcDOyhwN+CglxxBDoJzv\nGRhHSW/E5O1NinQ70L27LTVs0yisY+g5XlwTqTe8BqC2uR1oPrMMgHZ9odVMvT44\nAWpyFCTeuqQQamgFzFH+oi7gxpvyTlNt5S2nlOjNTzGVDa7v/R/uwipGXb0VN+2C\n75f5YnGI/Zl+DkMJAptopmRUnL7nd+/GFfbmhfQ0dl3Yvf+3463F/MCFWhZv/kmw\nKBmEVBZTlCyHMHuH/rQQQBJuCJmk/avlg58RPTGAB/GJJx0WY3mChA/UtrijcUzs\nqPFDhYWjAgMBAAECggEALey+WKHCYfu7ePKmsdNVepU54RSaax4WEogXhZEwd/7Y\nmaNpdF6/mqYxwOwGINZ2UpelsiKG8WKYI/jGTVv996PglsjPyAX1bvGSrrAeQvWZ\nIiJUPtdLKs4AQrY4qujX9fjf9JYd4VJJmhAk5IeWrOTkNZgBqtpxFYD9dCnSAhiD\n0V3TtIXvX4nVxOra5SGrUHmaECb/6tHWOlt7KQZbWdtf13ssV+Sudy07FxDn6me3\n4p1jIHwnBh9tS7IcpN26DNd4GrGyISNeeHeLZFO+I18qDwul7QtwIUD+LbvK5yM3\nq+Qr/gAijnCOeKFpAAk3A7sJospaCUXeCbGXgI35sQKBgQDzioklXRiMpiyrGYoI\naO0SN2w5dOcTzukU6X5vcV4WT6Sh/m5DX5ljsK2S38KJ1+BOjkLDaQmfVt8RA29d\nu/L9DpyphahVGYnseAt8NR+qsj/udF0mR6cbvpLqNhGXoheh1srpjA+RC+o0LxLZ\niYKWEXVikRe2py8ndiLl3ThcaQKBgQDJN7BrknlM+G9e6+oItSGZIrMlTHjbr7A2\nAV++nATfCePr19Lduq+Igvq4BPJzh4fU5C44lqclAjfIp6mT6r2RCe6r0AILRsRY\n27pnjHimdGsxYvQTiuxswPYHGxCkNmmZmMczq1+aYyo2iOyO8cYWb/cxP3QCmAuD\n/IeOON4AKwKBgQCL0z84h4G/xuygc7JPb8alDdMCDf9Z3RLvYbuoykMFtkZEh6rQ\n3cNYfCi7yeKMd7geAgmM3fKbXCoIP5uiCnXRGqGRpt5ltZr9fFLDxlBfFaYlBwQw\nJTVpdXouJErnbzX4QjUP781ELr4RpfFBmnSyKmXl6H3f7Y7iLi6NIPzp+QKBgQCI\nabay1vRhWDO4uFtLV/DVLo8hBD0TQoJFupy8Tm2G/9+C7ihIpd2GwLVUuBXeeM1/\naMplFs1t65kB8ZinbQbjI0apODWKi4llbGFs/fB1eIuLSbiK3y31dMPWgWTAzxq8\nRLUXtGD1+7CMlDs7lXFjmLiOrKPrdkSoUDVeF/N5TQKBgAotyR3K5CilRyxn+CBJ\nUiGfOCx71lY6lLZScaB+6NngSY8HAqogmmjqclQ3y3k+AijRwN2VcdRFlKJKgoRy\nag74e/YnS1cqJrWXyQN7cEiQLFo07Rh9tohhZIP+Y2AhzxP31q81MpjaQm0tZaLH\nOX2AUmt5VJEyFAnsZEWoxbHl\n-----END PRIVATE KEY-----\n

# JWT Configuration (generate a secure random string)
JWT_SECRET=<generate-with-command-below>
JWT_EXPIRE=7d

# Admin User
ADMIN_EMAIL=admin@kpopanimeshop.com
ADMIN_PASSWORD=<your-secure-password>

# File Upload Settings
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads
```

### Generate JWT Secret

Run this command to generate a secure JWT secret:

**Windows (PowerShell)**:
```powershell
openssl rand -base64 32
```

**Linux/Mac**:
```bash
openssl rand -base64 32
```

Or use an online generator: https://www.grc.com/passwords.htm

### Optional Variables

```env
# Printful Integration (if using print-on-demand)
PRINTFUL_API_KEY=<your-printful-api-key>
```

---

## Step 5: Deploy and Verify

1. **Trigger deployment**:
   - If using GitHub: Render will auto-deploy when you push to main
   - If manual: Click "Manual Deploy" → "Deploy latest commit"

2. **Monitor deployment**:
   - Watch the build logs in Render dashboard
   - Look for successful build and start messages

3. **Check your service URL**:
   - Once deployed, Render will assign a URL like: `https://kpopanimeshop-api.onrender.com`
   - Copy this URL for the next steps

4. **Test the health endpoint**:
   ```bash
   curl https://kpopanimeshop-api.onrender.com/api/health
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

5. **Test API endpoints**:
   ```bash
   # Get categories
   curl https://kpopanimeshop-api.onrender.com/api/categories

   # Get products
   curl https://kpopanimeshop-api.onrender.com/api/products

   # Get blog posts
   curl https://kpopanimeshop-api.onrender.com/api/blog
   ```

---

## Step 6: Update Firebase Authorized Domains

Now that you have your Render URL, add it to Firebase:

1. Go to Firebase Console: https://console.firebase.google.com/project/kpopanimeshop/authentication/settings

2. Add your Render domain to "Authorized domains":
   ```
   kpopanimeshop-api.onrender.com
   ```

---

## Step 7: Update Frontend to Use Backend API

Your frontend on Hostinger needs to connect to the Render backend:

1. **Locate API configuration** in your frontend code (usually in a config file or at the top of JavaScript files)

2. **Update API endpoint**:
   ```javascript
   // Update this line in your frontend code
   const API_URL = 'https://kpopanimeshop-api.onrender.com/api';
   ```

3. **Re-upload to Hostinger**:
   - Upload the updated JavaScript files via FTP/File Manager
   - Clear browser cache and test

---

## Step 8: Create Firestore Indexes (If Not Done)

Your app needs composite indexes for certain queries. If you haven't created them yet:

### Products Index:
https://console.firebase.google.com/project/kpopanimeshop/firestore/indexes?create_composite=ClFwcm9qZWN0cy9rcG9wYW5pbWVzaG9wL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9wcm9kdWN0cy9pbmRleGVzL18QARoKCgZpc0FjdGl2ZRABGg0KCWNyZWF0ZWRBdBAC

### Blog Posts Index:
https://console.firebase.google.com/project/kpopanimeshop/firestore/indexes?create_composite=ClVwcm9qZWN0cy9rcG9wYW5pbWVzaG9wL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9ibG9nUG9zdHMvaW5kZXhlcy9fEAEaDgoKaXNQdWJsaXNoZWQQARoOCgpwdWJsaXNoZWRBdBAC

Click each link and click "Create Index". It takes a few minutes to build.

---

## Step 9: Configure Custom Domain (Optional)

If you want `api.kpopanimeshop.com` instead of the Render subdomain:

1. **In Render dashboard**:
   - Go to your service → "Settings" → "Custom Domain"
   - Click "Add Custom Domain"
   - Enter: `api.kpopanimeshop.com`
   - Render will provide you with DNS records to add

2. **Add DNS record** in your domain provider (where you registered kpopanimeshop.com):
   ```
   Type: CNAME
   Name: api
   Value: <the-cname-render-provides>
   TTL: 3600
   ```

3. **Wait for DNS propagation** (5-30 minutes)

4. **Update environment variables** in Render:
   - API_URL → `https://api.kpopanimeshop.com`

5. **Update Firebase Authorized Domains**:
   - Add `api.kpopanimeshop.com`

6. **Update frontend** to use custom domain:
   ```javascript
   const API_URL = 'https://api.kpopanimeshop.com/api';
   ```

---

## Troubleshooting

### CORS Errors

If you see CORS errors in browser console:

1. Check that FRONTEND_URL is set correctly in Render environment variables
2. Verify your frontend domain is in the allowedOrigins array in `backend/server.js`
3. Check browser DevTools Network tab for the exact origin being blocked

### Firebase Connection Errors

Check Render logs for Firebase connection issues:

1. Go to Render dashboard → Your service → "Logs"
2. Look for `✓ Firestore connection established`

If connection fails:
- Verify FIREBASE_PRIVATE_KEY is copied exactly (including `\n` escape sequences)
- Ensure all three Firebase variables are set (PROJECT_ID, CLIENT_EMAIL, PRIVATE_KEY)
- Check that serviceAccountKey.json is in the `backend/` directory

### 500 Internal Server Error

Check Render logs:
1. Go to Render dashboard → Your service → "Logs"
2. Look for error messages
3. Common issues:
   - Missing environment variables
   - Firebase authentication failure
   - Missing Firestore indexes

### Render Free Tier Limitations

Render's free tier has limitations:

- **Cold starts**: Service spins down after 15 minutes of inactivity
  - First request after spin-down may take 30-60 seconds
  - Consider upgrading to paid plan to avoid this

- **750 hours/month**: Should be enough for one service

- **Build minutes**: Free tier has limited build minutes
  - Cache dependencies to speed up builds

- **Bandwidth**: Limited free bandwidth
  - Monitor usage in Render dashboard

To reduce cold start impact:
- Consider using a service like UptimeRobot to ping your API every 10 minutes
- Or upgrade to a paid Render plan

---

## Deployment Checklist

Before going live:

- [ ] All environment variables set in Render dashboard
- [ ] Firebase Authorized Domains updated with Render URL
- [ ] Firestore composite indexes created
- [ ] API health check returns 200 OK
- [ ] Test all major endpoints (categories, products, blog, auth)
- [ ] Frontend updated to use Render API URL
- [ ] Frontend re-uploaded to Hostinger
- [ ] SSL/HTTPS working correctly
- [ ] CORS configured properly (test from frontend domain)
- [ ] Admin user can log in successfully

---

## Useful Render Commands & Features

### View Logs
- Go to your service in Render dashboard
- Click "Logs" tab
- View real-time logs

### Manual Deploy
- Go to your service
- Click "Manual Deploy" → "Deploy latest commit"

### Restart Service
- Go to your service → "Settings"
- Click "Restart Service"

### Environment Variables
- Go to your service → "Environment"
- Add/edit/delete variables
- Service auto-restarts after changes

### Shell Access
- Go to your service
- Click "Shell" tab
- Access your service's shell directly

---

## Auto-Deploy from GitHub

Render automatically deploys when you push to GitHub:

```bash
# Make changes to your code
git add .
git commit -m "Update backend API"
git push origin main

# Render will automatically:
# 1. Detect the push
# 2. Run npm ci
# 3. Run npm start
# 4. Deploy the new version
```

---

## Monitoring and Performance

### Built-in Monitoring
- Render provides basic metrics in dashboard:
  - CPU usage
  - Memory usage
  - Request count
  - Response times

### Set Up Alerts
1. Go to your service → "Settings" → "Notifications"
2. Add email for deployment notifications
3. Get notified of deploy successes/failures

### External Monitoring (Recommended)
- **UptimeRobot**: Monitor uptime and get alerts
- **Google Analytics**: Track frontend traffic
- **Firebase Console**: Monitor Firestore reads/writes

---

## Cost Optimization

### Render Free Tier
- 750 hours/month per service
- Limited build minutes
- Services spin down after 15 min inactivity
- Good for development/testing

### Render Paid Tiers
- Start at $7/month per service
- No cold starts (always on)
- More resources (RAM/CPU)
- Better for production

### Firebase Free Tier
- 50K reads/day
- 20K writes/day
- 1GB storage
- Upgrade to Blaze (pay-as-you-go) if needed

### Tips to Reduce Costs
1. Optimize Firestore queries (use indexes, limit results)
2. Cache frequently accessed data on frontend
3. Use Firebase Storage efficiently
4. Monitor Firebase usage in console

---

## Security Best Practices

1. **Environment Secrets**:
   - Never commit `.env` or `serviceAccountKey.json` to git
   - Use Render's environment variables for all secrets
   - Rotate JWT_SECRET and Firebase keys periodically

2. **Firestore Security Rules**:
   - Review and tighten Firestore rules before launch
   - Test rules thoroughly
   - Follow principle of least privilege

3. **HTTPS Only**:
   - Render provides free SSL certificates
   - Never use HTTP for API calls

4. **Rate Limiting**:
   - Already configured in your Express app
   - Monitor for abuse in logs

5. **Dependencies**:
   - Keep npm packages updated
   - Run `npm audit` regularly
   - Fix security vulnerabilities promptly

---

## Backup Strategy

1. **Firestore Backups**:
   - Enable scheduled exports in Firebase Console
   - Export to Google Cloud Storage
   - Keep 7-30 days of backups

2. **Code Backups**:
   - Git repository is your backup
   - Consider GitHub private repository
   - Tag releases: `git tag v1.0.0`

3. **Environment Variables**:
   - Document all environment variables
   - Keep a secure backup of credentials
   - Use a password manager for secrets

---

## Next Steps After Deployment

1. ✅ Test all functionality with production data
2. ✅ Set up monitoring and alerts
3. ✅ Configure backups
4. ✅ Implement analytics (Google Analytics)
5. ✅ Set up error tracking (optional: Sentry, Rollbar)
6. ✅ Performance optimization based on usage
7. ✅ SEO optimization for product pages
8. ✅ Consider CDN for static assets

---

## Support and Resources

- **Render Docs**: https://render.com/docs
- **Render Community**: https://community.render.com
- **Firebase Docs**: https://firebase.google.com/docs
- **Express.js Best Practices**: https://expressjs.com/en/advanced/best-practice-performance.html
- **Node.js Best Practices**: https://github.com/goldbergyoni/nodebestpractices

---

**Last Updated**: 2025-11-02
**Version**: 1.0.0
