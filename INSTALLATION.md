# DinLinks Installation Guide

This guide will walk you through setting up DinLinks on your local machine.

## Step 1: Prerequisites

Make sure you have the following installed:

1. **Node.js 18+** and npm
   - Download from [nodejs.org](https://nodejs.org)
   - Verify: `node --version` and `npm --version`

2. **PostgreSQL**
   - Download from [postgresql.org](https://www.postgresql.org/download/)
   - Or use Docker: `docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=password postgres`

3. **Git**
   - Download from [git-scm.com](https://git-scm.com)

## Step 2: Database Setup

Create a PostgreSQL database named `dinlinks`:

```sql
CREATE DATABASE dinlinks;
```

Or using command line:
```bash
createdb dinlinks
```

## Step 3: Project Setup

1. Navigate to the project directory:
```bash
cd /Users/ahmedhasan/Desktop/DinLinks
```

2. Install dependencies:
```bash
npm install
```

## Step 4: Environment Configuration

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` and configure the following:

### Database
```env
DATABASE_URL="postgresql://username:password@localhost:5432/dinlinks"
```
Replace `username` and `password` with your PostgreSQL credentials.

### Auth.js
```env
AUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```
Generate AUTH_SECRET with: `openssl rand -base64 32`

### Cloudinary Setup

1. Go to [cloudinary.com](https://cloudinary.com) and sign up
2. In your dashboard, find:
   - Cloud Name
   - API Key
   - API Secret
3. Create an upload preset:
   - Go to Settings > Upload
   - Scroll to "Upload presets"
   - Click "Add upload preset"
   - Name it `dinlinks`
   - Set Signing Mode to "Unsigned"
   - Save

4. Add to `.env`:
```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

### Stripe Setup

1. Go to [stripe.com](https://stripe.com) and sign up
2. Get your API keys from the Dashboard
3. Create two products with recurring prices:
   - Product 1: Monthly subscription ($29/month)
   - Product 2: Yearly subscription ($279/year)
4. Copy the Price IDs (they start with `price_`)
5. Set up a webhook endpoint:
   - Go to Developers > Webhooks
   - Add endpoint: `http://localhost:3000/api/subscription/webhook`
   - Select events:
     - checkout.session.completed
     - invoice.payment_succeeded
     - invoice.payment_failed
     - customer.subscription.deleted
   - Copy the webhook secret (starts with `whsec_`)

6. Add to `.env`:
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_MONTHLY_PRICE_ID="price_..."
STRIPE_YEARLY_PRICE_ID="price_..."
```

### App URL
```env
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Step 5: Database Migration

Run Prisma migrations to create database tables:

```bash
npx prisma migrate dev --name init
```

This will:
- Create all database tables
- Generate Prisma Client
- Apply the schema to your database

## Step 6: Seed Database

Seed the database with initial data:

```bash
npm run db:seed
```

This creates:
- Admin user (admin@dinlinks.com / admin123)
- Default categories (Administrasjon, Helse, Håndverk, etc.)

## Step 7: Run Development Server

Start the development server:

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## Step 8: Test the Application

### As Admin
1. Go to http://localhost:3000/login
2. Login with:
   - Email: admin@dinlinks.com
   - Password: admin123
3. You'll be redirected to /admin
4. Try creating categories and managing businesses

### As Business
1. Go to http://localhost:3000/signup
2. Create a business account
3. Create your business profile
4. Subscribe to a plan (use Stripe test cards)

### As Customer
1. Go to http://localhost:3000
2. Search for businesses
3. Filter by category
4. View business profiles

## Stripe Test Cards

For testing payments, use these test cards:

- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **3D Secure**: 4000 0025 0000 3155

Use any future expiry date, any 3-digit CVC, and any postal code.

## Troubleshooting

### Database Connection Error
- Make sure PostgreSQL is running
- Verify DATABASE_URL is correct
- Check username/password

### Prisma Error
- Run `npx prisma generate`
- Delete `node_modules` and `package-lock.json`, then run `npm install`

### Image Upload Not Working
- Verify Cloudinary credentials
- Make sure upload preset `dinlinks` exists and is unsigned
- Check browser console for errors

### Stripe Webhook Not Working
- Use Stripe CLI for local testing: `stripe listen --forward-to localhost:3000/api/subscription/webhook`
- Update STRIPE_WEBHOOK_SECRET with the CLI secret

### Port Already in Use
- Change the port: `npm run dev -- -p 3001`
- Or kill the process using port 3000

## Next Steps

1. **Change Admin Password**: Login as admin and update the password
2. **Add Real Categories**: Go to admin panel and add relevant categories
3. **Configure Stripe**: Set up real products and prices for production
4. **Test Workflows**: Create test businesses and test the approval workflow
5. **Customize Design**: Modify components to match your exact design requirements

## Development Tools

### Prisma Studio
View and edit your database:
```bash
npx prisma studio
```

### View Logs
Check the terminal where you ran `npm run dev` for logs

### TypeScript Errors
Check for type errors:
```bash
npm run build
```

## Production Deployment

When ready to deploy:

1. Set up production database
2. Add all environment variables to your hosting platform
3. Update NEXTAUTH_URL and NEXT_PUBLIC_APP_URL
4. Run `npm run build`
5. Deploy to Vercel, Netlify, or your preferred platform

## Support

For issues, check:
- Console logs in browser (F12)
- Terminal logs where `npm run dev` is running
- Prisma Studio for database state
- Stripe Dashboard for payment logs

Happy coding!
