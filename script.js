const STORAGE_KEY = "personalExpenseTrackerTransactions";

const form = document.getElementById("transactionForm");
const typeInput = document.getElementById("type");
const descriptionInput = document.getElementById("description");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");
const filterInput = document.getElementById("filterType");
const searchInput = document.getElementById("search");
const transactionList = document.getElementById("transactionList");
const successModal = document.getElementById("successModal");
const successOkBtn = document.getElementById("successOkBtn");
const themeToggle = document.getElementById("themeToggle");

let transactions = loadTransactions();

function applyTheme(isDark) {
  document.body.classList.toggle("dark-mode", isDark);
  themeToggle.textContent = isDark ? "Light Mode" : "Dark Mode";
  localStorage.setItem("expenseTrackerTheme", isDark ? "dark" : "light");
}

function initializeTheme() {
  const savedTheme = localStorage.getItem("expenseTrackerTheme");
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(savedTheme ? savedTheme === "dark" : prefersDark);
}

function showSuccessMessage() {
  successModal.classList.add("show");
  successModal.setAttribute("aria-hidden", "false");
  successOkBtn.focus();
}

function hideSuccessMessage() {
  successModal.classList.remove("show");
  successModal.setAttribute("aria-hidden", "true");
}

function loadTransactions() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveTransactions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

function formatMoney(value) {
  return "LKR " + Number(value).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatDate(value) {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  return `${year}-${month}-${day}`;
}

function updateSummary() {
  const income = transactions
    .filter(item => item.type === "income")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const expenses = transactions
    .filter(item => item.type === "expense")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  document.getElementById("totalIncome").textContent = formatMoney(income);
  document.getElementById("totalExpenses").textContent = formatMoney(expenses);
  document.getElementById("currentBalance").textContent = formatMoney(income - expenses);
}

function renderTransactions() {
  const selectedType = filterInput.value;
  const searchTerm = searchInput.value.trim().toLowerCase();

  const visibleTransactions = transactions
    .filter(item => selectedType === "all" || item.type === selectedType)
    .filter(item =>
      item.description.toLowerCase().includes(searchTerm) ||
      item.category.toLowerCase().includes(searchTerm)
    )
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);

  transactionList.replaceChildren();

  if (visibleTransactions.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 6;
    cell.className = "empty";
    cell.textContent = "No transactions found.";
    row.appendChild(cell);
    transactionList.appendChild(row);
    return;
  }

  visibleTransactions.forEach(item => {
    const row = document.createElement("tr");

    const dateCell = document.createElement("td");
    dateCell.textContent = formatDate(item.date);

    const descriptionCell = document.createElement("td");
    descriptionCell.textContent = item.description;

    const typeCell = document.createElement("td");
    const badge = document.createElement("span");
    badge.className = `type-badge ${item.type === "income" ? "type-income" : "type-expense"}`;
    badge.textContent = item.type;
    typeCell.appendChild(badge);

    const categoryCell = document.createElement("td");
    categoryCell.textContent = item.category;

    const amountCell = document.createElement("td");
    amountCell.className = "amount";
    amountCell.textContent = `${item.type === "income" ? "+" : "-"} ${formatMoney(item.amount)}`;

    const actionCell = document.createElement("td");
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-btn";
    deleteButton.textContent = "Delete";
    deleteButton.setAttribute("aria-label", `Delete ${item.description}`);
    deleteButton.addEventListener("click", () => deleteTransaction(item.id));
    actionCell.appendChild(deleteButton);

    [dateCell, descriptionCell, typeCell, categoryCell, amountCell, actionCell]
      .forEach(cell => row.appendChild(cell));

    transactionList.appendChild(row);
  });
}

function deleteTransaction(id) {
  transactions = transactions.filter(item => item.id !== id);
  saveTransactions();
  updateSummary();
  renderTransactions();
}

form.addEventListener("submit", event => {
  event.preventDefault();

  const description = descriptionInput.value.trim();
  const amount = Number(amountInput.value);
  const category = categoryInput.value;
  const date = dateInput.value;

  if (!description || !category || !date || !Number.isFinite(amount) || amount <= 0) {
    alert("Please complete all fields and enter an amount greater than zero.");
    return;
  }

  const transaction = {
    id: (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    type: typeInput.value,
    description,
    amount,
    category,
    date,
    createdAt: Date.now()
  };

  transactions.push(transaction);
  saveTransactions();
  updateSummary();
  renderTransactions();

  form.reset();
  dateInput.value = new Date().toISOString().slice(0, 10);
  showSuccessMessage();
});

successOkBtn.addEventListener("click", hideSuccessMessage);
successModal.addEventListener("click", event => {
  if (event.target === successModal) {
    hideSuccessMessage();
  }
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && successModal.classList.contains("show")) {
    hideSuccessMessage();
  }
});

document.getElementById("clearForm").addEventListener("click", () => {
  // The native reset clears the fields; restore the default date afterwards.
  setTimeout(() => {
    dateInput.value = new Date().toISOString().slice(0, 10);
  }, 0);
});

themeToggle.addEventListener("click", () => {
  const isDark = !document.body.classList.contains("dark-mode");
  applyTheme(isDark);
});

filterInput.addEventListener("change", renderTransactions);
searchInput.addEventListener("input", renderTransactions);

initializeTheme();
dateInput.value = new Date().toISOString().slice(0, 10);
updateSummary();
renderTransactions();
