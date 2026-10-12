"use client";

import { useState, useEffect, useRef } from "react";
import { Languages, Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
}

export const INDIAN_LANGUAGES: LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  { code: "mr", name: "Marathi", nativeName: "मराठी" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ" },
  { code: "or", name: "Odia", nativeName: "ଓଡ଼ିଆ" },
  { code: "ur", name: "Urdu", nativeName: "اردو" },
  { code: "as", name: "Assamese", nativeName: "অসমীয়া" },
  { code: "sa", name: "Sanskrit", nativeName: "संस्कृतम्" },
];

interface LanguageSwitcherProps {
  className?: string;
  compact?: boolean;
  onLanguageChange?: (lang: LanguageOption) => void;
}

function getStoredLanguageCode(): string {
  if (typeof window === "undefined" || typeof document === "undefined") return "en";
  
  // 1. Check URL hash (Google Translate native format: #googtrans(en|hi) or #googtrans/en/hi)
  const hash = window.location.hash || "";
  const hashMatch = hash.match(/googtrans(?:\((?:en|[a-z]{2,3})\||\/(?:en|[a-z]{2,3})\/)([a-z]{2,3})/i);
  if (hashMatch && hashMatch[1]) {
    return hashMatch[1].toLowerCase();
  }

  // 2. Check googtrans cookie: /en/<lang> or /auto/<lang>
  const cookieMatch = document.cookie.match(/googtrans=(?:\/auto|\/en)\/([a-z]{2,3})/i);
  if (cookieMatch && cookieMatch[1]) {
    return cookieMatch[1].toLowerCase();
  }

  return "en";
}

function setTranslationCookies(langCode: string) {
  if (typeof document === "undefined" || typeof window === "undefined") return;

  const isEn = langCode === "en";
  const val = isEn ? "" : `/en/${langCode}`;
  const autoVal = isEn ? "" : `/auto/${langCode}`;
  const expireStr = isEn ? "expires=Thu, 01 Jan 1970 00:00:00 UTC; " : "";

  // Set root path cookies
  document.cookie = `googtrans=${val}; path=/; ${expireStr}`;
  document.cookie = `googtrans=${autoVal}; path=/; ${expireStr}`;

  // Set domain variants if not localhost
  const hostname = window.location.hostname;
  const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";
  if (!isLocalhost && hostname) {
    document.cookie = `googtrans=${val}; path=/; domain=${hostname}; ${expireStr}`;
    document.cookie = `googtrans=${val}; path=/; domain=.${hostname}; ${expireStr}`;
    document.cookie = `googtrans=${autoVal}; path=/; domain=${hostname}; ${expireStr}`;
    document.cookie = `googtrans=${autoVal}; path=/; domain=.${hostname}; ${expireStr}`;

    const parts = hostname.split(".");
    if (parts.length > 2) {
      const rootDomain = parts.slice(-2).join(".");
      document.cookie = `googtrans=${val}; path=/; domain=.${rootDomain}; ${expireStr}`;
      document.cookie = `googtrans=${autoVal}; path=/; domain=.${rootDomain}; ${expireStr}`;
    }
  }
}

export function LanguageSwitcher({
  className,
  compact = false,
  onLanguageChange,
}: LanguageSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentCode, setCurrentCode] = useState("en");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Read active language from hash or cookie on mount
  useEffect(() => {
    setCurrentCode(getStoredLanguageCode());
  }, []);

  // Translation Watchdog: if non-English is selected, ensure Google Translate combo applies translation
  useEffect(() => {
    if (currentCode === "en") return;

    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      const isTranslated =
        document.documentElement.classList.contains("translated-ltr") ||
        document.documentElement.classList.contains("translated-rtl") ||
        document.querySelector("font") !== null;

      if (isTranslated) {
        clearInterval(interval);
        return;
      }

      const combo = document.querySelector(".goog-te-combo") as HTMLSelectElement | null;
      if (combo) {
        if (combo.value !== currentCode) {
          combo.value = currentCode;
          combo.dispatchEvent(new Event("change", { bubbles: true }));
          if (typeof (combo as unknown as { onchange?: () => void }).onchange === "function") {
            (combo as unknown as { onchange: () => void }).onchange();
          }
        }
      }

      if (attempts >= 30) {
        clearInterval(interval);
      }
    }, 250);

    return () => clearInterval(interval);
  }, [currentCode]);

  // Close dropdown on click outside or Escape
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSelectLanguage = (lang: LanguageOption) => {
    if (typeof document === "undefined" || typeof window === "undefined") return;

    const targetCode = lang.code;
    const isEn = targetCode === "en";

    // 1. Save translation cookies
    setTranslationCookies(targetCode);

    // 2. Manage URL hash
    if (isEn) {
      if (window.location.hash.includes("googtrans")) {
        const cleanUrl = window.location.pathname + window.location.search;
        window.history.replaceState(null, "", cleanUrl);
      }
    } else {
      window.location.hash = `#googtrans(en|${targetCode})`;
    }

    setCurrentCode(targetCode);
    setIsOpen(false);
    onLanguageChange?.(lang);

    // 3. Trigger Google Translate combo element
    const combo = document.querySelector(".goog-te-combo") as HTMLSelectElement | null;
    if (combo) {
      combo.value = isEn ? "" : targetCode;
      combo.dispatchEvent(new Event("change", { bubbles: true }));
      if (typeof (combo as unknown as { onchange?: () => void }).onchange === "function") {
        (combo as unknown as { onchange: () => void }).onchange();
      }

      if (isEn) {
        // Clean reload after resetting combo to restore pure server-rendered English
        setTimeout(() => {
          window.location.reload();
        }, 150);
      }
      return;
    }

    // 4. If combo hasn't mounted yet, reload so Google Translate automatically translates on page load
    window.location.reload();
  };

  const activeLanguage =
    INDIAN_LANGUAGES.find((l) => l.code === currentCode) ??
    INDIAN_LANGUAGES[0] ?? {
      code: "en",
      name: "English",
      nativeName: "English",
    };

  const filteredLanguages = INDIAN_LANGUAGES.filter((lang) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      lang.name.toLowerCase().includes(q) ||
      lang.nativeName.toLowerCase().includes(q) ||
      lang.code.toLowerCase().includes(q)
    );
  });

  return (
    <div
      ref={containerRef}
      className={cn("relative inline-block text-left notranslate", className)}
    >
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-surface/90 text-ink hover:text-primary hover:border-primary/40 hover:bg-surface-subtle transition-all cursor-pointer shadow-2xs active:scale-98 select-none focus-visible:outline-2 focus-visible:outline-primary",
          compact ? "p-2" : "px-3 py-1.5 text-small font-medium"
        )}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label="Select website language"
        title="Switch language / भाषा बदलें"
      >
        <Languages className="h-4 w-4 text-primary shrink-0" />
        {!compact && (
          <>
            <span className="font-semibold text-small tracking-tight">
              {activeLanguage.nativeName}
            </span>
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 text-ink-muted transition-transform duration-200",
                isOpen && "rotate-180"
              )}
            />
          </>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute right-0 mt-2 w-72 rounded-2xl border border-border/90 bg-surface/98 backdrop-blur-md shadow-xl z-50 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150"
        >
          {/* Header & Search */}
          <div className="p-3 border-b border-border/80 bg-surface-subtle/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                Select Indian Language
              </span>
              <span className="text-[10px] font-semibold text-primary px-1.5 py-0.5 rounded-full bg-primary/10">
                14 Languages
              </span>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-muted" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Hindi, Marathi, Tamil..."
                className="w-full pl-8 pr-3 py-1.5 text-small rounded-lg border border-border bg-surface text-ink placeholder:text-ink-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Languages List */}
          <div className="max-h-72 overflow-y-auto p-1.5 space-y-0.5 divide-y-0">
            {filteredLanguages.length === 0 ? (
              <div className="p-4 text-center text-small text-ink-muted">
                No matching languages found
              </div>
            ) : (
              filteredLanguages.map((lang) => {
                const isSelected = lang.code === currentCode;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelectLanguage(lang)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors cursor-pointer group select-none",
                      isSelected
                        ? "bg-primary/10 text-primary font-bold"
                        : "text-ink hover:bg-surface-subtle hover:text-primary"
                    )}
                  >
                    <div className="flex flex-col">
                      <span className="text-small font-semibold leading-tight">
                        {lang.nativeName}
                      </span>
                      <span className="text-[11px] text-ink-muted group-hover:text-ink/80 leading-tight">
                        {lang.name}
                      </span>
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 text-primary shrink-0 ml-2" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer explanation */}
          <div className="px-3 py-2 border-t border-border/80 bg-surface-subtle/30 text-[11px] text-ink-muted text-center">
            Translates full website syllabus, lectures &amp; batches
          </div>
        </div>
      )}
    </div>
  );
}
