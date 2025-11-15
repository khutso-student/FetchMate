import { createContext, useState, useEffect } from "react";
import { loginUser, signupUser } from "../services/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")) || null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on first render
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
    setLoading(false);
  }, []);

  // Login using email + password
  const login = async (email, password) => {
    const response = await loginUser({ email, password });
    const { user, tokens } = response.data;

    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("accessToken", tokens.access);
    localStorage.setItem("refreshToken", tokens.refresh);

    setUser(user);
    return response.data;
  };

  // Signup
  const signup = async (username, email, password) => {
    const response = await signupUser({ username, email, password });
    const { user, tokens } = response.data;

    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("accessToken", tokens.access);
    localStorage.setItem("refreshToken", tokens.refresh);

    setUser(user);
    return response.data;
  };

  // Logout
  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
