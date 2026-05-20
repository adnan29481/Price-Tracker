import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  initDatabase,
  seedDropdownOptions,
  addProduct,
  bulkInsertProducts,
  getAllProducts,
  searchProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getDropdownOptions
} from './database.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Get directory name for static files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Initialize database on startup
await initDatabase();
await seedDropdownOptions();

// ==================== API Routes ====================

// Get all products (With query search backup)
app.get('/api/products', async (req, res) => {
  try {
    const query = String(req.query.q ?? req.query.search ?? '').trim();
    const products = query ? await searchProducts(query) : await getAllProducts();
    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Search products route
app.get('/api/products/search', async (req, res) => {
  try {
    const query = String(req.query.q ?? req.query.search ?? '').trim();
    if (!query) {
      return res.json({ success: true, data: [] });
    }
    const products = await searchProducts(query);
    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get single product
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Add new product
app.post('/api/products', async (req, res) => {
  try {
    const result = await addProduct(req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Bulk import products
app.post('/api/import', async (req, res) => {
  try {
    if (!Array.isArray(req.body)) {
      return res.status(400).json({ success: false, error: 'Request body must be an array of products' });
    }
    const count = await bulkInsertProducts(req.body);
    res.json({ success: true, count });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Update product
app.put('/api/products/:id', async (req, res) => {
  try {
    await updateProduct(req.params.id, req.body);
    const updated = await getProductById(req.params.id);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Delete product
app.delete('/api/products/:id', async (req, res) => {
  try {
    await deleteProduct(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get dropdown options
app.get('/api/dropdowns/:category', async (req, res) => {
  try {
    const options = await getDropdownOptions(req.params.category);
    res.json({ success: true, data: options });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== Static Pages ====================

// Serve React app directly on root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'react.html'));
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n✨ Price Tracker Server is running!`);
  console.log(`📍 App:  http://localhost:${PORT}\n`);
});