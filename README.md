# Kamdhenu App: clickable prototype

Phase 1 prototype of a prepaid ordering app for Kamdhenu TMT bars, binding wire and nails in Goa and Karnataka. Orders are routed to the nearest Kamdhenu dealer, and the dealer is paid after delivery.

Plain HTML, CSS and JavaScript. Order routing, dispatch, delivery and payouts run in `assets/data.js`, shared by all pages, so an order placed in one app updates the others live. No build step. Demo data is stored in the browser (localStorage) and can be reset from the app.

| Page | Status |
| --- | --- |
| `index.html` | Hub with the points to confirm |
| `customer.html` | Customer app |
| `dealer.html` | Dealer app (signed in as a demo dealer) |
| `demo.html` | Customer and dealer apps side by side, sharing the same orders |
| Admin panel | Next |

Run locally: `python3 -m http.server` and open http://localhost:8000.

All prices, dealers and people shown are demo data.
