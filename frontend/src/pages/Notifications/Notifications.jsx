import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getNotifications, markNotificationsRead, clearNotifications } from "../../services/notificationService";
import { FiBell, FiHeart, FiMessageCircle, FiUserPlus, FiTrash2 } from "react-icons/fi";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const data = await getNotifications();
      setNotifications(data.notifications || []);
      
      // Automatically mark notifications as read on loading the page
      if (data.notifications?.some((n) => !n.read)) {
        await markNotificationsRead();
      }
    } catch (err) {
      console.log("Failed to load notifications list:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleClearAll = async () => {
    if (!window.confirm("Clear all notifications?")) return;
    try {
      await clearNotifications();
      setNotifications([]);
    } catch (err) {
      console.log("Failed to clear notifications:", err);
    }
  };

  return (
    <div className="w-full text-left">
      {/* Page Header */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/5">
        <h2 className="text-xl font-extrabold text-white flex items-center space-x-2">
          <FiBell className="w-5 h-5 text-cyan-400" />
          <span>Notifications</span>
        </h2>

        {notifications.length > 0 && (
          <button
            onClick={handleClearAll}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-white/5 text-[10px] font-bold text-gray-400 hover:text-red-400 hover:bg-red-500/5 transition-colors cursor-pointer"
          >
            <FiTrash2 className="w-3.5 h-3.5" />
            <span>Clear All</span>
          </button>
        )}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="space-y-3.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-panel rounded-2xl p-4 animate-pulse flex items-center space-x-4">
              <div className="w-8 h-8 rounded-full bg-white/10" />
              <div className="space-y-1.5 flex-1">
                <div className="w-1/2 h-3.5 bg-white/10 rounded" />
                <div className="w-1/3 h-2 bg-white/10 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center text-gray-500">
          <span className="text-3xl">🔔</span>
          <p className="mt-2 text-sm">No notifications yet. You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const sender = notification.sender;
            return (
              <div
                key={notification._id}
                className={`glass-panel rounded-2xl p-4 flex items-start space-x-4 border-l-2 transition-all ${
                  notification.read
                    ? "border-l-transparent bg-white/[0.01]"
                    : "border-l-cyan-500 bg-cyan-500/[0.01]"
                }`}
              >
                {/* Icon mapping */}
                <div className="mt-1 flex-shrink-0">
                  {notification.type === "like" && (
                    <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
                      <FiHeart className="w-4 h-4 fill-rose-500" />
                    </div>
                  )}
                  {notification.type === "comment" && (
                    <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                      <FiMessageCircle className="w-4 h-4 fill-cyan-400" />
                    </div>
                  )}
                  {notification.type === "follow" && (
                    <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400">
                      <FiUserPlus className="w-4 h-4" />
                    </div>
                  )}
                </div>

                {/* Body details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="text-sm">
                      <Link to={`/profile/${sender?._id}`} className="font-bold text-white hover:underline">
                        {sender?.name}
                      </Link>
                      <span className="text-gray-400 ml-1">
                        {notification.type === "like" && "liked your post"}
                        {notification.type === "comment" && "replied to your post"}
                        {notification.type === "follow" && "started following you"}
                      </span>
                    </div>
                    
                    <span className="text-[10px] text-gray-500 flex-shrink-0 ml-2">
                      {new Date(notification.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>

                  {/* Post preview if like or comment */}
                  {notification.post && (notification.type === "like" || notification.type === "comment") && (
                    <Link
                      to="/"
                      className="mt-2 block p-2.5 rounded-xl bg-black/20 hover:bg-black/30 border border-white/[0.03] text-xs text-gray-400 truncate max-w-md transition-colors"
                    >
                      {notification.post.content}
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
