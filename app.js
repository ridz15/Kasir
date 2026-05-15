const STORAGE_KEY = "mooncake-94-data-v1";
const DEFAULT_CATEGORIES = ["Roti", "Kue", "Pastry", "Minuman"];
const OTHER_CATEGORY = "Lainnya";
const STORE_PHONE = "+6287877530387";
const STORE_INSTAGRAM = "Moncake94";
const STORE_ADDRESS = "Jl. Danau Limboto Blok C-1 no.5, RT.13/RW.5, Pejompongan, Bend. Hilir, Kecamatan Tanah Abang, Kota Jakarta Pusat, Daerah Khusus Ibukota Jakarta 10210";

const defaultProducts = [
  { id: createId(), name: "Roti Tawar", category: "Roti", price: 18000, stock: 20, minStock: 5 },
  { id: createId(), name: "Croissant Butter", category: "Pastry", price: 15000, stock: 18, minStock: 5 },
  { id: createId(), name: "Donat Cokelat", category: "Kue", price: 8000, stock: 30, minStock: 8 },
  { id: createId(), name: "Kopi Susu", category: "Minuman", price: 12000, stock: 25, minStock: 6 }
];

const API_ENABLED = location.protocol === "http:" || location.protocol === "https:";

let state = getInitialState();
let cart = [];
let activeView = "cashier";
let currentDayKey = todayKey();

const els = {
  loginScreen: document.getElementById("loginScreen"),
  loginForm: document.getElementById("loginForm"),
  loginUsername: document.getElementById("loginUsername"),
  loginPassword: document.getElementById("loginPassword"),
  logoutButton: document.getElementById("logoutButton"),
  openPasswordModal: document.getElementById("openPasswordModal"),
  passwordModal: document.getElementById("passwordModal"),
  passwordForm: document.getElementById("passwordForm"),
  currentPassword: document.getElementById("currentPassword"),
  newPassword: document.getElementById("newPassword"),
  confirmPassword: document.getElementById("confirmPassword"),
  closePasswordModal: document.getElementById("closePasswordModal"),
  openTransactionExport: document.getElementById("openTransactionExport"),
  transactionExportModal: document.getElementById("transactionExportModal"),
  transactionExportForm: document.getElementById("transactionExportForm"),
  exportStartDate: document.getElementById("exportStartDate"),
  exportEndDate: document.getElementById("exportEndDate"),
  closeTransactionExport: document.getElementById("closeTransactionExport"),
  openTransactionReport: document.getElementById("openTransactionReport"),
  transactionReportModal: document.getElementById("transactionReportModal"),
  transactionReportForm: document.getElementById("transactionReportForm"),
  reportStartDate: document.getElementById("reportStartDate"),
  reportEndDate: document.getElementById("reportEndDate"),
  closeTransactionReport: document.getElementById("closeTransactionReport"),
  navItems: document.querySelectorAll(".nav-item"),
  views: {
    cashier: document.getElementById("cashierView"),
    products: document.getElementById("productsView"),
    history: document.getElementById("historyView"),
    reports: document.getElementById("reportsView")
  },
  viewTitle: document.getElementById("viewTitle"),
  currentDate: document.getElementById("currentDate"),
  todayRevenue: document.getElementById("todayRevenue"),
  productGrid: document.getElementById("productGrid"),
  productSearch: document.getElementById("productSearch"),
  cartList: document.getElementById("cartList"),
  cartCount: document.getElementById("cartCount"),
  cartTotal: document.getElementById("cartTotal"),
  cashReceived: document.getElementById("cashReceived"),
  changeAmount: document.getElementById("changeAmount"),
  clearCart: document.getElementById("clearCart"),
  finishTransaction: document.getElementById("finishTransaction"),
  productForm: document.getElementById("productForm"),
  productName: document.getElementById("productName"),
  productCategory: document.getElementById("productCategory"),
  customCategory: document.getElementById("customCategory"),
  manualCategoryWrap: document.getElementById("manualCategoryWrap"),
  deleteCategory: document.getElementById("deleteCategory"),
  productPrice: document.getElementById("productPrice"),
  productStock: document.getElementById("productStock"),
  productMinStock: document.getElementById("productMinStock"),
  inventorySearch: document.getElementById("inventorySearch"),
  inventoryTable: document.getElementById("inventoryTable"),
  exportProducts: document.getElementById("exportProducts"),
  importProducts: document.getElementById("importProducts"),
  historyList: document.getElementById("historyList"),
  importTransactions: document.getElementById("importTransactions"),
  clearHistory: document.getElementById("clearHistory"),
  todayTransactions: document.getElementById("todayTransactions"),
  todayItemsSold: document.getElementById("todayItemsSold"),
  lowStockCount: document.getElementById("lowStockCount"),
  revenueChart: document.getElementById("revenueChart"),
  bestSellerList: document.getElementById("bestSellerList"),
  exportData: document.getElementById("exportData"),
  importData: document.getElementById("importData"),
  toast: document.getElementById("toast")
};

function getInitialState() {
  return {
    branchName: "Cabang Utama",
    products: [],
    deletedCategories: [],
    transactions: []
  };
}

