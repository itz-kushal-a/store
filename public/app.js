const rankList = document.getElementById('rank-list');
const rankSelect = document.getElementById('rankId');
const checkoutForm = document.getElementById('checkout-form');
const statusText = document.getElementById('status');

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD'
});

async function loadRanks() {
  const response = await fetch('/api/ranks');
  if (!response.ok) {
    throw new Error('Could not load ranks');
  }

  const ranks = await response.json();

  rankList.innerHTML = '';
  rankSelect.innerHTML = '';

  for (const rank of ranks) {
    const card = document.createElement('article');
    card.className = 'rank-card';
    card.innerHTML = `
      <h3>${rank.name}</h3>
      <p class="price">${money.format(rank.priceUsd)}</p>
      <p>${rank.description}</p>
      <ul>${rank.perks.map((perk) => `<li>${perk}</li>`).join('')}</ul>
    `;
    rankList.appendChild(card);

    const option = document.createElement('option');
    option.value = rank.id;
    option.textContent = `${rank.name} (${money.format(rank.priceUsd)})`;
    rankSelect.appendChild(option);
  }
}

checkoutForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  statusText.textContent = 'Creating secure checkout...';

  const formData = new FormData(checkoutForm);
  const payload = {
    playerName: formData.get('playerName'),
    email: formData.get('email'),
    rankId: formData.get('rankId')
  };

  try {
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Checkout failed.');
    }

    window.location.href = data.url;
  } catch (error) {
    statusText.textContent = error.message;
  }
});

loadRanks().catch((error) => {
  statusText.textContent = error.message;
});
