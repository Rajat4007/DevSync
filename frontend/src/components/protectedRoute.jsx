import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

//  Guard 1: Sirf Logged In Users ke liye (Dashboard, Kanban ke liye)
export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  // Jab tak check chal raha hai, tab tak screen par kuch mat dikhao (ya loading screen)
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0f] text-white">
        <div className="w-6 h-6 rounded-full border-2 border-t-transparent border-violet-500 animate-spin" />
      </div>
    );
  }

  // Agar user logged in nahi hai, toh use login page par redirect kar do
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Guard 2: Sirf Unauthenticated Users ke liye (Login, Register ke liye)
export const PublicRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0f] text-white">
        <div className="w-6 h-6 rounded-full border-2 border-t-transparent border-violet-500 animate-spin" />
      </div>
    );
  }

  // Agar user pehle se logged in hai, toh use login page mat dikhao, direct dashboard bhejo
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};