function loadLocalState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return {
      branchName: "Cabang Utama",
      products: defaultProducts,
      deletedCategories: [],
      transactions: []
    };
  }

  try {
    const parsed = JSON.parse(saved);
    return {
      branchName: parsed.branchName || "Cabang Utama",
      products: Array.isArray(parsed.products) ? parsed.products : defaultProducts,
      deletedCategories: Array.isArray(parsed.deletedCategories) ? parsed.deletedCategories : [],
      transactions: Array.isArray(parsed.transactions) ? parsed.transactions : []
    };
  } catch {
    return {
      branchName: "Cabang Utama",
      products: defaultProducts,
      deletedCategories: [],
      transactions: []
    };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

async function loadState() {
  if (!API_ENABLED) {
    state = loadLocalState();
    return;
  }

  try {
    state = await apiRequest("/api/state");
  } catch {
    state = loadLocalState();
    showToast("Server database belum terbaca, sementara memakai data browser ini.");
  }
}

async function apiRequest(path, options = {}) {
  const token = sessionStorage.getItem("mooncake-94-session-token");
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Terjadi kesalahan server.");
  }
  return data;
}

async function login(event) {
  event.preventDefault();
  try {
    const data = await apiRequest("/api/login", {
      method: "POST",
      body: JSON.stringify({
        username: els.loginUsername.value.trim(),
        password: els.loginPassword.value
      })
    });
    sessionStorage.setItem("mooncake-94-session-token", data.token);
    els.loginPassword.value = "";
    els.loginScreen.classList.add("hidden");
    await loadState();
    render();
    showToast("Login berhasil.");
  } catch (error) {
    showToast(error.message);
  }
}

async function logout() {
  if (API_ENABLED) {
    try {
      await apiRequest("/api/logout", { method: "POST" });
    } catch {
      // Session may already be gone.
    }
  }

  sessionStorage.removeItem("mooncake-94-session-token");
  cart = [];
  els.loginScreen.classList.remove("hidden");
  els.loginUsername.focus();
  showToast("Logout berhasil.");
}

function openPasswordModal() {
  els.passwordModal.classList.remove("hidden");
  els.currentPassword.focus();
}

function closePasswordModal() {
  els.passwordForm.reset();
  els.passwordModal.classList.add("hidden");
}

async function changePassword(event) {
  event.preventDefault();
  const newPassword = els.newPassword.value;
  const confirmPassword = els.confirmPassword.value;

  if (newPassword.length < 6) {
    showToast("Password baru minimal 6 karakter.");
    return;
  }

  if (newPassword !== confirmPassword) {
    showToast("Konfirmasi password baru tidak sama.");
    return;
  }

  try {
    await apiRequest("/api/change-password", {
      method: "POST",
      body: JSON.stringify({
        currentPassword: els.currentPassword.value,
        newPassword
      })
    });
    closePasswordModal();
    sessionStorage.removeItem("mooncake-94-session-token");
    els.loginScreen.classList.remove("hidden");
    els.loginUsername.focus();
    showToast("Password berhasil diganti. Silakan login ulang.");
  } catch (error) {
    showToast(error.message);
  }
}

function createId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(value || 0);
}

function parseMoneyInput(value) {
  return Number(String(value || "").replace(/\D/g, "")) || 0;
}

function formatMoneyInput(value) {
  const number = parseMoneyInput(value);
  return number ? new Intl.NumberFormat("id-ID").format(number) : "";
}

function applyMoneyFormat(input) {
  input.value = formatMoneyInput(input.value);
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatDateOnly(value) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(value));
}

function todayKey(date = new Date()) {
  const localDate = new Date(date);
  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, "0");
  const day = String(localDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function localTimestampKey(date = new Date()) {
  const localDate = new Date(date);
  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, "0");
  const day = String(localDate.getDate()).padStart(2, "0");
  const hours = String(localDate.getHours()).padStart(2, "0");
  const minutes = String(localDate.getMinutes()).padStart(2, "0");
  const seconds = String(localDate.getSeconds()).padStart(2, "0");
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

function getProduct(id) {
  return state.products.find((product) => product.id === id);
}

function cartTotal() {
  return cart.reduce((total, item) => total + item.price * item.qty, 0);
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  window.setTimeout(() => els.toast.classList.remove("show"), 2200);
}

function setView(view) {
  activeView = view;
  const titles = {
    cashier: "Kasir",
    products: "Produk & Stok",
    history: "Riwayat Transaksi",
    reports: "Laporan"
  };

  els.navItems.forEach((button) => button.classList.toggle("active", button.dataset.view === view));
  Object.entries(els.views).forEach(([name, element]) => element.classList.toggle("active", name === view));
  els.viewTitle.textContent = titles[view];
  render();
}

function renderProducts() {
  const keyword = els.productSearch.value.trim().toLowerCase();
  const products = state.products.filter((product) => {
    return `${product.name} ${product.category}`.toLowerCase().includes(keyword);
  });

  if (!products.length) {
    els.productGrid.innerHTML = `<div class="empty-state">Produk tidak ditemukan.</div>`;
    return;
  }

  els.productGrid.innerHTML = products
    .map((product) => {
      const status = product.stock <= 0 ? "empty" : product.stock <= product.minStock ? "low" : "";
      const label = product.stock <= 0 ? "Habis" : `Stok ${product.stock}`;
      return `
        <button class="product-card" data-add-product="${product.id}" ${product.stock <= 0 ? "disabled" : ""}>
          <strong>${escapeHtml(product.name)}</strong>
          <span>${escapeHtml(product.category)} - ${formatCurrency(product.price)}</span>
          <span class="stock-badge ${status}">${label}</span>
        </button>
      `;
    })
    .join("");
}

function renderCart() {
  const total = cartTotal();
  const cash = parseMoneyInput(els.cashReceived.value);
  const change = cash - total;
  const isInsufficientPayment = cart.length > 0 && cash > 0 && change < 0;

  els.cartCount.textContent = cart.length ? `${cart.reduce((sum, item) => sum + item.qty, 0)} item di keranjang.` : "Belum ada produk.";
  els.cartTotal.textContent = formatCurrency(total);
  els.changeAmount.textContent = isInsufficientPayment ? `-${formatCurrency(Math.abs(change))}` : formatCurrency(Math.max(change, 0));
  els.changeAmount.classList.toggle("negative", isInsufficientPayment);

  if (!cart.length) {
    els.cartList.innerHTML = `<div class="empty-state">Klik produk di sebelah kiri untuk mulai transaksi.</div>`;
    return;
  }

  els.cartList.innerHTML = cart
    .map((item) => `
      <div class="cart-item">
        <div class="item-top">
          <div>
            <strong>${escapeHtml(item.name)}</strong>
            <div>${formatCurrency(item.price)} x ${item.qty}</div>
          </div>
          <strong>${formatCurrency(item.price * item.qty)}</strong>
        </div>
        <div class="item-actions">
          <button aria-label="Kurangi ${escapeHtml(item.name)}" data-decrease="${item.id}">-</button>
          <button aria-label="Tambah ${escapeHtml(item.name)}" data-increase="${item.id}">+</button>
          <button aria-label="Hapus ${escapeHtml(item.name)}" data-remove="${item.id}">x</button>
        </div>
      </div>
    `)
    .join("");
}

function renderInventory() {
  const keyword = els.inventorySearch.value.trim().toLowerCase();
  const products = state.products.filter((product) => `${product.name} ${product.category}`.toLowerCase().includes(keyword));

  if (!products.length) {
    els.inventoryTable.innerHTML = `<tr><td colspan="4">Belum ada produk.</td></tr>`;
    return;
  }

  els.inventoryTable.innerHTML = products
    .map((product) => {
      const stockClass = product.stock <= 0 ? "empty" : product.stock <= product.minStock ? "low" : "";
      return `
        <tr>
          <td>
            <strong>${escapeHtml(product.name)}</strong>
            <div>${escapeHtml(product.category)}</div>
          </td>
          <td>${formatCurrency(product.price)}</td>
          <td><span class="stock-badge ${stockClass}">${product.stock}</span></td>
          <td>
            <div class="stock-actions">
              <button title="Tambah 1 stok" data-stock-add="${product.id}" data-amount="1">+1</button>
              <button title="Tambah 6 stok" data-stock-add="${product.id}" data-amount="6">+6</button>
              <button title="Kurangi 1 stok" data-stock-add="${product.id}" data-amount="-1">-1</button>
              <button title="Ubah produk" data-edit-product="${product.id}">Ubah</button>
              <button title="Hapus produk" class="danger-button" data-delete-product="${product.id}">Hapus</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");
}

function getCategoryOptions() {
  const deletedCategories = new Set((state.deletedCategories || []).map((category) => category.toLowerCase()));
  const categories = [...DEFAULT_CATEGORIES, ...state.products.map((product) => product.category)]
    .map((category) => String(category || "").trim())
    .filter((category) => {
      const normalized = category.toLowerCase();
      return category && normalized !== OTHER_CATEGORY.toLowerCase() && !deletedCategories.has(normalized);
    });

  const uniqueCategories = [...new Map(categories.map((category) => [category.toLowerCase(), category])).values()];
  uniqueCategories.sort((a, b) => a.localeCompare(b, "id", { sensitivity: "base" }));
  return [...uniqueCategories, OTHER_CATEGORY];
}

function renderCategoryOptions(selectedCategory = els.productCategory.value) {
  const categoryOptions = getCategoryOptions();
  const selectedValue = String(selectedCategory || "");
  const selectedExists = categoryOptions.some((category) => category.toLowerCase() === selectedValue.toLowerCase());
  const finalSelected = selectedExists ? selectedValue : OTHER_CATEGORY;

  els.productCategory.innerHTML = categoryOptions
    .map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`)
    .join("");
  els.productCategory.value = finalSelected;
  toggleManualCategory();
}

function toggleManualCategory() {
  const isManual = els.productCategory.value === OTHER_CATEGORY;
  els.manualCategoryWrap.classList.toggle("hidden", !isManual);
  els.deleteCategory.disabled = isManual;
  if (!isManual) {
    els.customCategory.value = "";
  }
}

function renderHistory() {
  if (!state.transactions.length) {
    els.historyList.innerHTML = `<div class="empty-state">Belum ada transaksi.</div>`;
    return;
  }

  els.historyList.innerHTML = [...state.transactions]
    .reverse()
    .map((transaction) => `
      <article class="history-item">
        <div class="history-top">
          <div>
            <strong>${transaction.receiptNumber}</strong>
            <div>${formatDateTime(transaction.createdAt)}</div>
          </div>
          <strong>${formatCurrency(transaction.total)}</strong>
        </div>
        <div>${transaction.items.map((item) => `${escapeHtml(item.name)} x ${item.qty}`).join(", ")}</div>
        <button class="secondary-button" data-print-receipt="${transaction.id}">Print Ulang</button>
      </article>
    `)
    .join("");
}

function renderReports() {
  const today = todayKey();
  const todayTransactions = state.transactions.filter((transaction) => todayKey(transaction.createdAt) === today);
  const revenue = todayTransactions.reduce((sum, transaction) => sum + transaction.total, 0);
  const itemsSold = todayTransactions.reduce((sum, transaction) => {
    return sum + transaction.items.reduce((itemSum, item) => itemSum + item.qty, 0);
  }, 0);
  const lowStock = state.products.filter((product) => product.stock <= product.minStock);

  els.todayRevenue.textContent = formatCurrency(revenue);
  els.todayTransactions.textContent = todayTransactions.length;
  els.todayItemsSold.textContent = itemsSold;
  els.lowStockCount.textContent = lowStock.length;

  renderRevenueChart();
  renderBestSellers();
}

function renderRevenueChart() {
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const key = todayKey(date);
    const revenue = state.transactions
      .filter((transaction) => todayKey(transaction.createdAt) === key)
      .reduce((sum, transaction) => sum + transaction.total, 0);
    return { date, key, revenue };
  });
  const maxRevenue = Math.max(...days.map((day) => day.revenue), 1);

  els.revenueChart.innerHTML = days
    .map((day) => {
      const height = Math.max((day.revenue / maxRevenue) * 180, day.revenue ? 14 : 8);
      const label = new Intl.DateTimeFormat("id-ID", { weekday: "short" }).format(day.date);
      return `
        <div class="bar-wrap">
          <span class="bar-value">${formatCurrency(day.revenue).replace("Rp", "Rp ")}</span>
          <div class="bar" style="height: ${height}px"></div>
          <span class="bar-label">${label}</span>
        </div>
      `;
    })
    .join("");
}

