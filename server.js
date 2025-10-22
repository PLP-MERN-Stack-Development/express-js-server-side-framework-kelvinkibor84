// server.js - Express RESTful API for Products (Final Version with Advanced Features)

const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// =============================
// MIDDLEWARE
// =============================
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

app.use(bodyParser.json());

// Authentication
const API_KEY = 'mysecretkey123';
const authMiddleware = (req, res, next) => {
  const key = req.header('x-api-key');
  if (!key || key !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized - Invalid API Key' });
  }
  next();
};

// =============================
// ERROR CLASSES
// =============================
class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}
class UnauthorizedError extends Error {
  constructor(message) {
    super(message);
    this.name = 'UnauthorizedError';
    this.statusCode = 401;
  }
}

// =============================
// SAMPLE DATA
// =============================
let products = [
  { id: '1', name: 'Laptop', description: 'High-performance laptop with 16GB RAM', price: 1200, category: 'electronics', inStock: true },
  { id: '2', name: 'Smartphone', description: 'Latest model with 128GB storage', price: 800, category: 'electronics', inStock: true },
  { id: '3', name: 'Coffee Maker', description: 'Programmable coffee maker with timer', price: 50, category: 'kitchen', inStock: false },
  { id: '4', name: 'Headphones', description: 'Noise-cancelling wireless headphones', price: 150, category: 'electronics', inStock: true },
  { id: '5', name: 'Blender', description: 'Powerful kitchen blender with 3 speeds', price: 100, category: 'kitchen', inStock: true }
];

// =============================
// ROUTES
// =============================

app.get('/', (req, res) => {
  res.send('Welcome to the Product API! Try /api/products or /api/products/stats');
});

// GET all products with filter, pagination & search
app.get('/api/products', authMiddleware, (req, res) => {
  const { category, page = 1, limit = 3, search } = req.query;
  let filtered = [...products];

  // 🔍 Search by name
  if (search) {
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase())
    );
  }

  // 🧩 Filter by category
  if (category) {
    filtered = filtered.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }

  // 📄 Pagination
  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + parseInt(limit));

  res.json({
    total: filtered.length,
    page: parseInt(page),
    limit: parseInt(limit),
    results: paginated
  });
});

// GET one product
app.get('/api/products/:id', authMiddleware, (req, res, next) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) return next(new NotFoundError('Product not found'));
  res.json(product);
});

// POST new product
app.post('/api/products', authMiddleware, (req, res, next) => {
  const { name, description, price, category, inStock } = req.body;
  if (!name || !description || price == null || !category || inStock == null) {
    return next(new ValidationError('All product fields are required'));
  }
  const newProduct = { id: uuidv4(), name, description, price, category, inStock };
  products.push(newProduct);
  res.status(201).json(newProduct);
});

// PUT update product
app.put('/api/products/:id', authMiddleware, (req, res, next) => {
  const { id } = req.params;
  const product = products.find(p => p.id === id);
  if (!product) return next(new NotFoundError('Product not found'));

  const { name, description, price, category, inStock } = req.body;
  product.name = name ?? product.name;
  product.description = description ?? product.description;
  product.price = price ?? product.price;
  product.category = category ?? product.category;
  product.inStock = inStock ?? product.inStock;

  res.json(product);
});

// DELETE product
app.delete('/api/products/:id', authMiddleware, (req, res, next) => {
  const index = products.findIndex(p => p.id === req.params.id);
  if (index === -1) return next(new NotFoundError('Product not found'));
  const deleted = products.splice(index, 1);
  res.json({ message: 'Product deleted successfully', deleted });
});

// 📊 STATS endpoint
app.get('/api/products/stats', authMiddleware, (req, res) => {
  const stats = products.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {});
  res.json({ totalProducts: products.length, countByCategory: stats });
});

// =============================
// GLOBAL ERROR HANDLER
// =============================
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
  res.status(500).json({ error: 'Internal Server Error' });
});

// =============================
// START SERVER
// =============================
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

module.exports = app;
