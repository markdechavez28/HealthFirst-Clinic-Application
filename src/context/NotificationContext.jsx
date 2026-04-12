import React, { createContext, useState, useCallback } from "react";

export const NotificationContext = createContext();

// Request notification permission on app load
if ("Notification" in window) {
  if (Notification.permission === "default") {
    Notification.requestPermission().then((permission) => {
      console.log("Notification permission granted:", permission);
    });
  }
} else {
  console.warn("Browser does not support notifications");
}

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const playNotificationSound = useCallback(() => {
    // Create a simple beep sound using Web Audio API
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = "sine";
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
      console.log("Notification sound played");
    } catch (error) {
      console.error("Error playing notification sound:", error);
    }
  }, []);

  const showBrowserNotification = useCallback((message, type = "info") => {
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        const getIcon = () => {
          switch (type) {
            case "success":
              return "•";
            case "error":
              return "✕";
            case "info":
            default:
              return "ℹ";
          }
        };

        try {
          new Notification("HealthFirst Clinic", {
            body: message,
            icon: "/hf-logo.png",
            badge: "/hf-logo.png",
            tag: "healthfirst-notification",
            requireInteraction: type === "error",
          });
          console.log("Browser notification shown:", message);
        } catch (error) {
          console.error("Error showing browser notification:", error);
        }
      } else {
        console.warn("Notification permission not granted");
      }
    }
  }, []);

  const addNotification = useCallback((message, type = "info", duration = 5000) => {
    const id = Date.now();
    const notification = { id, message, type };

    console.log("Adding notification:", notification);
    setNotifications((prev) => [...prev, notification]);

    // Play sound and show browser notification
    playNotificationSound();
    showBrowserNotification(message, type);

    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }

    return id;
  }, [playNotificationSound, showBrowserNotification]);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
    </NotificationContext.Provider>
  );
}
