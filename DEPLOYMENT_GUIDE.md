# MedCenter HIS - Deployment Guide
## Complete Instructions for All Platforms

---

## Prerequisites

Before deploying, ensure:
- Node.js >= 20.0.0 installed
- npm or yarn package manager
- Required environment variables configured
- Firebase service account configured (for backend services)
- Supabase credentials configured (if using database sync)

---

## 1. Quick Start (Local Development)

### Development Server
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```
- Development server runs on `http://localhost:3000`
- Hot module replacement enabled
- Vite middleware provides fast rebuilds

### Production Build (Local)
```bash
# Build production assets
npm run build

# Start production server
npm start
```

---

## 2. Vercel Deployment (Recommended)

Vercel provides the easiest deployment with automatic CI/CD.

### Option A: GitHub Integration (Automatic)

1. **Connect Repository**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Select your GitHub repository
   - Vercel auto-detects this is a Node.js + React app

2. **Configure Environment Variables**
   - In Vercel dashboard, go to Settings → Environment Variables
   - Add all variables from `.env.example`:
     ```
     FIREBASE_SERVICE_ACCOUNT=<your-firebase-json>
     GEMINI_API_KEY=<your-api-key>
     VITE_GOOGLE_CLIENT_ID=<your-google-oauth-id>
     VITE_SUPABASE_URL=<your-supabase-url>
     SUPABASE_SERVICE_ROLE_KEY=<your-supabase-key>
     ```

3. **Deploy**
   - Push to GitHub
   - Vercel automatically builds and deploys
   - View deployment at `https://your-project.vercel.app`

### Option B: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod

# Set environment variables
vercel env add FIREBASE_SERVICE_ACCOUNT
vercel env add GEMINI_API_KEY
# ... add others
```

### Option C: Manual Deployment

```bash
# Build locally
npm run build

# Deploy dist folder to Vercel
vercel deploy --prod dist/

# Or use Vercel's git integration:
git push origin main  # Automatic deployment
```

---

## 3. Google Cloud Run Deployment

### Using gcloud CLI

```bash
# Set project
gcloud config set project YOUR_PROJECT_ID

# Build Docker image
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/medcenter

# Deploy to Cloud Run
gcloud run deploy medcenter \
  --image gcr.io/YOUR_PROJECT_ID/medcenter \
  --platform managed \
  --region us-central1 \
  --port 3000 \
  --memory 512Mi \
  --cpu 1 \
  --timeout 900
```

### Docker Dockerfile (Create in root)

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production && npm run build

# Copy built files
COPY . .

# Expose port
EXPOSE 3000

# Start server
CMD ["npm", "start"]
```

### Deploy with Dockerfile

```bash
# Build image
docker build -t medcenter:latest .

# Test locally
docker run -p 3000:3000 medcenter:latest

# Push to Google Cloud
docker tag medcenter:latest gcr.io/YOUR_PROJECT_ID/medcenter:latest
docker push gcr.io/YOUR_PROJECT_ID/medcenter:latest
```

---

## 4. AWS Deployment

### EC2 Instance

```bash
# SSH into EC2 instance
ssh -i your-key.pem ec2-user@your-instance.amazonaws.com

# Install Node.js
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# Clone repository
git clone https://github.com/alwaliabdlelah7-lang/MedCenter.git
cd MedCenter

# Install and build
npm install
npm run build

# Install PM2 for process management
npm install -g pm2

# Start application
pm2 start dist/server.cjs --name medcenter
pm2 save
pm2 startup

# Setup Nginx reverse proxy (optional)
sudo amazon-linux-extras install -y nginx
# Configure nginx.conf to proxy to localhost:3000
sudo systemctl start nginx
```

### Elastic Beanstalk

```bash
# Install EB CLI
pip install awsebcli

# Initialize
eb init -p "Node.js 20" medcenter

# Create environment
eb create medcenter-env

# Deploy
eb deploy
```

---

## 5. Heroku Deployment

```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create medcenter-app

# Add buildpack (if needed)
heroku buildpacks:add heroku/nodejs

# Set environment variables
heroku config:set FIREBASE_SERVICE_ACCOUNT="your-json"
heroku config:set GEMINI_API_KEY="your-key"
# ... set others

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

---

## 6. Docker Compose (Self-Hosted)

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  medcenter:
    build: .
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      FIREBASE_SERVICE_ACCOUNT: ${FIREBASE_SERVICE_ACCOUNT}
      GEMINI_API_KEY: ${GEMINI_API_KEY}
      VITE_SUPABASE_URL: ${VITE_SUPABASE_URL}
      SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY}
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Optional: Nginx reverse proxy
  nginx:
    image: nginx:latest
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - medcenter
```

