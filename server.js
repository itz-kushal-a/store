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

const catalog = [
  {
    subserverId: 'survival',
    subserverName: 'Survival',
    ranks: [
      {
        id: 'survival-scout',
        name: 'Scout',
        description: 'Starter survival perks, /kit scout, and basic claim boosts.',
        prices: { usd: 4.99, inr: 399, eur: 4.59, gbp: 3.99 },
        perks: ['/kit scout', '+1 claim chunk bonus', 'Scout chat badge']
      },
      {
        id: 'survival-warlord',
        name: 'Warlord',
        description: 'Mid-tier survival package with better kits and homes.',
        prices: { usd: 11.99, inr: 999, eur: 10.99, gbp: 9.49 },
        perks: ['/kit warlord', '5 homes', 'Silk touch spawner perk']
      },
      {
        id: 'survival-overlord',
        name: 'Overlord',
        description: 'Top survival rank with premium utility and cosmetics.',
        prices: { usd: 24.99, inr: 2099, eur: 22.99, gbp: 19.99 },
        perks: ['/kit overlord', '15 homes', 'Exclusive particle trails']
      }
    ]
  },
  {
    subserverId: 'lifesteal',
    subserverName: 'Lifesteal',
    ranks: [
      {
        id: 'lifesteal-bloodborn',
        name: 'Bloodborn',
        description: 'Lifesteal starter with lightweight PvP boosts.',
        prices: { usd: 5.99, inr: 499, eur: 5.49, gbp: 4.79 },
        perks: ['+1 max heart cap', '/kit bloodborn', 'Bloodborn prefix']
      },
      {
        id: 'lifesteal-reaper',
        name: 'Reaper',
        description: 'Improved combat perks and economy boosters.',
        prices: { usd: 13.99, inr: 1199, eur: 12.99, gbp: 10.99 },
        perks: ['+2 max heart cap', '/kit reaper', 'Auction fee discount']
      },
      {
        id: 'lifesteal-immortal',
        name: 'Immortal',
        description: 'Elite lifesteal rank with full premium benefits.',
        prices: { usd: 27.99, inr: 2399, eur: 25.99, gbp: 21.99 },
        perks: ['+3 max heart cap', '/kit immortal', 'Special kill effects']
      }
    ]
  },
  {
    subserverId: 'pvp',
    subserverName: 'PvP',
    ranks: [
      {
        id: 'pvp-gladiator',
        name: 'Gladiator',
        description: 'Arena access perks and starter duel commands.',
        prices: { usd: 3.99, inr: 349, eur: 3.69, gbp: 3.29 },
        perks: ['Gladiator title', '/duel custom loadouts', '2 daily crate keys']
      },
      {
        id: 'pvp-champion',
        name: 'Champion',
        description: 'Competitive rank focused on ladder progression.',
        prices: { usd: 9.99, inr: 849, eur: 9.19, gbp: 7.99 },
        perks: ['Champion title', 'Ranked queue priority', '5 daily crate keys']
      },
      {
        id: 'pvp-titan',
        name: 'Titan',
        description: 'Ultimate PvP package with exclusive profile flair.',
        prices: { usd: 19.99, inr: 1699, eur: 18.49, gbp: 15.99 },
        perks: ['Titan title', 'Unique kill message style', '10 daily crate keys']
      }
    ]
  }
];

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

const currencyMap = {
  USD: { code: 'usd', paymentMethods: ['card'] },
  EUR: { code: 'eur', paymentMethods: ['card'] },
  GBP: { code: 'gbp', paymentMethods: ['card'] },
  INR: { code: 'inr', paymentMethods: ['card', 'upi'] }
};

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.get('/api/v1/catalog', (_req, res) => {
  res.json(catalog);
});

app.post('/api/v1/create-checkout-session', async (req, res) => {
  if (!stripe) {
    return res.status(500).json({
      error: 'Stripe is not configured. Set STRIPE_SECRET_KEY in your environment.'
    });
  }

  const { subserverId, rankId, playerName, email, currency = 'USD' } = req.body;

  if (!subserverId || !rankId || !playerName || !email) {
    return res.status(400).json({ error: 'subserverId, rankId, playerName, and email are required.' });
  }

  const paymentConfig = currencyMap[currency.toUpperCase()];
  if (!paymentConfig) {
    return res.status(400).json({ error: 'Unsupported currency.' });
  }

  const subserver = catalog.find((item) => item.subserverId === subserverId);
  const rank = subserver?.ranks.find((item) => item.id === rankId);

  if (!subserver || !rank) {
    return res.status(404).json({ error: 'Subserver or rank not found.' });
  }

  const amount = rank.prices[paymentConfig.code];
  if (!amount) {
    return res.status(400).json({ error: `Price for currency ${paymentConfig.code} is not configured.` });
  }

  try {
    const baseUrl = process.env.PUBLIC_URL || `http://localhost:${port}`;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: email,
      payment_method_types: paymentConfig.paymentMethods,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: paymentConfig.code,
            unit_amount: Math.round(amount * 100),
            product_data: {
              name: `${subserver.subserverName} • ${rank.name} Rank`,
              description: rank.description
            }
          }
        }
      ],
      metadata: {
        subserverId: subserver.subserverId,
        subserverName: subserver.subserverName,
        rankId: rank.id,
        rankName: rank.name,
        playerName,
        email,
        currency: paymentConfig.code
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

app.post('/api/v1/stripe-webhook', express.raw({ type: 'application/json' }), (req, res) => {
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
    console.log(
      'Payment complete:',
      session.metadata?.playerName,
      '|',
      session.metadata?.subserverName,
      '|',
      session.metadata?.rankName,
      '|',
      session.metadata?.currency
    );
    // TODO: Add integration to grant ranks in-game (RCON/plugin/worker).
  }

  return res.json({ received: true });
});

app.listen(port, () => {
  console.log(`Minecraft rank store (v1) running on http://localhost:${port}`);
});
