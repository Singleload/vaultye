import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Systems from './pages/Systems';
import SystemDetail from './pages/SystemDetail';
import MeetingRoom from './pages/MeetingRoom';
import DecisionPage from './pages/DecisionPage';

// En wrapper för sidor som ska ha Layout
const AppLayout = () => (
  <Layout>
    <Outlet />
  </Layout>
);

function App() {
  return (
    <Router>
      <Routes>
        {/* Publika sidor (Ingen sidebar) */}
        <Route path="/decision/:token" element={<DecisionPage />} />

        {/* Admin sidor (Med sidebar) */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/systems" element={<Systems />} />
          <Route path="/systems/:id" element={<SystemDetail />} />
          <Route path="/systems/:id/meeting/:meetingId" element={<MeetingRoom />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;