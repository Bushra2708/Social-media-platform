import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { FiSun, FiMoon } from "react-icons/fi";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) return;
    
    setSubmitting(true);
    try {
      const data = await loginUser(formData);
      login(data.user, data.token);
      navigate("/");
    } catch (error) {
      alert(
        error?.response?.data?.message ||
          "Login failed"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen ${theme} bg-[var(--bg-base)] text-[var(--text-main)] flex items-center justify-center px-4 transition-colors duration-300 relative overflow-hidden text-left`}>
      
      {/* Corner Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-3 rounded-full glass-panel hover:bg-[var(--hover-bg)] transition-all cursor-pointer z-50"
      >
        {theme === "dark" ? (
          <FiSun className="w-5 h-5 text-amber-400 rotate-0 hover:rotate-45 transition-transform duration-300" />
        ) : (
          <FiMoon className="w-5 h-5 text-indigo-500" />
        )}
      </button>

      {/* Absolute Background Blobs */}
      <div className="absolute inset-0 overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[380px] h-[380px] rounded-full blur-[140px] bg-gradient-to-br from-[#38bdf8]/15 to-[#6366f1]/15 dark:from-[#38bdf8]/5 dark:to-[#6366f1]/5 animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[380px] h-[380px] rounded-full blur-[140px] bg-gradient-to-br from-[#10b981]/15 to-[#6366f1]/15 dark:from-[#10b981]/5 dark:to-[#6366f1]/5 animate-pulse" />
      </div>

      {/* Main card */}
      <div className="w-full max-w-md p-8 rounded-3xl glass-panel relative animate-in fade-in-50 zoom-in-95 duration-200">
        <h1 className="text-4xl text-center font-black mb-2 text-gradient uppercase tracking-wide">
          Welcome Back
        </h1>
        <p className="text-center text-xs text-gray-500 mb-8">Login to enter the Sphere</p>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400">Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="name@example.com"
              required
              onChange={handleChange}
              disabled={submitting}
              className="w-full p-4 rounded-xl custom-input outline-none text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400">Password</label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              required
              onChange={handleChange}
              disabled={submitting}
              className="w-full p-4 rounded-xl custom-input outline-none text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 bg-[var(--button-bg)] text-[var(--button-text)] py-4 rounded-xl font-bold text-sm shadow-lg hover:opacity-90 transition-all duration-300 transform active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {submitting ? "Entering..." : "Login"}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-6">
          New to Sphere?
          <Link
            to="/register"
            className="text-[var(--primary-accent)] font-semibold ml-1 hover:underline"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}