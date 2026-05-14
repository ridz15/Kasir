const STORAGE_KEY = "mooncake-94-data-v1";

const defaultProducts = [
  { id: crypto.randomUUID(), name: "Roti Tawar", category: "Roti", price: 18000, stock: 20, minStock: 5 },
  { id: crypto.randomUUID(), name: "Croissant Butter", category: "Pastry", price: 15000, stock: 18, minStock: 5 },
  { id: crypto.randomUUID(), name: "Donat Cokelat", category: "Kue", price: 8000, stock: 30, minStock: 8 },
  { id: crypto.randomUUID(), name: "Kopi Susu", category: "Minuman", price: 12000, stock: 25, minStock: 6 }
];

let state = loadState();
let cart = [];
let activeView = "cashier";
let currentDayKey = todayKey();

const els = {
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
  productPrice: document.getElementById("productPrice"),
  productStock: document.getElementById("productStock"),
  productMinStock: document.getElementById("productMinStock"),
  inventorySearch: document.getElementById("inventorySearch"),
  inventoryTable: document.getElementById("inventoryTable"),
  historyList: document.getElementById("historyList"),
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

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return {
      branchName: "Cabang Utama",
      products: defaultProducts,
      transactions: []
    };
  }

  try {
    const parsed = JSON.parse(saved);
    return {
      branchName: parsed.branchName || "Cabang Utama",
      products: Array.isArray(parsed.products) ? parsed.products : defaultProducts,
      transactions: Array.isArray(parsed.transactions) ? parsed.transactions : []
    };
  } catch {
    return {
      branchName: "Cabang Utama",
      products: defaultProducts,
      transactions: []
    };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function formatCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(value || 0);
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
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
  const cash = Number(els.cashReceived.value || 0);
  const change = Math.max(cash - total, 0);

  els.cartCount.textContent = cart.length ? `${cart.reduce((sum, item) => sum + item.qty, 0)} item di keranjang.` : "Belum ada produk.";
  els.cartTotal.textContent = formatCurrency(total);
  els.changeAmount.textContent = formatCurrency(change);

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
  const todayTransactions = state.transactions.filter((transaction) => transaction.createdAt.slice(0, 10) === today);
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
      .filter((transaction) => transaction.createdAt.slice(0, 10) === key)
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

function finishTransaction() {
  const total = cartTotal();
  const cash = Number(els.cashReceived.value || 0);

  if (!cart.length) {
    showToast("Keranjang masih kosong.");
    return;
  }

  if (cash < total) {
    showToast("Uang diterima belum cukup.");
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

  cart.forEach((item) => {
    const product = getProduct(item.id);
    product.stock -= item.qty;
  });

  const transaction = {
    id: crypto.randomUUID(),
    receiptNumber: `TRX-${new Date().toISOString().replace(/\D/g, "").slice(0, 14)}`,
    branchName: state.branchName,
    createdAt: new Date().toISOString(),
    items: cart.map((item) => ({ ...item })),
    total,
    cash,
    change: cash - total
  };

  state.transactions.push(transaction);
  saveState();
  cart = [];
  els.cashReceived.value = "";
  render();
  printReceipt(transaction);
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
          h1 { font-size: 18px; text-align: center; margin: 18px 0 4px; }
          p { text-align: center; margin: 0 0 12px; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          td { padding: 6px 0; border-bottom: 1px dashed #bbb; vertical-align: top; }
          td:last-child { text-align: right; white-space: nowrap; }
          .total td { font-weight: bold; border-bottom: 0; }
          .thanks { margin-top: 16px; }
          @media print { button { display: none; } body { width: auto; } }
        </style>
      </head>
      <body>
        <h1>Mooncake 94</h1>
        <p>${escapeHtml(transaction.branchName)}<br>${transaction.receiptNumber}<br>${formatDateTime(transaction.createdAt)}</p>
        <table>
          ${rows}
          <tr class="total"><td>Total</td><td>${formatCurrency(transaction.total)}</td></tr>
          <tr><td>Tunai</td><td>${formatCurrency(transaction.cash)}</td></tr>
          <tr><td>Kembalian</td><td>${formatCurrency(transaction.change)}</td></tr>
        </table>
        <p class="thanks">Terima kasih</p>
        <button onclick="window.print()">Print</button>
        <script>window.onload = () => window.print();<\/script>
      </body>
    </html>
  `);
  receiptWindow.document.close();
}

function saveProduct(event) {
  event.preventDefault();
  const name = els.productName.value.trim();
  const price = Number(els.productPrice.value || 0);
  const stock = Number(els.productStock.value || 0);
  const minStock = Number(els.productMinStock.value || 0);

  if (!name || price <= 0) {
    showToast("Nama dan harga produk wajib diisi.");
    return;
  }

  const editingId = els.productForm.dataset.editingId;
  if (editingId) {
    const product = getProduct(editingId);
    if (product) {
      product.name = name;
      product.category = els.productCategory.value;
      product.price = price;
      product.stock = stock;
      product.minStock = minStock;
    }
    delete els.productForm.dataset.editingId;
    showToast("Produk berhasil diubah.");
  } else {
    state.products.push({
      id: crypto.randomUUID(),
      name,
      category: els.productCategory.value,
      price,
      stock,
      minStock
    });
    showToast("Produk baru berhasil ditambahkan.");
  }

  saveState();
  els.productForm.reset();
  els.productMinStock.value = 5;
  render();
}

function editProduct(productId) {
  const product = getProduct(productId);
  if (!product) return;

  els.productForm.dataset.editingId = product.id;
  els.productName.value = product.name;
  els.productCategory.value = product.category;
  els.productPrice.value = product.price;
  els.productStock.value = product.stock;
  els.productMinStock.value = product.minStock;
  els.productName.focus();
  showToast("Data produk siap diubah di form kiri.");
}

function deleteProduct(productId) {
  const product = getProduct(productId);
  if (!product) return;

  const usedInTransaction = state.transactions.some((transaction) => transaction.items.some((item) => item.id === productId));
  if (usedInTransaction) {
    showToast("Produk pernah terjual, stok dibuat 0 agar riwayat tetap aman.");
    product.stock = 0;
  } else {
    state.products = state.products.filter((item) => item.id !== productId);
  }

  cart = cart.filter((item) => item.id !== productId);
  saveState();
  render();
}

function clearHistory() {
  if (!state.transactions.length) {
    showToast("Belum ada riwayat transaksi.");
    return;
  }

  const confirmed = window.confirm(
    "Peringatan: semua riwayat transaksi akan dihapus permanen dari aplikasi ini. Produk dan stok tetap tersimpan. Lanjutkan?"
  );

  if (!confirmed) return;

  state.transactions = [];
  saveState();
  render();
  showToast("Semua riwayat transaksi berhasil dihapus.");
}

function changeStock(productId, amount) {
  const product = getProduct(productId);
  if (!product) return;

  product.stock = Math.max(0, product.stock + amount);
  saveState();
  render();
  showToast(`Stok ${product.name} sekarang ${product.stock}.`);
}

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `backup-mooncake-94-${todayKey()}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      if (!Array.isArray(parsed.products) || !Array.isArray(parsed.transactions)) {
        throw new Error("Invalid backup");
      }
      state = {
        branchName: parsed.branchName || "Cabang Utama",
        products: parsed.products,
        transactions: parsed.transactions
      };
      cart = [];
      saveState();
      render();
      showToast("Data backup berhasil diimport.");
    } catch {
      showToast("File backup tidak sesuai.");
    }
  };
  reader.readAsText(file);
  event.target.value = "";
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

els.productForm.addEventListener("submit", saveProduct);
els.productSearch.addEventListener("input", renderProducts);
els.inventorySearch.addEventListener("input", renderInventory);
els.cashReceived.addEventListener("input", renderCart);
els.clearCart.addEventListener("click", () => {
  cart = [];
  renderCart();
});
els.finishTransaction.addEventListener("click", finishTransaction);
els.clearHistory.addEventListener("click", clearHistory);
els.exportData.addEventListener("click", exportData);
els.importData.addEventListener("change", importData);

render();

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
