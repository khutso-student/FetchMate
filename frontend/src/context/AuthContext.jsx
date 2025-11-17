// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect } from "react";
import api from "../services/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Load user on refresh
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  // Signup
  const signup = async (username, email, password) => {
    try {
      const response = await api.post("/users/signup/", {
        username,
        email,
        password,
      });

      // Save tokens (use correct keys from backend)
      const { accessToken, refreshToken } = response.data.tokens;
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);

      // Save user
      localStorage.setItem("user", JSON.stringify(response.data.user));
      setUser(response.data.user);

      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Signup failed",
      };
    }
  };

  // Login
  const login = async (email, password) => {
    try {
      const response = await api.post("/users/login/", { email, password });

      // Save tokens (use correct keys)
      const { accessToken, refreshToken } = response.data.tokens;
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);

      // Save user
      localStorage.setItem("user", JSON.stringify(response.data.user));
      setUser(response.data.user);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Login failed",
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
