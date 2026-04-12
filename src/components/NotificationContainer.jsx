import React, { useContext } from "react";
import { NotificationContext } from "../context/NotificationContext";
import { Check, AlertCircle, Info, X } from "lucide-react";

export default function NotificationContainer() {
  const { notifications, removeNotification } = useContext(NotificationContext);

  const getIcon = (type) => {
    switch (type) {
      case "success":
        return <Check size={24} className="text-green-600" />;
      case "error":
        return <AlertCircle size={24} className="text-red-600" />;
      case "info":
      default:
        return <Info size={24} className="text-blue-600" />;
    }
  };

  const getStyles = (type) => {
    switch (type) {
      case "success":
        return "bg-green-50 border-2 border-green-400 text-green-900 shadow-lg shadow-green-200";
      case "error":
        return "bg-red-50 border-2 border-red-400 text-red-900 shadow-lg shadow-red-200";
      case "info":
      default:
        return "bg-blue-50 border-2 border-blue-400 text-blue-900 shadow-lg shadow-blue-200";
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 pointer-events-none max-w-md">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`flex items-start gap-4 p-5 rounded-lg pointer-events-auto font-semibold animate-slideIn ${getStyles(
            notification.type
          )}`}
          role="alert"
        >
          <div className="flex-shrink-0 pt-0.5">{getIcon(notification.type)}</div>
          <div className="flex-1">
            <p className="text-base leading-snug">{notification.message}</p>
            {notification.actionLabel && typeof notification.onAction === "function" && (
              <button
                onClick={notification.onAction}
                className="mt-3 inline-flex items-center rounded-md border border-current px-3 py-1.5 text-sm font-semibold hover:bg-white/60 transition"
              >
                {notification.actionLabel}
              </button>
            )}
          </div>
          <button
            onClick={() => removeNotification(notification.id)}
            className="flex-shrink-0 text-current hover:opacity-70 transition"
            aria-label="Dismiss notification"
          >
            <X size={20} />
          </button>
        </div>
      ))}
    </div>
  );
}
