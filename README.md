# Kamdhenu Ordering App: clickable prototype

Prototype of a B2B ordering app for Mohit Ispat. Distributors and dealers book Kamdhenu TMT in tonnes at the daily price, choose a payment term, add the size split and track each truck. Mohit Ispat runs orders, dispatch, payments and users from a web admin panel.

Plain HTML, CSS and JavaScript. No build step. Demo data lives in the browser (localStorage) and is shared live between open tabs, so the apps and the admin panel update each other.

| Page | What it is |
| --- | --- |
| `index.html` | Hub, with the points to confirm (C1 to C16) |
| `app.html?as=dealer` | Dealer app |
| `app.html?as=distributor` | Distributor app (same app, plus a Dealers tab) |
| `admin.html` | Mohit Ispat admin panel |
| `demo.html` | Dealer and distributor apps side by side |
| `consumer-v1/` | Earlier consumer marketplace direction, on hold, kept for reference |

Shared rules and data are in `assets/mi-data.js`. Yellow C pins in the apps mark the points to confirm with the client; turn them on or off with "Show points to confirm".

Run locally: `python3 -m http.server` and open http://localhost:8000.

All prices, companies and people shown are demo data.
