import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({ name: '', email: '' });
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    axios.get('/customers').then(res => setCustomers(res.data));
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSubmit = (e) => {
    e.preventDefault();
    if (editId) {
      axios.put(`/customers/${editId}`, form).then(res => {
        setCustomers(customers.map(c => c.id === editId ? res.data : c));
        setEditId(null);
      });
    } else {
      axios.post('/customers', form).then(res => setCustomers([...customers, res.data]));
    }
    setForm({ name: '', email: '' });
  };
  const handleDelete = (id) => axios.delete(`/customers/${id}`).then(() => setCustomers(customers.filter(c => c.id !== id)));
  const handleEdit = (customer) => { setForm(customer); setEditId(customer.id); };

  return (
    <div>
      <h2>Customer Management</h2>
      <form onSubmit={handleSubmit}>
        <input name="name" value={form.name} onChange={handleChange} placeholder="Name" required />
        <input name="email" value={form.email} onChange={handleChange} placeholder="Email" required />
        <button type="submit">{editId ? 'Update' : 'Add'} Customer</button>
      </form>
      <table>
        <thead><tr><th>Name</th><th>Email</th><th>Actions</th></tr></thead>
        <tbody>
          {customers.map(c => (
            <tr key={c.id}>
              <td>{c.name}</td><td>{c.email}</td>
              <td>
                <button onClick={() => handleEdit(c)}>Edit</button>
                <button onClick={() => handleDelete(c.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Customers;