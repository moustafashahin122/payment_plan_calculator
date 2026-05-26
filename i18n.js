const I18N = {
  en: {
    title: 'Payment Plan Calculator',
    subtitle: 'Build an installment plan with down payment, custom payments, and a target interest (discount) rate.',
    planParams: 'Plan Parameters',
    cashValue: 'Cash Value',
    interestRate: 'Interest Rate (annual %)',
    downPayment: 'Down Payment (%)',
    paymentInterval: 'Payment Interval',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    semiAnnually: 'Semi-Annually',
    annually: 'Annually',
    years: 'Years',
    startDate: 'Start Date',
    roundUpTo: 'Round Up To',
    noRounding: 'No rounding',
    nearest10: 'Nearest 10',
    nearest100: 'Nearest 100',
    nearest1k: 'Nearest 1,000',
    nearest10k: 'Nearest 10,000',
    nearest100k: 'Nearest 100,000',
    bulkPayments: 'Custom Payments',
    addBulk: '+ Add Custom Payment',
    calculate: 'Calculate',
    reset: 'Reset',
    results: 'Results',
    exportPdf: 'Print / Save as PDF',
    generated: 'Generated',
    exportExcel: 'Export Excel',
    downPaymentShort: 'Down Payment',
    installmentAmount: 'Installment Amount',
    numInstallments: '# of Installments',
    factor: 'Factor (Total / Cash)',
    totalPaid: 'Total Paid',
    totalCeiled: 'Total (Ceiled)',
    schedule: 'Payment Schedule',
    hash: '#',
    date: 'Date',
    type: 'Type',
    amount: 'Amount',
    ceiled: 'Ceiled',
    cumulative: 'Cumulative',
    footer: 'Static calculator — runs entirely in your browser.',
    bulkAmountPct: 'Amount %',
    bulkPaymentNo: 'Payment #',
    remove: 'Remove',
    downPaymentRow: 'Down Payment',
    installment: 'Installment',
    bulkSuffix: '+ Custom',

    // Field tooltips
    cashValueTip: 'The price if the buyer paid in full today (the present value). All future payments are scaled so their NPV equals this value at the chosen interest rate.',
    interestRateTip: 'Annual discount rate used to compute present value. Higher rate → larger total payment. Enter as a percentage (e.g., 22 = 22%/year).',
    downPaymentTip: 'Upfront payment as a percentage of the cash value. Paid on the Start Date before any installments. Example: 10 means 10% upfront.',
    paymentIntervalTip: 'How often installments are paid. The rate per period is annual rate ÷ payments per year (e.g., 22% annual ÷ 4 = 5.5% per quarter).',
    yearsTip: 'Total plan duration in years. Number of installments = Years × payments per year (e.g., 5 years quarterly = 20 installments).',
    startDateTip: 'Date the down payment is made. The 1st installment occurs one interval later, and each subsequent installment follows the interval.',
    roundUpToTip: 'Rounds each payment UP to the chosen step (e.g., nearest 1,000) for customer-friendly amounts. Total paid will be slightly higher than the raw NPV-balanced number.',
    customPaymentsTip: 'Optional extra lump-sum payments added on top of a specific installment. Each is a % of cash value applied at installment #N. Useful for balloon or seasonal payments.',

    // Algorithm section
    howItWorks: 'How it works (technical details)',
    algoIntro: 'The calculator uses Net Present Value (NPV) logic: the present value of all future payments, discounted at the chosen rate, equals the entered Cash Value.',
    algoStep1Title: 'Step 1 — Build a percentage cashflow',
    algoStep1: 'We construct a template cashflow in percentages. Position 0 is the down payment. Positions 1..N are equal installments. Custom payments are added on top of their respective positions.',
    algoStep2Title: 'Step 2 — Compute factor via NPV',
    algoStep2: 'We compute the Net Present Value of that cashflow, then divide the sum of cashflow by the NPV to get the factor (the value multiplier).',
    algoStep3Title: 'Step 3 — Convert to amounts',
    algoStep3: 'Future Value (FV) = factor × Cash Value. Each individual payment is its percentage × FV.',
    algoStep4Title: 'Step 4 — Round up (optional)',
    algoStep4: 'For customer-friendly amounts, each payment is rounded UP to the nearest 10ⁿ. This makes the displayed total slightly higher than the raw NPV-balanced total.',
    exampleLabel: 'Example',
    algoExample1: 'Cash Value = 1,000,000 · 22%/year · Quarterly · 5 years · 10% down · no custom payments.',
    algoExample2: 'Rate per period = 0.22 ÷ 4 = 0.055 per quarter. # of installments = 5 × 4 = 20. Each installment % = (1 − 0.10) ÷ 20 = 4.5%.',
    algoExample3: 'Factor evaluates to ≈ 1.486, so Total ≈ 1,486,000. Down payment = 100,000 and each installment ≈ 67,000 (before rounding).',
    algoNoteTitle: 'Why this works',
    algoNote: 'NPV guarantees that, at the chosen interest rate, the discounted sum of every scheduled payment equals today\'s Cash Value. This is the same math used in mortgage and lease contracts.',
  },
  ar: {
    title: 'حاسبة خطة السداد',
    subtitle: 'أنشئ خطة أقساط مع دفعة مقدمة ودفعات مخصصة ومعدل فائدة مستهدف.',
    planParams: 'معلمات الخطة',
    cashValue: 'القيمة النقدية',
    interestRate: 'معدل الفائدة (سنوي %)',
    downPayment: 'الدفعة المقدمة (%)',
    paymentInterval: 'فترة الدفع',
    monthly: 'شهري',
    quarterly: 'ربع سنوي',
    semiAnnually: 'نصف سنوي',
    annually: 'سنوي',
    years: 'السنوات',
    startDate: 'تاريخ البداية',
    roundUpTo: 'التقريب إلى',
    noRounding: 'بدون تقريب',
    nearest10: 'أقرب 10',
    nearest100: 'أقرب 100',
    nearest1k: 'أقرب 1,000',
    nearest10k: 'أقرب 10,000',
    nearest100k: 'أقرب 100,000',
    bulkPayments: 'دفعات مخصصة',
    addBulk: '+ إضافة دفعة مخصصة',
    calculate: 'احسب',
    reset: 'إعادة تعيين',
    results: 'النتائج',
    exportPdf: 'طباعة / حفظ كـ PDF',
    generated: 'تاريخ الإنشاء',
    exportExcel: 'تصدير Excel',
    downPaymentShort: 'الدفعة المقدمة',
    installmentAmount: 'قيمة القسط',
    numInstallments: 'عدد الأقساط',
    factor: 'المعامل (الإجمالي / النقدي)',
    totalPaid: 'الإجمالي المدفوع',
    totalCeiled: 'الإجمالي (مقرّب)',
    schedule: 'جدول الدفعات',
    hash: '#',
    date: 'التاريخ',
    type: 'النوع',
    amount: 'المبلغ',
    ceiled: 'المقرّب',
    cumulative: 'التراكمي',
    footer: 'حاسبة ثابتة — تعمل بالكامل في متصفحك.',
    bulkAmountPct: 'المبلغ %',
    bulkPaymentNo: 'رقم الدفعة',
    remove: 'حذف',
    downPaymentRow: 'الدفعة المقدمة',
    installment: 'قسط',
    bulkSuffix: '+ دفعة مخصصة',

    // Field tooltips
    cashValueTip: 'السعر إذا دفع المشتري بالكامل اليوم (القيمة الحالية). يتم تحجيم جميع الدفعات المستقبلية بحيث يساوي صافي قيمتها الحالية هذه القيمة عند معدل الفائدة المختار.',
    interestRateTip: 'معدل الخصم السنوي المستخدم لحساب القيمة الحالية. كلما زاد المعدل زاد إجمالي الدفع. أدخله كنسبة مئوية (مثل 22 = 22% سنويًا).',
    downPaymentTip: 'دفعة مقدمة كنسبة من القيمة النقدية. تُدفع في تاريخ البداية قبل أي أقساط. مثال: 10 تعني 10% مقدمًا.',
    paymentIntervalTip: 'تكرار دفع الأقساط. معدل الفترة = المعدل السنوي ÷ عدد الدفعات في السنة (مثل 22% ÷ 4 = 5.5% لكل ربع).',
    yearsTip: 'إجمالي مدة الخطة بالسنوات. عدد الأقساط = السنوات × عدد الدفعات في السنة (مثل 5 سنوات ربع سنوي = 20 قسط).',
    startDateTip: 'تاريخ دفع المقدم. يحدث القسط الأول بعد فترة واحدة، وكل قسط لاحق يتبع الفترة.',
    roundUpToTip: 'يقرّب كل دفعة لأعلى إلى الخطوة المختارة (مثل أقرب 1,000) لمبالغ مريحة للعميل. سيكون الإجمالي المدفوع أعلى قليلاً من رقم صافي القيمة الحالية المتوازن.',
    customPaymentsTip: 'دفعات إضافية اختيارية تُضاف فوق قسط محدد. كل دفعة هي نسبة من القيمة النقدية تُطبق عند القسط رقم N. مفيدة للدفعات الموسمية أو البالونية.',

    // Algorithm section
    howItWorks: 'كيف يعمل (تفاصيل تقنية)',
    algoIntro: 'تستخدم الحاسبة منطقًا قائمًا على صافي القيمة الحالية (NPV) لضمان أن تساوي القيمة الحالية لجميع الدفعات المستقبلية القيمة النقدية المُدخلة عند معدل الفائدة المحدد.',
    algoStep1Title: 'الخطوة 1 — بناء التدفق النقدي بالنسب',
    algoStep1: 'نبدأ بـ "تدفق نقدي قالب" بنسب مئوية. الموضع 0 هو الدفعة المقدمة. المواضع 1..N هي الأقساط المتساوية. الدفعات المخصصة تُضاف فوق مواضعها.',
    algoStep2Title: 'الخطوة 2 — حساب المعامل عبر NPV',
    algoStep2: 'نحسب صافي القيمة الحالية للتدفق ثم نقسم مجموع التدفق على NPV للحصول على المعامل (مضاعف القيمة).',
    algoStep3Title: 'الخطوة 3 — التحويل إلى مبالغ',
    algoStep3: 'القيمة المستقبلية (FV) = المعامل × القيمة النقدية. كل دفعة هي نسبتها × FV.',
    algoStep4Title: 'الخطوة 4 — التقريب لأعلى (اختياري)',
    algoStep4: 'لمبالغ مريحة للعميل، يتم تقريب كل دفعة لأعلى إلى أقرب 10ⁿ. هذا يجعل الإجمالي أعلى قليلاً من إجمالي NPV الأصلي.',
    exampleLabel: 'مثال',
    algoExample1: 'قيمة نقدية = 1,000,000 · معدل 22%/سنوي · ربع سنوي · 5 سنوات · مقدم 10% · بدون دفعات مخصصة.',
    algoExample2: 'معدل الفترة = 0.22 ÷ 4 = 0.055 لكل ربع. عدد الأقساط = 5 × 4 = 20. نسبة كل قسط = (1 − 0.10) ÷ 20 = 4.5%.',
    algoExample3: 'يصبح المعامل ≈ 1.486 ، فإذا كانت القيمة النقدية 1,000,000 → الإجمالي ≈ 1,486,000. الدفعة المقدمة = 100,000 وكل قسط ≈ 67,000 (قبل التقريب).',
    algoNoteTitle: 'لماذا يعمل هذا؟',
    algoNote: 'يضمن صافي القيمة الحالية أن الجدول النقدي اليوم يساوي القيمة النقدية. هذا هو نفس الأساس الرياضي المستخدم في عقود التمويل العقاري والتأجير.',
  },
};

let currentLang = 'en';

function t(key) {
  return (I18N[currentLang] && I18N[currentLang][key]) || I18N.en[key] || key;
}

function applyTranslations() {
  document.documentElement.lang = currentLang;
  document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
  document.title = t('title');
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const key = el.getAttribute('data-i18n-html');
    el.innerHTML = t(key);
  });
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === currentLang);
  });
}

function setLanguage(lang) {
  currentLang = lang;
  applyTranslations();
  if (typeof onLanguageChange === 'function') onLanguageChange();
}
