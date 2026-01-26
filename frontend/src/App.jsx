// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Systems from './pages/Systems';
import SystemDetail from './pages/SystemDetail';

// Placeholder för andra sidor
const Placeholder = ({ title }) => (
  <div className="p-10 text-center text-slate-400">
    <h2 className="text-2xl font-bold">{title}</h2>
    <p>Kommer snart...</p>
  </div>
);

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          
          {/* Nya routes för system */}
          <Route path="/systems" element={<Systems />} />
          <Route path="/systems/:id" element={<SystemDetail />} />
          
          <Route path="/meetings" element={<Placeholder title="Mötesrummet" />} />
          <Route path="/upgrades" element={<Placeholder title="Uppgraderingar" />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;