function renderBestSellers() {
  const totals = new Map();
  state.transactions.forEach((transaction) => {
    transaction.items.forEach((item) => {
      totals.set(item.name, (totals.get(item.name) || 0) + item.qty);
    });
  });

  const sellers = [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  if (!sellers.length) {
    els.bestSellerList.innerHTML = `<div class="empty-state">Belum ada data penjualan.</div>`;
    return;
  }

  els.bestSellerList.innerHTML = sellers
    .map(([name, qty], index) => `
      <div class="seller-item">
        <strong>${index + 1}. ${escapeHtml(name)}</strong>
        <span>${qty} terjual</span>
      </div>
    `)
    .join("");
}

function render() {
  currentDayKey = todayKey();
  els.currentDate.textContent = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date());

  renderProducts();
  renderCart();
  renderCategoryOptions();
  renderInventory();
  renderHistory();
  renderReports();
}

function addToCart(productId) {
  const product = getProduct(productId);
  if (!product || product.stock <= 0) return;

  const existing = cart.find((item) => item.id === productId);
  const quantityInCart = existing ? existing.qty : 0;
  if (quantityInCart >= product.stock) {
    showToast("Stok produk tidak cukup.");
    return;
  }

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      qty: 1
    });
  }
  renderCart();
}

function updateCartItem(productId, action) {
  const item = cart.find((cartItem) => cartItem.id === productId);
  const product = getProduct(productId);
  if (!item || !product) return;

  if (action === "increase") {
    if (item.qty >= product.stock) {
      showToast("Stok produk tidak cukup.");
      return;
    }
    item.qty += 1;
  }

  if (action === "decrease") {
    item.qty -= 1;
  }

  if (action === "remove" || item.qty <= 0) {
    cart = cart.filter((cartItem) => cartItem.id !== productId);
  }

  renderCart();
}

async function finishTransaction() {
  const total = cartTotal();
  const cash = parseMoneyInput(els.cashReceived.value);

  if (!cart.length) {
    showToast("Keranjang masih kosong.");
    return;
  }

  if (cash < total) {
    showToast(`Uang diterima belum cukup. Masih kurang ${formatCurrency(total - cash)}.`);
    return;
  }

  const hasInsufficientStock = cart.some((item) => {
    const product = getProduct(item.id);
    return !product || product.stock < item.qty;
  });
  if (hasInsufficientStock) {
    showToast("Ada stok produk yang tidak cukup.");
    return;
  }

  const transaction = {
    id: createId(),
    receiptNumber: `TRX-${localTimestampKey()}`,
    branchName: state.branchName,
    createdAt: new Date().toISOString(),
    items: cart.map((item) => ({ ...item })),
    total,
    cash,
    change: cash - total
  };

  if (API_ENABLED) {
    try {
      state = await apiRequest("/api/transactions", {
        method: "POST",
        body: JSON.stringify(transaction)
      });
    } catch (error) {
      showToast(error.message);
      return;
    }
  } else {
    cart.forEach((item) => {
      const product = getProduct(item.id);
      product.stock -= item.qty;
    });
    state.transactions.push(transaction);
    saveState();
  }

  cart = [];
  els.cashReceived.value = "";
  render();
  const savedTransaction = state.transactions.find((item) => item.id === transaction.id) || transaction;
  printReceipt(savedTransaction);
  showToast("Transaksi selesai dan stok otomatis berkurang.");
}

