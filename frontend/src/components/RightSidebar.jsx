import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getRecommendedUsers, followUser } from "../services/userService";
import { useAuth } from "../context/AuthContext";
import { FiUserPlus, FiUserCheck, FiTrendingUp } from "react-icons/fi";

export default function RightSidebar() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [followedIds, setFollowedIds] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRecommendations = async () => {
    try {
      const data = await getRecommendedUsers();
      setRecommendations(data.users || []);
    } catch (err) {
      console.log("Failed to fetch recommended users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchRecommendations();
    }
  }, [user]);

  const handleFollow = async (recUser) => {
    try {
      await followUser(recUser._id);
      setFollowedIds((prev) => [...prev, recUser._id]);
      
      // Update recommendation state visually
      setTimeout(() => {
        setRecommendations((prev) => prev.filter((r) => r._id !== recUser._id));
      }, 800);
    } catch (error) {
      console.log("Follow error:", error);
    }
  };

  const trendingTopics = [
    { tag: "#React19", posts: "124K posts" },
    { tag: "#MERNFullstack", posts: "85K posts" },
    { tag: "#TailwindCSSv4", posts: "54K posts" },
    { tag: "#AdvancedWebDesign", posts: "32K posts" },
  ];

  if (!user) return null;

  return (
    <aside className="w-80 fixed h-screen top-0 right-0 hidden lg:flex flex-col border-l border-white/5 bg-black/40 backdrop-blur-xl p-6 space-y-6 z-40">
      
      {/* Search Bar Placeholder or Trigger (if on other pages) */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span className="text-gray-500 text-sm">🔍</span>
        </div>
        <input
          type="text"
          placeholder="Search Sphere..."
          disabled
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/5 text-sm text-gray-400 cursor-not-allowed"
        />
      </div>

      {/* Recommended Section */}
      <div className="glass-panel rounded-2xl p-5 space-y-4">
        <h3 className="font-bold text-sm text-white flex items-center space-x-2">
          <span>Who to follow</span>
        </h3>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-full bg-white/10" />
                  <div className="space-y-1">
                    <div className="w-20 h-3 bg-white/10 rounded" />
                    <div className="w-16 h-2 bg-white/10 rounded" />
                  </div>
                </div>
                <div className="w-14 h-6 bg-white/10 rounded-full" />
              </div>
            ))}
          </div>
        ) : recommendations.length === 0 ? (
          <p className="text-xs text-gray-500">You follow everyone!</p>
        ) : (
          <div className="space-y-3.5">
            {recommendations.map((recUser) => {
              const isFollowed = followedIds.includes(recUser._id);
              return (
                <div key={recUser._id} className="flex items-center justify-between group">
                  <Link to={`/profile/${recUser._id}`} className="flex items-center space-x-3 flex-1 min-w-0">
                    <img
                      src={recUser.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"}
                      alt={recUser.name}
                      className="w-9 h-9 rounded-full object-cover border border-white/10 group-hover:border-cyan-500/30 transition-colors"
                    />
                    <div className="flex-1 min-w-0 text-left">
                      <p className="font-semibold text-xs truncate text-white group-hover:underline">
                        {recUser.name}
                      </p>
                      <p className="text-[10px] text-gray-500 truncate">
                        @{recUser.username}
                      </p>
                    </div>
                  </Link>

                  <button
                    onClick={() => handleFollow(recUser)}
                    disabled={isFollowed}
                    className={`ml-2 flex items-center justify-center p-2 rounded-full transition-all duration-300 cursor-pointer ${
                      isFollowed
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15"
                        : "bg-cyan-500 text-black hover:bg-cyan-400 scale-95 hover:scale-100"
                    }`}
                  >
                    {isFollowed ? (
                      <FiUserCheck className="w-3.5 h-3.5" />
                    ) : (
                      <FiUserPlus className="w-3.5 h-3.5 text-black" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Trending Topics */}
      <div className="glass-panel rounded-2xl p-5 space-y-4">
        <h3 className="font-bold text-sm text-white flex items-center space-x-2">
          <FiTrendingUp className="w-4 h-4 text-violet-400" />
          <span>What's Trending</span>
        </h3>
        
        <div className="space-y-3.5">
          {trendingTopics.map((topic, i) => (
            <div key={i} className="text-left group cursor-pointer">
              <p className="font-bold text-xs text-cyan-400 group-hover:text-cyan-300 transition-colors">
                {topic.tag}
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5">{topic.posts}</p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Footer footer links */}
      <div className="px-2 text-[10px] text-gray-600 text-left">
        <p>© 2026 Sphere Social Media Inc.</p>
        <p className="mt-1">Built with MERN Stack & Framer Motion</p>
      </div>

    </aside>
  );
}
