import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            element={<ProtectedRoute />}
          >
            <Route path="/dashboard" element={<Dashboard />} />
            {/* Add other protected routes here */}
            <Route
              path="/"
              element={<Navigate to="/dashboard" replace />}
            >
            </Route>
          </Route>
          {/* Redirect root to login if not protected */}
          <Route
            path="/"
            element={
              <Navigate to="/login" replace />
            }
          >
          </Route>
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
