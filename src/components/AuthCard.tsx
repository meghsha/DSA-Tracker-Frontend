import React from 'react';
import { Link } from 'react-router-dom';

type AuthCardProps = {
  children: React.ReactNode;
  buttonText: string;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  subtitle: string;
  navText: string;
  navLink: string;
  navAction: string;
  error?: string | null;
};

export const AuthCard: React.FC<AuthCardProps> = ({
  children,
  buttonText,
  isLoading,
  onSubmit,
  subtitle,
  navText,
  navLink,
  navAction,
  error,
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">DSA Tracker</h2>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
        <form className="space-y-6" onSubmit={onSubmit}>
          {children}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? buttonText + 'ing...' : buttonText}
            </button>
          </div>
          <p className="text-center text-sm">
            {navText}{' '}
            <Link
              to={navLink}
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              {navAction}
            </Link>
          </p>
          {error && (
            <p className="mt-2 text-sm text-red-600 text-center">
              {error}
            </p>
          )}
        </form>
      </div>
    </div>
  );
};
