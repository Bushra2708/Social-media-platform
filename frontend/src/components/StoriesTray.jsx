import { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { getStories, createStory } from "../services/storyService";
import { FiPlus, FiX, FiChevronLeft, FiChevronRight } from "react-icons/fi";

export default function StoriesTray() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef(null);

  const [storyGroups, setStoryGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Active Story Viewer Overlay States
  const [activeGroupIndex, setActiveGroupIndex] = useState(null); // Index of author group in storyGroups
  const [activeStoryIndex, setActiveStoryIndex] = useState(0); // Index of story within active group
  const [progress, setProgress] = useState(0); // Timer progress percentage (0 to 100)

  const progressIntervalRef = useRef(null);
  const storyDuration = 4500; // 4.5 seconds per story slide

  const fetchActiveStories = async () => {
    try {
      const data = await getStories();
      setStoryGroups(data.stories || []);
    } catch (error) {
      console.error("Failed to load stories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveStories();
  }, []);

  // Handle uploading story
  const handleUploadStory = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    showToast("Publishing story...", "info");
    try {
      await createStory(file);
      showToast("Story published! Active for 24h", "success");
      fetchActiveStories();
    } catch (error) {
      showToast("Failed to upload story", "error");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Timer logic for active story viewer
  useEffect(() => {
    if (activeGroupIndex === null) {
      setProgress(0);
      return;
    }

    setProgress(0);
    const stepTime = 40; // update progress every 40ms
    const totalSteps = storyDuration / stepTime;
    let currentStep = 0;

    progressIntervalRef.current = setInterval(() => {
      currentStep++;
      const nextProgress = (currentStep / totalSteps) * 100;
      setProgress(nextProgress);

      if (currentStep >= totalSteps) {
        clearInterval(progressIntervalRef.current);
        handleNext();
      }
    }, stepTime);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [activeGroupIndex, activeStoryIndex]);

  const handlePrev = () => {
    if (activeGroupIndex === null) return;

    if (activeStoryIndex > 0) {
      // Go to previous story of the same user
      setActiveStoryIndex((prev) => prev - 1);
    } else if (activeGroupIndex > 0) {
      // Go to the last story of the previous user
      const prevGroupIdx = activeGroupIndex - 1;
      setActiveGroupIndex(prevGroupIdx);
      setActiveStoryIndex(storyGroups[prevGroupIdx].stories.length - 1);
    } else {
      // Close at the start
      closeViewer();
    }
  };

  const handleNext = () => {
    if (activeGroupIndex === null) return;

    const currentGroup = storyGroups[activeGroupIndex];
    if (activeStoryIndex < currentGroup.stories.length - 1) {
      // Go to next story of the same user
      setActiveStoryIndex((prev) => prev + 1);
    } else if (activeGroupIndex < storyGroups.length - 1) {
      // Go to first story of the next user
      setActiveGroupIndex((prev) => prev + 1);
      setActiveStoryIndex(0);
    } else {
      // End of overall stories roster
      closeViewer();
    }
  };

  const closeViewer = () => {
    setActiveGroupIndex(null);
    setActiveStoryIndex(0);
    setProgress(0);
  };

  const openViewer = (groupIdx) => {
    setActiveGroupIndex(groupIdx);
    setActiveStoryIndex(0);
  };

  return (
    <div className="w-full mb-6 relative">
      <div className="flex items-center space-x-4 overflow-x-auto pb-2 scrollbar-none py-1 text-left select-none">
        
        {/* Circle 1: Create Story Button */}
        <div className="flex flex-col items-center space-y-1.5 flex-shrink-0 cursor-pointer">
          <label className="relative cursor-pointer group">
            <input
              type="file"
              accept="image/*"
              onChange={handleUploadStory}
              ref={fileInputRef}
              disabled={uploading}
              className="hidden"
            />
            <div className="relative">
              <img
                src={user?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"}
                alt="Create Story"
                className="w-13 h-13 rounded-full object-cover border-2 border-[var(--border-color)] group-hover:opacity-90 transition-opacity"
              />
              <div className="absolute bottom-0 right-0 p-1 rounded-full bg-[var(--primary-accent)] text-[#070913] border-2 border-[var(--bg-base)] flex items-center justify-center shadow-lg transform translate-x-1 translate-y-1">
                <FiPlus className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            </div>
          </label>
          <span className="text-[10px] text-gray-500 font-bold truncate max-w-[60px]">My Story</span>
        </div>

        {/* Stories Circles list */}
        {loading ? (
          <div className="flex space-x-4 animate-pulse">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex flex-col items-center space-y-2">
                <div className="w-13 h-13 rounded-full bg-white/5" />
                <div className="h-2 bg-white/5 w-10 rounded" />
              </div>
            ))}
          </div>
        ) : (
          storyGroups.map((group, groupIdx) => {
            const groupUser = group.user;
            // Check if this is ours or others
            const isOurs = groupUser._id === user?._id;
            
            return (
              <button
                key={groupUser._id}
                onClick={() => openViewer(groupIdx)}
                className="flex flex-col items-center space-y-1.5 flex-shrink-0 focus:outline-none cursor-pointer"
              >
                {/* Active story visual ring */}
                <div className="p-[2.5px] rounded-full bg-gradient-to-tr from-[var(--primary-accent)] via-indigo-500 to-[var(--secondary-accent)] shadow-md transform hover:scale-105 transition-transform">
                  <img
                    src={groupUser.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"}
                    alt={groupUser.name}
                    className="w-11.5 h-11.5 rounded-full object-cover border-2 border-[var(--bg-base)]"
                  />
                </div>
                <span className="text-[10px] text-[var(--text-main)] font-semibold truncate max-w-[64px]">
                  {isOurs ? "Your Story" : groupUser.name.split(" ")[0]}
                </span>
              </button>
            );
          })
        )}
      </div>

      {/* TIMED STORY VIEWER MODAL OVERLAY */}
      {activeGroupIndex !== null && storyGroups[activeGroupIndex] && (
        <div className="fixed inset-0 bg-black/95 z-55 flex items-center justify-center p-0 md:p-6 select-none">
          <div className="w-full max-w-lg h-full md:h-[90vh] relative flex flex-col justify-between overflow-hidden md:rounded-3xl bg-[#070913] border border-white/5">
            
            {/* Top Overlay Bars (Header, Timer Lines) */}
            <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-40 space-y-3">
              
              {/* Progress lines stack */}
              <div className="flex space-x-1.5">
                {storyGroups[activeGroupIndex].stories.map((story, idx) => {
                  let barProgress = 0;
                  if (idx < activeStoryIndex) barProgress = 100;
                  if (idx === activeStoryIndex) barProgress = progress;

                  return (
                    <div key={story._id} className="flex-1 h-[3px] bg-white/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white transition-all duration-75"
                        style={{ width: `${barProgress}%` }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Story Author Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 text-left">
                  <img
                    src={storyGroups[activeGroupIndex].user.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"}
                    alt=""
                    className="w-8.5 h-8.5 rounded-full object-cover border border-white/20"
                  />
                  <div>
                    <h4 className="text-xs font-black text-white flex items-center space-x-1">
                      <span>{storyGroups[activeGroupIndex].user.name}</span>
                      {storyGroups[activeGroupIndex].user.isVerified && (
                        <span className="text-[10px] text-sky-400">✔</span>
                      )}
                    </h4>
                    <p className="text-[9px] text-gray-400">
                      {formatStoryTime(storyGroups[activeGroupIndex].stories[activeStoryIndex].createdAt)}
                    </p>
                  </div>
                </div>

                {/* Close handle */}
                <button
                  onClick={closeViewer}
                  className="p-1.5 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors cursor-pointer"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Story Image center stage */}
            <div className="flex-1 flex items-center justify-center bg-black/40 h-full relative">
              <img
                src={storyGroups[activeGroupIndex].stories[activeStoryIndex].image}
                alt="Story content"
                className="max-h-full max-w-full object-contain aspect-[9/16] md:aspect-auto"
              />

              {/* Left/Right manual touch tap sectors */}
              <button
                onClick={handlePrev}
                className="absolute left-0 top-20 bottom-20 w-1/4 cursor-pointer focus:outline-none"
              />
              <button
                onClick={handleNext}
                className="absolute right-0 top-20 bottom-20 w-1/4 cursor-pointer focus:outline-none"
              />

              {/* Visual arrow hover helpers for laptops */}
              <button
                onClick={handlePrev}
                className="hidden md:flex absolute left-4 p-2.5 rounded-full bg-black/50 hover:bg-black/85 text-white hover:scale-105 transition-all z-40 cursor-pointer"
              >
                <FiChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={handleNext}
                className="hidden md:flex absolute right-4 p-2.5 rounded-full bg-black/50 hover:bg-black/85 text-white hover:scale-105 transition-all z-40 cursor-pointer"
              >
                <FiChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Format relative stories date
function formatStoryTime(dateStr) {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60));
      return `${minutes <= 0 ? 1 : minutes}m ago`;
    }
    return `${hours}h ago`;
  } catch (err) {
    return "";
  }
}
