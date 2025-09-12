import React, { useEffect, useState } from 'react';
import axios from 'axios';

// Create a base axios instance with the correct API URL
const API_BASE_URL = process.env.REACT_APP_API_URL || ''; // Falls back to relative path if variable is missing (for local dev)
const api = axios.create({
  baseURL: API_BASE_URL,
});

function Inventory() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', category: '', price: 0, quantity: 0, image: '' });
  const [editId, setEditId] = useState(null);
  const [addQty, setAddQty] = useState({});

  useEffect(() => {
    // Use the api instance, which now has the correct baseURL
    api.get('/products').then(res => setProducts(res.data));
  }, []);

  const handleChange = (e) => {
    if (e.target.name === 'image') {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => setForm({ ...form, [e.target.name]: reader.result });
        reader.readAsDataURL(file);
      }
    } else {
      setForm({ ...form, [e.target.name]: e.target.name === 'price' || e.target.name === 'quantity' ? parseFloat(e.target.value) : e.target.value });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editId) {
      api.put(`/products/${editId}`, form).then(res => {
        setProducts(products.map(p => p.id === editId ? res.data : p));
        setEditId(null);
      });
    } else {
      api.post('/products', form).then(res => setProducts([...products, res.data]));
    }
    setForm({ name: '', description: '', category: '', price: 0, quantity: 0, image: '' });
  };

  const handleDelete = (id) => api.delete(`/products/${id}`).then(() => setProducts(products.filter(p => p.id !== id)));
  const handleEdit = (product) => { setForm(product); setEditId(product.id); };
  const handleQtyChange = (id, value) => setAddQty({ ...addQty, [id]: value });
  const handleAddStock = (id) => {
    const qty = parseInt(addQty[id] || 0);
    if (qty > 0) {
      // Use the api instance for the /stock/add endpoint as well
      api.post('/stock/add', { productId: id, quantity: qty }).then(() => {
        setProducts(products.map(p => p.id === id ? { ...p, quantity: p.quantity + qty } : p));
        setAddQty({ ...addQty, [id]: 0 });
      });
    }
  };

  return (
    <div className="content">
      <h2>Inventory Management</h2>
      <form onSubmit={handleSubmit}>
        <input name="name" value={form.name} onChange={handleChange} placeholder="Name" required />
        <input name="description" value={form.description} onChange={handleChange} placeholder="Description" required />
        <input name="category" value={form.category} onChange={handleChange} placeholder="Category" required />
        <input name="price" type="number" value={form.price} onChange={handleChange} placeholder="Price" step="0.01" required />
        <input name="quantity" type="number" value={form.quantity} onChange={handleChange} placeholder="Initial Quantity" required />
        <input name="image" type="file" accept="image/*" onChange={handleChange} />
        <button type="submit">{editId ? 'Update' : 'Add'} Product</button>
      </form>
      <table>
        <thead><tr><th>Name</th><th>Description</th><th>Category</th><th>Price</th><th>Quantity</th><th>Actions</th></tr></thead>
        <tbody>
          {products.map(p => (
            <tr key={p.id} className={p.quantity < 10 ? 'low-stock' : ''}>
              <td>{p.name}</td><td>{p.description}</td><td>{p.category}</td><td>M{p.price.toFixed(2)}</td><td>{p.quantity}</td>
              <td>
                <button onClick={() => handleEdit(p)}>Edit</button>
                <button onClick={() => handleDelete(p.id)}>Delete</button>
                <input type="number" value={addQty[p.id] || ''} onChange={(e) => handleQtyChange(p.id, e.target.value)} placeholder="Add Qty" />
                <button onClick={() => handleAddStock(p.id)}>Add Stock</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Inventory;import React, { useEffect, useState } from 'react';
import axios from 'axios';

// Create a base axios instance with the correct API URL
const API_BASE_URL = process.env.REACT_APP_API_URL || ''; // Falls back to relative path if variable is missing (for local dev)
const api = axios.create({
  baseURL: API_BASE_URL,
});

function Inventory() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', category: '', price: 0, quantity: 0, image: '' });
  const [editId, setEditId] = useState(null);
  const [addQty, setAddQty] = useState({});

  useEffect(() => {
    // Use the api instance, which now has the correct baseURL
    api.get('/products').then(res => setProducts(res.data));
  }, []);

  const handleChange = (e) => {
    if (e.target.name === 'image') {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => setForm({ ...form, [e.target.name]: reader.result });
        reader.readAsDataURL(file);
      }
    } else {
      setForm({ ...form, [e.target.name]: e.target.name === 'price' || e.target.name === 'quantity' ? parseFloat(e.target.value) : e.target.value });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editId) {
      api.put(`/products/${editId}`, form).then(res => {
        setProducts(products.map(p => p.id === editId ? res.data : p));
        setEditId(null);
      });
    } else {
      api.post('/products', form).then(res => setProducts([...products, res.data]));
    }
    setForm({ name: '', description: '', category: '', price: 0, quantity: 0, image: '' });
  };

  const handleDelete = (id) => api.delete(`/products/${id}`).then(() => setProducts(products.filter(p => p.id !== id)));
  const handleEdit = (product) => { setForm(product); setEditId(product.id); };
  const handleQtyChange = (id, value) => setAddQty({ ...addQty, [id]: value });
  const handleAddStock = (id) => {
    const qty = parseInt(addQty[id] || 0);
    if (qty > 0) {
      // Use the api instance for the /stock/add endpoint as well
      api.post('/stock/add', { productId: id, quantity: qty }).then(() => {
        setProducts(products.map(p => p.id === id ? { ...p, quantity: p.quantity + qty } : p));
        setAddQty({ ...addQty, [id]: 0 });
      });
    }
  };

  return (
    <div className="content">
      <h2>Inventory Management</h2>
      <form onSubmit={handleSubmit}>
        <input name="name" value={form.name} onChange={handleChange} placeholder="Name" required />
        <input name="description" value={form.description} onChange={handleChange} placeholder="Description" required />
        <input name="category" value={form.category} onChange={handleChange} placeholder="Category" required />
        <input name="price" type="number" value={form.price} onChange={handleChange} placeholder="Price" step="0.01" required />
        <input name="quantity" type="number" value={form.quantity} onChange={handleChange} placeholder="Initial Quantity" required />
        <input name="image" type="file" accept="image/*" onChange={handleChange} />
        <button type="submit">{editId ? 'Update' : 'Add'} Product</button>
      </form>
      <table>
        <thead><tr><th>Name</th><th>Description</th><th>Category</th><th>Price</th><th>Quantity</th><th>Actions</th></tr></thead>
        <tbody>
          {products.map(p => (
            <tr key={p.id} className={p.quantity < 10 ? 'low-stock' : ''}>
              <td>{p.name}</td><td>{p.description}</td><td>{p.category}</td><td>M{p.price.toFixed(2)}</td><td>{p.quantity}</td>
              <td>
                <button onClick={() => handleEdit(p)}>Edit</button>
                <button onClick={() => handleDelete(p.id)}>Delete</button>
                <input type="number" value={addQty[p.id] || ''} onChange={(e) => handleQtyChange(p.id, e.target.value)} placeholder="Add Qty" />
                <button onClick={() => handleAddStock(p.id)}>Add Stock</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Inventory;
