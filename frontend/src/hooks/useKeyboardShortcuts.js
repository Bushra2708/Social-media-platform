import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function useKeyboardShortcuts(onOpenCreatePost) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const lastKeyRef = useRef("");

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore shortcut triggers if user is actively typing inside text inputs
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.isContentEditable)
      ) {
        return;
      }

      const key = e.key.toLowerCase();
      const lastKey = lastKeyRef.current;
      lastKeyRef.current = key;

      // Reset sequence tracking after 1 second
      setTimeout(() => {
        if (lastKeyRef.current === key) lastKeyRef.current = "";
      }, 1000);

      // Single Key Triggers
      if (key === "n") {
        e.preventDefault();
        onOpenCreatePost?.();
      }

      if (key === "/") {
        e.preventDefault();
        navigate("/search");
      }

      // Combo Key Sequences (e.g., 'g' then 'h' for "Go Home")
      if (lastKey === "g") {
        if (key === "h") {
          e.preventDefault();
          navigate("/");
        } else if (key === "p" && user) {
          e.preventDefault();
          navigate(`/profile/${user._id}`);
        } else if (key === "n") {
          e.preventDefault();
          navigate("/notifications");
        } else if (key === "m") {
          e.preventDefault();
          navigate("/messages");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [user, navigate, onOpenCreatePost]);
}
