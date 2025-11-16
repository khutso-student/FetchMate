import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const { user } = useContext(AuthContext);

  // Redirect unauthenticated users to "/" (Home)
  return user ? children : <Navigate to="/" replace />;
};

export default ProtectedRoute;
