// Coupon Scout — static app to launch coupon searches and manage personal codes (no scraping).

const el = (q) => document.querySelector(q);
const storeInput = el('#store');
const countryInput = el('#country');
const goBtn = el('#go');
const openAllBtn = el('#open-all');
const copyQueriesBtn = el('#copy-queries');
const results = el('#results');
const patternsCard = el('#patterns-card');
const patternsDiv = el('#patterns');
const copyPatternsBtn = el('#copy-patterns');
const myCodesCard = el('#mycodes-card');
const myCodesDiv = el('#mycodes');
const addMyCodeBtn = el('#add-mycode');
const dlMyCodesBtn = el('#download-mycodes');
const myCodeCode = el('#mycode-code');
const myCodeNotes = el('#mycode-notes');

let lastLinks = [];
let myCodesData = {}; // { "rei.com": [ {code, notes}, ... ] }

// Load personal codes if present
fetch('my-codes.json', { cache: 'no-store' })
  .then(r => r.ok ? r.json() : {})
  .then(json => { myCodesData = json || {}; })
  .catch(() => {});

// Helper to sanitize and derive domain-ish slug
function storeToSlug(name) {
  return name.toLowerCase()
    .replace(/https?:\/\/(www\.)?/, '')
    .replace(/[^\w.-]+/g, '')
    .replace(/(^\.)|(\.$)/g, '');
}

// Build an array of "search providers" describing how to compose URLs
function providersFor(store, country) {
  // Build base search query
  const q = encodeURIComponent(`${store} coupon code ${country ? country : ''}`.trim());
  const qAlt = encodeURIComponent(`${store} promo code ${country ? country : ''}`.trim());

  return [
    {
      name: 'Google (coupons)',
      url: `https://www.google.com/search?q=${q}`,
      note: 'General web search for coupons.'
    },
    {
      name: 'Google (promos)',
      url: `https://www.google.com/search?q=${qAlt}`,
      note: 'Alternate query wording.'
    },
    {
      name: 'Bing',
      url: `https://www.bing.com/search?q=${q}`,
      note: 'Another search engine for variety.'
    },
    {
      name: 'Reddit',
      url: `https://www.reddit.com/search/?q=${encodeURIComponent(store + ' coupon OR promo')}`,
      note: 'Community-shared codes & tips.'
    },
    {
      name: 'Slickdeals',
      url: `https://slickdeals.net/newsearch.php?q=${encodeURIComponent(store)}+coupon`,
      note: 'Deal forum threads (varies by store).'
    },
    {
      name: 'RetailMeNot',
      url: `https://www.retailmenot.com/s/${encodeURIComponent(store)}`,
      note: 'Aggregated coupons (mixed reliability).'
    },
    {
      name: 'Honey Community',
      url: `https://www.joinhoney.com/shop/${encodeURIComponent(store)}`,
      note: 'User-submitted codes for many stores.'
    },
    {
      name: 'Groupon Coupons',
      url: `https://www.groupon.com/coupons/${encodeURIComponent(store)}`,
      note: 'Often has store pages with codes.'
    },
    {
      name: 'The Krazy Coupon Lady',
      url: `https://thekrazycouponlady.com/?s=${encodeURIComponent(store)}`,
      note: 'How-to posts, occasional codes.'
    },
    {
      name: 'CouponBirds',
      url: `https://www.couponbirds.com/codes/${encodeURIComponent(store)}`,
      note: 'Another aggregator.'
    },
    {
      name: 'DuckDuckGo (bang: r)',
      url: `https://duckduckgo.com/?q=!r+${encodeURIComponent(store + ' coupon')}`,
      note: 'Quick Reddit bang search.'
    }
  ];
}

