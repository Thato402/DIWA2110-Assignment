const express = require('express');
const cors = require('cors');

console.time('Server startup');

const app = express();
app.use(cors()); // Allow all origins for debugging
app.use(express.json({ limit: '10mb' })); // Increased limit for base64 images

// In-memory storage for debugging
let products = [];
let sales = [];

const getData = (file) => {
  console.log(`Accessing in-memory data for ${file}`);
  return file === 'products' ? products : sales;
};

const saveData = (file, data) => {
  console.log(`Saving in-memory data for ${file}`);
  if (file === 'products') products = data;
  else sales = data;
  return true;
};

// Root route to handle GET requests to "/"
app.get('/', (req, res) => {
  console.log('Root route hit');
  res.json({ message: 'DIWA2110 Backend API is running', version: '1.0.0' });
});

// Health check endpoint for monitoring
app.get('/health', (req, res) => {
  console.log('Health route hit');
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Products CRUD with image
app.get('/products', (req, res) => {
  const products = getData('products');
  res.json(products);
});

app.post('/products', (req, res) => {
  const products = getData('products');
  const newProduct = { id: Date.now(), quantity: parseInt(req.body.quantity) || 0, ...req.body };
  products.push(newProduct);
  if (saveData('products', products)) {
    res.status(201).json(newProduct);
  } else {
    res.status(500).json({ error: 'Failed to save product' });
  }
});

app.put('/products/:id', (req, res) => {
  const products = getData('products');
  const index = products.findIndex(p => p.id === parseInt(req.params.id));
  if (index !== -1) {
    products[index] = { ...products[index], ...req.body, quantity: parseInt(req.body.quantity) || products[index].quantity };
    if (req.body.image) products[index].image = req.body.image;
    if (saveData('products', products)) {
      res.json(products[index]);
    } else {
      res.status(500).json({ error: 'Failed to save product' });
    }
  } else {
    res.status(404).json({ error: 'Product not found' });
  }
});

app.delete('/products/:id', (req, res) => {
  const products = getData('products');
  const newProducts = products.filter(p => p.id !== parseInt(req.params.id));
  if (saveData('products', newProducts)) {
    res.json({ message: 'Product deleted' });
  } else {
    res.status(500).json({ error: 'Failed to save product' });
  }
});

// Stock Management
app.post('/stock/add', (req, res) => {
  const { productId, quantity } = req.body;
  const products = getData('products');
  const index = products.findIndex(p => p.id === productId);
  if (index !== -1) {
    products[index].quantity += parseInt(quantity) || 0;
    if (saveData('products', products)) {
      res.json({ message: 'Stock added' });
    } else {
      res.status(500).json({ error: 'Failed to save stock' });
    }
  } else {
    res.status(404).json({ error: 'Product not found' });
  }
});

// Sales with multiple products
app.get('/sales', (req, res) => res.json(getData('sales')));

app.post('/sales', (req, res) => {
  const salesItems = Array.isArray(req.body) ? req.body : [req.body];
  const products = getData('products');
  let insufficientStock = false;

  salesItems.forEach(item => {
    const { productId, quantity } = item;
    const index = products.findIndex(p => p.id === parseInt(productId));
    if (index === -1) return res.status(404).json({ error: 'Product not found' });
    const qty = parseInt(quantity) || 1;
    if (products[index].quantity < qty) insufficientStock = true;
  });

  if (insufficientStock) return res.status(400).json({ error: 'Insufficient stock' });

  salesItems.forEach(item => {
    const { productId, quantity } = item;
    const index = products.findIndex(p => p.id === parseInt(item.productId));
    const qty = parseInt(quantity) || 1;
    products[index].quantity -= qty;
  });

  if (!saveData('products', products)) {
    return res.status(500).json({ error: 'Failed to save product stock' });
  }

  const sales = getData('sales');
  const newSale = {
    id: Date.now(),
    items: salesItems,
    date: new Date().toISOString(),
    total: salesItems.reduce((sum, item) => {
      const product = products.find(p => p.id === parseInt(item.productId));
      const qty = parseInt(item.quantity) || 1;
      return sum + (product?.price * qty || 0);
    }, 0)
  };
  sales.push(newSale);
  if (saveData('sales', sales)) {
    res.status(201).json(newSale);
  } else {
    res.status(500).json({ error: 'Failed to save sale' });
  }
});

// Reports
app.get('/reports/lowstock', (req, res) => {
  const threshold = parseInt(req.query.threshold) || 10;
  const products = getData('products');
  res.json(products.filter(p => p.quantity < threshold));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Dynamic port for Render
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.timeEnd('Server startup');
  console.log(`Backend server running on port ${PORT}`);
});