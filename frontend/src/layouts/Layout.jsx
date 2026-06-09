import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import Sidebar from "../components/Sidebar";
import RightSidebar from "../components/RightSidebar";
import CommandPalette from "../components/CommandPalette";
import useKeyboardShortcuts from "../hooks/useKeyboardShortcuts";
import { createPost } from "../services/postService";
import {
  FiHome,
  FiSearch,
  FiBell,
  FiUser,
  FiPlus,
  FiX,
  FiImage,
  FiMessageSquare,
} from "react-icons/fi";

export default function Layout({ children }) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Hook global keys navigation Fast Paths
  useKeyboardShortcuts(() => setIsModalOpen(true));

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreatePost = async () => {
    if (!postContent.trim() && !imageFile) return;
    setSubmitting(true);
    try {
      await createPost(postContent, imageFile);
      setPostContent("");
      setImageFile(null);
      setImagePreview("");
      setIsModalOpen(false);
      
      // Refresh the page or navigate to home to show the new post
      if (location.pathname === "/") {
        window.location.reload();
      } else {
        navigate("/");
      }
    } catch (error) {
      console.error("Failed to create post from layout modal:", error);
      alert("Failed to create post. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return <div className={`min-h-screen ${theme} bg-[var(--bg-base)] text-[var(--text-main)] transition-colors duration-300`}>{children}</div>;
  }

  return (
    <div className={`min-h-screen ${theme} bg-[var(--bg-base)] text-[var(--text-main)] transition-colors duration-300 flex relative`}>
      {/* Spotlight Command Palette search box */}
      <CommandPalette />

      {/* Absolute Floating Animated Background Blobs */}
      <div className="fixed inset-0 overflow-hidden -z-10 pointer-events-none">
        {/* Blob 1: Top Left - Peach/Rose */}
        <div className="absolute top-[-10%] left-[-10%] w-[450px] h-[450px] rounded-full blur-[150px] transition-all duration-1000 bg-gradient-to-br from-[#ffe0c5]/20 to-[#ad5c71]/20 dark:from-[#ffe0c5]/5 dark:to-[#760031]/5 animate-pulse" />
        {/* Blob 2: Bottom Right - Plum/Rose */}
        <div className="absolute bottom-[-10%] right-[-10%] w-[550px] h-[550px] rounded-full blur-[160px] transition-all duration-1000 bg-gradient-to-br from-[#760031]/20 to-[#ad5c71]/20 dark:from-[#ad5c71]/5 dark:to-[#ffe0c5]/5 animate-pulse" />
      </div>

      {/* Desktop Left Sidebar */}
      <Sidebar onOpenCreatePost={() => setIsModalOpen(true)} />

      {/* Main Container */}
      <main className="flex-1 md:ml-64 lg:mr-80 min-h-screen pb-20 md:pb-0 flex flex-col items-center">
        
        {/* Mobile Top Header */}
        <header className="md:hidden w-full flex items-center justify-between px-6 py-4 sticky top-0 bg-[var(--bg-base)]/80 backdrop-blur-xl border-b border-[var(--border-color)] z-30">
          <Link to="/" className="text-xl font-black uppercase text-gradient">
            Sphere
          </Link>
          <button
            onClick={() => setIsModalOpen(true)}
            className="p-2 rounded-full bg-[var(--button-bg)] text-[var(--button-text)] shadow-lg hover:shadow-cyan-500/10 cursor-pointer"
          >
            <FiPlus className="w-5 h-5" />
          </button>
        </header>

        {/* Dynamic page content */}
        <div className="w-full max-w-2xl px-4 py-6 md:py-8">
          {children}
        </div>
      </main>

      {/* Desktop Right Sidebar */}
      <RightSidebar />

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[var(--bg-base)]/90 backdrop-blur-xl border-t border-[var(--border-color)] flex items-center justify-around px-6 z-40">
        {[
          { icon: FiHome, path: "/" },
          { icon: FiSearch, path: "/search" },
          { icon: FiBell, path: "/notifications" },
          { icon: FiMessageSquare, path: "/messages" },
          { icon: FiUser, path: `/profile/${user._id}` },
        ].map((item, idx) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={idx}
              to={item.path}
              className={`p-2 rounded-xl transition-all duration-200 ${
                isActive ? "text-[var(--primary-accent)] scale-110" : "text-gray-500"
              }`}
            >
              <Icon className="w-6 h-6" />
            </Link>
          );
        })}
      </nav>

      {/* Global Create Post Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md z-50 p-4">
          <div className="w-full max-w-lg glass-panel rounded-3xl p-6 relative animate-in fade-in-50 zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              onClick={() => {
                setIsModalOpen(false);
                setPostContent("");
                setImageFile(null);
                setImagePreview("");
              }}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/5 text-[var(--text-secondary)] hover:text-[var(--text-main)] cursor-pointer"
            >
              <FiX className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold mb-4 text-gradient">Create new post</h3>

            {/* Input area */}
            <div className="flex space-x-3 items-start">
              <img
                src={user.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"}
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover border border-[var(--border-color)]"
              />
              <div className="flex-1 space-y-4">
                <textarea
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="What's on your mind?"
                  rows="4"
                  className="w-full bg-transparent resize-none outline-none text-[var(--text-main)] text-sm placeholder-gray-500"
                />

                {imagePreview && (
                  <div className="relative rounded-2xl overflow-hidden border border-[var(--border-color)] aspect-video bg-black/20">
                    <img
                      src={imagePreview}
                      alt="Upload Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview("");
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-black/90 text-white cursor-pointer"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-[var(--border-color)]">
                  {/* File Upload Trigger */}
                  <label className="flex items-center space-x-1.5 text-xs text-[var(--secondary-accent)] hover:text-[var(--text-secondary)] font-medium cursor-pointer">
                    <FiImage className="w-4 h-4" />
                    <span>Add Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>

                  <button
                    onClick={handleCreatePost}
                    disabled={submitting || (!postContent.trim() && !imageFile)}
                    className="px-5 py-2 rounded-xl text-[var(--button-text)] font-semibold text-xs bg-[var(--button-bg)] hover:opacity-90 transition-all duration-300 transform active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                  >
                    {submitting ? "Posting..." : "Post"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