```bash
# Deploy
docker-compose up -d

# View logs
docker-compose logs -f medcenter
```

---

## 7. Traditional VPS/Server Deployment

### Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Create app directory
sudo mkdir -p /var/www/medcenter
cd /var/www/medcenter

# Clone repository
sudo git clone https://github.com/alwaliabdlelah7-lang/MedCenter.git .

# Install dependencies
sudo npm install --production
```

### Build and Run

```bash
# Build production assets
npm run build

# Start with PM2
pm2 start dist/server.cjs --name medcenter --instances max

# Setup auto-restart
pm2 startup
pm2 save

# View status
pm2 status
pm2 logs medcenter
```

### Nginx Configuration

Create `/etc/nginx/sites-available/medcenter`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /socket.io {
        proxy_pass http://localhost:3000/socket.io;
        proxy_http_version 1.1;
        proxy_buffering off;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/medcenter /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### SSL/HTTPS (Let's Encrypt)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot certonly --nginx -d your-domain.com

# Auto-renew
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

---

## 8. Environment Variables

### Required for Production

Create `.env` file in root (not in git):

```env
# Firebase Admin SDK
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"..."}

# Gemini AI
GEMINI_API_KEY=your-api-key-here

# Google OAuth
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com

# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional
NODE_ENV=production
PORT=3000
```

---

## 9. Health Check & Monitoring

### Health Endpoint
```bash
curl http://localhost:3000/health
# Returns: OK
```

### Monitoring Services

**PM2 Plus** (Free tier available)
```bash
pm2 plus
pm2 link <secret> <key>
```

**Datadog**
```bash
dd-agent/scripts/install.sh
```

**New Relic**
```bash
npm install --save newrelic
```

---

## 10. Database Backup & Restore

### Firebase Firestore

```bash
# Backup
gcloud firestore export gs://your-bucket/backups/$(date +%s)

# Restore
gcloud firestore import gs://your-bucket/backups/BACKUP_ID
```

### Supabase

```bash
# Using pg_dump
pg_dump -h db.YOUR_PROJECT.supabase.co \
  -U postgres -d postgres > backup.sql

# Restore
psql -h db.YOUR_PROJECT.supabase.co \
  -U postgres -d postgres < backup.sql
```

---

## 11. Scaling Considerations

### For High Traffic
- Use PM2 in cluster mode: `pm2 start dist/server.cjs -i max`
- Enable caching with Redis
- Use load balancer (Nginx, HAProxy)
- Implement database connection pooling
- Consider horizontal scaling

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: medcenter
spec:
  replicas: 3
  selector:
    matchLabels:
      app: medcenter
  template:
    metadata:
      labels:
        app: medcenter
    spec:
      containers:
      - name: medcenter
        image: gcr.io/your-project/medcenter:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        # ... add environment variables
        resources:
          requests:
            cpu: 250m
            memory: 512Mi
          limits:
            cpu: 500m
            memory: 1Gi
```

---

## 12. Troubleshooting

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Build Failures
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Memory Issues
```bash
# Check memory
free -h

# Run with memory limit
node --max-old-space-size=2048 dist/server.cjs
```

### Firebase Connection Issues
```bash
# Validate credentials
node -e "console.log(process.env.FIREBASE_SERVICE_ACCOUNT)"

# Test connectivity
curl http://localhost:3000/api-test
```

---

## 13. Post-Deployment Checklist

- [ ] Environment variables configured
- [ ] Health check endpoint responding
- [ ] Static assets loading correctly
- [ ] API routes accessible
- [ ] Socket.io connection working
- [ ] Database connections established
- [ ] Email notifications working
- [ ] User authentication functional
- [ ] All routes accessible
- [ ] Performance baseline measured
- [ ] Backup strategy implemented
- [ ] Monitoring configured
- [ ] SSL/HTTPS enabled
- [ ] CORS properly configured
- [ ] Logs centralized

---

## 14. Continuous Deployment (CI/CD)

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - run: npm run build
      - uses: vercel/action@master
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

---

## Summary

**Recommended Deployment Path:**
1. **For MVP/Testing**: Vercel (easiest, free tier available)
2. **For Production**: Cloud Run or EC2 (scalable, reliable)
3. **For Full Control**: Self-hosted VPS with Docker

All platforms listed above are production-ready for MedCenter HIS.

**For Questions**: Check the main README.md or contact support.

---

*Last Updated: June 6, 2026*
