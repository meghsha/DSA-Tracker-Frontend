import { Navigate, Outlet } from 'react-router-dom';
import React from 'react';

const ProtectedRoute: React.FC = () => {
  const token = localStorage.getItem('accessToken');
  return token ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
