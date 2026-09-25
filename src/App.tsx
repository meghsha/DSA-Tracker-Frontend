import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProblemDetails from './pages/ProblemDetails';
import Planner from './pages/Planner';
import ProtectedRoute from './components/ProtectedRoute';
import GuestRoute from './components/GuestRoute';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Guest routes: accessible only when not authenticated */}
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>
          {/* Protected routes: accessible only when authenticated */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/problems/:problemId" element={<ProblemDetails />} />
            <Route path="/planner" element={<Planner />} />
            {/* Add other protected routes here */}
            {/* Root route for authenticated users: redirect to dashboard */}
            <Route
              path="/"
              element={<Navigate to="/dashboard" replace />}
            >
            </Route>
          </Route>
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;