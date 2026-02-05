// Utility: Format currency
const formatMoney = (num) => {
    return new Intl.NumberFormat('th-TH', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(num);
};

// Utility: Parse float safely
const getVal = (id) => {
    const val = parseFloat(document.getElementById(id).value.replace(/,/g, ''));
    return isNaN(val) ? 0 : val;
};

// Auto Calculate Expenses
// Logic: Expenses for salary (40(1)) are 50% but not exceeding 100,000 THB
document.getElementById('autoCalcExpenses').addEventListener('click', () => {
    const salary = getVal('salary');
    // Simplified assumption: Applying standard salary deduction rule
    // In reality, this depends heavily on income type, but this is a helper.
    let expense = salary * 0.5;
    if (expense > 100000) expense = 100000;

    document.getElementById('expenses').value = expense;
});

// Family UI Interaction
// Counter Logic
window.updateCounter = (id, change) => {
    const input = document.getElementById(id);
    let val = parseInt(input.value) || 0;
    val += change;
    if (val < 0) val = 0;
    // Cap children just for realistic UI, maybe 10?
    if (val > 10) val = 10;
    input.value = val;
};

// Selection Card Toggle
document.getElementById('cardSpouse').addEventListener('click', function (e) {
    if (e.target.tagName !== 'INPUT') { // Avoid double triggering if clicking input usually (hidden)
        const checkbox = document.getElementById('spouseCheck');
        checkbox.checked = !checkbox.checked;

        if (checkbox.checked) {
            this.classList.add('selected');
        } else {
            this.classList.remove('selected');
        }
    }
});

// Calculate Main Function
document.getElementById('calculateBtn').addEventListener('click', () => {
    // 1. Get Inputs
    const salary = getVal('salary');
    const otherIncome = getVal('otherIncome');
    const expenses = getVal('expenses');

    // Family Deductions
    const hasSpouse = document.getElementById('spouseCheck').checked;
    const childCount = parseInt(document.getElementById('childCount').value) || 0;
    const hasFather = document.getElementById('fatherCheck').checked;
    const hasMother = document.getElementById('motherCheck').checked;

    const socialSecurity = getVal('socialSecurity');
    const lifeInsurance = getVal('lifeInsurance');
    const providentFund = getVal('providentFund');
    const otherDeduction = getVal('otherDeduction');

    const totalRevenue = salary + otherIncome;

    // 2. Calculate Deductions
    // Personal deduction is fixed at 60,000
    const personalDeduction = 60000;
    const spouseDeduction = hasSpouse ? 60000 : 0;
    const childDeductionAmount = childCount * 30000;
    const parentDeduction = (hasFather ? 30000 : 0) + (hasMother ? 30000 : 0);

    // Safety caps
    const totalDeductions = personalDeduction + spouseDeduction + childDeductionAmount + parentDeduction +
        socialSecurity + lifeInsurance + providentFund + otherDeduction;

    // 3. Net Income
    // Net Income cannot be less than 0
    let netIncome = totalRevenue - expenses - totalDeductions;
    if (netIncome < 0) netIncome = 0;

    // 4. Calculate Tax (Progressive)
    const taxBrackets = [
        { limit: 150000, rate: 0 },
        { limit: 300000, rate: 0.05 },
        { limit: 500000, rate: 0.10 },
        { limit: 750000, rate: 0.15 },
        { limit: 1000000, rate: 0.20 },
        { limit: 2000000, rate: 0.25 },
        { limit: 5000000, rate: 0.30 },
        { limit: Infinity, rate: 0.35 }
    ];

    let taxPayable = 0;
    let remainingIncome = netIncome;
    let prevLimit = 0;

    const breakdownHTML = [];

    for (let i = 0; i < taxBrackets.length; i++) {
        const bracket = taxBrackets[i];
        const range = bracket.limit - prevLimit;

        let incomeInBracket = 0;
        let taxInBracket = 0;

        if (remainingIncome > 0) {
            if (bracket.limit === Infinity) {
                incomeInBracket = remainingIncome;
            } else {
                incomeInBracket = Math.min(remainingIncome, range);
            }
        }

        taxInBracket = incomeInBracket * bracket.rate;
        taxPayable += taxInBracket;
        remainingIncome -= incomeInBracket;

        // Formatting for table
        const rangeLabel = bracket.limit === Infinity
            ? `${formatMoney(prevLimit + 1)} ขึ้นไป`
            : `${formatMoney(prevLimit + 1)} - ${formatMoney(bracket.limit)}`;

        const isActive = incomeInBracket > 0;

        breakdownHTML.push(`
            <div class="breakdown-item ${isActive ? 'active' : ''}">
                <div>${rangeLabel}</div>
                <div>${(bracket.rate * 100).toFixed(0)}%</div>
                <div>${isActive ? formatMoney(taxInBracket) : '-'}</div>
            </div>
        `);

        prevLimit = bracket.limit;

        if (remainingIncome <= 0 && bracket.limit !== Infinity && i < taxBrackets.length - 1) {
            // Continue loop to print empty brackets or break?
            // Users usually like to see all brackets to see where they stopped.
            // We will continue but incomeInBracket will be 0.
        }
    }

    // 5. Display Results
    document.getElementById('netIncomeDisplay').innerText = formatMoney(netIncome);
    document.getElementById('taxPayableDisplay').innerText = formatMoney(taxPayable);
    document.getElementById('taxBreakdownList').innerHTML = breakdownHTML.join('');

    // Show and scroll
    const resultCard = document.getElementById('resultCard');
    resultCard.classList.remove('hidden');
    resultCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

// Reset
document.getElementById('resetBtn').addEventListener('click', () => {
    document.getElementById('taxForm').reset();
    document.getElementById('resultCard').classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Input Polish - Select all on focus
document.querySelectorAll('input[type="number"]').forEach(input => {
    input.addEventListener('focus', function () {
        this.select();
    });
});