function printReceipt(transaction) {
  const receiptWindow = window.open("", "_blank", "width=380,height=640");
  if (!receiptWindow) {
    showToast("Popup print diblokir browser.");
    return;
  }

  const rows = transaction.items
    .map((item) => `
      <tr>
        <td>${escapeHtml(item.name)}<br><small>${item.qty} x ${formatCurrency(item.price)}</small></td>
        <td>${formatCurrency(item.price * item.qty)}</td>
      </tr>
    `)
    .join("");

  receiptWindow.document.write(`
    <!doctype html>
    <html lang="id">
      <head>
        <meta charset="UTF-8" />
        <title>${transaction.receiptNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; width: 280px; margin: 0 auto; color: #111; }
          h1 { font-size: 20px; text-align: center; margin: 16px 0 6px; letter-spacing: 0; }
          p { text-align: center; margin: 0 0 12px; font-size: 12px; }
          .store-info { line-height: 1.35; margin-bottom: 8px; }
          .contact-row { display: flex; justify-content: center; gap: 8px; margin: 4px 0; }
          .contact-item { display: inline-flex; align-items: center; gap: 3px; white-space: nowrap; }
          .icon { width: 12px; height: 12px; display: inline-block; vertical-align: -2px; }
          .store-address { display: block; margin: 6px auto 0; max-width: 250px; }
          .receipt-meta { border-top: 1px dashed #999; border-bottom: 1px dashed #999; padding: 8px 0; margin-bottom: 8px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          td { padding: 6px 0; border-bottom: 1px dashed #bbb; vertical-align: top; }
          td:last-child { text-align: right; white-space: nowrap; }
          .total td { font-weight: bold; border-bottom: 0; }
          .receipt-note {
            margin: 14px 0 10px;
            padding: 0 8px;
            line-height: 1.35;
            font-style: italic;
          }
          .thanks { margin-top: 10px; }
          @media print { button { display: none; } body { width: auto; } }
        </style>
      </head>
      <body>
        <h1>Moncake94</h1>
        <p class="store-info">
          ${escapeHtml(transaction.branchName)}<br>
          <span class="contact-row">
            <span class="contact-item">
              <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#111" d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.9.3 2.3.5.6.2 1 .5 1.5 1s.8.9 1 1.5c.2.4.4 1.1.5 2.3.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.3 1.9-.5 2.3-.2.6-.5 1-1 1.5s-.9.8-1.5 1c-.4.2-1.1.4-2.3.5-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.9-.3-2.3-.5-.6-.2-1-.5-1.5-1s-.8-.9-1-1.5c-.2-.4-.4-1.1-.5-2.3-.1-1.3-.1-1.7-.1-4.9s0-3.6.1-4.9c.1-1.2.3-1.9.5-2.3.2-.6.5-1 1-1.5s.9-.8 1.5-1c.4-.2 1.1-.4 2.3-.5 1.3-.1 1.7-.1 4.9-.1Zm0 1.8c-3.1 0-3.5 0-4.8.1-1.1.1-1.6.2-2 .4-.5.2-.8.4-1.1.7-.4.4-.6.7-.8 1.1-.2.4-.3.9-.4 2-.1 1.3-.1 1.7-.1 4.8s0 3.5.1 4.8c.1 1.1.2 1.6.4 2 .2.5.4.8.8 1.1.4.4.7.6 1.1.8.4.2.9.3 2 .4 1.3.1 1.7.1 4.8.1s3.5 0 4.8-.1c1.1-.1 1.6-.2 2-.4.5-.2.8-.4 1.1-.8.4-.4.6-.7.8-1.1.2-.4.3-.9.4-2 .1-1.3.1-1.7.1-4.8s0-3.5-.1-4.8c-.1-1.1-.2-1.6-.4-2-.2-.5-.4-.8-.8-1.1-.4-.4-.7-.6-1.1-.7-.4-.2-.9-.3-2-.4-1.3-.1-1.7-.1-4.8-.1Zm0 3.2a4.8 4.8 0 1 1 0 9.6 4.8 4.8 0 0 1 0-9.6Zm0 1.8a3 3 0 1 0 0 6.1 3 3 0 0 0 0-6.1Zm5-3.1a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2Z"/>
              </svg>
              ${escapeHtml(STORE_INSTAGRAM)}
            </span>
            <span class="contact-item">
              <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#111" d="M20 3.9A10 10 0 0 0 3.4 15.2L2 22l7-1.3A10 10 0 0 0 20 3.9ZM12 20a8 8 0 0 1-4.1-1.1l-.3-.2-4.1.8.8-4-.2-.4A8 8 0 1 1 12 20Zm4.4-5.8c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.6.1-.2.3-.6.8-.8.9-.1.2-.3.2-.5.1-1.5-.7-2.5-1.3-3.5-3-.2-.2 0-.4.1-.5l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.7-1.6c-.2-.4-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.2-.9.9-.9 2.2s.9 2.5 1 2.7c.1.2 1.8 2.8 4.4 3.9.6.3 1.1.4 1.5.5.6.2 1.2.2 1.6.1.5-.1 1.4-.6 1.6-1.1.2-.6.2-1 .2-1.1-.1-.1-.3-.2-.5-.3Z"/>
              </svg>
              ${escapeHtml(STORE_PHONE)}
            </span>
          </span>
          <span class="store-address">${escapeHtml(STORE_ADDRESS)}</span>
        </p>
        <p class="receipt-meta">${transaction.receiptNumber}<br>${formatDateTime(transaction.createdAt)}</p>
        <table>
          ${rows}
          <tr class="total"><td>Total</td><td>${formatCurrency(transaction.total)}</td></tr>
          <tr><td>Tunai</td><td>${formatCurrency(transaction.cash)}</td></tr>
          <tr><td>Kembalian</td><td>${formatCurrency(transaction.change)}</td></tr>
        </table>
        <p class="receipt-note">
          "Jika makanan ini terasa lezat ucapkanlah Maa Syaa Allah Tabarakallah Karena Hanya Allah SWT yang pantas di puji"
        </p>
        <p class="thanks">Terima kasih</p>
        <button onclick="window.print()">Print</button>
        <script>window.onload = () => window.print();<\/script>
      </body>
    </html>
  `);
  receiptWindow.document.close();
}

