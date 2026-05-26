// Payment Plan Calculator — pure browser JS.
// Mirrors the NPV-based plan logic from
// odoo_17/epm/metrics_enterprise/finance/models/payment_plan_structure.py

function $(id) { return document.getElementById(id); }

const fmt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

let lastResult = null; // { plan, plainPlan, startDate, inputs }

// npv(rate, cashflows) matching numpy_financial.npv.
function npv(rate, cashflows) {
  let total = 0;
  for (let t = 0; t < cashflows.length; t++) {
    total += cashflows[t] / Math.pow(1 + rate, t);
  }
  return total;
}

function roundUpToNearest(value, digits) {
  const step = Math.pow(10, digits);
  return Math.ceil(value / step) * step;
}

function readBulks() {
  const rows = document.querySelectorAll('#bulkList .bulk-row');
  const bulks = [];
  rows.forEach(row => {
    const pct = parseFloat(row.querySelector('.bulk-pct').value);
    const idx = parseInt(row.querySelector('.bulk-idx').value, 10);
    if (!isNaN(pct) && !isNaN(idx) && pct > 0) {
      bulks.push({ pct: pct / 100, idx });
    }
  });
  return bulks;
}

function addBulkRow(pct = 5, idx = 1) {
  const row = document.createElement('div');
  row.className = 'bulk-row';
  row.innerHTML = `
    <label><span data-i18n="bulkAmountPct">${t('bulkAmountPct')}</span><input type="number" class="bulk-pct" min="0" max="100" step="0.01" value="${pct}" /></label>
    <label><span data-i18n="bulkPaymentNo">${t('bulkPaymentNo')}</span><input type="number" class="bulk-idx" min="1" step="1" value="${idx}" /></label>
    <button type="button" class="btn-icon" data-i18n-title="remove" title="${t('remove')}">&times;</button>
  `;
  row.querySelector('.btn-icon').addEventListener('click', () => row.remove());
  $('bulkList').appendChild(row);
}

function showError(msg) {
  const box = $('errorBox');
  box.textContent = msg;
  box.hidden = false;
  $('resultsCard').hidden = true;
}

function clearError() { $('errorBox').hidden = true; }

function computePlan(inputs) {
  const { cashValue, interestRate, downPaymentPct, paymentInterval, years, bulks } = inputs;
  const ratePerPeriod = interestRate / paymentInterval;
  const numInstallments = Math.round(years * paymentInterval);
  if (numInstallments <= 0) throw new Error('Number of installments must be > 0.');

  const bulkPct = bulks.reduce((s, b) => s + b.pct, 0);
  const remaining = 1 - downPaymentPct - bulkPct;
  if (remaining <= 0) throw new Error('Down payment + bulk payments exceed 100%.');

  const installmentPct = remaining / numInstallments;

  const cashflow = [downPaymentPct * 100];
  for (let i = 0; i < numInstallments; i++) cashflow.push(installmentPct * 100);
  for (const b of bulks) {
    if (b.idx < 1 || b.idx > numInstallments) {
      throw new Error(`Bulk payment at # ${b.idx} exceeds plan duration (${numInstallments}).`);
    }
    cashflow[b.idx] += b.pct * 100;
  }

  const npvVal = npv(ratePerPeriod, cashflow);
  if (npvVal === 0) throw new Error('NPV evaluated to zero — check your inputs.');
  const factor = cashflow.reduce((s, v) => s + v, 0) / npvVal;
  const fv = factor * cashValue;

  const fvDown = Math.floor(downPaymentPct * fv);
  const fvInstallment = Math.floor(installmentPct * fv);
  const fvInstallments = new Array(numInstallments).fill(installmentPct * fv);
  const fvBulks = bulks.map(b => ({ amount: Math.floor(b.pct * fv), idx: b.idx }));
  const total = fvDown + fvBulks.reduce((s, b) => s + b.amount, 0) + fvInstallments.reduce((s, v) => s + v, 0);

  return { factor, fv: Math.floor(fv), fvDown, fvInstallment, fvInstallments, fvBulks, total, numInstallments, paymentInterval };
}

function applyCeiling(plan, digits) {
  const fvInstallments = plan.fvInstallments.map(v => roundUpToNearest(v, digits));
  const fvBulks = plan.fvBulks.map(b => ({ amount: roundUpToNearest(b.amount, digits), idx: b.idx }));
  const fvDown = roundUpToNearest(plan.fvDown, digits);
  const fvInstallment = roundUpToNearest(plan.fvInstallment, digits);
  const total = fvDown + fvBulks.reduce((s, b) => s + b.amount, 0) + fvInstallments.reduce((s, v) => s + v, 0);
  return { ...plan, fvInstallments, fvBulks, fvDown, fvInstallment, total };
}

function monthsBetween(interval) { return 12 / interval; }

function parseStartDate(str) {
  if (!str) return new Date();
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function addMonths(date, months) {
  const d = new Date(date.getTime());
  const targetMonth = d.getMonth() + months;
  d.setDate(1);
  d.setMonth(targetMonth);
  const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(date.getDate(), daysInMonth));
  return d;
}

