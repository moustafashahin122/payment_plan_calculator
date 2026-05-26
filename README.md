# Payment Plan Calculator

A static, browser-based calculator that builds installment payment plans from a
target interest (discount) rate, down payment, and optional custom lump-sum
payments. Runs entirely client-side — no backend, no build step.

> Mirrors the NPV-based plan logic of the Odoo
> `finance.payment_plan_structure` model used in real-estate financing.

## Features

- **NPV-balanced installments** — payments are scaled so their discounted sum
  at the chosen rate equals the entered cash value.
- **Configurable schedule** — annual / semi-annual / quarterly / monthly,
  multi-year duration, arbitrary start date.
- **Custom payments** — add lump-sum percentages at any installment index
  (balloon, seasonal, or step-up plans).
- **Ceiling rounding** — round each payment up to friendlier amounts
  (nearest 10 / 100 / 1,000 / 10,000 / 100,000).
- **Full schedule output** — every payment row with date, amount, ceiled amount,
  and running cumulative.
- **Bilingual UI (English / Arabic)** with full RTL layout, translated dates,
  and locale-aware formatting.
- **Per-field help tooltips** explaining each input.
- **Algorithm explainer panel** with formulas, mini-example, and rationale.
- **Print / Save as PDF** with a dedicated print stylesheet — no third-party
  PDF library; uses the browser's native print pipeline.
- **Excel export** (XLSX) with separate Results and Schedule sheets.
- **In-browser test suite** (66 assertions) covering core functions and the
  full plan computation across all four intervals.

## Quick Start

Open `index.html` directly in any modern browser, or serve locally:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deploy to GitHub Pages

1. Push this repo to GitHub.
2. **Settings → Pages → Source** → branch `main`, folder `/` (root).
3. Site goes live at `https://<user>.github.io/payment_plan_calculator/`.

No build step, no CI configuration required.

## How It Works

The calculator uses a Net Present Value (NPV) factor to scale every future
payment so that, discounted at the target rate, they sum to today's cash value.

**Step 1 — Build a percentage cashflow**

```
cashflow[0]    = down_payment_pct × 100
cashflow[1..N] = installment_pct × 100      where installment_pct = (1 − down − Σ custom) / N
cashflow[idx] += custom_pct × 100           for each custom payment at index idx
```

**Step 2 — Compute factor via NPV**

```
rate_per_period = annual_rate / payments_per_year
NPV(rate, cf)   = Σ  cf[t] / (1 + rate)^t      for t = 0..length(cf)-1
factor          = Σ cf / NPV(rate_per_period, cf)
```

**Step 3 — Convert to amounts**

```
FV          = factor × cash_value
down        = down_payment_pct × FV
installment = installment_pct  × FV
custom_i    = custom_pct_i     × FV          (added to its installment row)
```

**Step 4 — Optional ceiling rounding** for customer-friendly amounts:

```
round_up(x, n) = ⌈ x / 10ⁿ ⌉ × 10ⁿ
```

Full documentation with a worked example is available in the in-app
"How it works" panel.

## Worked Example

Cash Value 1,000,000 · 10%/year · Quarterly · 5 years · 10% down · 10% custom
at installment #4:

| Metric | Value |
|--------|-------|
| # of installments | 20 |
| Factor | 1.2283 |
| Future Value | 1,228,257 |
| Down payment | 122,825 |
| Each installment | 49,130 |
| Custom payment at #4 | 122,825 |
| **Total paid** | **1,228,256** |

The 32-row in-app test suite verifies these exact numbers across all four
payment intervals.

## Testing

The repo ships with an in-browser test runner (`tests.js`). Two ways to run:

```
# In the URL — auto-runs and shows a results panel
http://localhost:8000/?test

# From the browser console
runTests()              // logs grouped results
runTestsAndDisplay()    // runs and shows the on-page panel
```

The suite covers:

| Category | Tests |
|----------|-------|
| **Unit tests** — `npv`, `roundUpToNearest`, `monthsBetween`, `parseStartDate`, `addMonths`, `applyCeiling` (incl. leap-year + end-of-month clamping) | 30 |
| **Integration tests** — full `computePlan` with exact analytical expected values across Monthly / Quarterly / Semi-Annually / Annually | 36 |
| **Total** | **66** |

## Tech Stack

- Vanilla HTML / CSS / JavaScript — no framework, no build pipeline.
- [SheetJS](https://sheetjs.com/) (CDN) for Excel export.
- Browser-native `window.print()` + `@media print` stylesheet for PDF export.

## Repository Layout

```
.
├── index.html       Markup, including instructions and algorithm panel
├── styles.css       Dark UI + print stylesheet + RTL adjustments
├── app.js           Calculation logic + UI wiring + exports
├── i18n.js          English / Arabic translation tables
├── tests.js         In-browser test runner (66 assertions)
└── README.md
```

## Localization

UI strings live in `i18n.js`, keyed by language code (`en`, `ar`). To add a
language, copy the `en` block, translate the values, and add a matching
`<button class="lang-btn" data-lang="xx">` in the header.

The active language drives:
- All visible labels, buttons, headings, and tooltips
- `<html lang>` and `dir` attributes (full RTL flip for Arabic)
- Date formatting (`Intl.DateTimeFormat` with locale-appropriate calendar)
- Excel sheet names and RTL view flag

## License

MIT
