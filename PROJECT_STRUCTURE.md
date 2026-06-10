# DinLinks Project Structure

## Directory Overview

```
dinlinks/
├── app/                          # Next.js App Router
│   ├── (auth)/                  # Auth route group
│   │   ├── login/              # Login page
│   │   │   └── page.tsx
│   │   └── signup/             # Signup page
│   │       └── page.tsx
│   ├── admin/                   # Admin dashboard
│   │   ├── categories/         # Category management
│   │   │   └── page.tsx
│   │   └── page.tsx            # Main admin page
│   ├── api/                     # API routes
│   │   ├── admin/
│   │   │   ├── businesses/
│   │   │   │   └── [id]/
│   │   │   │       ├── approve/
│   │   │   │       │   └── route.ts
│   │   │   │       ├── reject/
│   │   │   │       │   └── route.ts
│   │   │   │       └── route.ts
│   │   │   └── categories/
│   │   │       ├── [id]/
│   │   │       │   └── route.ts
│   │   │       └── route.ts
│   │   ├── auth/
│   │   │   ├── [...nextauth]/
│   │   │   │   └── route.ts     # Auth.js handler
│   │   │   └── signup/
│   │   │       └── route.ts     # Signup API
│   │   ├── business/
│   │   │   └── route.ts         # Business CRUD
│   │   ├── favorites/
│   │   │   └── route.ts         # Favorites API
│   │   └── subscription/
│   │       ├── create/
│   │       │   └── route.ts
│   │       └── webhook/
│   │           └── route.ts     # Stripe webhooks
│   ├── business/                # Public business pages
│   │   └── [id]/
│   │       └── page.tsx         # Business profile
│   ├── dashboard/               # Business dashboard
│   │   └── page.tsx
│   ├── search/                  # Search page
│   │   └── page.tsx
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Home page
│
├── components/                   # React components
│   ├── AdminNav.tsx             # Admin navigation
│   ├── BusinessCard.tsx         # Business card component
│   ├── BusinessForm.tsx         # Business profile form
│   ├── BusinessTable.tsx        # Admin business table
│   ├── CategoryList.tsx         # Category grid
│   ├── CategoryManager.tsx      # Admin category manager
│   ├── DashboardNav.tsx         # Dashboard navigation
│   ├── FavoriteButton.tsx       # Favorite toggle button
│   ├── ReviewList.tsx           # Reviews display
│   ├── SearchBar.tsx            # Search input
│   ├── SearchFilters.tsx        # Search filters
│   ├── SearchResults.tsx        # Search results
│   └── SubscriptionCard.tsx     # Subscription plans
│
├── lib/                         # Utility libraries
│   ├── auth.ts                  # Auth.js configuration
│   ├── cloudinary.ts            # Cloudinary helpers
│   ├── prisma.ts                # Prisma client
│   ├── stripe.ts                # Stripe helpers
│   └── utils.ts                 # General utilities
│
├── prisma/                      # Database
│   ├── schema.prisma            # Database schema
│   └── seed.ts                  # Database seeding
│
├── types/                       # TypeScript definitions
│   └── next-auth.d.ts          # Auth types
│
├── .env.example                 # Environment variables template
├── .eslintrc.json              # ESLint config
├── .gitignore                  # Git ignore rules
├── FEATURES.md                  # Feature documentation
├── INSTALLATION.md              # Installation guide
├── middleware.ts                # Next.js middleware
├── next.config.mjs             # Next.js config
├── package.json                 # Dependencies
├── postcss.config.mjs          # PostCSS config
├── PROJECT_STRUCTURE.md         # This file
├── README.md                    # Main documentation
├── tailwind.config.ts          # Tailwind config
└── tsconfig.json               # TypeScript config
```

## File Descriptions

### App Directory

#### Pages
- **app/page.tsx**: Home page with search bar and category grid
- **app/(auth)/login/page.tsx**: User login page
- **app/(auth)/signup/page.tsx**: Business registration page
- **app/dashboard/page.tsx**: Business owner dashboard
- **app/search/page.tsx**: Search results page
- **app/business/[id]/page.tsx**: Individual business profile page
- **app/admin/page.tsx**: Admin dashboard with business table
- **app/admin/categories/page.tsx**: Category management page

#### API Routes
- **api/auth/signup/route.ts**: Handle user registration
- **api/auth/[...nextauth]/route.ts**: Auth.js authentication
- **api/business/route.ts**: Create/update business profiles
- **api/favorites/route.ts**: Add/remove favorites
- **api/admin/businesses/[id]/approve/route.ts**: Approve business
- **api/admin/businesses/[id]/reject/route.ts**: Reject business
- **api/admin/businesses/[id]/route.ts**: Delete business
- **api/admin/categories/route.ts**: Create category
- **api/admin/categories/[id]/route.ts**: Delete category
- **api/subscription/create/route.ts**: Create Stripe checkout
- **api/subscription/webhook/route.ts**: Handle Stripe webhooks

### Components

#### Layout Components
- **AdminNav.tsx**: Navigation bar for admin pages
- **DashboardNav.tsx**: Navigation bar for business dashboard

