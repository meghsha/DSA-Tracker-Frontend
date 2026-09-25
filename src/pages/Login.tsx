import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import type { LoginResponse } from '../types/auth';
import { AuthCard } from '../components/AuthCard';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validateEmail = (value: string) => {
    if (!value) {
      setEmailError('Email is required');
      return false;
    }
    // Simple email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      setEmailError('Enter a valid email address');
      return false;
    }
    setEmailError(null);
    return true;
  };

  const validatePassword = (value: string) => {
    if (!value) {
      setPasswordError('Password is required');
      return false;
    }
    setPasswordError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Reset errors
    setError(null);
    setEmailError(null);
    setPasswordError(null);

    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await api.post<LoginResponse>('/api/auth/login', {
        email,
        password,
      });
      const { accessToken } = response.data;
      localStorage.setItem('accessToken', accessToken);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      buttonText="Sign in"
      isLoading={loading}
      onSubmit={handleSubmit}
      subtitle="Welcome back\nContinue tracking your DSA preparation."
      navText="Don't have an account? "
      navLink="/register"
      navAction="Create one"
      error={error}
    >
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setEmailError(null);
          }}
          onBlur={() => validateEmail(email)}
          placeholder="you@example.com"
        />
        {emailError && (
          <p className="mt-1 text-sm text-red-600">{emailError}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm pr-10"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setPasswordError(null);
            }}
            onBlur={() => validatePassword(password)}
            placeholder="•••••••••••"
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center pr-2"
            onClick={() => setShowPassword(!showPassword)}
            aria-label="Show password"
          >
            {showPassword ? (
              <span className="text-sm text-gray-500">Show</span>
            ) : (
              <span className="text-sm text-gray-500">Hide</span>
            )}
          </button>
        </div>
        {passwordError && (
          <p className="mt-1 text-sm text-red-600">{passwordError}</p>
        )}
      </div>
    </AuthCard>
  );
};

export default Login;
