// src/context/AuthContext.js
import React, { createContext } from "react";
import api from "../api/api"; // your axios instance

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Signup
  const signup = async (username, email, password) => {
    try {
      const response = await api.post("/users/signup/", {
        username,
        email,
        password,
      });
      
      // Save tokens and user to localStorage
      const { access, refresh } = response.data.tokens;
      localStorage.setItem("accessToken", access);
      localStorage.setItem("refreshToken", refresh);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      return { success: true, data: response.data };
    } catch (error) {
      console.error("Signup error:", error.response?.data || error.message);
      return { success: false, error: error.response?.data?.error || "Signup failed" };
    }
  };

  // Login
  const login = async (email, password) => {
    try {
      const response = await api.post("/users/login/", {
        email,
        password,
      });

      // Save tokens and user to localStorage
      const { access, refresh } = response.data.tokens;
      localStorage.setItem("accessToken", access);
      localStorage.setItem("refreshToken", refresh);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      return { success: true, data: response.data };
    } catch (error) {
      console.error("Login error:", error.response?.data || error.message);
      return { success: false, error: error.response?.data?.error || "Login failed" };
    }
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
