import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useEffect, useState } from "react";
import { getNotifications } from "../services/notificationService";
import { getConversations } from "../services/messageService";
import {
  FiHome,
  FiSearch,
  FiBell,
  FiUser,
  FiLogOut,
  FiPlusSquare,
  FiSun,
  FiMoon,
  FiMessageSquare,
} from "react-icons/fi";

export default function Sidebar({ onOpenCreatePost }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);

  // Fetch unread notifications
  useEffect(() => {
    if (!user) return;

    const fetchUnread = async () => {
      try {
        const data = await getNotifications();
        const unread = data.notifications.filter((n) => !n.read).length;
        setUnreadCount(unread);
      } catch (err) {
        console.log("Unread count fetch failed:", err);
      }
    };

    fetchUnread();
    
    // Live update listeners
    const handleNewNotification = () => {
      setUnreadCount((prev) => prev + 1);
    };

    window.addEventListener("new_notification", handleNewNotification);
    return () => {
      window.removeEventListener("new_notification", handleNewNotification);
    };
  }, [user, location.pathname]);

  // Fetch unread messages
  useEffect(() => {
    if (!user) return;

    const fetchUnreadMsgs = async () => {
      try {
        const data = await getConversations();
        const unread = (data.conversations || []).reduce((acc, c) => acc + c.unreadCount, 0);
        setUnreadMsgCount(unread);
      } catch (err) {
        console.log("Unread messages count fetch failed:", err);
      }
    };

    fetchUnreadMsgs();

    const handleNewMessage = () => {
      if (!location.pathname.startsWith("/messages")) {
        setUnreadMsgCount((prev) => prev + 1);
      }
    };

    window.addEventListener("new_message", handleNewMessage);
    return () => {
      window.removeEventListener("new_message", handleNewMessage);
    };
  }, [user, location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    { name: "Home", path: "/", icon: FiHome },
    { name: "Search", path: "/search", icon: FiSearch },
    {
      name: "Notifications",
      path: "/notifications",
      icon: FiBell,
      badge: unreadCount,
    },
    {
      name: "Messages",
      path: "/messages",
      icon: FiMessageSquare,
      badge: unreadMsgCount,
    },
    { name: "Profile", path: `/profile/${user?._id}`, icon: FiUser },
  ];

  return (
    <aside className="w-64 fixed h-screen top-0 left-0 hidden md:flex flex-col border-r border-[var(--border-color)] bg-[var(--panel-bg)] backdrop-blur-xl p-6 justify-between z-40">
      <div className="space-y-8 w-full">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center space-x-2 px-2">
          <span className="text-2xl font-black tracking-wider text-gradient uppercase">
            Sphere
          </span>
        </Link>

        {/* User Card */}
        {user && (
          <div className="flex items-center space-x-3 p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--border-color)]">
            <img
              src={user.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"}
              alt={user.name}
              className="w-10 h-10 rounded-full object-cover border border-[var(--secondary-accent)]/30"
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate text-[var(--text-main)]">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">@{user.username}</p>
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center justify-between p-3.5 rounded-xl font-medium transition-all duration-200 group ${
                  isActive
                    ? "bg-[var(--hover-bg)] text-[var(--primary-accent)] border border-[var(--border-color)] font-bold shadow-sm"
                    : "text-gray-400 hover:text-[var(--text-main)] hover:bg-[var(--hover-bg)]"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-5 h-5 transition-transform duration-200 ${!isActive && "group-hover:scale-110"}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge > 0 && (
                  <span className="px-2 py-0.5 text-xs font-bold bg-[var(--primary-accent)] text-[var(--button-text)] rounded-full animate-pulse">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Quick Create Post button */}
          {onOpenCreatePost && (
            <button
              onClick={onOpenCreatePost}
              className="w-full flex items-center justify-center space-x-2 mt-4 bg-[var(--button-bg)] text-[var(--button-text)] hover:opacity-90 font-semibold py-3 px-4 rounded-xl shadow-lg transition-all duration-300 transform active:scale-95 cursor-pointer"
            >
              <FiPlusSquare className="w-5 h-5" />
              <span>New Post</span>
            </button>
          )}
        </nav>
      </div>

      <div className="space-y-2 w-full">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="flex items-center justify-between p-3.5 w-full rounded-xl text-gray-400 hover:text-[var(--text-main)] hover:bg-[var(--hover-bg)] transition-all duration-200 group cursor-pointer text-left"
        >
          <div className="flex items-center space-x-3">
            {theme === "dark" ? (
              <FiSun className="w-5 h-5 text-amber-400 group-hover:rotate-45 transition-transform duration-500" />
            ) : (
              <FiMoon className="w-5 h-5 text-indigo-500" />
            )}
            <span className="text-sm font-medium">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
          </div>
        </button>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 p-3.5 w-full rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/5 transition-all duration-200 group cursor-pointer text-left"
        >
          <FiLogOut className="w-5 h-5 group-hover:translate-x-0.5 transition-transform duration-200" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}
