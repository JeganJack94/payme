// components/PWAInstallPrompt.jsx
import React, { useEffect, useState } from "react";

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true); // Show install button
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choice) => {
      if (choice.outcome === "accepted") {
        console.log("PWA installed");
      } else {
        console.log("PWA install dismissed");
      }
      setDeferredPrompt(null);
      setShowInstall(false);
    });
  };

  return (
    showInstall && (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={handleInstallClick}
          className="px-4 py-2 bg-[#e82c2a] text-white font-semibold rounded-lg shadow-lg hover:bg-[#d32626]"
        >
          Install App
        </button>
      </div>
    )
  );
};

export default PWAInstallPrompt;