function formatDate(date) {
  const locale = currentLang === 'ar' ? 'ar-EG' : 'en-US';
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: '2-digit' }).format(date);
}

function buildScheduleRows(plan, plainPlan, startDate) {
  const monthsStep = monthsBetween(plan.paymentInterval);
  const bulkByIdx = new Map(plan.fvBulks.map(b => [b.idx, b.amount]));
  const bulkByIdxPlain = new Map(plainPlan.fvBulks.map(b => [b.idx, b.amount]));
  const rows = [];
  let cumulative = 0;

  cumulative += plan.fvDown;
  rows.push({ idx: 1, date: startDate, type: t('downPaymentRow'), amount: plainPlan.fvDown, ceiled: plan.fvDown, cumulative, isBulk: false });

  for (let i = 0; i < plan.numInstallments; i++) {
    const installmentNo = i + 1;
    const date = addMonths(startDate, installmentNo * monthsStep);
    let amount = plan.fvInstallments[i];
    let amountPlain = plainPlan.fvInstallments[i];
    let label = `${t('installment')} ${installmentNo}`;
    let isBulk = false;
    if (bulkByIdx.has(installmentNo)) {
      amount += bulkByIdx.get(installmentNo);
      amountPlain += bulkByIdxPlain.get(installmentNo);
      label += ` ${t('bulkSuffix')}`;
      isBulk = true;
    }
    cumulative += amount;
    rows.push({ idx: i + 2, date, type: label, amount: amountPlain, ceiled: amount, cumulative, isBulk });
  }
  return rows;
}

