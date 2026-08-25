# DinLinks - Business Directory Platform

DinLinks is a modern business directory platform where businesses can create profiles and customers can easily search and discover local businesses. The platform features geolocation-based search, subscription management, and an admin dashboard for moderation.

## Features

### For Businesses
- User registration and authentication
- Create and edit business profiles
- Upload logo and gallery images via Cloudinary
- Manage business information (name, description, category, hours, contact info)
- Subscription management (monthly/yearly plans via Stripe)
- Profile status tracking (pending, approved, rejected)

### For Customers
- Search businesses by name or description
- Filter by category
- View nearby businesses based on geolocation
- View popular businesses
- Save businesses to favorites
- View detailed business profiles with:
  - About section
  - Opening hours
  - Address and map link
  - Contact information
  - Website and booking links
  - Image gallery
  - Reviews

### For Administrators
- Admin dashboard
- Approve/reject business profiles
- Manage categories
- Delete businesses
- View statistics

## Tech Stack

- **Frontend**: Next.js 14, React, TailwindCSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Auth.js (NextAuth v5)
- **Image Upload**: Cloudinary
- **Payments**: Stripe
- **Language**: TypeScript

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js 18+ and npm
- PostgreSQL database
- Git

You'll also need accounts and API keys for:
- Cloudinary (for image uploads)
- Stripe (for payments)

## Installation

### 1. Clone the repository

```bash
cd /Users/ahmedhasan/Desktop/DinLinks
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and fill in your credentials:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/dinlinks"

# Auth.js
AUTH_SECRET="your-secret-key-here"  # Generate with: openssl rand -base64 32
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

### 4. Set up the database

Run Prisma migrations to create the database schema:

```bash
npx prisma migrate dev --name init
```

### 5. Seed the database (optional)

Create initial categories and an admin user:

```bash
npx prisma db seed
```

### 6. Set up Cloudinary

1. Go to [Cloudinary](https://cloudinary.com) and create an account
2. Create an upload preset named `dinlinks` with unsigned uploads enabled
3. Add your cloud name, API key, and API secret to `.env`

### 7. Set up Stripe

1. Go to [Stripe](https://stripe.com) and create an account
2. Create two products with recurring prices (monthly and yearly)
3. Add the price IDs to `.env`
4. Set up webhook endpoint at `/api/subscription/webhook` for these events:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.deleted`
5. Add the webhook secret to `.env`

### 8. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Seeding

To seed the database with initial data, create a file `prisma/seed.ts`:

```bash
npm run db:seed
```

This will create:
- The current pre-migration category rows

An admin account is opt-in and takes its credentials from the environment —
`SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`, both required. Demo businesses
are opt-in too (`SEED_DEMO_BUSINESSES=1`). Leave both unset for any database
that is not your own local one.

Note: the seed still reflects the legacy flat category state (which includes `Annet`). It is not the approved taxonomy. The approved taxonomy is defined in `docs/specifications/03_TAXONOMY_MASTER_LIST.md` and is applied through the controlled Taxonomy v1 migration. `Annet` is not a valid final Category and is removed during that migration.

## Project Structure

```
dinlinks/
├── app/                      # Next.js app directory
│   ├── (auth)/              # Auth pages (login, signup)
│   ├── admin/               # Admin dashboard
│   ├── api/                 # API routes
│   ├── business/            # Business profile pages
│   ├── dashboard/           # Business dashboard
│   ├── search/              # Search page
│   └── page.tsx             # Home page
├── components/              # React components
├── lib/                     # Utility functions
│   ├── auth.ts             # Auth.js configuration
│   ├── prisma.ts           # Prisma client
│   ├── stripe.ts           # Stripe utilities
│   ├── cloudinary.ts       # Cloudinary utilities
│   └── utils.ts            # Helper functions
├── prisma/                  # Database schema
│   └── schema.prisma       # Prisma schema
├── types/                   # TypeScript types
└── public/                  # Static files
```

## User Roles

### Business User
- Can create and manage their own business profile
- Can subscribe to monthly or yearly plans
- Cannot access admin features

### Admin User
- Can view all businesses
- Can approve/reject business profiles
- Can manage categories
- Can delete businesses
- Cannot create business content

## API Routes

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/[...nextauth]` - Auth.js endpoints

### Business
- `POST /api/business` - Create business profile
- `PUT /api/business` - Update business profile

### Favorites
- `POST /api/favorites` - Add to favorites
- `DELETE /api/favorites` - Remove from favorites

### Admin
- `POST /api/admin/businesses/[id]/approve` - Approve business
- `POST /api/admin/businesses/[id]/reject` - Reject business
- `DELETE /api/admin/businesses/[id]` - Delete business
- `POST /api/admin/categories` - Create category
- `DELETE /api/admin/categories/[id]` - Delete category

### Subscription
- `POST /api/subscription/create` - Create checkout session
- `POST /api/subscription/webhook` - Stripe webhook handler

## Deployment

### Database
1. Set up a PostgreSQL database (e.g., Vercel Postgres, Supabase, or Railway)
2. Update `DATABASE_URL` in your production environment

### Environment Variables
Add all environment variables from `.env.example` to your hosting platform

### Build
```bash
npm run build
```

### Deploy
The application can be deployed to:
- Vercel (recommended for Next.js)
- Netlify
- Railway
- Any Node.js hosting platform

## Admin Account

There is no default admin and no default password. To create one locally,
supply both variables when seeding:

```bash
SEED_ADMIN_EMAIL=you@example.com SEED_ADMIN_PASSWORD='<choose a strong one>' npm run db:seed
```

The seed refuses to run if only one of the two is set, and it never modifies an
admin that already exists — so it cannot reset a live administrator's password.

**Important**: never seed an admin against a shared or production database.

## Development

### Run development server
```bash
npm run dev
```

### Run Prisma Studio (database GUI)
```bash
npx prisma studio
```

### Generate Prisma Client
```bash
npx prisma generate
```

### Create new migration
```bash
npx prisma migrate dev --name migration_name
```

## Features Overview

### Smart Location System
- Detects user location with permission
- Sorts search results by distance
- Shows distance to each business
- Works like Google Maps but simpler and ad-free

### Profile Page Sections
- Om (About)
- Opening Hours
- Address with map link
- Reviews
- Contact Information
- Links (website, booking)
- Image Gallery

### Categories

The DinLinks taxonomy is defined by the single source of truth at `docs/specifications/03_TAXONOMY_MASTER_LIST.md`.

- The taxonomy has exactly two levels: Category → Subcategory.
- There are exactly eight top-level Categories: Mat, Shopping, Tjenester, Helse, Bil, Utdanning, Administrasjon, Dyr.
- Every business belongs to exactly one Subcategory. A business is never assigned directly to a top-level Category.
- The top-level Category is derived from the selected Subcategory (through `parentId`).
- There is no `Annet` and no `Generelt` final Category.
- Categories are not freely created outside the approved taxonomy process. Taxonomy changes require founder approval, and the Taxonomy Master List must be updated before any code or database change.

## Support

For issues and questions, please contact the development team.

## License

This project is proprietary and confidential.
