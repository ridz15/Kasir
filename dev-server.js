const http = require("http");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");

const root = __dirname;
const dataDir = path.join(root, "data");
const dbPath = path.join(dataDir, "mooncake94.db");
const port = Number(process.env.PORT || 4173);
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png"
};

fs.mkdirSync(dataDir, { recursive: true });
const db = new DatabaseSync(dbPath);
initDatabase();

http
  .createServer(async (request, response) => {
    try {
      const url = new URL(request.url, `http://${request.headers.host}`);
      if (url.pathname.startsWith("/api/")) {
        await handleApi(request, response, url);
        return;
      }

      serveStatic(url, response);
    } catch (error) {
      sendJson(response, 500, { error: error.message || "Terjadi kesalahan server." });
    }
  })
  .listen(port, "0.0.0.0", () => {
    const localUrls = getLocalUrls();
    console.log(`Mooncake 94 berjalan di PC ini: http://127.0.0.1:${port}`);
    console.log(`Database lokal: ${dbPath}`);
    console.log("");
    console.log("Untuk HP/tablet di WiFi yang sama, buka salah satu alamat ini:");
    localUrls.forEach((url) => console.log(`- ${url}`));
    console.log("");
    console.log("Biarkan jendela ini tetap terbuka selama aplikasi dipakai.");
  });

