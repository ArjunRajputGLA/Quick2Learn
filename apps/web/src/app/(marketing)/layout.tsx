import { ReactNode, Suspense } from "react";
import { Header } from "@/components/layout/header";
import { Footer, type FooterSettings } from "@/components/layout/footer";
import {
  AnnouncementBar,
  type AnnouncementBarData,
} from "@/components/layout/announcement-bar";
import { FloatingWhatsApp } from "@/components/layout/floating-whatsapp";
import { GeminiChatbot } from "@/components/layout/gemini-chatbot";
import { getSetting, getAllSettings } from "@/server/data/settings";
import { getMegaMenuData } from "@/server/data/catalog";

export default async function MarketingLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Fetch layout data concurrently from PostgreSQL data layer
  const [announcement, allSettings, megaMenuData] = await Promise.all([
    getSetting<AnnouncementBarData>("announcement_bar").catch(() => null),
    getAllSettings().catch(() => ({} as Record<string, unknown>)),
    getMegaMenuData().catch(() => ({
      classes: [],
      sidePanelLinks: [],
    })),
  ]);

  const settingsRecord = allSettings as Record<string, unknown>;
  const footerSettings: FooterSettings = {
    contact: (settingsRecord.contact as FooterSettings["contact"]) || undefined,
    address: (settingsRecord.address as FooterSettings["address"]) || undefined,
    socials: (settingsRecord.socials as FooterSettings["socials"]) || undefined,
  };

  const whatsappNumber = footerSettings.contact?.whatsapp;

  return (
    <div className="flex min-h-screen flex-col bg-surface text-ink">
      {/* 1. Dismissible Announcement Bar (optional) */}
      <AnnouncementBar announcement={announcement} />

      {/* 2. Sticky Header with Mega-Menu & Typeahead Search */}
      <Header megaMenuData={megaMenuData} />

      {/* 3. Main Content Area */}
      <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
        {children}
      </main>

      {/* 4. Coursera-inspired Comprehensive Footer */}
      <Footer settings={footerSettings} />

      {/* 5. Floating WhatsApp Direct Access Button */}
      <FloatingWhatsApp whatsappNumber={whatsappNumber} />

      {/* 6. Ask Quick2Learn Full-Page AI Chatbot */}
      <Suspense fallback={null}>
        <GeminiChatbot />
      </Suspense>
    </div>
  );
}
