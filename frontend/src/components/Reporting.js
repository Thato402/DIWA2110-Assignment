import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Reporting() {
  const [lowStock, setLowStock] = useState([]);
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [totalItemsBought, setTotalItemsBought] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [remainingWorth, setRemainingWorth] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const refreshData = () => {
    setRefreshKey(prev => prev + 1);
  };

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      axios.get('/reports/lowstock'),
      axios.get('/sales'),
      axios.get('/products')
    ])
      .then(([lowRes, salesRes, prodRes]) => {
        setLowStock(lowRes.data || []);
        setSales(salesRes.data || []);
        setProducts(prodRes.data || []);

        // Total Items Bought
        const itemsBought = (salesRes.data || []).reduce((sum, sale) => {
          return sum + (sale.items || []).reduce((subSum, item) => subSum + (parseInt(item.quantity) || 1), 0);
        }, 0);
        setTotalItemsBought(itemsBought);

        // Total Revenue
        const revenue = (salesRes.data || []).reduce((sum, sale) => {
          return sum + (sale.items || []).reduce((subSum, item) => {
            const product = (prodRes.data || []).find(p => p.id === parseInt(item.productId));
            const qty = parseInt(item.quantity) || 1;
            if (!product) {
              console.warn(`Product not found for sale item ${item.productId}`);
              return subSum;
            }
            if (!product.price || product.price <= 0) {
              console.warn(`Invalid price for product ID ${item.productId}: ${product.price}`);
              return subSum;
            }
            const saleRevenue = product.price * qty;
            console.log(`Sale ${sale.id} Item ${item.productId}: Qty ${qty}, Price ${product.price}, Revenue ${saleRevenue}`);
            return subSum + saleRevenue;
          }, 0);
        }, 0);
        setTotalRevenue(revenue);

        // Remaining Worth
        const worth = (prodRes.data || []).reduce((sum, p) => {
          if (!p.price || p.price <= 0) {
            console.warn(`Invalid price for product ID ${p.id}: ${p.price}`);
            return sum;
          }
          return sum + (p.quantity * p.price);
        }, 0);
        setRemainingWorth(worth);

        // Total Available Products
        const availableProducts = (prodRes.data || []).filter(p => p.quantity > 0).length;
        setTotalProducts(availableProducts);
      })
      .catch(err => console.error('Error fetching data:', err))
      .finally(() => setIsLoading(false));
  }, [refreshKey]);

  // Calculate sales trends (total quantity sold per product)
  const getSalesTrend = (productId) => {
    return (sales || []).reduce((sum, sale) => {
      const item = (sale.items || []).find(i => parseInt(i?.productId) === productId);
      return sum + (parseInt(item?.quantity) || 0);
    }, 0);
  };

  if (isLoading) {
    return <div className="content"><p>Loading...</p></div>;
  }

  return (
    <div className="content">
      <h2>Reporting</h2>
      

      <h3>Overview of Available Products</h3>
      <table>
        <tbody>
          <tr><td>Total Available Products</td><td>{totalProducts}</td></tr>
          <tr><td>Total Worth of Available Products</td><td>M{remainingWorth.toFixed(2) || '0.00'}</td></tr>
        </tbody>
      </table>

      <h3>Available Products and Sales Trends</h3>
      <table className="products-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Quantity</th>
            <th>Worth</th>
            <th>Total Sold</th>
          </tr>
        </thead>
        <tbody>
          {products.filter(p => p.quantity > 0).map(p => (
            <tr key={p.id}>
              <td data-label="Name">{p.name}</td>
              <td data-label="Quantity">{p.quantity}</td>
              <td data-label="Worth">M{(p.quantity * (p.price || 0)).toFixed(2)}</td>
              <td data-label="Total Sold">{getSalesTrend(p.id)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Low Stock Products</h3>
      <table>
        <thead><tr><th>Name</th><th>Description</th><th>Quantity</th><th>Price</th></tr></thead>
        <tbody>
          {lowStock.map(p => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{p.description}</td>
              <td>{p.quantity}</td>
              <td>M{p.price?.toFixed(2) || 'N/A'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Sales Records Summary</h3>
      <table>
        <tbody>
          <tr><td>Total Items Bought</td><td>{totalItemsBought}</td></tr>
          <tr><td>Total Money Recovered from Sales</td><td>M{totalRevenue.toFixed(2) || '0.00'}</td></tr>
          <tr><td>Total Worth of Remaining Products</td><td>M{remainingWorth.toFixed(2) || '0.00'}</td></tr>
        </tbody>
      </table>

     
    </div>
  );
}

export default Reporting;