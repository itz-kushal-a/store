const path = require('path');
const express = require('express');
const Stripe = require('stripe');
require('dotenv').config();

const app = express();
const PORT = Number(process.env.PORT || 3000);
const STORE_URL = process.env.STORE_URL || `http://localhost:${PORT}`;

const ranks = [
  {
    id: 'vip',
    name: 'VIP',
    priceCents: 499,
    features: ['VIP chat tag', '/kit vip', '2 homes'],
  },
  {
    id: 'mvp',
    name: 'MVP',
    priceCents: 999,
    features: ['MVP chat tag', '/kit mvp', '4 homes', 'Priority queue'],
  },
  {
    id: 'legend',
    name: 'Legend',
    priceCents: 1999,
    features: [
      'Legend chat tag',
      '/kit legend',
      '8 homes',
      'Bypass full queue',
      'Exclusive cosmetics',
    ],
  },
  {
    id: 'immortal',
    name: 'Immortal',
    priceCents: 3499,
    features: [
      'Immortal chat tag',
      '/kit immortal',
      'Unlimited homes',
      'Bypass full queue',
      'Monthly bonus crate key',
    ],
  },
];

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.get('/api/ranks', (_req, res) => {
  res.json({ ranks });
});

app.post('/api/create-checkout-session', async (req, res) => {
  if (!stripe) {
    return res.status(500).json({
      error:
        'Stripe is not configured. Add STRIPE_SECRET_KEY in your .env to enable payments.',
    });
  }

  const { rankId } = req.body;
  const rank = ranks.find((entry) => entry.id === rankId);

  if (!rank) {
    return res.status(400).json({ error: 'Selected rank does not exist.' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: rank.priceCents,
            product_data: {
              name: `${rank.name} Rank`,
              description: `Minecraft server rank purchase: ${rank.name}`,
            },
          },
        },
      ],
      success_url: `${STORE_URL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${STORE_URL}/cancel.html`,
      metadata: {
        rankId: rank.id,
      },
    });

    return res.json({ url: session.url });
  } catch (error) {
    return res.status(500).json({
      error: 'Unable to initialize checkout session. Try again in a moment.',
      details: error.message,
    });
  }
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Minecraft rank store listening on ${STORE_URL}`);
});