async function saveProduct(event) {
  event.preventDefault();
  const name = els.productName.value.trim();
  const category = els.productCategory.value === OTHER_CATEGORY
    ? els.customCategory.value.trim()
    : els.productCategory.value;
  const price = parseMoneyInput(els.productPrice.value);
  const stock = Number(els.productStock.value || 0);
  const minStock = Number(els.productMinStock.value || 0);

  if (!name || !category || price <= 0) {
    showToast("Nama, kategori, dan harga produk wajib diisi.");
    return;
  }

  const editingId = els.productForm.dataset.editingId;
  const productPayload = {
    id: editingId || createId(),
    name,
    category,
    price,
    stock,
    minStock
  };

  if (editingId) {
    if (API_ENABLED) {
      try {
        state = await apiRequest("/api/products", {
          method: "POST",
          body: JSON.stringify(productPayload)
        });
      } catch (error) {
        showToast(error.message);
        return;
      }
    } else {
      const product = getProduct(editingId);
      if (product) {
        product.name = name;
        product.category = category;
        product.price = price;
        product.stock = stock;
        product.minStock = minStock;
      }
      saveState();
    }
    delete els.productForm.dataset.editingId;
    showToast("Produk berhasil diubah.");
  } else {
    if (API_ENABLED) {
      try {
        state = await apiRequest("/api/products", {
          method: "POST",
          body: JSON.stringify(productPayload)
        });
      } catch (error) {
        showToast(error.message);
        return;
      }
    } else {
      state.products.push(productPayload);
      saveState();
    }
    showToast("Produk baru berhasil ditambahkan.");
  }

  els.productForm.reset();
  els.productMinStock.value = 5;
  els.customCategory.value = "";
  render();
}

function editProduct(productId) {
  const product = getProduct(productId);
  if (!product) return;

  els.productForm.dataset.editingId = product.id;
  els.productName.value = product.name;
  renderCategoryOptions(product.category);
  if (els.productCategory.value === OTHER_CATEGORY && product.category !== OTHER_CATEGORY) {
    els.customCategory.value = product.category;
  }
  els.productPrice.value = formatMoneyInput(product.price);
  els.productStock.value = product.stock;
  els.productMinStock.value = product.minStock;
  els.productName.focus();
  showToast("Data produk siap diubah di form kiri.");
}

async function deleteProduct(productId) {
  const product = getProduct(productId);
  if (!product) return;

  const confirmed = window.confirm(`Hapus produk "${product.name}"? Jika produk pernah terjual, produk tidak dihapus dari riwayat dan stok hanya dibuat 0.`);
  if (!confirmed) return;

  if (API_ENABLED) {
    try {
      state = await apiRequest(`/api/products/${encodeURIComponent(productId)}`, {
        method: "DELETE"
      });
    } catch (error) {
      showToast(error.message);
      return;
    }
  } else {
    const usedInTransaction = state.transactions.some((transaction) => transaction.items.some((item) => item.id === productId));
    if (usedInTransaction) {
      showToast("Produk pernah terjual, stok dibuat 0 agar riwayat tetap aman.");
      product.stock = 0;
    } else {
      state.products = state.products.filter((item) => item.id !== productId);
    }
    saveState();
  }

  cart = cart.filter((item) => item.id !== productId);
  render();
}

async function clearHistory() {
  if (!state.transactions.length) {
    showToast("Belum ada riwayat transaksi.");
    return;
  }

  const confirmed = window.confirm(
    "Peringatan: semua riwayat transaksi akan dihapus permanen dari aplikasi ini. Produk dan stok tetap tersimpan. Lanjutkan?"
  );

  if (!confirmed) return;

  if (API_ENABLED) {
    try {
      state = await apiRequest("/api/transactions", { method: "DELETE" });
    } catch (error) {
      showToast(error.message);
      return;
    }
  } else {
    state.transactions = [];
    saveState();
  }

  render();
  showToast("Semua riwayat transaksi berhasil dihapus.");
}

async function deleteSelectedCategory() {
  const category = els.productCategory.value;
  if (!category || category === OTHER_CATEGORY) {
    showToast("Pilih kategori yang ingin dihapus.");
    return;
  }

  const isUsed = state.products.some((product) => product.category.toLowerCase() === category.toLowerCase());
  if (isUsed) {
    showToast("Kategori masih dipakai produk, ubah produknya dulu sebelum hapus kategori.");
    return;
  }

  const confirmed = window.confirm(`Hapus kategori "${category}" dari daftar pilihan?`);
  if (!confirmed) return;

  if (API_ENABLED) {
    try {
      state = await apiRequest("/api/categories/delete", {
        method: "POST",
        body: JSON.stringify({ category })
      });
    } catch (error) {
      showToast(error.message);
      return;
    }
  } else {
    const deletedCategories = new Set((state.deletedCategories || []).map((item) => item.toLowerCase()));
    deletedCategories.add(category.toLowerCase());
    state.deletedCategories = [...deletedCategories];
    saveState();
  }

  renderCategoryOptions();
  showToast("Kategori berhasil dihapus dari daftar pilihan.");
}

async function changeStock(productId, amount) {
  const product = getProduct(productId);
  if (!product) return;

  if (API_ENABLED) {
    try {
      state = await apiRequest(`/api/products/${encodeURIComponent(productId)}/stock`, {
        method: "POST",
        body: JSON.stringify({ amount })
      });
    } catch (error) {
      showToast(error.message);
      return;
    }
  } else {
    product.stock = Math.max(0, product.stock + amount);
    saveState();
  }

  render();
  const updatedProduct = getProduct(productId) || product;
  showToast(`Stok ${updatedProduct.name} sekarang ${updatedProduct.stock}.`);
}

function exportData() {
  downloadJson(`backup-penuh-moncake94-${todayKey()}.json`, {
    backupType: "full",
    exportedAt: new Date().toISOString(),
    data: state
  });
}

function exportProducts() {
  downloadJson(`backup-produk-stok-moncake94-${todayKey()}.json`, {
    backupType: "products",
    exportedAt: new Date().toISOString(),
    data: {
      branchName: state.branchName,
      products: state.products,
      deletedCategories: state.deletedCategories || []
    }
  });
}