#### Business Components
- **BusinessCard.tsx**: Card display for business in search results
- **BusinessForm.tsx**: Complex form for creating/editing business profile
- **BusinessTable.tsx**: Admin table with approve/reject/delete actions

#### Search Components
- **SearchBar.tsx**: Main search input component
- **SearchFilters.tsx**: Category filter sidebar
- **SearchResults.tsx**: Server component displaying search results

#### Feature Components
- **CategoryList.tsx**: Grid of category cards
- **CategoryManager.tsx**: Admin interface for managing categories
- **FavoriteButton.tsx**: Toggle favorite status
- **ReviewList.tsx**: Display list of reviews
- **SubscriptionCard.tsx**: Display subscription plans and status

### Library Files

#### Auth & Database
- **lib/auth.ts**: Auth.js/NextAuth configuration with credentials provider
- **lib/prisma.ts**: Prisma client singleton
- **lib/stripe.ts**: Stripe client and helper functions
- **lib/cloudinary.ts**: Cloudinary upload functions

#### Utilities
- **lib/utils.ts**:
  - calculateDistance(): Calculate distance between coordinates
  - formatDistance(): Format distance for display
  - cn(): Classname helper

### Database

#### Prisma
- **prisma/schema.prisma**: Complete database schema with all models
- **prisma/seed.ts**: Seed script for initial data

#### Models
- User: User accounts with roles
- Account: NextAuth account linking
- Session: User sessions
- VerificationToken: Email verification
- Business: Business profiles
- Category: Business categories
- Favorite: User favorites
- Review: Business reviews
- Subscription: Stripe subscriptions

### Configuration Files

- **.env.example**: Template for environment variables
- **middleware.ts**: Route protection and authentication checks
- **next.config.mjs**: Next.js configuration (image domains)
- **tailwind.config.ts**: Tailwind CSS configuration
- **tsconfig.json**: TypeScript compiler options
- **postcss.config.mjs**: PostCSS configuration
- **.eslintrc.json**: ESLint rules
- **package.json**: Project dependencies and scripts

### Documentation

- **README.md**: Main project documentation
- **INSTALLATION.md**: Step-by-step installation guide
- **FEATURES.md**: Complete feature list
- **PROJECT_STRUCTURE.md**: This file

## Key Architectural Patterns

### 1. App Router Structure
- Uses Next.js 14 App Router
- Server Components by default
- Client Components marked with "use client"
- Route groups for organization (auth)

### 2. API Routes
- RESTful API design
- Proper HTTP methods (GET, POST, PUT, DELETE)
- Authentication middleware
- Error handling

### 3. Database Access
- Prisma ORM for type safety
- Server-side only (no client-side queries)
- Optimized queries with includes
- Proper indexing

### 4. Authentication Flow
- Auth.js with credentials provider
- JWT session strategy
- Role-based access control
- Protected routes via middleware

### 5. State Management
- Server state via Next.js
- Minimal client state
- URL state for filters
- Form state with React hooks

### 6. Styling Approach
- Utility-first with Tailwind
- Reusable component classes
- Responsive design
- Consistent spacing system

## Data Flow Examples

### Business Creation Flow
1. User fills form in `components/BusinessForm.tsx`
2. Form submits to `api/business/route.ts`
3. API validates with Zod
4. Prisma creates business in database
5. Business status set to PENDING
6. User sees success message
7. Admin approves via `api/admin/businesses/[id]/approve/route.ts`
8. Business appears in search results

### Search Flow
1. User enters query in `components/SearchBar.tsx`
2. Navigates to `app/search/page.tsx` with query params
3. Server component fetches from database
4. `components/SearchResults.tsx` displays results
5. Results sorted by distance if location provided
6. User clicks business card
7. Navigates to `app/business/[id]/page.tsx`

### Subscription Flow
1. User clicks subscribe in `components/SubscriptionCard.tsx`
2. API call to `api/subscription/create/route.ts`
3. Stripe checkout session created
4. User redirected to Stripe
5. User completes payment
6. Stripe sends webhook to `api/subscription/webhook/route.ts`
7. Subscription record updated in database
8. Business dashboard shows active subscription

## Environment Requirements

### Development
- Node.js 18+
- PostgreSQL 12+
- npm 9+

### Production
- All of the above
- Cloudinary account
- Stripe account
- Vercel/Netlify/Railway (recommended)

## Deployment Checklist

- [ ] Set up production database
- [ ] Configure environment variables
- [ ] Update NEXTAUTH_URL
- [ ] Set up Stripe webhooks
- [ ] Run database migrations
- [ ] Seed production data
- [ ] Test authentication flow
- [ ] Test payment flow
- [ ] Test image uploads
- [ ] Configure domain
- [ ] Enable HTTPS
- [ ] Set up monitoring

## Common Tasks

### Add a new category
1. Login as admin
2. Go to /admin/categories
3. Enter category name
4. Click "Add Category"

### Approve a business
1. Login as admin
2. Go to /admin
3. Find pending business
4. Click "Approve"

### Create a business profile
1. Sign up at /signup
2. Login at /login
3. Fill out profile at /dashboard
4. Upload images
5. Submit for approval
6. Subscribe to a plan

### Search for businesses
1. Go to home page
2. Enter search term or click category
3. Filter results
4. Click business to view profile
