# Minecraft Rank Store

Simple web store for selling Minecraft server ranks with Stripe Checkout.

## Features

- Clean rank storefront page.
- Checkout form capturing Minecraft username + email.
- Stripe payment integration using hosted checkout sessions.
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

## Stripe webhook setup

For local testing with Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/stripe-webhook
```

Copy the shown webhook signing secret into `STRIPE_WEBHOOK_SECRET`.

## Granting ranks in your server

After `checkout.session.completed`, this app logs payment metadata. Connect this part to your own Minecraft automation, e.g.:

- Send command via RCON.
- Call a plugin endpoint.
- Queue an async worker that grants the rank.

The payment metadata includes `playerName` and `rankId`.
