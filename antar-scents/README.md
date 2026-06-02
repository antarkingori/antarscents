# ANTAR SCENTS

A full-stack e-commerce platform for a Kenyan online perfume shop based in Nairobi, with countrywide delivery via matatu stages.

## Tech Stack

- **Frontend:** Next.js 14 (App Router), React, Tailwind CSS — deployed on Vercel
- **Backend:** Node.js + Express REST API — deployed on Render
- **Database:** Supabase (PostgreSQL + Storage)
- **Payments:** M-Pesa (STK Push + Manual Till) + Paystack

## Project Structure

```
/
├── frontend/   # Next.js 14 App → Vercel
├── backend/    # Express API → Render
└── README.md
```

## Setup

### 1. Supabase

Create a Supabase project and run the SQL schema from `SCHEMA.md` in the SQL editor.

### 2. Backend (Render)

1. Connect this GitHub repo to Render
2. Set Root Directory to `backend`
3. Build Command: `npm install`
4. Start Command: `node index.js`
5. Add environment variables from `.env.example`

### 3. Frontend (Vercel)

1. Connect this GitHub repo to Vercel
2. Set Root Directory to `frontend`
3. Framework: Next.js
4. Add environment variables:
   - `NEXT_PUBLIC_API_URL` — your Render backend URL
   - `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Local Development

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Fill in .env values
node index.js
```

### Frontend
```bash
cd frontend
npm install
# Create .env.local with NEXT_PUBLIC_API_URL=http://localhost:5000
npm run dev
```

## Admin Access

Default admin credentials (set via Render env vars):
- **Email:** `ADMIN_EMAIL` env var
- **Password:** `ADMIN_PASSWORD` env var
- **URL:** `/admin`

## Features

- Full product catalogue with variants, images, vendor and tags
- M-Pesa STK Push + manual till code checkout
- Paystack card/mobile money checkout
- Order tracking by order number + phone
- Customer accounts with order history and favourites
- Full admin panel: dashboard, products, orders, customers, finances, settings
- CSV import from Shopify export format
- Recommendation engine based on browsing history
- WhatsApp support button on all pages
- Kenyan matatu-stage delivery model
- Responsive mobile-first design with bottom navigation
