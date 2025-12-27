
import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import MachineryPage from './components/MachineryPage';
import PlotsPage from './components/PlotsPage';
import InputsPage from './components/InputsPage';
import ProductionPage from './components/ProductionPage';

const App: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/machinery" element={<MachineryPage />} />
          <Route path="/plots" element={<PlotsPage />} />
          <Route path="/inputs" element={<InputsPage />} />
          <Route path="/production" element={<ProductionPage />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
