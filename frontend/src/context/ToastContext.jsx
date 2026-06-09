import { createContext, useContext, useState, useCallback } from "react";
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX } from "react-icons/fi";

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto dismiss after 3.5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Floating Toasts Stack Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col space-y-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center justify-between p-4 rounded-2xl shadow-xl transition-all duration-300 transform translate-x-0 animate-in slide-in-from-right-10 duration-200 border ${
              t.type === "success"
                ? "bg-[#10b981] text-[#070913] border-[#10b981]/20 shadow-[#10b981]/10"
                : t.type === "error"
                ? "bg-[#ad5c71] text-white border-[#ad5c71]/20 shadow-[#ad5c71]/10"
                : "bg-[var(--panel-bg)] text-[var(--text-main)] border-[var(--border-color)]"
            }`}
          >
            <div className="flex items-center space-x-3 text-left">
              <span className="flex-shrink-0">
                {t.type === "success" && <FiCheckCircle className="w-5 h-5 text-[#070913]" />}
                {t.type === "error" && <FiAlertCircle className="w-5 h-5 text-white" />}
                {t.type === "info" && <FiInfo className="w-5 h-5 text-[var(--primary-accent)]" />}
              </span>
              <p className="text-xs font-bold leading-tight">{t.message}</p>
            </div>
            
            <button
              onClick={() => dismissToast(t.id)}
              className="ml-4 p-1 rounded-lg hover:bg-black/10 transition-colors flex-shrink-0 cursor-pointer"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