function initDatabase() {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price INTEGER NOT NULL,
      stock INTEGER NOT NULL,
      min_stock INTEGER NOT NULL DEFAULT 5
    );

    CREATE TABLE IF NOT EXISTS deleted_categories (
      category TEXT PRIMARY KEY
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      receipt_number TEXT NOT NULL,
      branch_name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      total INTEGER NOT NULL,
      cash INTEGER NOT NULL,
      change_amount INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transaction_items (
      transaction_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      name TEXT NOT NULL,
      price INTEGER NOT NULL,
      qty INTEGER NOT NULL,
      FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
    );
  `);

  db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('branchName', 'Cabang Utama')").run();
}

async function handleApi(request, response, url) {
  if (request.method === "GET" && url.pathname === "/api/state") {
    sendJson(response, 200, getState());
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/products") {
    const product = await readJson(request);
    saveProduct(product);
    sendJson(response, 200, getState());
    return;
  }

  const stockMatch = url.pathname.match(/^\/api\/products\/([^/]+)\/stock$/);
  if (request.method === "POST" && stockMatch) {
    const { amount } = await readJson(request);
    changeStock(decodeURIComponent(stockMatch[1]), Number(amount || 0));
    sendJson(response, 200, getState());
    return;
  }

  const productMatch = url.pathname.match(/^\/api\/products\/([^/]+)$/);
  if (request.method === "DELETE" && productMatch) {
    deleteProduct(decodeURIComponent(productMatch[1]));
    sendJson(response, 200, getState());
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/transactions") {
    const transaction = await readJson(request);
    createTransaction(transaction);
    sendJson(response, 200, getState());
    return;
  }

  if (request.method === "DELETE" && url.pathname === "/api/transactions") {
    db.exec("DELETE FROM transactions");
    sendJson(response, 200, getState());
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/categories/delete") {
    const { category } = await readJson(request);
    deleteCategory(category);
    sendJson(response, 200, getState());
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/import") {
    const data = await readJson(request);
    importState(data);
    sendJson(response, 200, getState());
    return;
  }

  sendJson(response, 404, { error: "Endpoint tidak ditemukan." });
}

function getState() {
  const branchName = db.prepare("SELECT value FROM settings WHERE key = 'branchName'").get()?.value || "Cabang Utama";
  const products = db.prepare(`
    SELECT id, name, category, price, stock, min_stock AS minStock
    FROM products
    ORDER BY name COLLATE NOCASE
  `).all();
  const deletedCategories = db.prepare("SELECT category FROM deleted_categories ORDER BY category COLLATE NOCASE").all().map((row) => row.category);
  const transactions = db.prepare(`
    SELECT id, receipt_number AS receiptNumber, branch_name AS branchName, created_at AS createdAt,
      total, cash, change_amount AS change
    FROM transactions
    ORDER BY created_at ASC
  `).all();
  const itemQuery = db.prepare(`
    SELECT product_id AS id, name, price, qty
    FROM transaction_items
    WHERE transaction_id = ?
    ORDER BY rowid ASC
  `);

  transactions.forEach((transaction) => {
    transaction.items = itemQuery.all(transaction.id);
  });

  return { branchName, products, deletedCategories, transactions };
}

function saveProduct(product) {
  const id = String(product.id || createId());
  const name = String(product.name || "").trim();
  const category = String(product.category || "").trim();
  const price = Number(product.price || 0);
  const stock = Number(product.stock || 0);
  const minStock = Number(product.minStock || 0);

  if (!name || !category || price <= 0) {
    throw new Error("Nama, kategori, dan harga produk wajib diisi.");
  }

  db.prepare(`
    INSERT INTO products (id, name, category, price, stock, min_stock)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      category = excluded.category,
      price = excluded.price,
      stock = excluded.stock,
      min_stock = excluded.min_stock
  `).run(id, name, category, price, Math.max(0, stock), Math.max(0, minStock));
}

function changeStock(productId, amount) {
  db.prepare("UPDATE products SET stock = MAX(stock + ?, 0) WHERE id = ?").run(amount, productId);
}

function deleteProduct(productId) {
  const used = db.prepare("SELECT 1 FROM transaction_items WHERE product_id = ? LIMIT 1").get(productId);
  if (used) {
    db.prepare("UPDATE products SET stock = 0 WHERE id = ?").run(productId);
    return;
  }

  db.prepare("DELETE FROM products WHERE id = ?").run(productId);
}

function createTransaction(transaction) {
  const items = Array.isArray(transaction.items) ? transaction.items : [];
  if (!items.length) {
    throw new Error("Keranjang masih kosong.");
  }

  const insertTransaction = db.prepare(`
    INSERT INTO transactions (id, receipt_number, branch_name, created_at, total, cash, change_amount)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const insertItem = db.prepare(`
    INSERT INTO transaction_items (transaction_id, product_id, name, price, qty)
    VALUES (?, ?, ?, ?, ?)
  `);
  const productQuery = db.prepare("SELECT id, name, price, stock FROM products WHERE id = ?");
  const stockUpdate = db.prepare("UPDATE products SET stock = stock - ? WHERE id = ?");

  db.exec("BEGIN IMMEDIATE");
  try {
    let total = 0;
    const normalizedItems = items.map((item) => {
      const product = productQuery.get(item.id);
      const qty = Number(item.qty || 0);
      if (!product || qty <= 0 || product.stock < qty) {
        throw new Error("Ada stok produk yang tidak cukup.");
      }

      total += product.price * qty;
      return {
        id: product.id,
        name: product.name,
        price: product.price,
        qty
      };
    });

    const cash = Number(transaction.cash || 0);
    if (cash < total) {
      throw new Error("Uang diterima belum cukup.");
    }

    const id = String(transaction.id || createId());
    const createdAt = transaction.createdAt || new Date().toISOString();
    const receiptNumber = String(transaction.receiptNumber || `TRX-${localTimestampKey(createdAt)}`);
    const branchName = String(transaction.branchName || "Cabang Utama");

    insertTransaction.run(id, receiptNumber, branchName, createdAt, total, cash, cash - total);
    normalizedItems.forEach((item) => {
      stockUpdate.run(item.qty, item.id);
      insertItem.run(id, item.id, item.name, item.price, item.qty);
    });
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

function deleteCategory(category) {
  const value = String(category || "").trim();
  if (!value || value.toLowerCase() === "lainnya") {
    throw new Error("Kategori tidak bisa dihapus.");
  }

  const used = db.prepare("SELECT 1 FROM products WHERE LOWER(category) = LOWER(?) LIMIT 1").get(value);
  if (used) {
    throw new Error("Kategori masih dipakai produk.");
  }

  db.prepare("INSERT OR IGNORE INTO deleted_categories (category) VALUES (?)").run(value.toLowerCase());
}

function importState(data) {
  if (!Array.isArray(data.products) || !Array.isArray(data.transactions)) {
    throw new Error("File backup tidak sesuai.");
  }

  db.exec("BEGIN IMMEDIATE");
  try {
    db.exec("DELETE FROM transaction_items; DELETE FROM transactions; DELETE FROM products; DELETE FROM deleted_categories;");
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('branchName', ?)").run(data.branchName || "Cabang Utama");
    data.products.forEach(saveProduct);
    (data.deletedCategories || []).forEach((category) => {
      db.prepare("INSERT OR IGNORE INTO deleted_categories (category) VALUES (?)").run(String(category).toLowerCase());
    });

    const insertTransaction = db.prepare(`
      INSERT INTO transactions (id, receipt_number, branch_name, created_at, total, cash, change_amount)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const insertItem = db.prepare(`
      INSERT INTO transaction_items (transaction_id, product_id, name, price, qty)
      VALUES (?, ?, ?, ?, ?)
    `);

    data.transactions.forEach((transaction) => {
      const transactionId = transaction.id || createId();
      insertTransaction.run(
        transactionId,
        transaction.receiptNumber || `TRX-${localTimestampKey(transaction.createdAt)}`,
        transaction.branchName || data.branchName || "Cabang Utama",
        transaction.createdAt || new Date().toISOString(),
        Number(transaction.total || 0),
        Number(transaction.cash || 0),
        Number(transaction.change || 0)
      );
      (transaction.items || []).forEach((item) => {
        insertItem.run(transactionId, item.id || "", item.name || "", Number(item.price || 0), Number(item.qty || 0));
      });
    });
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

function serveStatic(url, response) {
  let route = decodeURIComponent(url.pathname);
  if (route === "/") route = "/index.html";

  const filePath = path.normalize(path.join(root, route));
  if (!filePath.startsWith(root)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    response.writeHead(200, {
      "Content-Type": types[path.extname(filePath)] || "application/octet-stream"
    });
    response.end(data);
  });
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 10_000_000) {
        request.destroy();
        reject(new Error("Data terlalu besar."));
      }
    });
    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Format JSON tidak sesuai."));
      }
    });
    request.on("error", reject);
  });
}

function sendJson(response, status, data) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*"
  });
  response.end(JSON.stringify(data));
}

function createId() {
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
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

function getLocalUrls() {
  const interfaces = os.networkInterfaces();
  const urls = [];

  Object.values(interfaces).forEach((items) => {
    (items || []).forEach((item) => {
      if (item.family === "IPv4" && !item.internal) {
        urls.push(`http://${item.address}:${port}`);
      }
    });
  });

  return urls.length ? urls : [`http://alamat-ip-pc:${port}`];
}
