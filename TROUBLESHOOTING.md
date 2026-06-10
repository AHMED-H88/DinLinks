# DinLinks Troubleshooting Guide

## Issues Fixed

The following issues have been resolved in the codebase:

### ✅ 1. Auth.js Type Issues
**Fixed**: Added proper type assertions for NextAuth v5 compatibility
**Files**:
- [lib/auth.ts](lib/auth.ts:53)
- [middleware.ts](middleware.ts:4)

### ✅ 2. API Route Parameters (Next.js 15)
**Fixed**: Updated dynamic route params to use Promises (Next.js 15 requirement)
**Files**:
- [app/api/admin/businesses/[id]/approve/route.ts](app/api/admin/businesses/[id]/approve/route.ts:7)
- [app/api/admin/businesses/[id]/reject/route.ts](app/api/admin/businesses/[id]/reject/route.ts:7)
- [app/api/admin/businesses/[id]/route.ts](app/api/admin/businesses/[id]/route.ts:7)
- [app/api/admin/categories/[id]/route.ts](app/api/admin/categories/[id]/route.ts:7)
- [app/business/[id]/page.tsx](app/business/[id]/page.tsx:11)

## Common Issues & Solutions

### 1. Dependencies Not Installed

**Error**: `sh: next: command not found` or similar

**Solution**:
```bash
cd /Users/ahmedhasan/Desktop/DinLinks
npm install
```

### 2. Database Connection Failed

**Error**: `Can't reach database server` or `connection refused`

**Solutions**:

#### Check if PostgreSQL is running:
```bash
# macOS with Homebrew
brew services start postgresql@14

# Or check status
brew services list | grep postgresql
```

#### Verify database exists:
```bash
psql -l | grep dinlinks
```

#### Create database if missing:
```bash
createdb dinlinks
```

#### Update DATABASE_URL in .env:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/dinlinks"
```

### 3. Prisma Errors

**Error**: `@prisma/client did not initialize yet`

**Solution**:
```bash
npx prisma generate
```

**Error**: `Migration failed` or `database is out of sync`

**Solution**:
```bash
# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Or create a new migration
npx prisma migrate dev --name fix_schema
```

### 4. AUTH_SECRET Not Set

**Error**: `AUTH_SECRET environment variable is not set`

**Solution**:
```bash
# Generate a random secret
openssl rand -base64 32

# Add to .env
AUTH_SECRET="your-generated-secret-here"
```

### 5. Cloudinary Upload Errors

**Error**: `Upload failed` or `Invalid credentials`

**Solutions**:

#### Verify .env credentials:
```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

#### Check upload preset:
1. Go to Cloudinary Dashboard
2. Settings → Upload
3. Find preset named `dinlinks`
4. Ensure "Signing Mode" is set to "Unsigned"

#### If preset doesn't exist:
1. Click "Add upload preset"
2. Name: `dinlinks`
3. Signing Mode: "Unsigned"
4. Save

### 6. Stripe Webhook Errors

**Error**: `No signatures found matching the expected signature`

**Solutions**:

#### For local development:
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks
stripe listen --forward-to localhost:3000/api/subscription/webhook

# Copy the webhook signing secret (whsec_...)
# Update .env with the secret
```

#### For production:
1. Go to Stripe Dashboard
2. Developers → Webhooks
3. Add endpoint: `https://yourdomain.com/api/subscription/webhook`
4. Select events:
   - checkout.session.completed
   - invoice.payment_succeeded
   - invoice.payment_failed
   - customer.subscription.deleted
5. Copy webhook secret to .env

### 7. Build Errors

**Error**: Type errors during `npm run build`

**Solution**:
```bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Generate Prisma client
npx prisma generate

# Try build again
npm run build
```

### 8. Login Not Working

**Symptoms**: Can't login, redirects to login page

**Solutions**:

#### Check user exists:
```bash
npx prisma studio
# Navigate to User table
# Verify admin@dinlinks.com exists
```

#### Re-seed database:
```bash
npm run db:seed
```

#### Verify AUTH_SECRET is set:
```bash
echo $AUTH_SECRET  # Should not be empty
```

#### Check browser console for errors:
- Open browser DevTools (F12)
- Look for errors in Console tab
- Check Network tab for failed requests

### 9. Images Not Displaying

**Symptoms**: Images show broken or don't load

**Solutions**:

#### Check Next.js config:
Verify [next.config.mjs](next.config.mjs:3) has:
```javascript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'res.cloudinary.com',
    },
  ],
}
```

#### Clear Next.js cache:
```bash
rm -rf .next
npm run dev
```

### 10. Port Already in Use

