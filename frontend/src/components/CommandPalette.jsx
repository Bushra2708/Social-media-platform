import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { searchUsers } from "../services/userService";
import { FiSearch, FiUser, FiBell, FiHome, FiMessageSquare, FiTrendingUp, FiMoon, FiSun } from "react-icons/fi";

export default function CommandPalette() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [userResults, setUserResults] = useState([]);
  
  const inputRef = useRef(null);

  // Define static navigation commands
  const staticCommands = [
    { id: "home", title: "Go to Home Feed", category: "Navigation", icon: FiHome, action: () => navigate("/") },
    { id: "search", title: "Search users", category: "Navigation", icon: FiSearch, action: () => navigate("/search") },
    { id: "notifications", title: "View notifications badge", category: "Navigation", icon: FiBell, action: () => navigate("/notifications") },
    { id: "messages", title: "Open direct messaging inbox", category: "Navigation", icon: FiMessageSquare, action: () => navigate("/messages") },
    { id: "profile", title: "View my profile cover", category: "Navigation", icon: FiUser, action: () => navigate(`/profile/${user?._id}`) },
    { id: "analytics", title: "Admin metrics dashboard", category: "Navigation", icon: FiTrendingUp, action: () => navigate("/analytics") },
    { id: "theme", title: `Toggle ${theme === "dark" ? "Light" : "Dark"} theme`, category: "System", icon: theme === "dark" ? FiSun : FiMoon, action: () => toggleTheme() },
  ];

  // Open/Close and global listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Fetch users as they search
  useEffect(() => {
    if (!query.trim()) {
      setUserResults([]);
      return;
    }

    const delaySearch = setTimeout(async () => {
      try {
        const data = await searchUsers(query);
        setUserResults(data.users || []);
      } catch (err) {
        console.error("Command palette user search failed:", err);
      }
    }, 200);

    return () => clearTimeout(delaySearch);
  }, [query]);

  // Reset selected cursor when list changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, userResults]);

  // Focus input automatically on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 80);
      setQuery("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter static list based on search string
  const matchedStatic = staticCommands.filter((c) =>
    c.title.toLowerCase().includes(query.toLowerCase())
  );

  // Combined searchable options list
  const combinedOptions = [
    ...matchedStatic,
    ...userResults.map((u) => ({
      id: `user-${u._id}`,
      title: `${u.name} (@${u.username})`,
      category: "Users",
      icon: FiUser,
      action: () => navigate(`/profile/${u._id}`),
      avatar: u.avatar
    }))
  ];

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % combinedOptions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + combinedOptions.length) % combinedOptions.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (combinedOptions[selectedIndex]) {
        combinedOptions[selectedIndex].action();
        setIsOpen(false);
      }
    }
  };

  return (
    <div
      onClick={() => setIsOpen(false)}
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-60 flex items-start justify-center p-4 md:p-12 animate-in fade-in duration-200"
    >
      {/* Palette Drawer box */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl glass-panel rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[70vh] border border-[var(--border-color)] mt-8 animate-in slide-in-from-top-4 duration-300"
      >
        {/* Input box */}
        <div className="flex items-center space-x-3 px-5 py-4 border-b border-[var(--border-color)]">
          <FiSearch className="text-gray-400 w-5 h-5 flex-shrink-0" />
          <input
            type="text"
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a page, command, or username..."
            className="w-full bg-transparent text-sm border-none outline-none text-[var(--text-main)] placeholder-gray-500"
          />
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold bg-[var(--hover-bg)] text-gray-500 rounded border border-[var(--border-color)]">
            ESC
          </kbd>
        </div>

        {/* Dynamic matched listings */}
        <div className="flex-grow overflow-y-auto p-2">
          {combinedOptions.length === 0 ? (
            <p className="text-xs text-gray-500 p-8 text-center">No options matched your query</p>
          ) : (
            // Group elements by category
            ["Navigation", "Users", "System"].map((category) => {
              const items = combinedOptions.filter((c) => c.category === category);
              if (items.length === 0) return null;

              return (
                <div key={category} className="mb-3">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-[var(--secondary-accent)] px-3 mb-1 block">
                    {category}
                  </span>
                  
                  <div className="space-y-0.5">
                    {items.map((item) => {
                      const absoluteIndex = combinedOptions.indexOf(item);
                      const isHovered = absoluteIndex === selectedIndex;
                      const Icon = item.icon;

                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            item.action();
                            setIsOpen(false);
                          }}
                          onMouseEnter={() => setSelectedIndex(absoluteIndex)}
                          className={`w-full flex items-center justify-between p-3 rounded-2xl text-left text-xs transition-colors cursor-pointer ${
                            isHovered
                              ? "bg-[var(--primary-accent)] text-[#070913] font-bold shadow-md"
                              : "text-[var(--text-main)] hover:bg-[var(--hover-bg)]"
                          }`}
                        >
                          <div className="flex items-center space-x-3 truncate">
                            {item.avatar ? (
                              <img
                                src={item.avatar}
                                alt=""
                                className="w-6 h-6 rounded-full object-cover border border-white/20"
                              />
                            ) : (
                              <Icon className="w-4.5 h-4.5 flex-shrink-0" />
                            )}
                            <span className="truncate">{item.title}</span>
                          </div>
                          
                          {isHovered && (
                            <span className="text-[10px] opacity-75 font-semibold">ENTER ↵</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        {/* Footer shortcuts helper */}
        <div className="bg-[var(--hover-bg)] border-t border-[var(--border-color)] px-5 py-3.5 flex items-center justify-between text-[10px] text-gray-500">
          <div className="flex space-x-4">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
          </div>
          <span>Sphere Palette</span>
        </div>
      </div>
    </div>
  );
}
