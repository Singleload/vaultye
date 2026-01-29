import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Systems from './pages/Systems';
import SystemDetail from './pages/SystemDetail';
import MeetingRoom from './pages/MeetingRoom';
import DecisionPage from './pages/DecisionPage';
import { Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import AdminUsers from './pages/AdminUsers'; // Vi skapar denna strax

// Skyddad Route Wrapper
const ProtectedRoute = ({ children, requireAdmin }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (requireAdmin && user.role !== 'ADMIN') return <Navigate to="/" />;
  return children;
};

// En wrapper för sidor som ska ha Layout
const AppLayout = () => {
    // ... (hämta user för att visa namn i menyn ev.)
    return (
        <Layout>
            <Outlet />
        </Layout>
    )
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/decision/:token" element={<DecisionPage />} />

        {/* Skyddade sidor */}
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/systems" element={<Systems />} />
          <Route path="/systems/:id" element={<SystemDetail />} />
          <Route path="/systems/:id/meeting/:meetingId" element={<MeetingRoom />} />
          
          {/* Admin Route */}
          <Route path="/admin/users" element={
            <ProtectedRoute requireAdmin>
              <AdminUsers />
            </ProtectedRoute>
          } />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;