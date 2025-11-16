import { createContext, useState, useEffect } from "react";
import { loginUser, signupUser } from "../services/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user")) || null
  );
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on first render
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
    setLoading(false);
  }, []);

  // ======================
  // LOGIN
  // ======================
  const login = async (email, password) => {
    try {
      const response = await loginUser({ email, password });
      const { user, tokens } = response.data;

      // Store user and tokens in localStorage
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("accessToken", tokens.access);
      localStorage.setItem("refreshToken", tokens.refresh);

      setUser(user);
      return { success: true, data: response.data };
    } catch (err) {
      console.error("Login error:", err);

      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Login failed";

      return { success: false, error: message };
    }
  };

  // ======================
  // SIGNUP
  // ======================
  const signup = async (username, email, password) => {
    try {
      const response = await signupUser({ username, email, password });
      const { user, tokens } = response.data;

      // Store user and tokens in localStorage
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("accessToken", tokens.access);
      localStorage.setItem("refreshToken", tokens.refresh);

      setUser(user);
      return { success: true, data: response.data };
    } catch (err) {
      console.error("Signup error:", err);

      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Signup failed";

      return { success: false, error: message };
    }
  };

  // ======================
  // LOGOUT
  // ======================
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
