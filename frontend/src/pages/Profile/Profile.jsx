import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getUserProfile, followUser } from "../../services/userService";
import { getPosts } from "../../services/postService";
import PostCard from "../../components/PostCard";
import EditProfileModal from "../../components/EditProfileModal";
import { FiCalendar, FiUserPlus, FiUserCheck, FiEdit2 } from "react-icons/fi";

export default function Profile() {
  const { id } = useParams(); // Profile User ID
  const { user: currentUser } = useAuth();

  const [profileUser, setProfileUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState("posts"); // "posts", "saved", "liked"
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Profile User details (includes saved posts inside user object if self)
      const userData = await getUserProfile(id);
      setProfileUser(userData.user);
      
      const isCurrentlyFollowing = userData.user.followers?.some(
        (f) => f._id === currentUser?._id
      );
      setIsFollowing(isCurrentlyFollowing);
      setFollowersCount(userData.user.followers?.length || 0);

      // 2. Fetch all posts to filter author posts and liked posts
      const postsData = await getPosts();
      const all = postsData.posts || [];
      
      // Filter posts written by profile owner
      const authored = all.filter((p) => p.author?._id === id);
      setUserPosts(authored);

      // Filter posts liked by profile owner
      const liked = all.filter((p) => p.likes?.includes(id));
      setLikedPosts(liked);

    } catch (err) {
      console.log("Failed to load profile resources:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchProfileData();
    }
  }, [id, currentUser?._id]);

  const handleFollowToggle = async () => {
    if (isFollowing) {
      setFollowersCount((prev) => Math.max(0, prev - 1));
      setIsFollowing(false);
    } else {
      setFollowersCount((prev) => prev + 1);
      setIsFollowing(true);
    }

    try {
      await followUser(profileUser._id);
    } catch (err) {
      console.log("Follow API failure, reverting state:", err);
      // Revert state
      setIsFollowing(!isFollowing);
      setFollowersCount((prev) => (isFollowing ? prev + 1 : Math.max(0, prev - 1)));
    }
  };

  const handlePostDeleted = (deletedId) => {
    setUserPosts((prev) => prev.filter((p) => p._id !== deletedId));
    setLikedPosts((prev) => prev.filter((p) => p._id !== deletedId));
    if (profileUser && profileUser.savedPosts) {
      setProfileUser((prev) => ({
        ...prev,
        savedPosts: prev.savedPosts.filter((p) => p._id !== deletedId),
      }));
    }
  };

  const isOwnProfile = id === currentUser?._id;

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-20 animate-pulse text-gray-500">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-white/10" />
          <div className="w-24 h-4 bg-white/10 rounded" />
          <div className="w-48 h-3 bg-white/10 rounded" />
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="glass-panel rounded-2xl p-12 text-center text-gray-500">
        <p className="font-bold">User profile not found.</p>
        <Link to="/" className="text-cyan-400 text-xs hover:underline mt-2 inline-block">
          Return home
        </Link>
      </div>
    );
  }

  const savedPosts = profileUser.savedPosts || [];

  return (
    <div className="w-full text-left">
      {/* Banner Cover Image */}
      <div className="h-44 w-full rounded-3xl overflow-hidden border border-[var(--border-color)] bg-white/[0.02] relative">
        {profileUser.coverImage ? (
          <img
            src={profileUser.coverImage}
            alt="Cover Banner"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-[#38bdf8]/15 via-[#6366f1]/15 to-[#10b981]/15" />
        )}
      </div>

      {/* Profile Details Container */}
      <div className="px-5 pb-5 relative z-10 flex flex-col space-y-4">
        {/* Avatar & Action Button Row */}
        <div className="flex items-end justify-between -mt-10">
          <div className="w-24 h-24 rounded-full border-4 border-[var(--bg-base)] bg-[var(--input-bg)] overflow-hidden shadow-2xl transition-colors duration-300">
            <img
              src={profileUser.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"}
              alt={profileUser.name}
              className="w-full h-full object-cover"
            />
          </div>

          <div>
            {isOwnProfile ? (
              <button
                onClick={() => setIsEditOpen(true)}
                className="flex items-center space-x-1.5 px-4 py-2 border border-[var(--border-color)] rounded-xl text-xs font-semibold hover:bg-[var(--hover-bg)] transition-all cursor-pointer text-[var(--text-main)] bg-[var(--panel-bg)]"
              >
                <FiEdit2 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            ) : (
              <button
                onClick={handleFollowToggle}
                className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all transform active:scale-95 cursor-pointer ${
                  isFollowing
                    ? "border border-[var(--border-color)] hover:bg-red-500/5 hover:text-red-400 hover:border-red-500/10 text-gray-305 text-gray-400"
                    : "bg-[var(--button-bg)] hover:opacity-90 text-[var(--button-text)] shadow-lg"
                }`}
              >
                {isFollowing ? (
                  <>
                    <FiUserCheck className="w-3.5 h-3.5" />
                    <span>Following</span>
                  </>
                ) : (
                  <>
                    <FiUserPlus className="w-3.5 h-3.5" />
                    <span>Follow</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* User Texts with Verification pill */}
        <div className="space-y-1">
          <h2 className="text-xl font-extrabold text-[var(--text-main)] leading-tight flex items-center flex-wrap gap-1.5">
            <span>{profileUser.name}</span>
            {profileUser.isVerified && (
              <FiUserCheck className="w-4 h-4 text-[#38bdf8] fill-[#38bdf8]/10 ml-0.5 flex-shrink-0" title={profileUser.badge || "Verified"} />
            )}
            {profileUser.badge && profileUser.badge !== "Verified" && (
              <span className="ml-1.5 px-2 py-0.5 text-[9px] font-bold bg-[var(--hover-bg)] text-[var(--primary-accent)] rounded-full border border-[var(--border-color)]">
                {profileUser.badge}
              </span>
            )}
          </h2>
          <p className="text-xs text-gray-500">@{profileUser.username}</p>
        </div>

        {/* Bio */}
        {profileUser.bio && (
          <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
            {profileUser.bio}
          </p>
        )}

        {/* Joined date & Metrics */}
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-gray-500">
          <div className="flex items-center space-x-1.5">
            <FiCalendar className="w-4 h-4" />
            <span>Joined {new Date(profileUser.createdAt).toLocaleDateString(undefined, { month: "long", year: "numeric" })}</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>
              <strong className="text-white font-bold">{profileUser.following?.length || 0}</strong>
              <span className="ml-1">Following</span>
            </span>
            <span>
              <strong className="text-white font-bold">{followersCount}</strong>
              <span className="ml-1">Followers</span>
            </span>
          </div>
        </div>
      </div>

      {/* Profile Page Sub-Tabs */}
      <div className="flex border-b border-white/5 -mx-4 px-4 mt-4">
        {[
          { id: "posts", label: `Posts (${userPosts.length})` },
          { id: "liked", label: `Likes (${likedPosts.length})` },
          ...(isOwnProfile ? [{ id: "saved", label: `Saved (${savedPosts.length})` }] : []),
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-4 text-xs font-bold border-b-2 text-center transition-all cursor-pointer ${
              activeTab === tab.id
                ? "border-cyan-500 text-cyan-400 font-extrabold"
                : "border-transparent text-gray-500 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tabs Content Feeds */}
      <div className="mt-6 space-y-4">
        {activeTab === "posts" && (
          userPosts.length === 0 ? (
            <p className="text-center text-sm text-gray-500 py-10">No posts shared yet.</p>
          ) : (
            userPosts.map((post) => (
              <PostCard key={post._id} post={post} onDeleteSuccess={handlePostDeleted} />
            ))
          )
        )}

        {activeTab === "liked" && (
          likedPosts.length === 0 ? (
            <p className="text-center text-sm text-gray-500 py-10">No liked posts yet.</p>
          ) : (
            likedPosts.map((post) => (
              <PostCard key={post._id} post={post} onDeleteSuccess={handlePostDeleted} />
            ))
          )
        )}

        {activeTab === "saved" && (
          savedPosts.length === 0 ? (
            <p className="text-center text-sm text-gray-500 py-10">No saved bookmarks yet.</p>
          ) : (
            savedPosts.map((post) => (
              <PostCard key={post._id} post={post} onDeleteSuccess={handlePostDeleted} />
            ))
          )
        )}
      </div>

      {/* Profile Editor Modal Component */}
      {isEditOpen && (
        <EditProfileModal
          onClose={() => setIsEditOpen(false)}
          onProfileUpdated={(updated) => setProfileUser(updated)}
        />
      )}
    </div>
  );
}
