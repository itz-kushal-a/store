const rankContainer = document.getElementById('ranks');
const statusNode = document.getElementById('status');
const template = document.getElementById('rank-card-template');

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

function setStatus(message, type = '') {
  statusNode.textContent = message;
  statusNode.className = `status ${type}`.trim();
}

async function loadRanks() {
  setStatus('Loading ranks...');
  const response = await fetch('/api/ranks');

  if (!response.ok) {
    throw new Error('Could not load rank list.');
  }

  const { ranks } = await response.json();
  rankContainer.innerHTML = '';

  for (const rank of ranks) {
    const clone = template.content.cloneNode(true);
    clone.querySelector('.rank-name').textContent = rank.name;
    clone.querySelector('.rank-price').textContent = currencyFormatter.format(
      rank.priceCents / 100,
    );

    const featureList = clone.querySelector('.rank-features');
    rank.features.forEach((feature) => {
      const item = document.createElement('li');
      item.textContent = feature;
      featureList.appendChild(item);
    });

    const buyButton = clone.querySelector('.buy-btn');
    buyButton.addEventListener('click', async () => {
      try {
        buyButton.disabled = true;
        setStatus(`Creating checkout for ${rank.name}...`);

        const checkoutResponse = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ rankId: rank.id }),
        });

        const payload = await checkoutResponse.json();

        if (!checkoutResponse.ok) {
          throw new Error(payload.error || 'Checkout failed.');
        }

        setStatus('Redirecting to secure checkout...', 'ok');
        window.location.href = payload.url;
      } catch (error) {
        setStatus(error.message, 'error');
      } finally {
        buyButton.disabled = false;
      }
    });

    rankContainer.appendChild(clone);
  }

  setStatus('');
}

loadRanks().catch((error) => setStatus(error.message, 'error'));
