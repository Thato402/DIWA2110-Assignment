import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import Sales from './components/Sales';
import Reporting from './components/Reporting';
import './App.css';

function App() {
  return (
    <Router>
      <nav>
        <Link to="/">Dashboard</Link> | 
        <Link to="/inventory">Inventory</Link> | 
        <Link to="/sales">Sales</Link> | 
        <Link to="/reporting">Reporting</Link>
      </nav>
      <div className="content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/reporting" element={<Reporting />} />
        </Routes>
      </div>
      <footer>
        Wings Cafe © 2025 All rights reserved.
      </footer>
    </Router>
  );
}

export default App;