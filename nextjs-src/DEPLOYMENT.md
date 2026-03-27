# GENPORT - Deployment Guide

Complete guide for deploying your GENPORT Next.js application to production.

## Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Database security rules are set
- [ ] Firebase Auth providers enabled
- [ ] API keys are valid and have required permissions
- [ ] Code tested locally with `npm run build`
- [ ] No console errors in browser dev tools
- [ ] No sensitive data in code or .env files

## Deployment Options

### 1. Vercel (Recommended - 5 minutes)

Vercel is the easiest option as it's made by the creators of Next.js.

#### Steps:

1. **Install Vercel CLI:**
```bash
npm install -g vercel
```

2. **Deploy:**
```bash
vercel
```

3. **Answer the prompts:**
   - Link to existing project or create new
   - Select framework: Next.js
   - Modify any settings if needed

4. **Add Environment Variables:**
   - Go to Vercel Dashboard
   - Select your project
   - Settings → Environment Variables
   - Add each variable:
     - `ANTHROPIC_API_KEY`
     - `NAVER_CLIENT_ID` (optional)
     - `NAVER_CLIENT_SECRET` (optional)

5. **Redeploy:**
```bash
vercel --prod
```

Your app is now live at the provided Vercel URL!

### 2. Docker (10 minutes)

Use Docker for any platform that supports containers.

#### Create Dockerfile:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy files
COPY package*.json ./
COPY . .

# Install dependencies
RUN npm ci

# Build
RUN npm run build

# Expose port
EXPOSE 3000

# Start
CMD ["npm", "start"]
```

#### Build and Run:

```bash
# Build image
docker build -t genport:latest .

# Run container
docker run \
  -p 3000:3000 \
  -e ANTHROPIC_API_KEY=your_key \
  -e NAVER_CLIENT_ID=your_id \
  -e NAVER_CLIENT_SECRET=your_secret \
  genport:latest
```

#### Push to Docker Hub:

```bash
docker tag genport:latest your-username/genport:latest
docker push your-username/genport:latest
```

### 3. AWS (EC2/ECS - 15 minutes)

#### Using EC2:

1. **Launch EC2 instance:**
   - Ubuntu 22.04 LTS
   - t3.small or larger
   - Allow HTTP (80) and HTTPS (443)

2. **Connect and setup:**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Clone your repository
git clone your-repo-url
cd your-repo

# Install and build
npm install
npm run build

# Install PM2 to manage process
sudo npm install -g pm2
pm2 start npm --name "genport" -- start
pm2 startup
pm2 save
```

3. **Setup domain and SSL:**
   - Point domain to EC2 IP
   - Use Let's Encrypt for free SSL

#### Using ECS (Docker):

1. **Push Docker image to ECR:**
```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

docker tag genport:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/genport:latest
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/genport:latest
```

2. **Create ECS cluster and service**
   - Use AWS Console or CLI
   - Configure load balancer
   - Set environment variables

### 4. Google Cloud Run (10 minutes)

1. **Build and push to Container Registry:**
```bash
# Enable Container Registry
gcloud services enable containerregistry.googleapis.com

# Build and push
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/genport
```

2. **Deploy:**
```bash
gcloud run deploy genport \
  --image gcr.io/YOUR_PROJECT_ID/genport \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars ANTHROPIC_API_KEY=your_key
```

### 5. Netlify (5 minutes)

1. **Connect GitHub repository:**
   - Go to netlify.com
   - Click "New site from Git"
   - Select GitHub and authorize
   - Choose your repository

2. **Configure build settings:**
   - Build command: `npm run build`
   - Publish directory: `.next`

3. **Add environment variables:**
   - Site settings → Environment
   - Add all required variables

4. **Deploy:**
   - Netlify automatically deploys on git push

### 6. Railway (5 minutes)

1. **Connect GitHub:**
   - Visit railway.app
   - Click "New Project"
   - Select "Deploy from GitHub repo"

2. **Configure:**
   - Add environment variables in dashboard
   - Railway auto-detects Next.js

3. **Deploy:**
   - Automatic deployment on git push

### 7. Heroku (Discontinued - Use Alternative)

Heroku free tier is no longer available. Use Vercel, Railway, or Render instead.

---

## Post-Deployment

### 1. Test Your Deployment

```bash
# Test main routes
curl https://your-domain.com
curl https://your-domain.com/dashboard
curl https://your-domain.com/api/claude

# Check if auth works
# Visit site and try logging in
```

### 2. Setup Domain

- Point custom domain to deployment
- Update Firebase allowed domains
- Configure CORS if needed

### 3. Enable HTTPS

