// In-browser tests for the payment plan calculator.
// Run by appending ?test to the URL, or calling runTests() from the console.

(function () {
  const TOLERANCE = 1e-6;

  function approx(a, b, tol = TOLERANCE) {
    return Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
  }

  function makeInputs(paymentInterval) {
    return {
      cashValue: 1_000_000,
      interestRate: 0.10,           // 10% annual
      downPaymentPct: 0.10,         // 10% down
      paymentInterval,
      years: 5,
      // 10% custom payment after one year: index = payment_interval
      bulks: [{ pct: 0.10, idx: paymentInterval }],
    };
  }

  // Rebuild the percentage cashflow exactly like computePlan does, then
  // verify the discounted NPV of the FV cashflow equals cash_value.
  function npvOfFvCashflow(plan, inputs) {
    const cf = new Array(plan.numInstallments + 1).fill(0);
    cf[0] = plan.fvDown;
    for (let i = 0; i < plan.numInstallments; i++) {
      cf[i + 1] = plan.fvInstallments[i];
    }
    for (const b of plan.fvBulks) {
      cf[b.idx] += b.amount;
    }
    const ratePerPeriod = inputs.interestRate / inputs.paymentInterval;
    let total = 0;
    for (let t = 0; t < cf.length; t++) {
      total += cf[t] / Math.pow(1 + ratePerPeriod, t);
    }
    return total;
  }

  // Closed-form expected values, derived analytically from the NPV
  // formula with cash=1,000,000 · 10%/yr · 10% down · 10% custom at
  // end of year 1 · 5 years, run through the same Math.floor()s that
  // computePlan applies to integer amounts. These are the exact values
  // the implementation must produce — down to the cent.
  const EXPECTED = {
    12: { numInstallments: 60, factor: 1.2224049768025627, fv: 1222404,
          fvDown: 122240, fvInstallment: 16298, fvCustom: 122240,
          total: 1222403.9814 },
    4:  { numInstallments: 20, factor: 1.228257454243691,  fv: 1228257,
          fvDown: 122825, fvInstallment: 49130, fvCustom: 122825,
          total: 1228255.9634 },
    2:  { numInstallments: 10, factor: 1.2369475100366847, fv: 1236947,
          fvDown: 123694, fvInstallment: 98955, fvCustom: 123694,
          total: 1236946.008 },
    1:  { numInstallments: 5,  factor: 1.2540207447458769, fv: 1254020,
          fvDown: 125402, fvInstallment: 200643, fvCustom: 125402,
          total: 1254020.5958 },
  };

  function eq(name, actual, expected, tol = 0) {
    const pass = tol === 0 ? actual === expected
                           : Math.abs(actual - expected) <= tol;
    return { name, pass, detail: `expected ${expected}, got ${actual}` };
  }

  function runIntervalTest(paymentInterval, label) {
    const inputs = makeInputs(paymentInterval);
    const plan = computePlan(inputs);
    const exp = EXPECTED[paymentInterval];
    const assertions = [
      eq(`${label}: numInstallments`, plan.numInstallments, exp.numInstallments),
      eq(`${label}: factor`, plan.factor, exp.factor, 1e-10),
      eq(`${label}: fv (future value)`, plan.fv, exp.fv),
      eq(`${label}: fvDown (down payment)`, plan.fvDown, exp.fvDown),
      eq(`${label}: fvInstallment (each installment)`, plan.fvInstallment, exp.fvInstallment),
      {
        name: `${label}: every installment row = ${exp.fvInstallment.toLocaleString()}`,
        pass: plan.fvInstallments.every(v => Math.abs(v - exp.fvInstallment) < 1),
        detail: `first=${plan.fvInstallments[0].toFixed(4)}, last=${plan.fvInstallments.at(-1).toFixed(4)}`,
      },
      {
        name: `${label}: 1 custom payment of ${exp.fvCustom.toLocaleString()} at index ${paymentInterval}`,
        pass: plan.fvBulks.length === 1
              && plan.fvBulks[0].idx === paymentInterval
              && plan.fvBulks[0].amount === exp.fvCustom,
        detail: JSON.stringify(plan.fvBulks),
      },
      eq(`${label}: total paid`, +plan.total.toFixed(4), exp.total, 1e-3),
    ];

    // Central correctness invariant: discounting the FV cashflow at
    // rate-per-period reconstructs the cash value (within rounding noise
    // from the Math.floor() on integer amounts).
    const reconstructed = npvOfFvCashflow(plan, inputs);
    assertions.push({
      name: `${label}: NPV(fv cashflow) reconstructs cash value within 0.001%`,
      pass: Math.abs(reconstructed - inputs.cashValue) / inputs.cashValue < 1e-5,
      detail: `NPV = ${reconstructed.toFixed(4)} vs ${inputs.cashValue}`,
    });

    return { label, plan, assertions };
  }

  // -------------------- Unit tests for core functions --------------------

  function dateISO(d) {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  function runUnitTests() {
    const a = [];

    // npv(rate, cashflows)
    a.push(eq('npv: rate=0 returns sum', npv(0, [100, 200, 300]), 600));
    a.push(eq('npv: single value at t=0 returns the value', npv(0.1, [500]), 500));
    // 100/1 + 110/1.1 = 100 + 100 = 200
    a.push(eq('npv: 100 at t=0 + 110 at t=1, r=10% → 200', npv(0.10, [100, 110]), 200, 1e-9));
    // 100/(1.05^2) = 100/1.1025 = 90.70294784...
    a.push(eq('npv: 100 at t=2, r=5% → 90.7029...',
      npv(0.05, [0, 0, 100]), 100 / 1.1025, 1e-9));
    a.push(eq('npv: empty cashflow → 0', npv(0.1, []), 0));

    // roundUpToNearest(value, digits)
    a.push(eq('roundUp: 1234 to nearest 100 → 1300', roundUpToNearest(1234, 2), 1300));
    a.push(eq('roundUp: 1000 (already aligned) to nearest 100 → 1000', roundUpToNearest(1000, 2), 1000));
    a.push(eq('roundUp: 1234 to nearest 1000 → 2000', roundUpToNearest(1234, 3), 2000));
    a.push(eq('roundUp: 1 to nearest 10000 → 10000', roundUpToNearest(1, 4), 10000));
    a.push(eq('roundUp: 0 always → 0', roundUpToNearest(0, 3), 0));
    a.push(eq('roundUp: digits=0 returns ceil(value)', roundUpToNearest(7.2, 0), 8));

    // monthsBetween(interval)
    a.push(eq('monthsBetween: monthly (12) → 1', monthsBetween(12), 1));
    a.push(eq('monthsBetween: quarterly (4) → 3', monthsBetween(4), 3));
    a.push(eq('monthsBetween: semi (2) → 6', monthsBetween(2), 6));
    a.push(eq('monthsBetween: annual (1) → 12', monthsBetween(1), 12));

    // parseStartDate(str)
    a.push(eq('parseStartDate: "2026-05-27" → 2026-05-27',
      dateISO(parseStartDate('2026-05-27')), '2026-05-27'));
    a.push(eq('parseStartDate: "2026-01-01" → 2026-01-01',
      dateISO(parseStartDate('2026-01-01')), '2026-01-01'));
    a.push(eq('parseStartDate: empty string → today',
      dateISO(parseStartDate('')), dateISO(new Date())));

    // addMonths(date, months)
    a.push(eq('addMonths: 2026-01-15 + 1 month → 2026-02-15',
      dateISO(addMonths(parseStartDate('2026-01-15'), 1)), '2026-02-15'));
    a.push(eq('addMonths: 2026-01-15 + 3 months → 2026-04-15',
      dateISO(addMonths(parseStartDate('2026-01-15'), 3)), '2026-04-15'));
    a.push(eq('addMonths: 2026-11-15 + 3 months → 2027-02-15 (year rollover)',
      dateISO(addMonths(parseStartDate('2026-11-15'), 3)), '2027-02-15'));
    // End-of-month clamping: Jan 31 + 1 → Feb 28 (2026 is not a leap year)
    a.push(eq('addMonths: 2026-01-31 + 1 → 2026-02-28 (clamp to month end)',
      dateISO(addMonths(parseStartDate('2026-01-31'), 1)), '2026-02-28'));
    // Leap year: 2024 is a leap year
    a.push(eq('addMonths: 2024-01-31 + 1 → 2024-02-29 (leap year clamp)',
      dateISO(addMonths(parseStartDate('2024-01-31'), 1)), '2024-02-29'));
    a.push(eq('addMonths: 2026-05-27 + 0 → 2026-05-27 (no-op)',
      dateISO(addMonths(parseStartDate('2026-05-27'), 0)), '2026-05-27'));

    // applyCeiling(plan, digits): ceils every monetary field and recomputes total
    const samplePlan = {
      factor: 1.5, fv: 1500000,
      fvDown: 123_456, fvInstallment: 12_345,
      fvInstallments: [12_345.6, 12_345.6, 12_345.6, 12_345.6],
      fvBulks: [{ amount: 9_999, idx: 2 }],
      total: 0,
      numInstallments: 4, paymentInterval: 4,
    };
    const ceiled = applyCeiling(samplePlan, 3); // nearest 1000
    a.push(eq('applyCeiling: fvDown ceils 123,456 → 124,000', ceiled.fvDown, 124000));
    a.push(eq('applyCeiling: fvInstallment ceils 12,345 → 13,000', ceiled.fvInstallment, 13000));
    a.push(eq('applyCeiling: every installment 12,345.6 → 13,000',
      ceiled.fvInstallments.every(v => v === 13000), true));
    a.push(eq('applyCeiling: bulk 9,999 → 10,000', ceiled.fvBulks[0].amount, 10000));
    // total = 124,000 + (4 × 13,000) + 10,000 = 186,000
    a.push(eq('applyCeiling: total recomputed from ceiled parts', ceiled.total, 186000));
    a.push(eq('applyCeiling: original plan untouched (fvDown unchanged)',
      samplePlan.fvDown, 123456));

    return { label: 'Core function unit tests', assertions: a };
  }

  // ----------------------------------------------------------------------

  function runTests() {
    const cases = [
      { interval: 12, label: 'Monthly (12/yr)' },
      { interval: 4, label: 'Quarterly (4/yr)' },
      { interval: 2, label: 'Semi-Annually (2/yr)' },
      { interval: 1, label: 'Annually (1/yr)' },
    ];
    const results = [runUnitTests(), ...cases.map(c => runIntervalTest(c.interval, c.label))];
    const total = results.reduce((s, r) => s + r.assertions.length, 0);
    const passed = results.reduce((s, r) => s + r.assertions.filter(a => a.pass).length, 0);
    console.group(`Payment Plan Tests — ${passed}/${total} passed`);
    for (const r of results) {
      console.group(r.label);
      for (const a of r.assertions) {
        if (a.pass) console.log(`✓ ${a.name}`);
        else console.error(`✗ ${a.name} — ${a.detail}`);
      }
      console.groupEnd();
    }
    console.groupEnd();
    return { results, total, passed, failed: total - passed };
  }

  function renderTestPanel(summary) {
    const panel = document.createElement('div');
    panel.id = 'testPanel';
    panel.style.cssText = `
      position: fixed; inset: 0; background: #0b1220; color: #e2e8f0;
      z-index: 100000; overflow: auto; padding: 24px 32px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    `;
    const ok = summary.failed === 0;
    const header = document.createElement('div');
    header.style.cssText = `
      padding: 14px 20px; border-radius: 8px; margin-bottom: 20px;
      background: ${ok ? '#065f46' : '#7f1d1d'}; color: white;
      font-size: 18px; font-weight: 700;
      display: flex; justify-content: space-between; align-items: center;
    `;
    header.innerHTML = `
      <span>${ok ? '✓ All Tests Passed' : '✗ Tests Failed'} (${summary.passed}/${summary.total})</span>
      <button id="closeTests" style="background:rgba(0,0,0,.3);color:white;border:none;padding:6px 14px;border-radius:4px;cursor:pointer;font-weight:600">Close</button>
    `;
    panel.appendChild(header);

    for (const r of summary.results) {
      const block = document.createElement('div');
      block.style.cssText = 'background:#1e293b;border:1px solid #334155;border-radius:8px;padding:14px 18px;margin-bottom:14px;';
      const title = document.createElement('h3');
      title.style.cssText = 'margin:0 0 8px;font-size:14px;color:#cbd5e1;';
      title.textContent = r.label;
      block.appendChild(title);
      for (const a of r.assertions) {
        const row = document.createElement('div');
        row.style.cssText = `font-size:13px;line-height:1.6;color:${a.pass ? '#10b981' : '#ef4444'};`;
        row.innerHTML = `${a.pass ? '✓' : '✗'} ${a.name}${a.pass ? '' : ` <span style="color:#fca5a5">— ${a.detail}</span>`}`;
        block.appendChild(row);
      }
      panel.appendChild(block);
    }

    document.body.appendChild(panel);
    document.getElementById('closeTests').addEventListener('click', () => panel.remove());
  }

  // Expose globally
  window.runTests = runTests;
  window.runTestsAndDisplay = function () {
    const s = runTests();
    renderTestPanel(s);
    return s;
  };

  // Auto-run if URL has ?test
  document.addEventListener('DOMContentLoaded', () => {
    if (new URLSearchParams(location.search).has('test')) {
      window.runTestsAndDisplay();
    }
  });
})();
