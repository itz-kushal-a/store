# Minecraft Rank Store (v1)

Web store for selling Minecraft server ranks with Stripe Checkout, including UPI (India) and international currency support.

## Features

- API version 1 routes (`/api/v1/*`) only.
- Subservers included:
  - Survival
  - Lifesteal
  - PvP
- Multiple ranks per subserver with custom prices.
- International checkout support (USD, EUR, GBP card payments).
- India checkout support (INR with card + UPI).
- Stripe webhook endpoint for post-payment rank fulfillment automation.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy environment file:

   ```bash
   cp .env.example .env
   ```

3. Fill in your Stripe keys inside `.env`.

4. Start app:

   ```bash
   npm run dev
   ```

5. Open `http://localhost:3000`.

## API v1 routes

- `GET /api/v1/catalog`
- `POST /api/v1/create-checkout-session`
- `POST /api/v1/stripe-webhook`

## Stripe webhook setup

For local testing with Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/v1/stripe-webhook
```

Copy the shown webhook signing secret into `STRIPE_WEBHOOK_SECRET`.

## Granting ranks in your server

On `checkout.session.completed`, metadata includes:

- `playerName`
- `subserverId`
- `subserverName`
- `rankId`
- `rankName`
- `currency`

Use that metadata to grant the rank through RCON/plugin/worker automation.