**Error**: `Port 3000 is already in use`

**Solution**:
```bash
# Use a different port
npm run dev -- -p 3001

# Or kill the process using port 3000
lsof -ti:3000 | xargs kill
```

### 11. Search Not Returning Results

**Symptoms**: Search shows no businesses

**Solutions**:

#### Check business status:
```bash
npx prisma studio
# Navigate to Business table
# Ensure status is "APPROVED"
```

#### Approve business as admin:
1. Login as admin (admin@dinlinks.com)
2. Go to http://localhost:3000/admin
3. Find pending businesses
4. Click "Approve"

### 12. Subscription Not Working

**Symptoms**: Payment redirects fail or subscription not created

**Solutions**:

#### Check Stripe keys:
```env
# .env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_MONTHLY_PRICE_ID="price_..."
STRIPE_YEARLY_PRICE_ID="price_..."
```

#### Verify Price IDs:
1. Go to Stripe Dashboard → Products
2. Click on your subscription product
3. Copy the Price ID (starts with `price_`)
4. Update .env

#### Test webhook locally:
```bash
stripe listen --forward-to localhost:3000/api/subscription/webhook
```

### 13. TypeScript Errors

**Error**: Various TypeScript type errors

**Solution**:
```bash
# Regenerate Prisma types
npx prisma generate

# Check types without building
npx tsc --noEmit

# Update TypeScript if needed
npm install typescript@latest --save-dev
```

### 14. Module Not Found

**Error**: `Cannot find module '@/lib/...'` or similar

**Solution**:
```bash
# Ensure tsconfig.json has paths configured
# Should have:
"paths": {
  "@/*": ["./*"]
}

# Restart dev server
npm run dev
```

## Debug Checklist

When encountering issues, check these in order:

1. ✅ **Dependencies installed**: `npm install` completed successfully
2. ✅ **Database running**: PostgreSQL is active and accessible
3. ✅ **Database migrated**: `npx prisma migrate dev` ran without errors
4. ✅ **Environment variables**: All required .env variables are set
5. ✅ **Prisma generated**: `npx prisma generate` completed
6. ✅ **No build errors**: `npm run build` completes successfully
7. ✅ **Dev server running**: `npm run dev` shows no errors
8. ✅ **Browser console**: No JavaScript errors in browser DevTools

## Viewing Logs

### Backend Logs
Check the terminal where `npm run dev` is running

### Database Queries
```bash
# Enable Prisma query logging in .env
DATABASE_URL="postgresql://...?connection_limit=5&schema_log=query"
```

### Browser Logs
- Open DevTools (F12)
- Console tab for JavaScript errors
- Network tab for API request/response

## Testing the Application

### 1. Test Home Page
```
http://localhost:3000
Should load with search bar and categories
```

### 2. Test Admin Login
```
http://localhost:3000/login
Email: admin@dinlinks.com
Password: admin123
Should redirect to /admin
```

### 3. Test Business Signup
```
http://localhost:3000/signup
Create a business account
Should redirect to /dashboard
```

### 4. Test Search
```
http://localhost:3000/search
Should show approved businesses
```

## Getting Help

If issues persist:

1. **Check terminal output** for error messages
2. **Check browser console** for frontend errors
3. **Use Prisma Studio** to inspect database: `npx prisma studio`
4. **Review environment variables** in .env
5. **Check file permissions** if on Linux/Mac
6. **Try fresh install**:
   ```bash
   rm -rf node_modules package-lock.json .next
   npm install
   npx prisma generate
   npm run dev
   ```

## Fresh Installation

If all else fails, start fresh:

```bash
# 1. Backup your .env file
cp .env .env.backup

# 2. Clean everything
rm -rf node_modules package-lock.json .next
dropdb dinlinks  # If database exists
createdb dinlinks

# 3. Reinstall
npm install

# 4. Setup database
npx prisma migrate dev --name init
npm run db:seed

# 5. Start
npm run dev
```

## Environment Variables Reference

Required variables in .env:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/dinlinks"

# Auth
AUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_MONTHLY_PRICE_ID="price_..."
STRIPE_YEARLY_PRICE_ID="price_..."

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Common Commands

```bash
# Install dependencies
npm install

# Database migration
npx prisma migrate dev

# Seed database
npm run db:seed

# Generate Prisma client
npx prisma generate

# Open database GUI
npx prisma studio

# Start development
npm run dev

# Build for production
npm run build

# Start production
npm start

# Check for errors
npx tsc --noEmit
npm run lint
```

## Status Indicator

All issues have been fixed! ✅

The application is now ready to run. Follow the QUICK_START.md guide to get started.
