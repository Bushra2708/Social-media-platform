import { useEffect, useState, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { getPosts, getFeedPosts, createPost } from "../../services/postService";
import { searchUsers } from "../../services/userService";
import PostCard from "../../components/PostCard";
import StoriesTray from "../../components/StoriesTray";
import { FiImage, FiX, FiCpu, FiZap } from "react-icons/fi";

export default function Home() {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const fileInputRef = useRef(null);
  const observerRef = useRef(null);

  const [activeTab, setActiveTab] = useState("all"); // "all" or "following"
  const [content, setContent] = useState("");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Pagination states
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  // Drag & Drop Composer Upload States
  const [isDragging, setIsDragging] = useState(false);

  // Mention Autocomplete States
  const [mentionQuery, setMentionQuery] = useState(null);
  const [mentionUsers, setMentionUsers] = useState([]);
  const [showMentions, setShowMentions] = useState(false);

  // AI Post Assistant States
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiMenu, setShowAiMenu] = useState(false);

  const fetchPosts = async () => {
    setLoading(true);
    setPage(1);
    setHasMore(true);
    try {
      let data;
      if (activeTab === "following") {
        data = await getFeedPosts(1, 6);
      } else {
        data = await getPosts(1, 6);
      }
      setPosts(data.posts || []);
      setHasMore(data.hasMore ?? false);
    } catch (error) {
      console.log("Failed to fetch feed posts:", error);
      showToast("Failed to load feed", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchMorePosts = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      let data;
      if (activeTab === "following") {
        data = await getFeedPosts(nextPage, 6);
      } else {
        data = await getPosts(nextPage, 6);
      }
      const newPosts = data.posts || [];
      if (newPosts.length > 0) {
        setPosts((prev) => [...prev, ...newPosts]);
        setPage(nextPage);
      }
      setHasMore(data.hasMore ?? false);
    } catch (error) {
      console.log("Failed to load more posts:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [activeTab]);

  // Native Intersection Observer Setup
  useEffect(() => {
    if (loading || !hasMore) return;

    const currentObserverRef = observerRef.current;
    if (!currentObserverRef) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore && hasMore) {
          fetchMorePosts();
        }
      },
      { root: null, rootMargin: "100px", threshold: 0.1 }
    );

    observer.observe(currentObserverRef);

    return () => {
      if (currentObserverRef) {
        observer.unobserve(currentObserverRef);
      }
      observer.disconnect();
    };
  }, [observerRef.current, loading, hasMore, loadingMore, page, activeTab]);

  // Mention search trigger
  useEffect(() => {
    if (mentionQuery === null) {
      setMentionUsers([]);
      setShowMentions(false);
      return;
    }

    const delaySearch = setTimeout(async () => {
      try {
        const data = await searchUsers(mentionQuery);
        setMentionUsers(data.users || []);
        setShowMentions((data.users || []).length > 0);
      } catch (err) {
        console.error("Mention search failed:", err);
      }
    }, 250);

    return () => clearTimeout(delaySearch);
  }, [mentionQuery]);

  const handleTextareaChange = (e) => {
    const val = e.target.value;
    setContent(val);

    // Look for typing @username
    const match = val.match(/@(\w*)$/);
    if (match) {
      setMentionQuery(match[1]);
    } else {
      setMentionQuery(null);
      setShowMentions(false);
    }
  };

  const insertMention = (selectedUser) => {
    if (content) {
      const updated = content.replace(/@(\w*)$/, `@${selectedUser.username} `);
      setContent(updated);
    }
    setMentionQuery(null);
    setShowMentions(false);
  };

  // Drag & Drop event handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // AI Assistant generator
  const handleAiAssist = async (option) => {
    if (!content.trim()) {
      showToast("Write some draft content first for the AI Assistant to refine!", "error");
      return;
    }

    setAiLoading(true);
    setShowAiMenu(false);

    setTimeout(() => {
      let result = content;
      if (option === "polish") {
        result = `✨ ${content} ✨\n\nReally excited to share this update! Hope everyone is having a productive week. Let's connect! 🚀`;
      } else if (option === "professional") {
        result = `I would like to share the following update with my professional network:\n\n"${content}"\n\nI look forward to discussing your thoughts and insights on this matter.`;
      } else if (option === "shorten") {
        result = content.length > 50 ? `${content.substring(0, 50)}... #tldr` : `${content} (shortened)`;
      } else if (option === "hashtags") {
        const tags = ["#Sphere", "#MERN", "#React", "#TechLife"];
        result = `${content}\n\n${tags.join(" ")}`;
      }

      setContent(result);
      setAiLoading(false);
      showToast("Draft updated by AI Assistant!", "success");
    }, 1200);
  };

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
    if (!content.trim() && !imageFile) return;

    setSubmitting(true);
    try {
      await createPost(content, imageFile);
      setContent("");
      setImageFile(null);
      setImagePreview("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      
      showToast("Post published successfully!", "success");
      fetchPosts();
    } catch (error) {
      console.log("Create post failed:", error);
      showToast("Failed to publish post. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePostSuccess = (deletedPostId) => {
    setPosts((prev) => prev.filter((p) => p._id !== deletedPostId));
    showToast("Post deleted successfully", "success");
  };

  return (
    <div className="w-full flex flex-col">
      {/* Page Header Tabs */}
      <div className="flex border-b border-[var(--border-color)] sticky top-0 bg-[var(--bg-base)]/80 backdrop-blur-xl z-20 -mx-4 px-4 pt-2 transition-colors duration-300">
        {["all", "following"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-4 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === tab
                ? "border-[var(--primary-accent)] text-[var(--primary-accent)] font-extrabold"
                : "border-transparent text-gray-500 hover:text-[var(--text-main)]"
            }`}
          >
            {tab === "all" ? "For You" : "Following"}
          </button>
        ))}
      </div>

      {/* 24-Hour Stories Carousel */}
      <div className="mt-4">
        <StoriesTray />
      </div>      {/* Inline Post Composer */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`glass-panel rounded-2xl p-5 mb-6 text-left mt-6 relative border-2 transition-all duration-300 ${
          isDragging
            ? "border-dashed border-[var(--primary-accent)] bg-[var(--primary-accent)]/5 scale-[1.01]"
            : "border-transparent"
        }`}
      >
        {isDragging && (
          <div className="absolute inset-0 bg-[var(--bg-base)]/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center z-30 pointer-events-none border border-[var(--primary-accent)] animate-in fade-in duration-200">
            <span className="text-3xl mb-2">✨</span>
            <p className="text-sm font-bold text-[var(--primary-accent)]">Drop your photos here!</p>
          </div>
        )}

        <div className="flex space-x-3 items-start">
          <img
            src={user?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"}
            alt={user?.name}
            className="w-10 h-10 rounded-full object-cover border border-[var(--border-color)]"
          />
          <div className="flex-1 space-y-4">
            <textarea
              value={content}
              onChange={handleTextareaChange}
              placeholder="What's happening? (Drag images here or use AI Assistant below!)"
              rows="3"
              disabled={submitting}
              className="w-full bg-transparent resize-none outline-none text-[var(--text-main)] text-sm placeholder-gray-500 focus:ring-0"
            />

            {/* Selected Image Thumbnail preview */}
            {imagePreview && (
              <div className="relative rounded-2xl overflow-hidden border border-[var(--border-color)] aspect-video bg-black/20">
                <img
                  src={imagePreview}
                  alt="Composer Preview"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview("");
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-black/90 text-white transition-colors cursor-pointer"
                >
                  <FiX className="w-4.5 h-4.5" />
                </button>
              </div>
            )}

            {/* Mention autocomplete suggestions popover */}
            {showMentions && mentionUsers.length > 0 && (
              <div className="relative">
                <div className="absolute left-0 right-0 bottom-full mb-2 bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-2xl shadow-xl z-30 max-h-40 overflow-y-auto">
                  {mentionUsers.map((usr) => (
                    <button
                      key={usr._id}
                      onClick={() => insertMention(usr)}
                      className="w-full flex items-center space-x-3 p-2.5 hover:bg-[var(--hover-bg)] text-left cursor-pointer border-b border-[var(--border-color)]/20"
                    >
                      <img
                        src={usr.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"}
                        alt=""
                        className="w-7 h-7 rounded-full object-cover"
                      />
                      <div>
                        <p className="text-xs font-bold text-[var(--text-main)]">{usr.name}</p>
                        <p className="text-[10px] text-gray-500">@{usr.username}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-[var(--border-color)]">
              <div className="flex items-center space-x-4">
                {/* Image Input Trigger */}
                <label className="flex items-center space-x-1.5 text-xs text-[var(--secondary-accent)] hover:opacity-80 font-medium cursor-pointer">
                  <FiImage className="w-4.5 h-4.5" />
                  <span>Media</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    ref={fileInputRef}
                    className="hidden"
                  />
                </label>

                {/* AI Assistant Trigger */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowAiMenu(!showAiMenu)}
                    disabled={aiLoading}
                    className={`flex items-center space-x-1 text-xs text-[var(--primary-accent)] hover:opacity-85 font-medium cursor-pointer ${
                      aiLoading ? "animate-pulse" : ""
                    }`}
                  >
                    <FiCpu className="w-4.5 h-4.5" />
                    <span>{aiLoading ? "Thinking..." : "AI Assist"}</span>
                  </button>

                  {showAiMenu && (
                    <div className="absolute left-0 bottom-full mb-2 bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-2xl shadow-xl z-30 p-1.5 w-48 text-xs font-semibold space-y-1">
                      <button
                        type="button"
                        onClick={() => handleAiAssist("polish")}
                        className="w-full text-left p-2 hover:bg-[var(--hover-bg)] text-[var(--text-main)] rounded-lg cursor-pointer"
                      >
                        ✍️ Polish Draft
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAiAssist("professional")}
                        className="w-full text-left p-2 hover:bg-[var(--hover-bg)] text-[var(--text-main)] rounded-lg cursor-pointer"
                      >
                        💼 Make Professional
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAiAssist("shorten")}
                        className="w-full text-left p-2 hover:bg-[var(--hover-bg)] text-[var(--text-main)] rounded-lg cursor-pointer"
                      >
                        📝 Shorten Content
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAiAssist("hashtags")}
                        className="w-full text-left p-2 hover:bg-[var(--hover-bg)] text-[var(--text-main)] rounded-lg cursor-pointer"
                      >
                        🏷️ Auto Hashtags
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={handleCreatePost}
                disabled={submitting || (!content.trim() && !imageFile)}
                className="px-5 py-2 rounded-xl text-[var(--button-text)] font-semibold text-xs bg-[var(--button-bg)] hover:opacity-95 transition-all duration-300 transform active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {submitting ? "Posting..." : "Post"}
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Feed List */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-panel rounded-2xl p-5 animate-pulse text-left space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-white/10" />
                  <div className="space-y-1">
                    <div className="w-24 h-4 bg-white/10 rounded" />
                    <div className="w-16 h-3 bg-white/10 rounded" />
                  </div>
                </div>
                <div className="w-full h-12 bg-white/10 rounded-xl" />
                <div className="flex justify-between w-1/2">
                  <div className="w-12 h-3 bg-white/10 rounded" />
                  <div className="w-12 h-3 bg-white/10 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 text-center text-gray-500">
            <span className="text-3xl">📭</span>
            <p className="mt-2 text-sm">
              {activeTab === "following"
                ? "No posts from users you follow. Follow people to see their posts here!"
                : "No posts found. Be the first to share something!"}
            </p>
          </div>
        ) : (
          <>
            {posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                onDeleteSuccess={handleDeletePostSuccess}
              />
            ))}

            {/* Custom Infinite Scroll Loading Detector Sentinel */}
            {hasMore && (
              <div ref={observerRef} className="h-20 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-t-transparent border-[var(--primary-accent)] rounded-full animate-spin" />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}