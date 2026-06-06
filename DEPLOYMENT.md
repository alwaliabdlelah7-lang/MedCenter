# Deployment Guide

## Pre-Deployment Checklist

- [ ] Run `npm run lint` - TypeScript compilation passes
- [ ] Run `npm run test` - All tests pass
- [ ] Run `npm run build` - Production build succeeds
- [ ] Update version in package.json
- [ ] Review and update CHANGELOG.md
- [ ] Test on staging environment
- [ ] Security audit: `npm audit`

## Environment Variables

Required environment variables for deployment:

```env
# Firebase
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=xxx
VITE_FIREBASE_PROJECT_ID=xxx
VITE_FIREBASE_STORAGE_BUCKET=xxx
VITE_FIREBASE_MESSAGING_SENDER_ID=xxx
VITE_FIREBASE_APP_ID=xxx
FIREBASE_SERVICE_ACCOUNT=xxx (JSON stringified)

# Supabase
VITE_SUPABASE_URL=xxx
VITE_SUPABASE_ANON_KEY=xxx

# Gemini API
VITE_GEMINI_API_KEY=xxx

# Server
SERVER_PORT=3000
NODE_ENV=production
```

## Deployment Platforms

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# Set environment variables via dashboard
# or use vercel env command
```

### Docker

```bash
# Build image
docker build -t medcenter-his:latest .

# Run container
docker run -d -p 3000:3000 \
  -e VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY \
  medcenter-his:latest

# Docker Compose
docker-compose up -d
```

### Google Cloud Run

```bash
# Build and deploy
gcloud run deploy medcenter-his \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated

# Set environment variables
gcloud run services update medcenter-his \
  --update-env-vars KEY=value
```

### AWS

```bash
# Deploy to Elastic Beanstalk
eb init
eb create medcenter-his-env
eb deploy

# Or use Amplify
amplify init
amplify publish
```

## Build and Start

```bash
# Development
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Start production server
npm run start
```

## Health Checks

The application provides health check endpoints:

```bash
# Health status
curl http://localhost:3000/health

# Readiness check
curl http://localhost:3000/ready
```

## Monitoring and Logs

### Server Logs

Monitor application logs in production:

```bash
# Vercel
vercel logs

# Docker
docker logs container_id

# Cloud Run
gcloud run services describe medcenter-his
```

### Error Tracking

Errors are logged via errorService. For production monitoring:

1. Set up error tracking (Sentry, Rollbar, etc.)
2. Configure error reporting in errorService
3. Monitor critical errors via alerts

## Database Backups

### Firebase Firestore
- Backups handled by Firebase (automatic)
- Manual export via Firebase Console

### Supabase
- Automatic daily backups
- 30-day retention
- Manual backups available via dashboard

## Scaling

### Horizontal Scaling

For high traffic scenarios:

1. Deploy multiple instances
2. Use load balancer (nginx, HAProxy)
3. Ensure session management works across instances

### Vertical Scaling

Increase server resources for better performance:

1. Increase CPU and RAM allocation
2. Optimize database queries
3. Enable caching (Redis, CDN)

## Performance Optimization

### Bundle Optimization
- Tree shaking enabled
- Code splitting per feature
- Asset minification enabled

### API Optimization
- Request caching implemented
- Retry mechanism for failures
- Compression enabled

### Database Optimization
- Index on frequently queried fields
- Pagination for large datasets
- Real-time subscriptions for critical data

## Security Considerations

1. Keep dependencies updated: `npm audit fix`
2. Use HTTPS in production
3. Implement rate limiting
4. Validate all inputs server-side
5. Use environment variables for secrets
6. Enable CORS only for trusted origins
7. Set security headers (CSP, X-Frame-Options, etc.)
8. Regular security audits

## Rollback Procedures

### Vercel
```bash
vercel rollback
```

### Docker
```bash
docker run -d -p 3000:3000 medcenter-his:previous-tag
```

### Git-based Deployment
```bash
git revert HEAD
git push production main
```

## Post-Deployment

1. Verify all features work in production
2. Check error logs for issues
3. Monitor performance metrics
4. Run smoke tests
5. Notify team of successful deployment
6. Document any issues or changes
