# Deployment Guide - BodyFit AI

This guide covers deploying the NestJS Backend API to production (using Docker + Fly.io/AWS) and releasing the Mobile App to the Google Play Store and Apple App Store using Expo EAS Build.

---

## 1. Backend Server Deployment

### Dockerization (`Dockerfile` for NestJS)
We employ a multi-stage Docker build to keep production images tiny and fast.

```dockerfile
# Stage 1: Build dependencies
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
COPY . .
RUN npm run build
RUN npx prisma generate

# Stage 2: Production runtime
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --only=production
COPY prisma ./prisma/
COPY --from=builder /app/dist ./dist
RUN npx prisma generate

EXPOSE 3000
CMD ["node", "dist/src/main.js"]
```

### Infrastructure Provisioning
1. **Database**: Provision a managed PostgreSQL instance (e.g. AWS RDS or Supabase) with connection poolers enabled.
2. **Cache**: Provision a managed Redis cluster (e.g. AWS ElastiCache or Upstash).
3. **App Container**: Host on Fly.io, Render, or AWS ECS.

### Environment Variable Checklist (`.env`)
```bash
PORT=3000
DATABASE_URL="postgresql://user:pass@host:5432/bodyfit_db?sslmode=require"
REDIS_URL="redis://:password@redis-host:6379"
FIREBASE_PROJECT_ID="bodyfit-ai-prod"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANB..."
FIREBASE_CLIENT_EMAIL="firebase-adminsdk@bodyfit-ai-prod.iam.gserviceaccount.com"
OPENAI_API_KEY="sk-proj-..."
```

---

## 2. Mobile App Deployment & Release

BodyFit AI uses **Expo Application Services (EAS)** for compilation and deployment.

### A. Prerequisites
1. Install EAS CLI: `npm install -g eas-cli`
2. Log in to your Expo account: `eas login`
3. Configure the EAS project settings: `eas project:init`

### B. Configure `eas.json`
Define production compilation build parameters in the root folder:
```json
{
  "cli": {
    "version": ">= 10.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "ios": {
        "simulator": false
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### C. Build & Submit to App Stores

#### 1. Android Release
Compile a production Android App Bundle (`.aab`) and auto-submit to Google Play Console:
```bash
eas build --platform android --profile production --auto-submit
```

#### 2. iOS Release
Compile a production iOS App Store Package (`.ipa`) and auto-submit to TestFlight / App Store Connect:
```bash
eas build --platform ios --profile production --auto-submit
```
*Note: Requires an active Apple Developer Team membership. Code signing certificates, provisioning profiles, and bundle identifiers are provisioned automatically by EAS CLI.*
