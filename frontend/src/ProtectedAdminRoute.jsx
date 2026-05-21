// ProtectedAdminRoute.jsx
import { Navigate } from 'react-router-dom';

export function ProtectedAdminRoute({ children }) {
  const role = localStorage.getItem('userRole');
  return role === 'admin' ? children : <Navigate to="/home" replace />;
}