- Vercel: Automatic
- Docker/VPS: Use Let's Encrypt
- AWS/GCP: Use their certificate services

### 4. Monitor and Logs

**Vercel:**
- Go to Dashboard → Deployments
- View real-time logs
- Monitor analytics

**Docker/VPS:**
```bash
# Check logs
pm2 logs genport

# Monitor resources
htop
```

**AWS/GCP:**
- Use CloudWatch/Cloud Logging
- Set up alerts

### 5. Setup Analytics

1. **Google Analytics:**
   - Get tracking ID
   - Add to next.config.js or use library

2. **Sentry (Error Tracking):**
   - Create account at sentry.io
   - Install Sentry SDK
   - Track errors automatically

---

## Database Setup

### Firebase

1. **Create Firestore Database:**
   - Go to Firebase Console
   - Create database in test mode
   - Update security rules:

```firestore rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{uid} {
      allow read, write: if request.auth.uid == uid;
    }
    
    // Portfolios - users can only access their own
    match /portfolios/{document=**} {
      allow read, write: if request.auth.uid == resource.data.userId;
    }
  }
}
```

2. **Create Collections:**
   - Create "users" collection
   - Create "portfolios" collection

3. **Enable Auth Methods:**
   - Email/Password
   - Google OAuth

---

## Environment Variables for Production

```env
# Required
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxx

# Optional
NAVER_CLIENT_ID=your_naver_id
NAVER_CLIENT_SECRET=your_naver_secret

# Firebase is configured in code, but can be overridden:
# NEXT_PUBLIC_FIREBASE_API_KEY=
# NEXT_PUBLIC_FIREBASE_PROJECT_ID=
# etc.
```

**Important:** Use different API keys for development and production!

---

## Performance Optimization

### 1. Enable Caching

Add to next.config.js:
```javascript
{
  headers: async () => [
    {
      source: '/static/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
  ],
}
```

### 2. Database Indexing

Create Firestore indexes:
- Users by email
- Portfolios by userId + createdAt
- Portfolios by theme

### 3. API Rate Limiting

Add rate limiting middleware for `/api/` routes to prevent abuse.

### 4. CDN

Use a CDN like Cloudflare:
- Faster content delivery
- DDoS protection
- Analytics

---

## Monitoring and Maintenance

### Health Checks

1. **Setup uptime monitoring:**
   - Use UptimeRobot.com
   - Monitor: https://your-domain.com/api/claude
   - Get alerts if down

2. **Error tracking:**
   - Setup Sentry
   - Get notified of crashes
   - Track error frequency

3. **Database backups:**
   - Firebase auto-backs up daily
   - Download backups regularly
   - Test restore process

### Regular Maintenance

- [ ] Update dependencies monthly: `npm update`
- [ ] Check security advisories: `npm audit`
- [ ] Review Firebase usage and costs
- [ ] Monitor API rate limits
- [ ] Check disk space (if using VPS)

---

## Scaling

When you need to handle more users:

1. **Vercel:** Auto-scales automatically
2. **Docker:** Use Kubernetes (k8s)
3. **AWS:** Use Auto Scaling Groups
4. **Database:** Upgrade Firestore plan

---

## Troubleshooting Deployment

### "Cannot find module" Error
```bash
npm install
npm run build
```

### "Port already in use"
```bash
# Find and kill process
lsof -i :3000
kill -9 <PID>
```

### Slow Performance
- Check database indexes
- Enable caching headers
- Use CDN
- Upgrade instance size

### Firebase Errors
- Verify API key
- Check allowed domains
- Review security rules
- Check Firestore quota

### API Errors
- Verify environment variables
- Check API credentials
- Review rate limits
- Check error logs

---

## Security Checklist

- [ ] HTTPS/SSL enabled
- [ ] Environment variables not in code
- [ ] Firebase security rules configured
- [ ] CORS headers properly set
- [ ] Rate limiting implemented
- [ ] No sensitive data in logs
- [ ] Regular security audits
- [ ] Backup strategy in place

---

## Cost Estimation

| Service | Free Tier | Estimated Cost |
|---------|-----------|-----------------|
| Vercel | 100GB bandwidth | $20/mo if exceeded |
| Firebase | 1GB storage + 50k reads/day | $1-5/mo for small app |
| Anthropic | Pay per request | $1-20/mo depending on usage |
| Domain | - | $10-15/year |
| **Total** | - | **$30-50/mo** |

Costs vary based on usage. Start free with generous quotas.

---

## Getting Help

- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs/deployment
- Firebase Docs: https://firebase.google.com/docs
- Docker Docs: https://docs.docker.com/

---

Good luck with your deployment! 🚀
