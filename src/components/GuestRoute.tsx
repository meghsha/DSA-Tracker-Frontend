import { Navigate, Outlet } from 'react-router-dom';
import React from 'react';

const GuestRoute: React.FC = () => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    return <Outlet />;
  }

  // Check if token is expired (JWT)
  try {
    const payload = token.split('.')[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(base64);
    const parsed = JSON.parse(decoded);
    const now = Math.floor(Date.now() / 1000);
    if (parsed.exp && parsed.exp < now) {
      // Token expired
      localStorage.removeItem('accessToken');
      return <Outlet />;
    }
  } catch (err) {
    // If token is malformed, treat as invalid
    localStorage.removeItem('accessToken');
    return <Outlet />;
  }

  // Token is valid, redirect to dashboard
  return <Navigate to="/dashboard" replace />;
};

export default GuestRoute;