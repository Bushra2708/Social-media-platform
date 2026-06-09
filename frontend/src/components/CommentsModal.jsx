import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { addComment, deleteComment } from "../services/postService";
import { FiX, FiSend, FiTrash2 } from "react-icons/fi";

export default function CommentsModal({ postId, comments, onCommentsUpdate, onClose }) {
  const { user } = useAuth();
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setSubmitting(true);
    try {
      const data = await addComment(postId, commentText);
      onCommentsUpdate(data.comments);
      setCommentText("");
    } catch (err) {
      console.error("Failed to add comment:", err);
      alert("Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Delete this comment?")) return;

    try {
      const data = await deleteComment(postId, commentId);
      onCommentsUpdate(data.comments);
    } catch (err) {
      console.error("Failed to delete comment:", err);
      alert("Failed to delete comment");
    }
  };

  // Format comments timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-xl glass-panel rounded-3xl flex flex-col h-[550px] relative animate-in fade-in-50 zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--border-color)]">
          <h3 className="font-bold text-base text-gradient">Comments ({comments.length})</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/5 text-gray-400 hover:text-[var(--text-main)] transition-colors cursor-pointer"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Comments List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {comments.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 text-sm">
              <span className="text-2xl mb-1">💬</span>
              <p>No comments yet. Be the first to reply!</p>
            </div>
          ) : (
            comments.map((comment) => {
              const isCommentAuthor = comment.user?._id === user?._id;
              return (
                <div key={comment._id} className="flex items-start justify-between p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--border-color)] group">
                  <div className="flex space-x-3 items-start flex-1 min-w-0 text-left">
                    <Link to={`/profile/${comment.user?._id}`}>
                      <img
                        src={comment.user?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"}
                        alt={comment.user?.name}
                        className="w-8 h-8 rounded-full object-cover border border-[var(--border-color)]"
                      />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-baseline gap-x-1.5">
                        <Link
                          to={`/profile/${comment.user?._id}`}
                          className="font-bold text-xs hover:underline text-[var(--text-main)]"
                        >
                          {comment.user?.name}
                        </Link>
                        <span className="text-[10px] text-gray-500">
                          @{comment.user?.username} • {formatTime(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-[var(--text-main)] text-xs mt-1.5 leading-relaxed break-words whitespace-pre-wrap select-text text-left">
                        {comment.text}
                      </p>
                    </div>
                  </div>

                  {isCommentAuthor && (
                    <button
                      onClick={() => handleDeleteComment(comment._id)}
                      className="p-1 rounded-md text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Comment Input */}
        <form
          onSubmit={handleSubmit}
          className="p-4 border-t border-[var(--border-color)] flex items-center space-x-3 bg-[var(--input-bg)]"
        >
          <img
            src={user?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"}
            alt={user?.name}
            className="w-8 h-8 rounded-full object-cover border border-[var(--border-color)]"
          />
          <div className="flex-1 relative flex items-center">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add your reply..."
              disabled={submitting}
              className="w-full pl-4 pr-10 py-2.5 rounded-2xl outline-none text-xs custom-input focus:border-[var(--secondary-accent)]/30"
            />
            <button
              type="submit"
              disabled={submitting || !commentText.trim()}
              className="absolute right-2 p-1.5 text-[var(--primary-accent)] hover:opacity-80 disabled:opacity-30 transition-opacity cursor-pointer"
            >
              <FiSend className="w-4 h-4" />
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
