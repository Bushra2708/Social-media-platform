import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { likePost, bookmarkPost, deletePost, repostPost } from "../services/postService";
import CommentsModal from "./CommentsModal";
import {
  FiHeart,
  FiMessageCircle,
  FiBookmark,
  FiTrash2,
  FiUserCheck,
  FiRepeat,
} from "react-icons/fi";

export default function PostCard({ post, onDeleteSuccess }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [likes, setLikes] = useState(post.likes || []);
  const [comments, setComments] = useState(post.comments || []);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      setIsLiked(likes.includes(user._id));
      setIsBookmarked(user.savedPosts?.includes(post._id) || false);
    }
  }, [likes, user, post._id]);

  const handleRepost = async () => {
    if (!window.confirm("Repost this card to your community feed?")) return;
    try {
      await repostPost(post._id);
      showToast("Reposted successfully!", "success");
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (err) {
      console.error("Repost failed:", err);
      showToast(err.response?.data?.message || "Failed to repost card.", "error");
    }
  };

  const renderContentWithLinks = (text) => {
    if (!text) return "";
    const parts = text.split(/(\s+)/);
    return parts.map((part, index) => {
      if (part.startsWith("#") && part.length > 1) {
        const cleanTag = part.replace(/[^\w]/g, "");
        return (
          <Link
            key={index}
            to={`/search?q=%23${cleanTag}`}
            className="text-[var(--primary-accent)] hover:underline font-bold"
          >
            {part}
          </Link>
        );
      }
      if (part.startsWith("@") && part.length > 1) {
        const cleanUsername = part.replace(/[^\w]/g, "");
        return (
          <Link
            key={index}
            to={`/search?q=${cleanUsername}`}
            className="text-[var(--secondary-accent)] hover:underline font-bold"
          >
            {part}
          </Link>
        );
      }
      return part;
    });
  };

  const handleLike = async () => {
    // Optimistic UI Update
    const originalLikes = [...likes];
    const originalIsLiked = isLiked;
    
    if (isLiked) {
      setLikes((prev) => prev.filter((id) => id !== user._id));
      setIsLiked(false);
    } else {
      setLikes((prev) => [...prev, user._id]);
      setIsLiked(true);
    }

    try {
      const data = await likePost(post._id);
      setLikes(data.likes);
    } catch (err) {
      console.log("Failed to like post:", err);
      // Revert on error
      setLikes(originalLikes);
      setIsLiked(originalIsLiked);
    }
  };

  const handleBookmark = async () => {
    // Optimistic update
    setIsBookmarked(!isBookmarked);
    try {
      await bookmarkPost(post._id);
      // Update global user bookmarks in context if possible
      if (user.savedPosts) {
        if (isBookmarked) {
          user.savedPosts = user.savedPosts.filter((id) => id !== post._id);
        } else {
          user.savedPosts.push(post._id);
        }
      }
    } catch (err) {
      console.log("Failed to bookmark post:", err);
      setIsBookmarked(isBookmarked); // revert
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    setDeleting(true);
    try {
      await deletePost(post._id);
      if (onDeleteSuccess) {
        onDeleteSuccess(post._id);
      }
    } catch (err) {
      console.log("Failed to delete post:", err);
      alert("Failed to delete post");
      setDeleting(false);
    }
  };

  // Format timestamps neatly
  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  const isAuthor = post.author?._id === user?._id;

  return (
    <article className="glass-panel glass-panel-hover rounded-2xl p-5 mb-5 text-left transition-all duration-300">
      
      {/* Card Header */}
      <div className="flex items-center justify-between mb-3.5">
        <Link to={`/profile/${post.author?._id}`} className="flex items-center space-x-3 group">
          <img
            src={post.author?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"}
            alt={post.author?.name}
            className="w-10 h-10 rounded-full object-cover border border-[var(--border-color)] group-hover:border-[var(--primary-accent)]/20 transition-colors"
          />
          <div>
            <h4 className="font-bold text-sm text-[var(--text-main)] group-hover:underline flex items-center flex-wrap gap-1">
              <span>{post.author?.name}</span>
              {post.author?.isVerified && (
                <FiUserCheck className="w-3.5 h-3.5 text-[#38bdf8] fill-[#38bdf8]/10 ml-0.5 flex-shrink-0" title={post.author?.badge || "Verified"} />
              )}
              {post.author?.badge && post.author?.badge !== "Verified" && (
                <span className="ml-1 px-1.5 py-0.5 text-[8px] font-bold bg-[var(--hover-bg)] text-[var(--primary-accent)] rounded-full border border-[var(--border-color)]">
                  {post.author?.badge}
                </span>
              )}
            </h4>
            <p className="text-xs text-gray-500">
              @{post.author?.username} • {formatTime(post.createdAt)}
            </p>
          </div>
        </Link>

        {isAuthor && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-2 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Card Content */}
      <div className="space-y-4">
        {post.content && (
          <p className="text-[var(--text-main)] text-[14px] leading-relaxed whitespace-pre-line select-text">
            {renderContentWithLinks(post.content)}
          </p>
        )}

        {post.repostOf && (
          <div className="mt-3 p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--input-bg)]/40 text-left space-y-3 shadow-inner">
            {/* Original author header */}
            <div className="flex items-center space-x-2">
              <img
                src={post.repostOf.author?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"}
                alt=""
                className="w-6 h-6 rounded-full object-cover border border-[var(--border-color)]"
              />
              <div className="text-[11px] leading-none">
                <span className="font-bold text-[var(--text-main)] mr-1">{post.repostOf.author?.name}</span>
                <span className="text-gray-500">@{post.repostOf.author?.username}</span>
              </div>
            </div>
            {/* Original content */}
            {post.repostOf.content && (
              <p className="text-xs text-[var(--text-main)] leading-relaxed whitespace-pre-line">
                {renderContentWithLinks(post.repostOf.content)}
              </p>
            )}
            {post.repostOf.image && (
              <div className="rounded-xl overflow-hidden max-h-48 border border-[var(--border-color)]">
                <img
                  src={post.repostOf.image}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        )}

        {post.image && (
          <div className="rounded-xl overflow-hidden border border-[var(--border-color)] bg-[var(--input-bg)] aspect-video relative">
            <img
              src={post.image}
              alt="Post media"
              className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-500"
              loading="lazy"
            />
          </div>
        )}
      </div>

      {/* Card Action Buttons */}
      <div className="flex items-center justify-between pt-4 mt-4 border-t border-[var(--border-color)] text-[var(--text-secondary)] text-xs font-semibold">
        
        {/* Like Action */}
        <button
          onClick={handleLike}
          className={`flex items-center space-x-2 transition-colors cursor-pointer ${
            isLiked ? "text-rose-500" : "hover:text-rose-400"
          }`}
        >
          <FiHeart
            className={`w-[17px] h-[17px] transition-transform duration-200 ${
              isLiked ? "fill-rose-500 scale-110 animate-bounce" : "scale-100"
            }`}
          />
          <span>{likes.length}</span>
        </button>

        {/* Comment Action */}
        <button
          onClick={() => setIsCommentsOpen(true)}
          className="flex items-center space-x-2 hover:text-cyan-400 transition-colors cursor-pointer"
        >
          <FiMessageCircle className="w-[17px] h-[17px]" />
          <span>{comments.length}</span>
        </button>

        {/* Repost Action */}
        <button
          onClick={handleRepost}
          className="flex items-center space-x-2 hover:text-emerald-400 transition-colors cursor-pointer"
          title="Repost to feed"
        >
          <FiRepeat className="w-[17px] h-[17px]" />
        </button>

        {/* Save/Bookmark Action */}
        <button
          onClick={handleBookmark}
          className={`flex items-center space-x-2 transition-colors cursor-pointer ${
            isBookmarked ? "text-cyan-400" : "hover:text-cyan-400"
          }`}
        >
          <FiBookmark
            className={`w-[17px] h-[17px] ${
              isBookmarked ? "fill-cyan-400 text-cyan-400 scale-105" : ""
            }`}
          />
        </button>

      </div>

      {/* Comments Drawer Modal */}
      {isCommentsOpen && (
        <CommentsModal
          postId={post._id}
          comments={comments}
          onCommentsUpdate={(updatedComments) => setComments(updatedComments)}
          onClose={() => setIsCommentsOpen(false)}
        />
      )}

    </article>
  );
}
