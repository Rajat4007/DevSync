import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

// Context Create kiya
export const AuthContext = createContext();

// Vite ka environment variable nikaala 
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export const AuthProvider = ({ children }) => {
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // App load hote hi sync check karo
  useEffect(() => {
    const checkUser = () => {
      const storedUser = localStorage.getItem("userInfo");
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          // Token globally attach kiya code ke hisab se
          axios.defaults.headers.common["Authorization"] = `Bearer ${parsedUser.token}`;
        } catch (e) {
          console.error("Token parsing error, clearing storage", e);
          localStorage.removeItem("userInfo");
        }
      }
      setLoading(false); // Checking khatam hone ke baad hi false hoga
    };

    checkUser();
  }, []);

  // Login Function
  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email,
        password,
      });

      setUser(response.data.user || response.data);
      localStorage.setItem("userInfo", JSON.stringify(response.data));
      axios.defaults.headers.common["Authorization"] = `Bearer ${response.data.token}`;

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Login failed. Try again.",
      };
    }
  };

  // Register (Signup) Function
  const register = async (name, email, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/register`, {
        name,
        email,
        password,
      });

      setUser(response.data.user || response.data);
      localStorage.setItem("userInfo", JSON.stringify(response.data));
      axios.defaults.headers.common["Authorization"] = `Bearer ${response.data.token}`;

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Registration failed.",
      };
    }
  };

  // Logout Function
  const logout = () => {
    localStorage.removeItem("userInfo");
    delete axios.defaults.headers.common["Authorization"];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};