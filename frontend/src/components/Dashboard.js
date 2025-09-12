import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Dashboard() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    axios.get('/products')
      .then(res => {
        console.log('Fetched products:', res.data);
        setProducts(res.data.map(p => ({ ...p, hasImage: !!p.image })));
      })
      .catch(err => console.error('Error fetching products:', err));
  }, []);

  const handleImageChange = (e, productId) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        axios.put(`/products/${productId}`, { image: reader.result })
          .then(res => {
            console.log('Updated product:', res.data);
            setProducts(products.map(p => p.id === productId ? { ...res.data, hasImage: !!res.data.image } : p));
          })
          .catch(err => console.error('Error uploading image:', err));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="content">
      <h2>Dashboard</h2>
      <div className="card-container">
        {products.map(product => (
          <div key={product.id} className={`card ${product.hasImage ? 'has-image' : ''}`}>
            {product.image && <img src={product.image} alt={product.name} />}
            <h3>{product.name}</h3>
            <p>Quantity: {product.quantity}</p>
            <p>Price: M{product.price?.toFixed(2) || 'N/A'}</p>
            {!product.hasImage && (
              <div className="card-edit">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e, product.id)}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard
