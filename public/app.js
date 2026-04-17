const catalogEl = document.getElementById('catalog');
const subserverSelect = document.getElementById('subserverId');
const rankSelect = document.getElementById('rankId');
const currencySelect = document.getElementById('currency');
const checkoutForm = document.getElementById('checkout-form');
const statusText = document.getElementById('status');

let catalog = [];

const moneyFormatters = {
  USD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
  EUR: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }),
  GBP: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'GBP' }),
  INR: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })
};

function formatAmount(currency, amount) {
  const formatter = moneyFormatters[currency] || moneyFormatters.USD;
  return formatter.format(amount);
}

function renderCatalog() {
  const selectedCurrency = currencySelect.value;
  catalogEl.innerHTML = '';

  for (const subserver of catalog) {
    const section = document.createElement('article');
    section.className = 'rank-card';

    const rows = subserver.ranks
      .map((rank) => {
        const amount = rank.prices[selectedCurrency.toLowerCase()];
        return `
          <div class="rank-line">
            <h4>${rank.name} <span class="price">${formatAmount(selectedCurrency, amount)}</span></h4>
            <p>${rank.description}</p>
            <ul>${rank.perks.map((perk) => `<li>${perk}</li>`).join('')}</ul>
          </div>
        `;
      })
      .join('');

    section.innerHTML = `<h3>${subserver.subserverName}</h3>${rows}`;
    catalogEl.appendChild(section);
  }
}

function populateSubservers() {
  subserverSelect.innerHTML = '';
  for (const subserver of catalog) {
    const option = document.createElement('option');
    option.value = subserver.subserverId;
    option.textContent = subserver.subserverName;
    subserverSelect.appendChild(option);
  }
  populateRanks();
}

function populateRanks() {
  rankSelect.innerHTML = '';
  const selectedCurrency = currencySelect.value;
  const subserver = catalog.find((item) => item.subserverId === subserverSelect.value);
  if (!subserver) {
    return;
  }

  for (const rank of subserver.ranks) {
    const amount = rank.prices[selectedCurrency.toLowerCase()];
    const option = document.createElement('option');
    option.value = rank.id;
    option.textContent = `${rank.name} (${formatAmount(selectedCurrency, amount)})`;
    rankSelect.appendChild(option);
  }
}

async function loadCatalog() {
  const response = await fetch('/api/v1/catalog');
  if (!response.ok) {
    throw new Error('Could not load store catalog.');
  }

  catalog = await response.json();

  populateSubservers();
  renderCatalog();
}

subserverSelect.addEventListener('change', populateRanks);
currencySelect.addEventListener('change', () => {
  populateRanks();
  renderCatalog();
});

checkoutForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  statusText.textContent = 'Creating secure checkout...';

  const formData = new FormData(checkoutForm);
  const payload = {
    playerName: formData.get('playerName'),
    email: formData.get('email'),
    subserverId: formData.get('subserverId'),
    rankId: formData.get('rankId'),
    currency: formData.get('currency')
  };

  try {
    const response = await fetch('/api/v1/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

loadCatalog().catch((error) => {
  statusText.textContent = error.message;
});