function renderSchedule() {
  if (!lastResult) return;
  const { plan, plainPlan, startDate } = lastResult;
  const rows = buildScheduleRows(plan, plainPlan, startDate);
  const tbody = document.querySelector('#scheduleTable tbody');
  tbody.innerHTML = '';
  rows.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${r.idx}</td>
      <td>${formatDate(r.date)}</td>
      <td>${r.type}</td>
      <td class="num">${fmt.format(Math.round(r.amount))}</td>
      <td class="num">${fmt.format(Math.round(r.ceiled))}</td>
      <td class="num">${fmt.format(Math.round(r.cumulative))}</td>
    `;
    if (r.isBulk) tr.classList.add('bulk-row-table');
    tbody.appendChild(tr);
  });
}

function renderSummary() {
  if (!lastResult) return;
  const { plan, plainPlan } = lastResult;
  $('rDown').textContent = fmt.format(plan.fvDown);
  $('rInstallment').textContent = fmt.format(plan.fvInstallment);
  $('rNumInstall').textContent = plan.numInstallments;
  $('rFactor').textContent = plan.factor.toFixed(4);
  $('rTotal').textContent = fmt.format(Math.round(plainPlan.total));
  $('rTotalCieled').textContent = fmt.format(plan.total);
}

function calculate() {
  clearError();
  try {
    const paymentInterval = parseInt($('paymentInterval').value, 10);
    const inputs = {
      cashValue: parseFloat($('cashValue').value),
      interestRate: parseFloat($('interestRate').value) / 100,
      downPaymentPct: parseFloat($('downPayment').value) / 100,
      paymentInterval,
      years: parseInt($('years').value, 10) || 0,
      bulks: readBulks(),
    };
    const startDate = parseStartDate($('startDate').value);

    if (!(inputs.cashValue > 0)) throw new Error('Cash value must be > 0.');
    if (inputs.downPaymentPct < 0 || inputs.downPaymentPct >= 1) throw new Error('Down payment must be between 0 and <100%.');

    const plainPlan = computePlan(inputs);
    const cielDigits = parseInt($('cielDigits').value, 10);
    const plan = applyCeiling(plainPlan, cielDigits);

    lastResult = { plan, plainPlan, startDate, inputs };
    renderSummary();
    renderSchedule();
    $('resultsCard').hidden = false;
    $('resultsCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (e) {
    showError(e.message);
  }
}

function resetAll() {
  $('cashValue').value = 1000000;
  $('interestRate').value = 22;
  $('downPayment').value = 10;
  $('paymentInterval').value = 4;
  $('years').value = 5;
  $('startDate').value = todayISO();
  $('cielDigits').value = 3;
  $('bulkList').innerHTML = '';
  $('resultsCard').hidden = true;
  lastResult = null;
  clearError();
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ---------- Exports ----------

function exportExcel() {
  if (!lastResult) return;
  const { plan, plainPlan, startDate, inputs } = lastResult;
  const rows = buildScheduleRows(plan, plainPlan, startDate);

  const summary = [
    [t('cashValue'), inputs.cashValue],
    [t('interestRate'), (inputs.interestRate * 100).toFixed(2) + '%'],
    [t('downPayment'), (inputs.downPaymentPct * 100).toFixed(2) + '%'],
    [t('paymentInterval'), t({12:'monthly',4:'quarterly',2:'semiAnnually',1:'annually'}[inputs.paymentInterval])],
    [t('years'), inputs.years],
    [t('startDate'), formatDate(startDate)],
    [],
    [t('downPaymentShort'), plan.fvDown],
    [t('installmentAmount'), plan.fvInstallment],
    [t('numInstallments'), plan.numInstallments],
    [t('factor'), plan.factor.toFixed(4)],
    [t('totalPaid'), Math.round(plainPlan.total)],
    [t('totalCeiled'), plan.total],
  ];

  const scheduleHeader = [t('hash'), t('date'), t('type'), t('amount'), t('ceiled'), t('cumulative')];
  const scheduleData = rows.map(r => [
    r.idx, formatDate(r.date), r.type,
    Math.round(r.amount), Math.round(r.ceiled), Math.round(r.cumulative),
  ]);

  const wb = XLSX.utils.book_new();
  const ws1 = XLSX.utils.aoa_to_sheet(summary);
  ws1['!cols'] = [{ wch: 28 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, ws1, t('results'));

  const ws2 = XLSX.utils.aoa_to_sheet([scheduleHeader, ...scheduleData]);
  ws2['!cols'] = [{ wch: 6 }, { wch: 16 }, { wch: 22 }, { wch: 14 }, { wch: 14 }, { wch: 16 }];
  if (currentLang === 'ar') ws2['!views'] = [{ RTL: true }];
  XLSX.utils.book_append_sheet(wb, ws2, t('schedule'));

  XLSX.writeFile(wb, `payment-plan-${todayISO()}.xlsx`);
}

function intervalLabel(interval) {
  return t({ 12: 'monthly', 4: 'quarterly', 2: 'semiAnnually', 1: 'annually' }[interval] || 'monthly');
}

function updatePrintMeta() {
  const meta = $('printMeta');
  if (!meta || !lastResult) return;
  const { startDate } = lastResult;
  meta.textContent = `${t('startDate')}: ${formatDate(startDate)} · ${t('generated')}: ${formatDate(new Date())}`;
}

function exportPdf() {
  if (!lastResult) return;
  updatePrintMeta();
  window.print();
}

// ---------- Language change hook ----------

function onLanguageChange() {
  // Re-translate dynamic bulk rows
  document.querySelectorAll('#bulkList .bulk-row').forEach(row => {
    const spans = row.querySelectorAll('span[data-i18n]');
    spans.forEach(s => { s.textContent = t(s.getAttribute('data-i18n')); });
    const btn = row.querySelector('[data-i18n-title]');
    if (btn) btn.title = t(btn.getAttribute('data-i18n-title'));
  });
  // Re-render results in new language
  if (lastResult) {
    renderSummary();
    renderSchedule();
  }
}

// ---------- Tooltips ----------

function showTooltip(trigger) {
  const tip = $('tooltip');
  const key = trigger.getAttribute('data-i18n-tip');
  if (!key) return;
  tip.textContent = t(key);
  tip.hidden = false;
  // measure
  const r = trigger.getBoundingClientRect();
  const tw = tip.offsetWidth;
  const th = tip.offsetHeight;
  const margin = 8;
  const docW = document.documentElement.clientWidth;

  // Prefer below
  let top = r.bottom + window.scrollY + margin;
  let placement = 'below';
  // If would overflow viewport bottom and there's room above, flip
  if (r.bottom + th + margin + 20 > window.innerHeight && r.top - th - margin > 0) {
    top = r.top + window.scrollY - th - margin;
    placement = 'above';
  }
  // Horizontal: try to align tooltip's arrow under the trigger center
  const triggerCenterX = r.left + r.width / 2;
  let left = triggerCenterX - 20; // 20 = arrow offset within tooltip
  // Keep inside viewport
  if (left + tw > docW - 8) left = docW - tw - 8;
  if (left < 8) left = 8;
  const arrowX = Math.max(8, Math.min(tw - 16, triggerCenterX - left - 4));

  tip.style.top = top + 'px';
  tip.style.left = left + window.scrollX + 'px';
  tip.style.setProperty('--arrow-x', arrowX + 'px');
  tip.classList.remove('above', 'below');
  tip.classList.add(placement);
}

function hideTooltip() {
  const tip = $('tooltip');
  if (tip) tip.hidden = true;
}

function wireTooltips() {
  document.querySelectorAll('.help').forEach(btn => {
    if (btn.dataset.tipWired) return;
    btn.dataset.tipWired = '1';
    btn.addEventListener('mouseenter', () => showTooltip(btn));
    btn.addEventListener('mouseleave', hideTooltip);
    btn.addEventListener('focus', () => showTooltip(btn));
    btn.addEventListener('blur', hideTooltip);
    btn.addEventListener('click', (e) => { e.preventDefault(); showTooltip(btn); });
  });
}

// ---------- Wire up ----------

document.addEventListener('DOMContentLoaded', () => {
  $('startDate').value = todayISO();
  applyTranslations();
  wireTooltips();
  document.addEventListener('scroll', hideTooltip, true);
  $('addBulk').addEventListener('click', () => addBulkRow());
  $('calculate').addEventListener('click', calculate);
  $('reset').addEventListener('click', resetAll);
  $('exportPdf').addEventListener('click', exportPdf);
  $('exportXlsx').addEventListener('click', exportExcel);
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => setLanguage(btn.dataset.lang));
  });
});