function downloadJson(filename, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function openTransactionExportModal() {
  const today = todayKey();
  els.exportStartDate.value = today;
  els.exportEndDate.value = today;
  els.transactionExportModal.classList.remove("hidden");
  els.exportStartDate.focus();
}

function closeTransactionExportModal() {
  els.transactionExportForm.reset();
  els.transactionExportModal.classList.add("hidden");
}

function openTransactionReportModal() {
  const today = todayKey();
  els.reportStartDate.value = today;
  els.reportEndDate.value = today;
  els.transactionReportModal.classList.remove("hidden");
  els.reportStartDate.focus();
}

function closeTransactionReportModal() {
  els.transactionReportForm.reset();
  els.transactionReportModal.classList.add("hidden");
}

function exportTransactionHistory(event) {
  event.preventDefault();
  const startDate = els.exportStartDate.value;
  const endDate = els.exportEndDate.value;

  if (!startDate || !endDate) {
    showToast("Tanggal awal dan akhir wajib diisi.");
    return;
  }

  if (startDate > endDate) {
    showToast("Tanggal awal tidak boleh lebih besar dari tanggal akhir.");
    return;
  }

  const transactions = state.transactions.filter((transaction) => {
    const key = todayKey(transaction.createdAt);
    return key >= startDate && key <= endDate;
  });

  if (!transactions.length) {
    showToast("Tidak ada transaksi pada rentang tanggal tersebut.");
    return;
  }

  downloadJson(`backup-riwayat-moncake94-${startDate}-sd-${endDate}.json`, {
    backupType: "transactions",
    exportedAt: new Date().toISOString(),
    dateRange: { startDate, endDate },
    data: {
      branchName: state.branchName,
      transactions
    }
  });
  closeTransactionExportModal();
  showToast("Riwayat transaksi berhasil dibackup.");
}

function exportTransactionReport(event) {
  event.preventDefault();
  const startDate = els.reportStartDate.value;
  const endDate = els.reportEndDate.value;

  if (!startDate || !endDate) {
    showToast("Tanggal awal dan akhir wajib diisi.");
    return;
  }

  if (startDate > endDate) {
    showToast("Tanggal awal tidak boleh lebih besar dari tanggal akhir.");
    return;
  }

  const transactions = state.transactions.filter((transaction) => {
    const key = todayKey(transaction.createdAt);
    return key >= startDate && key <= endDate;
  });

  if (!transactions.length) {
    showToast("Tidak ada transaksi pada rentang tanggal tersebut.");
    return;
  }

  const rows = [
    ["Tanggal", "Jam", "Nomor Struk", "Produk", "Qty", "Harga Satuan", "Subtotal", "Total Transaksi", "Tunai", "Kembalian"]
  ];

  transactions.forEach((transaction) => {
    const date = new Date(transaction.createdAt);
    const dateText = formatDateOnly(transaction.createdAt);
    const timeText = new Intl.DateTimeFormat("id-ID", {
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);

    transaction.items.forEach((item, index) => {
      rows.push([
        dateText,
        timeText,
        transaction.receiptNumber,
        item.name,
        item.qty,
        item.price,
        item.price * item.qty,
        index === 0 ? transaction.total : "",
        index === 0 ? transaction.cash : "",
        index === 0 ? transaction.change : ""
      ]);
    });
  });

  const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\r\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `laporan-transaksi-moncake94-${startDate}-sd-${endDate}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  closeTransactionReportModal();
  showToast("Laporan CSV berhasil diexport.");
}

function escapeCsv(value) {
  const text = String(value ?? "");
  if (/[",\r\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const parsed = JSON.parse(reader.result);
      const importedState = parseFullBackup(parsed);

      if (API_ENABLED) {
        state = await apiRequest("/api/import", {
          method: "POST",
          body: JSON.stringify(importedState)
        });
      } else {
        state = importedState;
        saveState();
      }

      cart = [];
      render();
      showToast("Backup penuh berhasil diimport.");
    } catch (error) {
      showToast(error.message || "File backup tidak sesuai.");
    }
  };
  reader.readAsText(file);
  event.target.value = "";
}

function importTransactions(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const transactionState = parseTransactionsBackup(JSON.parse(reader.result));
      const existingIds = new Set(state.transactions.map((transaction) => transaction.id));
      const mergedTransactions = [
        ...state.transactions,
        ...transactionState.transactions.filter((transaction) => !existingIds.has(transaction.id))
      ];

      const importedState = {
        ...state,
        branchName: transactionState.branchName || state.branchName,
        transactions: mergedTransactions
      };

      if (API_ENABLED) {
        state = await apiRequest("/api/import", {
          method: "POST",
          body: JSON.stringify(importedState)
        });
      } else {
        state = importedState;
        saveState();
      }

      render();
      showToast("Riwayat transaksi berhasil diimport.");
    } catch (error) {
      showToast(error.message || "File riwayat transaksi tidak sesuai.");
    }
  };
  reader.readAsText(file);
  event.target.value = "";
}

function importProducts(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const productState = parseProductsBackup(JSON.parse(reader.result));
      const importedState = {
        ...state,
        branchName: productState.branchName || state.branchName,
        products: productState.products,
        deletedCategories: productState.deletedCategories || []
      };

      if (API_ENABLED) {
        state = await apiRequest("/api/import", {
          method: "POST",
          body: JSON.stringify(importedState)
        });
      } else {
        state = importedState;
        saveState();
      }

      cart = [];
      render();
      showToast("Produk dan stok berhasil diimport.");
    } catch (error) {
      showToast(error.message || "File produk dan stok tidak sesuai.");
    }
  };
  reader.readAsText(file);
  event.target.value = "";
}

function parseFullBackup(parsed) {
  if (parsed.backupType !== "full" || !parsed.data) {
    throw new Error("File ini bukan backup penuh.");
  }

  const data = parsed.data;
  if (!Array.isArray(data.products) || !Array.isArray(data.transactions)) {
    throw new Error("Isi backup penuh tidak sesuai.");
  }

  return {
    branchName: data.branchName || "Cabang Utama",
    products: data.products,
    deletedCategories: Array.isArray(data.deletedCategories) ? data.deletedCategories : [],
    transactions: data.transactions
  };
}

function parseProductsBackup(parsed) {
  if (parsed.backupType !== "products" || !parsed.data) {
    throw new Error("File ini bukan backup produk dan stok.");
  }

  const data = parsed.data;
  if (!Array.isArray(data.products)) {
    throw new Error("Isi backup produk dan stok tidak sesuai.");
  }

  return {
    branchName: data.branchName || "Cabang Utama",
    products: data.products,
    deletedCategories: Array.isArray(data.deletedCategories) ? data.deletedCategories : []
  };
}

function parseTransactionsBackup(parsed) {
  if (parsed.backupType !== "transactions" || !parsed.data) {
    throw new Error("File ini bukan backup riwayat transaksi.");
  }

  const data = parsed.data;
  if (!Array.isArray(data.transactions)) {
    throw new Error("Isi backup riwayat transaksi tidak sesuai.");
  }

  return {
    branchName: data.branchName || "Cabang Utama",
    transactions: data.transactions
  };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

els.navItems.forEach((button) => {
  button.addEventListener("click", () => setView(button.dataset.view));
});

els.productGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-add-product]");
  if (button) addToCart(button.dataset.addProduct);
});

els.cartList.addEventListener("click", (event) => {
  const increase = event.target.closest("[data-increase]");
  const decrease = event.target.closest("[data-decrease]");
  const remove = event.target.closest("[data-remove]");
  if (increase) updateCartItem(increase.dataset.increase, "increase");
  if (decrease) updateCartItem(decrease.dataset.decrease, "decrease");
  if (remove) updateCartItem(remove.dataset.remove, "remove");
});

els.inventoryTable.addEventListener("click", (event) => {
  const stockButton = event.target.closest("[data-stock-add]");
  const editButton = event.target.closest("[data-edit-product]");
  const deleteButton = event.target.closest("[data-delete-product]");

  if (stockButton) changeStock(stockButton.dataset.stockAdd, Number(stockButton.dataset.amount));
  if (editButton) editProduct(editButton.dataset.editProduct);
  if (deleteButton) deleteProduct(deleteButton.dataset.deleteProduct);
});

els.historyList.addEventListener("click", (event) => {
  const printButton = event.target.closest("[data-print-receipt]");
  if (!printButton) return;
  const transaction = state.transactions.find((item) => item.id === printButton.dataset.printReceipt);
  if (transaction) printReceipt(transaction);
});

els.loginForm.addEventListener("submit", login);
els.logoutButton.addEventListener("click", logout);
els.openPasswordModal.addEventListener("click", openPasswordModal);
els.closePasswordModal.addEventListener("click", closePasswordModal);
els.passwordForm.addEventListener("submit", changePassword);
els.openTransactionExport.addEventListener("click", openTransactionExportModal);
els.closeTransactionExport.addEventListener("click", closeTransactionExportModal);
els.transactionExportForm.addEventListener("submit", exportTransactionHistory);
els.openTransactionReport.addEventListener("click", openTransactionReportModal);
els.closeTransactionReport.addEventListener("click", closeTransactionReportModal);
els.transactionReportForm.addEventListener("submit", exportTransactionReport);
els.productForm.addEventListener("submit", saveProduct);
els.productCategory.addEventListener("change", toggleManualCategory);
els.deleteCategory.addEventListener("click", deleteSelectedCategory);
els.productPrice.addEventListener("input", () => applyMoneyFormat(els.productPrice));
els.productSearch.addEventListener("input", renderProducts);
els.inventorySearch.addEventListener("input", renderInventory);
els.cashReceived.addEventListener("input", () => {
  applyMoneyFormat(els.cashReceived);
  renderCart();
});
els.clearCart.addEventListener("click", () => {
  cart = [];
  renderCart();
});
els.finishTransaction.addEventListener("click", finishTransaction);
els.clearHistory.addEventListener("click", clearHistory);
els.exportData.addEventListener("click", exportData);
els.importData.addEventListener("change", importData);
els.exportProducts.addEventListener("click", exportProducts);
els.importProducts.addEventListener("change", importProducts);
els.importTransactions.addEventListener("change", importTransactions);

initApp();

async function initApp() {
  if (!API_ENABLED) {
    els.loginScreen.classList.add("hidden");
    await loadState();
    render();
    return;
  }

  const token = sessionStorage.getItem("mooncake-94-session-token");
  if (!token) {
    els.loginScreen.classList.remove("hidden");
    els.loginUsername.focus();
    return;
  }

  try {
    const session = await apiRequest("/api/session");
    if (!session.authenticated) {
      sessionStorage.removeItem("mooncake-94-session-token");
      els.loginScreen.classList.remove("hidden");
      els.loginUsername.focus();
      return;
    }

    els.loginScreen.classList.add("hidden");
    await loadState();
    render();
  } catch {
    sessionStorage.removeItem("mooncake-94-session-token");
    els.loginScreen.classList.remove("hidden");
    els.loginUsername.focus();
  }
}

setInterval(() => {
  const latestDayKey = todayKey();
  if (latestDayKey !== currentDayKey) {
    render();
    showToast("Tanggal sudah berganti, laporan hari ini diperbarui.");
    return;
  }

  els.currentDate.textContent = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date());
  renderReports();
}, 60000);
