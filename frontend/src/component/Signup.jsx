import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import Logo from "../assets/Logo.svg";
import { RiUser6Line } from "react-icons/ri";
import { AiOutlineMail } from "react-icons/ai";
import { CiLock } from "react-icons/ci";

export default function Signup({ model, setModel, switchToLogin }) {
  const { signup } = useContext(AuthContext);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await signup(username, email, password);

      if (result.success) {
        setSuccess("Signup successful! Redirecting...");
        setUsername("");
        setEmail("");
        setPassword("");

        setTimeout(() => {
          setModel(false);
          navigate("/direction");
        }, 1000);
      } else {
        // Show backend error
        setError(result.error || "Signup failed");
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={() => setModel(!model)}
        className="text-white text-sm bg-gradient-to-b from-[#341327] to-[#4F3127] border border-white px-3 sm:px-7 py-2 rounded-md cursor-pointer duration-300"
      >
        Sign Up
      </button>

      {model && (
        <div
          onClick={() => setModel(false)}
          className="fixed top-0 right-0 bg-[#000000a8] w-full h-full flex justify-center items-center z-30"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex flex-col justify-center items-center w-[95%] sm:w-100 h-auto gap-5 bg-gradient-to-b from-[#341327] to-[#4F3127] border border-white rounded-xl p-4"
          >
            <div className="flex justify-between items-center w-full h-12">
              <img src={Logo} alt="Logo" className="w-35" />
              <p className="text-white">Latest v1.0</p>
            </div>

            <h1 className="text-white text-xl font-bold">Sign Up</h1>

            {error && <p className="text-red-500 text-sm">{error}</p>}
            {success && <p className="text-green-500 text-sm">{success}</p>}

            <form className="flex flex-col gap-3 w-full text-white" onSubmit={handleSubmit}>
              <label>Username</label>
              <div className="flex items-center gap-3 w-full h-10 bg-[#ffffff11] border border-white rounded-md p-3">
                <RiUser6Line className="text-xl" />
                <input
                  type="text"
                  placeholder="Enter Username"
                  className="w-full text-white bg-transparent focus:outline-none"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <label>Email</label>
              <div className="flex items-center gap-3 w-full h-10 bg-[#ffffff11] border border-white rounded-md p-3">
                <AiOutlineMail className="text-xl" />
                <input
                  type="email"
                  placeholder="Enter Email"
                  className="w-full text-white bg-transparent focus:outline-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <label>Password</label>
              <div className="flex items-center gap-3 w-full h-10 bg-[#ffffff11] border border-white rounded-md p-3">
                <CiLock className="text-xl" />
                <input
                  type="password"
                  placeholder="Enter Password"
                  className="w-full text-white bg-transparent focus:outline-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-9 bg-gradient-to-r from-[#341327] to-[#4F3127] border text-white hover:text-[#8d647d] border-white hover:border-[#311f19] rounded-md cursor-pointer"
              >
                {loading ? "Signing up..." : "Sign Up"}
              </button>
            </form>

            <div className="flex justify-center items-center gap-2 w-full text-white mt-2">
              <p>Already have an account?</p>
              <span
                className="font-semibold cursor-pointer hover:underline hover:text-[#341327]"
                onClick={() => {
                  setModel(false);
                  switchToLogin();
                }}
              >
                Login
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
