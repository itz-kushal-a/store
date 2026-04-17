# Minecraft Rank Store

A simple web store for selling Minecraft server ranks with Stripe Checkout payment integration.

## Features

- Rank catalog (VIP, MVP, Legend, Immortal)
- Clean storefront UI
- Stripe-hosted secure checkout for card payments
- Success/cancel return pages

## Quick start

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy env template and set your Stripe key:
   ```bash
   cp .env.example .env
   ```
3. Start server:
   ```bash
   npm start
   ```
4. Open [http://localhost:3000](http://localhost:3000)

## Environment variables

- `PORT` - Local server port (default `3000`)
- `STORE_URL` - Public URL used for Stripe success/cancel redirects
- `STRIPE_SECRET_KEY` - Your Stripe secret API key

## Notes for production

- Use HTTPS and a real domain for `STORE_URL`.
- Configure webhooks to auto-deliver purchased ranks in-game.
- Replace hardcoded ranks in `server.js` with a database if needed.
