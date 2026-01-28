import { useEffect } from "react";
import { CheckCircle, XCircle, Info, X } from "lucide-react";
import { cn } from "../../utils/cn";

export function Toast({ message, type = "success", onClose, duration = 3000 }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" aria-hidden="true" />,
    error: <XCircle className="w-5 h-5 text-red-500" aria-hidden="true" />,
    info: <Info className="w-5 h-5 text-blue-500" aria-hidden="true" />,
  };

  const styles = {
    success: "bg-white border-green-200",
    error: "bg-white border-red-200",
    info: "bg-white border-blue-200",
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border-2 shadow-xl animate-fade-in",
        styles[type]
      )}
    >
      {icons[type]}
      <span className="text-sm font-medium text-gray-900">{message}</span>
      <button
        onClick={onClose}
        aria-label="Dismiss notification"
        className="ml-2 text-gray-400 hover:text-gray-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 rounded"
      >
        <X className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  );
}
