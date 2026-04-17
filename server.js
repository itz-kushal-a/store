import dotenv from 'dotenv';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Stripe from 'stripe';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3000);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rankCatalog = [
  {
    id: 'vip',
    name: 'VIP',
    description: 'Starter perks, colored chat prefix, and /kit vip daily.',
    priceUsd: 4.99,
    perks: ['VIP chat prefix', '2 homes', 'Daily /kit vip']
  },
  {
    id: 'mvp',
    name: 'MVP',
    description: 'Popular rank with better kits, more homes, and queue priority.',
    priceUsd: 9.99,
    perks: ['MVP chat prefix', '5 homes', 'Queue priority']
  },
  {
    id: 'legend',
    name: 'LEGEND',
    description: 'Premium rank with exclusive cosmetics and commands.',
    priceUsd: 19.99,
    perks: ['Legend prefix', '10 homes', 'Exclusive particles']
  }
];

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.get('/api/ranks', (_req, res) => {
  res.json(rankCatalog);
});

app.post('/api/create-checkout-session', async (req, res) => {
  if (!stripe) {
    return res.status(500).json({
      error: 'Stripe is not configured. Set STRIPE_SECRET_KEY in your environment.'
    });
  }

  const { rankId, playerName, email } = req.body;

  if (!rankId || !playerName || !email) {
    return res.status(400).json({ error: 'rankId, playerName, and email are required.' });
  }

  const rank = rankCatalog.find((item) => item.id === rankId);
  if (!rank) {
    return res.status(404).json({ error: 'Rank not found.' });
  }

  try {
    const baseUrl = process.env.PUBLIC_URL || `http://localhost:${port}`;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: email,
      payment_method_types: ['card'],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: Math.round(rank.priceUsd * 100),
            product_data: {
              name: `${rank.name} Rank`,
              description: rank.description
            }
          }
        }
      ],
      metadata: {
        rankId: rank.id,
        rankName: rank.name,
        playerName,
        email
      },
      success_url: `${baseUrl}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/?canceled=true`
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Failed to create checkout session:', error);
    return res.status(500).json({ error: 'Could not start checkout session.' });
  }
});

app.post('/api/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe) {
    return res.status(500).send('Stripe is not configured.');
  }

  const signature = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return res.status(400).send('Missing Stripe signature or webhook secret.');
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
  } catch (error) {
    console.error('Webhook signature check failed:', error.message);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    console.log('Payment completed for player:', session.metadata?.playerName, 'rank:', session.metadata?.rankName);
    // TODO: Connect this point to your Minecraft server automation.
    // Example approaches:
    // 1) Send command through RCON
    // 2) Call your server plugin API
    // 3) Push to a queue worker that grants the rank in-game
  }

  return res.json({ received: true });
});

app.listen(port, () => {
  console.log(`Minecraft rank store running on http://localhost:${port}`);
});
