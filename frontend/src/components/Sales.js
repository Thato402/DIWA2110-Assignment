import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Sales() {
  const [products, setProducts] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get('/products')
      .then(res => setProducts(res.data))
      .catch(err => console.error(err));
  }, []);

  const handleCheckboxChange = (productId) => {
    setSelectedItems(prev => {
      if (prev.some(item => item.productId === productId)) {
        return prev.filter(item => item.productId !== productId);
      } else {
        return [...prev, { productId, quantity: 1 }]; // Default to 1
      }
    });
  };

  const handleQuantityChange = (productId, value) => {
    const qty = parseInt(value) || 1; // Default to 1 if invalid
    setSelectedItems(prev =>
      prev.map(item =>
        item.productId === productId ? { ...item, quantity: qty } : item
      )
    );
  };

  const handleRemoveQuantity = (productId) => {
    setSelectedItems(prev =>
      prev.map(item =>
        item.productId === productId ? { ...item, quantity: undefined } : item
      ).filter(item => item.productId !== productId || item.quantity !== undefined)
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedItems.length === 0) {
      setError('Please select at least one product');
      return;
    }
    const validItems = selectedItems.map(item => ({
      productId: item.productId,
      quantity: item.quantity // Can be undefined, handled by backend
    }));
    axios.post('/sales', validItems)
      .then(() => {
        alert('Sale recorded successfully');
        setSelectedItems([]);
        setError('');
        axios.get('/products').then(res => setProducts(res.data)); // Refresh products
      })
      .catch(err => {
        setError(err.response?.data?.error || 'An error occurred');
      });
  };

  const calculateTotal = () => {
    return selectedItems.reduce((sum, item) => {
      const product = products.find(p => p.id === parseInt(item.productId));
      const qty = item.quantity || 1; // Default to 1 if not set
      return sum + (product?.price * qty || 0);
    }, 0);
  };

  return (
    <div className="content">
      <h2>Sales</h2>
      {error && <p style={{ color: '#000000' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="product-list">
          {products.map(product => (
            <div key={product.id} className="product-list-item">
              <input
                type="checkbox"
                checked={selectedItems.some(item => item.productId === product.id)}
                onChange={() => handleCheckboxChange(product.id)}
              />
              <span>{product.name} (Stock: {product.quantity}, Price: M{product.price?.toFixed(2)})</span>
              {selectedItems.some(item => item.productId === product.id) && (
                <>
                  <input
                    type="number"
                    min="1"
                    value={selectedItems.find(item => item.productId === product.id)?.quantity || 1}
                    onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                  />
                  <button type="button" onClick={() => handleRemoveQuantity(product.id)}>Remove Qty</button>
                </>
              )}
            </div>
          ))}
        </div>
        <button type="submit">Record Sale</button>
      </form>
      {selectedItems.length > 0 && (
        <div className="receipt">
          <h3>Receipt</h3>
          {selectedItems.map((item, index) => {
            const product = products.find(p => p.id === parseInt(item.productId));
            const qty = item.quantity || 1;
            return (
              <div key={index} className="receipt-item">
                {product?.name}: {qty} x M{product?.price?.toFixed(2)} = M{(product?.price * qty || 0).toFixed(2)}
              </div>
            );
          })}
          <div className="receipt-item"><strong>Total: M{calculateTotal().toFixed(2)}</strong></div>
        </div>
      )}
    </div>
  );
}

export default Sales;