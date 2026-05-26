# Payment Plan Calculator

Static, browser-based payment plan calculator. Build an installment plan with a
down payment, optional bulk payments, configurable payment intervals, and an
NPV-based factor calculation. Mirrors the logic of the Odoo
`finance.payment_plan_structure` model.

## Features

- Down payment (%) and cash value inputs
- Configurable interest (discount) rate
- Multiple bulk payments at any installment index
- Payment interval: monthly, quarterly, semi-annual, annual
- Plan duration in years + extra months (validated against interval)
- Grace periods (skip N periods before first installment)
- Ceiling rounding to user-friendly nearest 10ⁿ
- Full installment schedule with cumulative totals

## Run Locally

Just open `index.html` in a browser. No build step, no dependencies.

```bash
# optional: serve via a local web server
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deploy to GitHub Pages

1. Push this repo to GitHub.
2. Repo **Settings → Pages → Source**: select branch `main` (root).
3. Your site goes live at `https://<user>.github.io/payment_plan_calculator/`.

## Files

- `index.html` — markup
- `styles.css` — styling
- `app.js` — calculation + UI logic
