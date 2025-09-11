const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increased limit for base64 images

const DATA_DIR = path.join(__dirname, 'data');

const getData = (file) => {
  const filePath = path.join(DATA_DIR, `${file}.json`);
  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      console.log(`Reading ${file}.json:`, content.substring(0, 100) + '...');
      return content ? JSON.parse(content) : [];
    } catch (err) {
      console.error(`Error reading ${file}.json:`, err);
      return [];
    }
  }
  return [];
};

const saveData = (file, data) => {
  const filePath = path.join(DATA_DIR, `${file}.json`);
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const jsonData = JSON.stringify(data, null, 2);
    console.log(`Writing ${file}.json:`, jsonData.substring(0, 100) + '...');
    fs.writeFileSync(filePath, jsonData);
  } catch (err) {
    console.error(`Error writing ${file}.json:`, err);
    throw err;
  }
};

// Products CRUD with image
app.get('/products', (req, res) => {
  const products = getData('products');
  console.log('Returning products:', products.map(p => ({ id: p.id, name: p.name, image: p.image ? 'present' : 'absent' })));
  res.json(products);
});
app.post('/products', (req, res) => {
  const products = getData('products');
  const newProduct = { id: Date.now(), quantity: parseInt(req.body.quantity) || 0, ...req.body };
  products.push(newProduct);
  saveData('products', products);
  res.json(newProduct);
});
app.put('/products/:id', (req, res) => {
  const products = getData('products');
  const index = products.findIndex(p => p.id === parseInt(req.params.id));
  if (index !== -1) {
    try {
      products[index] = { ...products[index], ...req.body, quantity: parseInt(req.body.quantity) || products[index].quantity };
      if (req.body.image) products[index].image = req.body.image; // Update image if provided
      saveData('products', products);
      console.log(`Updated product ${req.params.id} with image:`, req.body.image ? 'present' : 'absent');
      res.json(products[index]);
    } catch (err) {
      console.error(`Error updating product ${req.params.id}:`, err);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.status(404).json({ error: 'Product not found' });
  }
});
app.delete('/products/:id', (req, res) => {
  const products = getData('products');
  const newProducts = products.filter(p => p.id !== parseInt(req.params.id));
  saveData('products', newProducts);
  res.json({ message: 'Product deleted' });
});

// Stock Management
app.post('/stock/add', (req, res) => {
  const { productId, quantity } = req.body;
  const products = getData('products');
  const index = products.findIndex(p => p.id === productId);
  if (index !== -1) {
    products[index].quantity += parseInt(quantity) || 0;
    saveData('products', products);
    res.json({ message: 'Stock added' });
  } else {
    res.status(404).json({ error: 'Product not found' });
  }
});

// Sales with multiple products
app.get('/sales', (req, res) => res.json(getData('sales')));
app.post('/sales', (req, res) => {
  const salesItems = Array.isArray(req.body) ? req.body : [req.body]; // Support single or array
  const products = getData('products');
  let insufficientStock = false;

  salesItems.forEach(item => {
    const { productId, quantity } = item;
    const index = products.findIndex(p => p.id === parseInt(productId));
    if (index === -1) return res.status(404).json({ error: 'Product not found' });
    const qty = parseInt(quantity) || 1; // Default to 1 if not provided
    if (products[index].quantity < qty) insufficientStock = true;
  });

  if (insufficientStock) return res.status(400).json({ error: 'Insufficient stock for one or more items' });

  salesItems.forEach(item => {
    const { productId, quantity } = item;
    const index = products.findIndex(p => p.id === parseInt(productId));
    const qty = parseInt(quantity) || 1; // Default to 1
    products[index].quantity -= qty;
  });
  saveData('products', products);

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
  saveData('sales', sales);
  res.json(newSale);
});

// Reports
app.get('/reports/lowstock', (req, res) => {
  const threshold = parseInt(req.query.threshold) || 10;
  const products = getData('products');
  res.json(products.filter(p => p.quantity < threshold));
});

app.listen(5000, () => console.log('Backend server running on port 5000'));