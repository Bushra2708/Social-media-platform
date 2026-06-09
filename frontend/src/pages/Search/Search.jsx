import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { searchUsers, followUser } from "../../services/userService";
import { useAuth } from "../../context/AuthContext";
import { FiSearch, FiUserPlus, FiUserCheck } from "react-icons/fi";

export default function Search() {
  const { user: currentUser } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [followedIds, setFollowedIds] = useState([]);
  const [loading, setLoading] = useState(false);

  // Initialize follows state
  useEffect(() => {
    if (currentUser?.following) {
      setFollowedIds(currentUser.following.map(id => id.toString()));
    }
  }, [currentUser]);

  // Debounced search query trigger
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (!searchQuery.trim()) {
        setUsers([]);
        return;
      }
      setLoading(true);
      try {
        const data = await searchUsers(searchQuery);
        setUsers(data.users || []);
      } catch (err) {
        console.log("Search API error:", err);
      } finally {
        setLoading(false);
      }
    }, 400); // 400ms debounce

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleFollowToggle = async (targetUser) => {
    const isFollowed = followedIds.includes(targetUser._id);
    
    // Toggle state locally
    if (isFollowed) {
      setFollowedIds((prev) => prev.filter((id) => id !== targetUser._id));
    } else {
      setFollowedIds((prev) => [...prev, targetUser._id]);
    }

    try {
      await followUser(targetUser._id);
      
      // Update our current user context locally to keep sidebar recommendations sync'd
      if (currentUser.following) {
        if (isFollowed) {
          currentUser.following = currentUser.following.filter(id => id !== targetUser._id);
        } else {
          currentUser.following.push(targetUser._id);
        }
      }
    } catch (err) {
      console.log("Follow toggle API failed, reverting local state:", err);
      // Revert state
      if (isFollowed) {
        setFollowedIds((prev) => [...prev, targetUser._id]);
      } else {
        setFollowedIds((prev) => prev.filter((id) => id !== targetUser._id));
      }
    }
  };

  return (
    <div className="w-full text-left">
      {/* Page Header Search Input */}
      <div className="relative mb-8">
        <FiSearch className="absolute left-4 top-3.5 w-5 h-5 text-gray-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for people (name or username)..."
          className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white/5 border border-white/5 outline-none text-sm text-white focus:border-cyan-500/30 transition-colors"
          autoFocus
        />
      </div>

      {/* Results Section */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-3.5">
            {[1, 2].map((i) => (
              <div key={i} className="glass-panel rounded-2xl p-4 animate-pulse flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-white/10" />
                  <div className="space-y-1.5">
                    <div className="w-24 h-4 bg-white/10 rounded" />
                    <div className="w-16 h-3 bg-white/10 rounded" />
                  </div>
                </div>
                <div className="w-16 h-8 bg-white/10 rounded-xl" />
              </div>
            ))}
          </div>
        ) : !searchQuery.trim() ? (
          <div className="glass-panel rounded-2xl p-12 text-center text-gray-500">
            <span className="text-3xl">🔍</span>
            <p className="mt-2 text-sm">Find users by entering their name or handle.</p>
          </div>
        ) : users.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 text-center text-gray-500">
            <span className="text-3xl">👤</span>
            <p className="mt-2 text-sm">No accounts match "{searchQuery}"</p>
          </div>
        ) : (
          <div className="space-y-3">
            {users.map((resultUser) => {
              const isFollowed = followedIds.includes(resultUser._id);
              return (
                <div
                  key={resultUser._id}
                  className="glass-panel rounded-2xl p-4 flex items-center justify-between hover:bg-white/[0.01] transition-all"
                >
                  <Link to={`/profile/${resultUser._id}`} className="flex items-center space-x-3 flex-1 min-w-0 group">
                    <img
                      src={resultUser.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"}
                      alt={resultUser.name}
                      className="w-10 h-10 rounded-full object-cover border border-white/5 group-hover:border-cyan-500/20 transition-colors"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-white group-hover:underline">{resultUser.name}</p>
                      <p className="text-xs text-gray-500">@{resultUser.username}</p>
                      {resultUser.bio && (
                        <p className="text-xs text-gray-400 mt-1 truncate max-w-sm">{resultUser.bio}</p>
                      )}
                    </div>
                  </Link>

                  <button
                    onClick={() => handleFollowToggle(resultUser)}
                    className={`ml-4 px-4 py-2 rounded-xl text-xs font-bold transition-all transform active:scale-95 cursor-pointer ${
                      isFollowed
                        ? "border border-white/10 hover:bg-red-500/5 hover:text-red-400 hover:border-red-500/10 text-gray-300"
                        : "bg-cyan-500 hover:bg-cyan-400 text-black shadow-lg"
                    }`}
                  >
                    {isFollowed ? (
                      <span className="flex items-center space-x-1">
                        <FiUserCheck className="w-3.5 h-3.5" />
                        <span>Following</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-1">
                        <FiUserPlus className="w-3.5 h-3.5 text-black" />
                        <span>Follow</span>
                      </span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
