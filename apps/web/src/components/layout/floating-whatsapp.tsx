import { MessageCircle } from "lucide-react";

interface FloatingWhatsAppProps {
  whatsappNumber?: string;
}

export function FloatingWhatsApp({ whatsappNumber }: FloatingWhatsAppProps) {
  const rawNumber = whatsappNumber || "+91-9897000000";
  const cleanNumber = rawNumber.replace(/[^0-9]/g, "");
  const defaultText = encodeURIComponent("Hi, I want to know about Quick2Learn batches");
  const whatsappUrl = `https://wa.me/${cleanNumber}?text=${defaultText}`;

  return (
    <aside aria-label="WhatsApp Contact Support">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with Quick2Learn on WhatsApp"
        className="fixed bottom-6 right-6 z-40 group flex items-center gap-2 rounded-full bg-[#25D366] text-white p-3.5 sm:px-4 sm:py-3 shadow-lg hover:shadow-xl hover:bg-[#20bd5a] hover:scale-105 active:scale-95 transition-all duration-200"
      >
        <MessageCircle className="h-6 w-6 fill-white text-[#25D366] shrink-0" />
        <span className="hidden sm:inline-block font-semibold text-small tracking-tight pr-1">
          Chat with Us
        </span>

        {/* Pulse ring animation */}
        <span className="absolute -inset-1 rounded-full bg-[#25D366] opacity-30 animate-ping pointer-events-none group-hover:hidden" />
      </a>
    </aside>
  );
}