// Generate predictable code patterns for manual try
function generatePatterns(store) {
  const base = store.replace(/\s+/g, '').toUpperCase();
  const yr = new Date().getFullYear();
  const season = (() => {
    const m = new Date().getMonth()+1;
    if ([12,1,2].includes(m)) return 'WINTER';
    if ([3,4,5].includes(m)) return 'SPRING';
    if ([6,7,8].includes(m)) return 'SUMMER';
    return 'FALL';
  })();

  const common = [
    'WELCOME10','WELCOME15','WELCOME20',
    'FIRST10','FIRSTORDER','NEW10',
    'SAVE5','SAVE10','SAVE15','SAVE20','SAVE25',
    'FREESHIP','FREESHIPPING','SHIPFREE',
    'VIP10','VIP15','VIP20',
    'SALE10','SALE15','SALE20',
    'EXTRA10','EXTRA15','EXTRA20',
    `${base}10`, `${base}15`, `${base}20`,
    `${season}${yr}`, `${season}${String(yr).slice(-2)}`,
    `WELCOME${yr}`, `NEW${yr}`, `SAVE${String(yr).slice(-2)}`
  ];

  return Array.from(new Set(common));
}

// Render search tiles
function renderLinks(list) {
  results.innerHTML = '';
  list.forEach(p => {
    const card = document.createElement('article');
    card.className = 'card link';
    const h3 = document.createElement('h3');
    h3.textContent = p.name;
    const pEl = document.createElement('p');
    pEl.textContent = p.note || '';
    const a = document.createElement('a');
    a.href = p.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = p.url;
    card.append(h3, pEl, a);
    results.appendChild(card);
  });
}

function openAll(list) {
  // Open sequentially from a single user click to reduce popup blocking
  let i = 0;
  const openNext = () => {
    if (i >= list.length) return;
    const w = window.open(list[i].url, '_blank', 'noopener');
    i++;
    setTimeout(openNext, 150);
  };
  openNext();
}

function renderMyCodes(store) {
  const slug = storeToSlug(store);
  const entries = myCodesData[slug] || [];
  myCodesDiv.innerHTML = entries.length ? '' : '<p class="hint">No saved codes yet for this store.</p>';
  if (entries.length) {
    const ul = document.createElement('ul');
    entries.forEach(e => {
      const li = document.createElement('li');
      li.textContent = `${e.code} — ${e.notes || ''}`;
      ul.appendChild(li);
    });
    myCodesDiv.appendChild(ul);
  }
  myCodesCard.hidden = false;
}

goBtn.addEventListener('click', () => {
  const store = storeInput.value.trim();
  const country = countryInput.value.trim();
  if (!store) {
    alert('Enter a store name (e.g., “Nike US”).');
    return;
  }
  lastLinks = providersFor(store, country);
  renderLinks(lastLinks);
  openAllBtn.disabled = false;
  copyQueriesBtn.disabled = false;

  // Patterns
  const pats = generatePatterns(store);
  patternsDiv.innerHTML = '<pre>' + pats.join('\n') + '</pre>';
  patternsCard.hidden = false;

  // My codes
  renderMyCodes(store);
});

openAllBtn.addEventListener('click', () => {
  if (lastLinks.length) openAll(lastLinks);
});

copyQueriesBtn.addEventListener('click', async () => {
  if (!lastLinks.length) return;
  const text = lastLinks.map(p => `${p.name}: ${p.url}`).join('\n');
  try {
    await navigator.clipboard.writeText(text);
    copyQueriesBtn.textContent = 'Copied!';
    setTimeout(()=> copyQueriesBtn.textContent = 'Copy Queries', 1200);
  } catch { alert('Copy failed.'); }
});

copyPatternsBtn.addEventListener('click', async () => {
  const txt = patternsDiv.innerText || '';
  try {
    await navigator.clipboard.writeText(txt);
    copyPatternsBtn.textContent = 'Copied!';
    setTimeout(()=> copyPatternsBtn.textContent = 'Copy Patterns', 1200);
  } catch { alert('Copy failed.'); }
});

// Add personal code to in-memory data and offer download
addMyCodeBtn.addEventListener('click', () => {
  const store = storeInput.value.trim();
  if (!store) return alert('Enter a store first.');
  const code = myCodeCode.value.trim();
  if (!code) return alert('Enter a code.');
  const notes = myCodeNotes.value.trim();
  const slug = storeToSlug(store);
  if (!myCodesData[slug]) myCodesData[slug] = [];
  myCodesData[slug].push({ code, notes });
  myCodeCode.value = '';
  myCodeNotes.value = '';
  renderMyCodes(store);
});

dlMyCodesBtn.addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(myCodesData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'my-codes.json';
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(url);
  a.remove();
});
