"use client";

import { useState, useEffect } from "react";

interface FloatingWhatsAppProps {
  whatsappNumber?: string;
}

export function FloatingWhatsApp({ whatsappNumber }: FloatingWhatsAppProps) {
  const rawNumber = whatsappNumber || "+91 76688 75809";
  const cleanNumber = rawNumber.replace(/[^0-9]/g, "");
  const defaultText = encodeURIComponent("Hi, I want to know about Quick2Learn batches");
  const whatsappUrl = `https://wa.me/${cleanNumber}?text=${defaultText}`;

  const [showTooltip, setShowTooltip] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Show tooltip after 3 seconds, auto-hide after 6 more seconds
  useEffect(() => {
    const showTimer = setTimeout(() => setShowTooltip(true), 3000);
    const hideTimer = setTimeout(() => setShowTooltip(false), 9000);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  return (
    <aside aria-label="WhatsApp Contact Support">
      {/* Tooltip bubble */}
      {showTooltip && !dismissed && (
        <div className="fixed bottom-[88px] right-6 z-40 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
          <div className="relative bg-white rounded-xl shadow-lg border border-gray-100 px-4 py-3 max-w-[220px]">
            <button
              onClick={() => setDismissed(true)}
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-gray-200 text-gray-500 hover:bg-gray-300 flex items-center justify-center text-[10px] font-bold transition-colors cursor-pointer"
              aria-label="Dismiss tooltip"
            >
              ✕
            </button>
            <p className="text-[13px] text-gray-700 leading-snug">
              👋 Need help? <span className="font-semibold text-gray-900">Chat with us</span> on WhatsApp!
            </p>
            {/* Arrow pointing down */}
            <div className="absolute -bottom-[6px] right-6 w-3 h-3 bg-white border-r border-b border-gray-100 rotate-45" />
          </div>
        </div>
      )}

      {/* Main WhatsApp button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with Quick2Learn on WhatsApp"
        className="fixed bottom-6 right-6 z-40 group flex items-center gap-0 rounded-full shadow-[0_4px_14px_rgba(37,211,102,0.45)] hover:shadow-[0_6px_20px_rgba(37,211,102,0.55)] transition-all duration-300 hover:scale-105 active:scale-95"
      >
        {/* Icon circle */}
        <div className="relative flex items-center justify-center h-[56px] w-[56px] rounded-full bg-[#25D366]">
          {/* WhatsApp SVG icon (official) */}
          <svg viewBox="0 0 32 32" className="h-7 w-7 fill-white" xmlns="http://www.w3.org/2000/svg">
            <path d="M16.004 2.667a13.26 13.26 0 0 0-11.3 20.17L2.667 29.333l6.67-2.002A13.26 13.26 0 1 0 16.004 2.667Zm0 24.29a11.01 11.01 0 0 1-5.613-1.533l-.403-.24-3.96 1.19 1.2-3.88-.263-.418a11.03 11.03 0 1 1 9.04 4.88Zm6.04-8.254c-.33-.166-1.957-.966-2.26-1.076-.303-.11-.523-.166-.743.166-.22.33-.856 1.076-1.05 1.296-.193.22-.386.248-.716.083-.33-.166-1.393-.513-2.654-1.636-.98-.874-1.643-1.953-1.836-2.283-.193-.33-.02-.51.145-.675.149-.148.33-.386.496-.58.166-.193.22-.33.33-.55.11-.22.056-.413-.028-.58-.083-.165-.743-1.79-1.018-2.45-.268-.644-.54-.557-.743-.567l-.633-.012a1.214 1.214 0 0 0-.88.413c-.303.33-1.157 1.13-1.157 2.756s1.184 3.196 1.35 3.416c.166.22 2.33 3.556 5.643 4.987.788.34 1.403.543 1.882.695.791.252 1.512.216 2.082.131.635-.095 1.957-.8 2.233-1.573.276-.773.276-1.435.193-1.573-.083-.138-.303-.22-.633-.386Z"/>
          </svg>

          {/* Subtle pulse ring */}
          <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-0 group-hover:opacity-0 animate-[wa-ping_2.5s_ease-out_infinite] pointer-events-none" />
        </div>
      </a>

      {/* Keyframe for the pulse animation */}
      <style>{`
        @keyframes wa-ping {
          0% { transform: scale(1); opacity: 0.35; }
          70% { transform: scale(1.45); opacity: 0; }
          100% { transform: scale(1.45); opacity: 0; }
        }
      `}</style>
    </aside>
  );
}
