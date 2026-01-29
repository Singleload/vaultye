import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Components
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Systems from './pages/Systems';
import SystemDetail from './pages/SystemDetail';
import MeetingRoom from './pages/MeetingRoom';
import DecisionPage from './pages/DecisionPage';
import AdminUsers from './pages/AdminUsers';

// Skyddad Route Wrapper
const ProtectedRoute = ({ children, requireAdmin }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Layout Wrapper för inloggade sidor
const AppLayout = () => {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Publik Route: Login */}
        <Route path="/login" element={<Login />} />
        
        {/* Publik Route: Externt beslutsfattande (kräver ingen inloggning, access via token) */}
        <Route path="/decision/:token" element={<DecisionPage />} />

        {/* Skyddade Routes (kräver inloggning) */}
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/systems" element={<Systems />} />
          <Route path="/systems/:id" element={<SystemDetail />} />
          <Route path="/systems/:id/meeting/:meetingId" element={<MeetingRoom />} />
          
          {/* Admin Routes */}
          <Route 
            path="/admin/users" 
            element={
              <ProtectedRoute requireAdmin>
                <AdminUsers />
              </ProtectedRoute>
            } 
          />
        </Route>

        {/* Catch all - skicka till Dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;