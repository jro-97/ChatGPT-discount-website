# Coupon Scout (static)
Hostable on **GitHub Pages**. Opens smart search links (no scraping) to help you find coupon codes fast. Also lets you keep a personal JSON of codes that you and your family find.

## Quick start
1. Create a new GitHub repo (public is fine).
2. Upload these files to the root of the repo:
   - `index.html`
   - `styles.css`
   - `script.js`
   - `my-codes.json` (optional; personalize later)
3. Enable **GitHub Pages** in your repo settings → Pages → Deploy from branch → `main` branch, `/ (root)`.  
4. Your site will be live at: `https://<yourname>.github.io/<reponame>/`

## How to use
- Type the store name (e.g., “Adidas US”).
- Click **Find Codes**.
- Click **Open All** to open tabs to Google, Bing, Reddit, and several coupon aggregators, all pre-filled for that store.
- Copy **Common Patterns** to try quickly at checkout.
- Manage **My Saved Codes**:
  - Add your own codes in the UI.
  - Click **Download updated my-codes.json** and commit it to the repo to share across your devices.

## Notes
- This app doesn’t scrape paywalled or login-required data. It just opens public pages and search queries.
- Different coupon sites have different reliability. Community forums (Reddit, Slickdeals) often surface the best recent tips.
- If a site is missing or buggy for you, edit `script.js` → `providersFor()` to tweak or add providers.

## Optional tweaks
- Add country to narrow results (e.g., “UK”).
- Add your favorite local deal communities by extending `providersFor()`.
- Fork the repo for friends, or keep `my-codes.json` private by removing it and using local-only downloads.

Enjoy!
