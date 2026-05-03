let initialBalance = parseInt(localStorage.getItem("balance")) || 0;
let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
let budget = parseInt(localStorage.getItem("budget")) || 0;
let chart;

expenses = expenses.filter(e => e.timestamp);
localStorage.setItem("expenses", JSON.stringify(expenses));

function update() {
    let spent = expenses.reduce((sum, e) => sum + e.amount, 0);
    let remaining = initialBalance - spent;

    document.getElementById("balance").innerText = "₹ " + remaining;
    document.getElementById("budgetValue").innerText = budget;
    document.getElementById("spentAmount").innerText = spent;

    if (budget > 0) {
        document.getElementById("budgetStatus").innerText =
            spent > budget ? "Exceeded ❌" : "Within Budget ✅";
        document.getElementById("budgetStatus").className =
            spent > budget ? "status-bad" : "status-ok";
    }

    renderExpenses();
    renderChart();
}

function addBalance() {
    let amount = parseInt(document.getElementById("balanceInput").value);
    if (!amount || amount <= 0) return alert("Enter valid amount");

    initialBalance += amount;
    localStorage.setItem("balance", initialBalance);

    document.getElementById("balanceInput").value = "";
    update();
}

function addExpense() {
    let amt = parseInt(document.getElementById("amount").value);
    let cat = document.getElementById("category").value;
    let desc = document.getElementById("description").value;

    if (!amt || amt <= 0) return alert("Enter valid amount");

    let now = new Date();

    expenses.push({
        amount: amt,
        category: cat,
        description: desc || "No description",
        date: now.toLocaleDateString('en-GB'),
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: now.getTime()
    });

    localStorage.setItem("expenses", JSON.stringify(expenses));

    document.getElementById("amount").value = "";
    document.getElementById("description").value = "";

    update();
}

function renderExpenses() {
    let list = document.getElementById("expenseList");
    list.innerHTML = "";

    expenses.slice().reverse().forEach(e => {
        let div = document.createElement("div");
        div.className = "expense-item";

        div.innerHTML = `
            <div class="expense-left">
                <strong>${e.category}</strong>
                <small>${e.description}</small>
                <small>${e.date} | ${e.time}</small>
            </div>
            <div>₹ ${e.amount}</div>
        `;

        list.appendChild(div);
    });
}

function renderChart() {
    let dataMap = {};
    expenses.forEach(e => {
        dataMap[e.category] = (dataMap[e.category] || 0) + e.amount;
    });

    let labels = Object.keys(dataMap);
    let data = Object.values(dataMap);

    if (chart) chart.destroy();

    let ctx = document.getElementById("expenseChart").getContext("2d");

    chart = new Chart(ctx, {
        type: 'bar',
        data: { labels: labels, datasets: [{ data: data }] },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
        }
    });
}

function clearExpenses() {
    if (confirm("Delete all transactions?")) {
        expenses = [];
        localStorage.setItem("expenses", JSON.stringify(expenses));
        update();
    }
}

function downloadPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    let now = new Date();
    let m = now.getMonth(), y = now.getFullYear();

    let pos = 10;

    doc.setFontSize(16);
    doc.text("Monthly Expense Report", 10, pos);
    pos += 12;

    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text("Date", 10, pos);
    doc.text("Category", 40, pos);
    doc.text("Description", 80, pos);
    doc.text("Amount", 170, pos);

    pos += 2;
    doc.line(10, pos, 190, pos);
    pos += 8;

    let catTotal = {};
    let grandTotal = 0;
    doc.setFont(undefined, 'normal');

    expenses.forEach(e => {
        let d = new Date(e.timestamp);

        if (d.getMonth() === m && d.getFullYear() === y) {
            let cleanCategory = e.category.replace(/[\u1000-\uFFFF]+/g, '').trim();

            let desc = e.description || "No description";
            if (desc.length > 35) desc = desc.substring(0, 32) + "...";

            catTotal[cleanCategory] = (catTotal[cleanCategory] || 0) + e.amount;
            grandTotal += e.amount;

            doc.text(e.date, 10, pos);
            doc.text(cleanCategory, 40, pos);
            doc.text(desc, 80, pos);
            doc.text("Rs. " + e.amount, 170, pos);
            pos += 8;
        }
    });

    pos += 5;
    doc.line(10, pos, 190, pos);
    pos += 10;

    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text("Category Summary:", 10, pos);
    pos += 8;

    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    for (let c in catTotal) {
        if (c) {
            doc.text(`${c}: Rs. ${catTotal[c]}`, 10, pos);
            pos += 6;
        }
    }

    pos += 4;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(`Total Monthly Expenses: Rs. ${grandTotal}`, 10, pos);

    doc.save("Monthly_Report.pdf");
}

function show(id) {
    document.querySelectorAll(".section").forEach(s => s.classList.add("hidden"));
    document.getElementById(id).classList.remove("hidden");
    if (id === "analytics") renderChart();
}

function saveBudget() {
    let val = parseInt(document.getElementById("budgetInput").value);
    if (!val || val <= 0) return alert("Enter valid budget");

    budget = val;
    localStorage.setItem("budget", budget);
    update();
}

update();
