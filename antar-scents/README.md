# ANTAR SCENTS

A premium Kenyan online perfume shop with countrywide delivery via matatu stages. Customers can browse, buy, and track orders with M-Pesa or card payments.

## Stack

| Layer | Tech | Platform |
|---|---|---|
| Frontend | Next.js 14 (App Router), Tailwind CSS | Vercel |
| Backend | Node.js + Express | Render |
| Database | PostgreSQL + Storage | Supabase |
| Payments | M-Pesa STK Push + Paystack | Safaricom / Paystack |

## Repository Layout

```
antar-scents/
├── frontend/          # Next.js 14 → deploy to Vercel
│   ├── app/           # App Router pages
│   ├── components/    # Shared UI components
│   ├── lib/           # API client, utilities
│   ├── store/         # Zustand (cart + auth)
│   ├── public/
│   └── vercel.json
├── backend/           # Express API → deploy to Render
│   ├── routes/        # Auth, products, orders, payments, admin…
│   ├── middleware/    # JWT auth, admin guard
│   ├── lib/
│   └── .env.example
├── render.yaml        # Render one-click deploy config
├── SCHEMA.sql         # Run this in Supabase SQL Editor
└── README.md
```

---

## 1 — Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → paste the full contents of `SCHEMA.sql` → **Run**
3. Go to **Storage** → **New bucket** → name it `product-images` → enable **Public**
4. Copy from **Settings → API**:
   - `Project URL` → `SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` secret key → `SUPABASE_SERVICE_ROLE_KEY` (backend only, never expose)

---

## 2 — Backend: Deploy to Render

### Option A — One-click with render.yaml
1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → **New** → **Blueprint**
3. Connect your GitHub repo → Render picks up `render.yaml` automatically
4. Fill in environment variables (see below)

### Option B — Manual
1. **New** → **Web Service**
2. Connect repo, set **Root Directory** to `backend`
3. **Build Command:** `npm install`
4. **Start Command:** `node index.js`
5. **Health Check Path:** `/health`

### Backend Environment Variables

| Variable | Description |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `5000` |
| `ADMIN_EMAIL` | First admin login email |
| `ADMIN_PASSWORD` | First admin login password |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (secret) |
| `JWT_SECRET` | Random 64-char string |
| `FRONTEND_URL` | Your Vercel frontend URL (e.g. `https://antarscents.vercel.app`) |
| `MPESA_CONSUMER_KEY` | From Safaricom Daraja portal |
| `MPESA_CONSUMER_SECRET` | From Safaricom Daraja portal |
| `MPESA_SHORTCODE` | Your M-Pesa shortcode |
| `MPESA_PASSKEY` | Your Daraja passkey |
| `MPESA_CALLBACK_URL` | `https://your-render-url.onrender.com/api/payments/mpesa/callback` |
| `PAYSTACK_SECRET_KEY` | From Paystack dashboard → Settings → API |

---

## 3 — Frontend: Deploy to Vercel

> ⚠️ **Important:** Set the Root Directory to `antar-scents/frontend` in Vercel — see below.

### Step-by-step

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repo (`antarkingori/antarscents`)
3. **CRITICAL — Root Directory:** click "Edit" and set it to **`antar-scents/frontend`**
4. Framework Preset: **Next.js** (auto-detected)
5. Add Environment Variables (see below)
6. Click **Deploy**

### Frontend Environment Variables

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | Your Render backend URL, e.g. `https://antar-scents-api.onrender.com` |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | From Paystack dashboard → Settings → API (public key) |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `NEXT_PUBLIC_SITE_URL` | Your Vercel domain, e.g. `https://antarscents.vercel.app` |

---

## 4 — Local Development

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your values
node index.js
# API running at http://localhost:5000
```

### Frontend
```bash
cd frontend
npm install
# Create .env.local:
echo "NEXT_PUBLIC_API_URL=http://localhost:5000" > .env.local
npm run dev
# App running at http://localhost:3000
```

---

## Features

- **Shop** — Product catalogue with filters (category, price, brand), search, quick view
- **Checkout** — 3-step flow: cart → delivery (matatu route) → payment
- **Payments** — M-Pesa STK Push, M-Pesa till (manual code), Paystack card/mobile
- **Order tracking** — Track by order number + phone, no login required
- **Accounts** — Register/login, order history, favourites list
- **Recommendations** — Based on browsing history and product tags
- **Admin panel** at `/admin`:
  - Dashboard with revenue chart
  - Products (add, edit, delete, inline price edit, CSV import from Shopify export)
  - Orders (filter, update status, mark paid, export CSV)
  - Customers list with spend totals
  - Finances — revenue/profit/cost breakdown with date range and chart
  - Settings — WhatsApp number, M-Pesa till, delivery fees, announcements
- **WhatsApp** support button on all pages

---

## Admin Access

On first startup the backend auto-creates an admin user using `ADMIN_EMAIL` and `ADMIN_PASSWORD` env vars. Navigate to `/admin` and sign in with those credentials.

---

## M-Pesa Setup

1. Register at [developer.safaricom.co.ke](https://developer.safaricom.co.ke)
2. Create an app → get Consumer Key and Consumer Secret
3. For STK Push production: apply for a Lipa Na M-Pesa shortcode
4. Set `MPESA_CALLBACK_URL` to a publicly accessible HTTPS URL (your Render URL)

## Paystack Setup

1. Sign up at [paystack.com](https://paystack.com)
2. Go to Settings → API → copy Public Key and Secret Key
