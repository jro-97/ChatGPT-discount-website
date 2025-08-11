// Node script to fetch public pages and extract coupon-like codes.
// Usage (GitHub Action): node scripts/fetch-coupons.js "Adidas US" "US"
import fs from 'fs';
import fetch from 'node-fetch';

const store = process.argv[2] || '';
const country = process.argv[3] || '';
if (!store) {
  console.error('Store name required.');
  process.exit(1);
}

const q = encodeURIComponent(`${store} ${country}`.trim());
const sources = [
  { name:'Reddit', url:`https://www.reddit.com/search/?q=${q}%20(coupon%20OR%20promo%20code)` },
  { name:'Slickdeals', url:`https://slickdeals.net/newsearch.php?q=${q}+coupon` },
  { name:'RetailMeNot', url:`https://www.retailmenot.com/s/${q}` }
];

async function getText(u){
  try {
    const r = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0 (CouponScout-GHA)' }});
    return await r.text();
  } catch (e) { return ''; }
}

function extract(text, label){
  const CODE = /[A-Z0-9][A-Z0-9-]{4,15}/g;
  const KEY = /(coupon|code|promo|discount|voucher|apply|use)\s*[:\-]?\s*/i;
  const lines = text.split(/\n|<|>/);
  const hits = [];
  for (const raw of lines) {
    const s = raw.replace(/&[#a-z0-9]+;/gi,' ').replace(/\s+/g,' ').trim();
    if (!s) continue;
    if (KEY.test(s)) {
      const ups = s.toUpperCase();
      const found = ups.match(CODE) || [];
      for (const code of found) {
        if (/^HTTP|DOCTYPE|CONTENT|REDDIT|SLICKDEALS|RETAILMENOT|SEARCH|GOOGLE$/.test(code)) continue;
        hits.push({ code, source: label, store });
      }
    }
  }
  return hits;
}

const run = async () => {
  let items = [];
  for (const s of sources) {
    const txt = await getText(s.url);
    if (!txt) continue;
    items = items.concat(extract(txt, s.name));
  }
  // dedupe
  const map = new Map();
  for (const it of items) {
    const k = `${it.store}|${it.code}`;
    if (!map.has(k)) map.set(k, it);
  }

  let out = { updated: new Date().toISOString(), items: [] };
  if (fs.existsSync('codes.json')) {
    try { out = JSON.parse(fs.readFileSync('codes.json','utf8')); } catch {}
    out.updated = new Date().toISOString();
  }
  out.items = Array.from(map.values());

  fs.writeFileSync('codes.json', JSON.stringify(out, null, 2));
  console.log(`Wrote ${out.items.length} items to codes.json`);
};

run();
