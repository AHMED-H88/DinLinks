# DinLinks Quick Start Guide

Get up and running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- PostgreSQL running
- Terminal/Command Prompt

## Installation Steps

### 1. Install Dependencies (1 minute)

```bash
cd /Users/ahmedhasan/Desktop/DinLinks
npm install
```

### 2. Set Up Database (1 minute)

Create a PostgreSQL database:
```bash
createdb dinlinks
```

### 3. Configure Environment (2 minutes)

Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` with minimum required settings:

```env
# Database - Update with your credentials
DATABASE_URL="postgresql://username:password@localhost:5432/dinlinks"

# Auth - Generate with: openssl rand -base64 32
AUTH_SECRET="your-random-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Cloudinary - Sign up at cloudinary.com (free)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Stripe - Use test mode keys from stripe.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_MONTHLY_PRICE_ID="price_..."
STRIPE_YEARLY_PRICE_ID="price_..."

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Initialize Database (1 minute)

Run migrations and seed:
```bash
npx prisma migrate dev --name init
npm run db:seed
```

### 5. Start Development Server (1 second)

```bash
npm run dev
```

Open http://localhost:3000 in your browser!

## Test Accounts

### Admin Account
- **URL**: http://localhost:3000/login
- **Email**: admin@dinlinks.com
- **Password**: admin123

### Test Business (Create Your Own)
- **URL**: http://localhost:3000/signup
- Create account and profile
- Use Stripe test card: 4242 4242 4242 4242

## Quick Feature Tour

### 1. Home Page (http://localhost:3000)
- Search bar
- Category grid
- Browse businesses

### 2. Create Business (http://localhost:3000/signup)
- Sign up as business
- Create profile
- Upload images
- Subscribe

### 3. Admin Dashboard (http://localhost:3000/admin)
- Login as admin
- Approve/reject businesses
- Manage categories

### 4. Search (http://localhost:3000/search)
- Search businesses
- Filter by category
- View profiles

## Common Issues & Solutions

### "Database connection failed"
**Solution**: Make sure PostgreSQL is running and DATABASE_URL is correct

### "Module not found"
**Solution**: Run `npm install` again

### "Prisma error"
**Solution**: Run `npx prisma generate`

### "Port 3000 already in use"
**Solution**: Run `npm run dev -- -p 3001` to use port 3001

### Images not uploading
**Solution**:
1. Create Cloudinary account at cloudinary.com
2. Go to Settings > Upload
3. Create upload preset named "dinlinks"
4. Set to "Unsigned"
5. Update .env with credentials

### Stripe checkout not working
**Solution**: Use Stripe CLI for local webhook testing:
```bash
stripe listen --forward-to localhost:3000/api/subscription/webhook
```

## Project Structure (Simplified)

```
DinLinks/
├── app/              # Pages and API routes
├── components/       # React components
├── lib/             # Utilities
├── prisma/          # Database
├── .env             # Your configuration
└── package.json     # Dependencies
```

## Key URLs

- **Home**: http://localhost:3000
- **Login**: http://localhost:3000/login
- **Signup**: http://localhost:3000/signup
- **Dashboard**: http://localhost:3000/dashboard
- **Admin**: http://localhost:3000/admin
- **Search**: http://localhost:3000/search
- **Prisma Studio**: Run `npx prisma studio`

## Development Commands

```bash
# Start dev server
npm run dev

# Run database migrations
npx prisma migrate dev

# Seed database
npm run db:seed

# Open database GUI
npx prisma studio

# Build for production
npm run build

# Start production server
npm start
```

## Cloudinary Setup (3 minutes)

1. Go to https://cloudinary.com/users/register/free
2. Sign up for free account
3. In Dashboard, note your:
   - Cloud name
   - API Key
   - API Secret
4. Go to Settings > Upload
5. Scroll to "Upload presets"
6. Click "Add upload preset"
7. Preset name: `dinlinks`
8. Signing Mode: `Unsigned`
9. Click "Save"
10. Update .env file

## Stripe Setup (5 minutes)

### Create Account
1. Go to https://stripe.com
2. Sign up for account
3. Activate your account

### Get API Keys
1. Go to Developers > API keys
2. Copy "Publishable key" (pk_test_...)
3. Copy "Secret key" (sk_test_...)
4. Add to .env

### Create Products
1. Go to Products
2. Click "Add product"
3. Create "Monthly Subscription"
   - Name: Monthly Plan
   - Price: $29/month
   - Recurring: Monthly
   - Copy Price ID (price_...)
4. Create "Yearly Subscription"
   - Name: Yearly Plan
   - Price: $279/year
   - Recurring: Yearly
   - Copy Price ID (price_...)
5. Add Price IDs to .env

### Set Up Webhooks (Local Testing)
1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login: `stripe login`
3. Forward webhooks:
```bash
stripe listen --forward-to localhost:3000/api/subscription/webhook
```
4. Copy webhook signing secret (whsec_...)
5. Add to .env as STRIPE_WEBHOOK_SECRET

### Test Card Numbers
- Success: 4242 4242 4242 4242
- Decline: 4000 0000 0000 0002
- 3D Secure: 4000 0025 0000 3155
- Any future expiry, any CVC, any postal code

## Next Steps

1. ✅ Install and run the app
2. ✅ Login as admin and explore
3. ✅ Create a test business account
4. ✅ Fill out business profile
5. ✅ Test image uploads
6. ✅ Test subscription flow
7. ✅ Approve business as admin
8. ✅ Search for the business
9. ✅ Test favorites
10. ✅ Customize design to match your PDF

## Getting Help

### Documentation
- README.md - Full documentation
- INSTALLATION.md - Detailed setup
- FEATURES.md - Feature list
- PROJECT_STRUCTURE.md - Code organization

### Logs
- Browser Console (F12) for frontend errors
- Terminal where `npm run dev` runs for backend errors

### Database
- Run `npx prisma studio` to view/edit data
- Check connection with `psql dinlinks`

### Common Debugging

**Can't login?**
- Check if user exists in Prisma Studio
- Verify password is correct
- Check AUTH_SECRET is set

**Images not showing?**
- Verify Cloudinary credentials
- Check upload preset is "unsigned"
- Look for errors in browser console

**Payment failing?**
- Use test card numbers
- Check Stripe webhook is running
- Verify STRIPE_WEBHOOK_SECRET matches

**Search not working?**
- Approve business in admin panel first
- Check business status is APPROVED
- Verify database has data

## Production Deployment

When ready to deploy:

1. **Database**: Set up production PostgreSQL
2. **Environment**: Add all .env variables to host
3. **Build**: Run `npm run build`
4. **Deploy**: Push to Vercel/Netlify
5. **Webhooks**: Update Stripe webhook URL
6. **Test**: Test all features in production

Recommended hosts:
- Vercel (best for Next.js)
- Railway (includes database)
- Netlify

## Support

Check these resources in order:
1. README.md for general info
2. INSTALLATION.md for setup help
3. Browser/terminal logs for errors
4. Prisma Studio for database state

Happy building! 🚀
