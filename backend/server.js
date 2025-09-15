const express = require("express");
const cors = require("cors");
const fs = require("node:fs").promises;
const path = require("node:path");

console.time("Server startup");

const app = express();

// ---- Constants ----
const DATA_FILE = path.join(__dirname, "data.json");
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000"; // Default to local dev

// ---- Middleware ----
app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: "10mb" }));

// ---- Data Storage Functions ----
async function loadData() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, return default structure
    if (error.code === 'ENOENT') {
      return { products: [], sales: [] };
    }
    throw error; // Re-throw other errors
  }
}

async function saveData(data) {
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error("Error saving data:", error);
    throw new Error("Failed to save data");
  }
}

// ---- Routes ----

// Root / Health
app.get("/", (req, res) => {
  res.json({ message: "DIWA2110 Backend API is running", version: "1.0.1" });
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

// Products CRUD
app.get("/products", async (req, res) => {
  try {
    const data = await loadData();
    res.json(data.products);
  } catch (error) {
    console.error("Error loading products:", error);
    res.status(500).json({ error: "Failed to load products" });
  }
});

app.post("/products", async (req, res) => {
  try {
    const { name, price, quantity, description, category, image } = req.body;
    
    if (!name || typeof price !== "number" || price < 0) {
      return res.status(400).json({ 
        error: "Name is required and price must be a non-negative number" 
      });
    }

    const data = await loadData();
    const newProduct = {
      id: Date.now(),
      name,
      price,
      quantity: parseInt(quantity) || 0,
      description: description || "",
      category: category || "",
      ...(image && { image }),
      createdAt: new Date().toISOString()
    };

    data.products.push(newProduct);
    await saveData(data);
    
    res.status(201).json(newProduct);
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ error: "Failed to create product" });
  }
});

app.put("/products/:id", async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const data = await loadData();
    const productIndex = data.products.findIndex(p => p.id === productId);
    
    if (productIndex === -1) {
      return res.status(404).json({ error: "Product not found" });
    }

    const { name, price, quantity, description, category, image } = req.body;
    const updatedProduct = {
      ...data.products[productIndex],
      ...(name && { name }),
      ...(typeof price === "number" && price >= 0 && { price }),
      ...(typeof quantity === "number" && quantity >= 0 && { quantity: parseInt(quantity) }),
      ...(description !== undefined && { description }),
      ...(category !== undefined && { category }),
      ...(image !== undefined && { image }),
      updatedAt: new Date().toISOString()
    };

    data.products[productIndex] = updatedProduct;
    await saveData(data);
    
    res.json(updatedProduct);
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ error: "Failed to update product" });
  }
});

app.delete("/products/:id", async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const data = await loadData();
    const initialLength = data.products.length;
    
    data.products = data.products.filter(p => p.id !== productId);
    
    if (data.products.length === initialLength) {
      return res.status(404).json({ error: "Product not found" });
    }

    await saveData(data);
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

// Stock management
app.post("/stock/add", async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    
    if (!productId || parseInt(quantity) <= 0) {
      return res.status(400).json({ 
        error: "Valid productId and positive quantity required" 
      });
    }

    const data = await loadData();
    const productIndex = data.products.findIndex(p => p.id === parseInt(productId));
    
    if (productIndex === -1) {
      return res.status(404).json({ error: "Product not found" });
    }

    const addQty = parseInt(quantity) || 0;
    data.products[productIndex].quantity += addQty;
    data.products[productIndex].updatedAt = new Date().toISOString();
    
    await saveData(data);
    res.json({ 
      message: "Stock updated successfully",
      newQuantity: data.products[productIndex].quantity
    });
  } catch (error) {
    console.error("Error adding stock:", error);
    res.status(500).json({ error: "Failed to add stock" });
  }
});

// Sales
app.get("/sales", async (req, res) => {
  try {
    const data = await loadData();
    res.json(data.sales);
  } catch (error) {
    console.error("Error loading sales:", error);
    res.status(500).json({ error: "Failed to load sales" });
  }
});

app.post("/sales", async (req, res) => {
  try {
    const salesItems = Array.isArray(req.body) ? req.body : [req.body];
    
    if (!salesItems.length) {
      return res.status(400).json({ error: "At least one sale item required" });
    }

    const data = await loadData();
    const insufficientStockItems = [];

    // First, validate all items
    for (let item of salesItems) {
      const { productId, quantity } = item;
      const product = data.products.find(p => p.id === parseInt(productId));
      
      if (!product) {
        return res.status(404).json({ error: `Product ${productId} not found` });
      }

      const qty = parseInt(quantity) || 1;
      if (product.quantity < qty) {
        insufficientStockItems.push({ productId, available: product.quantity, requested: qty });
      }
    }

    if (insufficientStockItems.length > 0) {
      return res.status(400).json({ 
        error: "Insufficient stock", 
        details: insufficientStockItems 
      });
    }

    // Process the sale
    let total = 0;
    const soldItems = [];

    for (let item of salesItems) {
      const { productId, quantity } = item;
      const productIndex = data.products.findIndex(p => p.id === parseInt(productId));
      const qty = parseInt(quantity) || 1;
      
      data.products[productIndex].quantity -= qty;
      data.products[productIndex].updatedAt = new Date().toISOString();

      const product = data.products[productIndex];
      const itemTotal = product.price * qty;
      total += itemTotal;

      soldItems.push({
        productId: product.id,
        name: product.name,
        quantity: qty,
        price: product.price,
        total: itemTotal
      });
    }

    const newSale = {
      id: Date.now(),
      items: soldItems,
      total,
      date: new Date().toISOString(),
    };

    data.sales.push(newSale);
    await saveData(data);
    
    res.status(201).json(newSale);
  } catch (error) {
    console.error("Error processing sale:", error);
    res.status(500).json({ error: "Failed to process sale" });
  }
});

// Reports
app.get("/reports/lowstock", async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold) || 10;
    const data = await loadData();
    const lowStockProducts = data.products.filter(p => p.quantity < threshold);
    res.json(lowStockProducts);
  } catch (error) {
    console.error("Error generating low stock report:", error);
    res.status(500).json({ error: "Failed to generate report" });
  }
});

// ---- Error Handler ----
app.use((err, req, res, next) => {
  console.error("Global error:", err.stack);
  res.status(500).json({ error: "Internal server error" });
});

// 404 Handler for undefined API routes
app.use((req, res) => {
  res.status(404).json({ error: "API endpoint not found" });
});

// ---- Start Server ----
const PORT = process.env.PORT || 10000;

async function startServer() {
  try {
    // Ensure data file exists
    try {
      await fs.access(DATA_FILE);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // Create initial data file
        await saveData({ products: [], sales: [] });
        console.log("Created new data file");
      }
    }

    app.listen(PORT, () => {
      console.timeEnd("Server startup");
      console.log(`🚀 Backend running on http://localhost:${PORT}`);
      console.log(`📊 Frontend URL: ${FRONTEND_URL}`);
      console.log(`💾 Data file: ${DATA_FILE}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
