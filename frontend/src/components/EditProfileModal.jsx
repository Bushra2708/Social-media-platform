import { useState } from "react";
import { updateProfile } from "../services/userService";
import { useAuth } from "../context/AuthContext";
import { FiX, FiCamera } from "react-icons/fi";

export default function EditProfileModal({ onClose, onProfileUpdated }) {
  const { user, setUser } = useAuth();
  
  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || "");
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(user?.coverImage || "");
  const [submitting, setSubmitting] = useState(false);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      const data = await updateProfile({
        name,
        bio,
        avatar: avatarFile,
        coverImage: coverFile,
      });

      // Update Auth context
      setUser(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));

      if (onProfileUpdated) {
        onProfileUpdated(data.user);
      }
      onClose();
    } catch (err) {
      console.error("Failed to update profile:", err);
      alert("Failed to update profile. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-xl glass-panel rounded-3xl overflow-hidden relative animate-in fade-in-50 zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h3 className="font-bold text-base text-gradient">Edit Profile</h3>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-1.5 rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-0 flex flex-col">
          <div className="max-h-[450px] overflow-y-auto p-5 space-y-6">
            
            {/* Cover Banner Image Edit */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-gray-400">Cover Photo</span>
              <div className="h-32 w-full rounded-2xl border border-[var(--border-color)] bg-white/[0.02] overflow-hidden relative group">
                {coverPreview ? (
                  <img
                    src={coverPreview}
                    alt="Cover banner preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-[#38bdf8]/15 via-[#6366f1]/15 to-[#10b981]/15" />
                )}
                <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity duration-200">
                  <div className="flex flex-col items-center text-xs font-semibold text-white space-y-1">
                    <FiCamera className="w-5 h-5" />
                    <span>Upload Banner</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Avatar Photo Edit */}
            <div className="flex flex-col items-center space-y-2 relative -mt-14 z-10">
              <div className="w-20 h-20 rounded-full border-4 border-[var(--bg-base)] bg-[var(--input-bg)] overflow-hidden relative group shadow-xl transition-colors duration-300">
                <img
                  src={avatarPreview || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"}
                  alt="Avatar preview"
                  className="w-full h-full object-cover"
                />
                <label className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity duration-200">
                  <FiCamera className="w-4 h-4 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
              </div>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Change Profile Pic</span>
            </div>

            {/* Inputs */}
            <div className="space-y-4">
              {/* Display Name Input */}
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-bold text-gray-400">Display Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                  required
                  disabled={submitting}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/5 outline-none text-sm focus:border-cyan-500/30 transition-colors"
                />
              </div>

              {/* Bio Input */}
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-bold text-gray-400">Biography</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows="3"
                  maxLength="160"
                  disabled={submitting}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/5 outline-none text-sm resize-none focus:border-cyan-500/30 transition-colors"
                />
                <div className="text-right text-[10px] text-gray-500">
                  {bio.length}/160 characters
                </div>
              </div>
            </div>

          </div>

          {/* Form Actions */}
          <div className="p-4 border-t border-white/5 flex justify-end space-x-3 bg-black/20">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl border border-white/5 hover:bg-white/5 text-gray-400 hover:text-white text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="px-5 py-2.5 rounded-xl text-black font-semibold text-xs bg-cyan-500 hover:bg-cyan-400 transition-all duration-300 transform active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
