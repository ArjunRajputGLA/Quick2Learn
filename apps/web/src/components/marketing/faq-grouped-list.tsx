"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ChevronDown, Search, HelpCircle, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GroupedFaqs } from "@/server/data/catalog";

interface FaqGroupedListProps {
  groupedFaqs: GroupedFaqs;
}

export function FaqGroupedList({ groupedFaqs }: FaqGroupedListProps) {
  const [activeTab, setActiveTab] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    "Admissions-0": true, // First question open by default
  });

  const categories = ["All", "Admissions", "Fees", "Classes", "Online access"];

  const toggleItem = (key: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Flatten and filter items
  const filteredCategories = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const result: Record<string, Array<{ question: string; answer: string; originalIdx: number }>> = {};

    for (const [catName, items] of Object.entries(groupedFaqs)) {
      if (activeTab !== "All" && activeTab !== catName) continue;

      const matched = items
        .map((item, idx) => ({ ...item, originalIdx: idx }))
        .filter((item) => {
          if (!query) return true;
          return (
            item.question.toLowerCase().includes(query) ||
            item.answer.toLowerCase().includes(query)
          );
        });

      if (matched.length > 0) {
        result[catName] = matched;
      }
    }

    return result;
  }, [groupedFaqs, activeTab, searchQuery]);

  const totalResultsCount = Object.values(filteredCategories).reduce(
    (acc, list) => acc + list.length,
    0,
  );

  return (
    <div className="space-y-8">
      {/* Search & Category Filter Row */}
      <div className="space-y-4">
        {/* Search Input */}
        <div className="relative max-w-xl mx-auto">
          <Search className="absolute left-4 top-3.5 h-5 w-5 text-ink-muted select-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search FAQs by topic (e.g. fees, demo class, online access)..."
            className="w-full rounded-xl border border-border bg-surface pl-12 pr-4 py-3 text-body text-ink placeholder:text-ink-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3.5 top-3.5 text-caption font-semibold text-ink-muted hover:text-ink"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveTab(cat)}
              className={`px-4 py-2 rounded-full text-small font-semibold transition-all ${
                activeTab === cat
                  ? "bg-primary text-surface shadow-sm"
                  : "bg-surface border border-border text-ink-muted hover:text-ink hover:border-ink"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Accordions Grouped by Category */}
      {totalResultsCount > 0 ? (
        <div className="space-y-10">
          {Object.entries(filteredCategories).map(([catName, items]) => (
            <div key={catName} className="space-y-4">
              <div className="border-b border-border pb-2 flex items-center justify-between">
                <h2 className="text-h2 font-bold text-ink">
                  {catName}
                </h2>
                <span className="text-caption text-ink-muted font-medium">
                  {items.length} question{items.length === 1 ? "" : "s"}
                </span>
              </div>

              <div className="space-y-3">
                {items.map((item) => {
                  const itemKey = `${catName}-${item.originalIdx}`;
                  const isOpen = !!openItems[itemKey];

                  return (
                    <div
                      key={itemKey}
                      className="rounded-xl border border-border bg-surface overflow-hidden shadow-xs transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => toggleItem(itemKey)}
                        className="w-full p-5 text-left flex items-start justify-between gap-4 font-bold text-body text-ink hover:text-primary transition-colors select-none"
                        aria-expanded={isOpen}
                      >
                        <span className="leading-snug">{item.question}</span>
                        <ChevronDown
                          className={`h-5 w-5 shrink-0 text-ink-muted transition-transform duration-200 mt-0.5 ${
                            isOpen ? "rotate-180 text-primary" : ""
                          }`}
                        />
                      </button>

                      {isOpen && (
                        <div className="px-5 pb-5 pt-1 text-small text-ink-muted leading-relaxed border-t border-border/50 bg-surface-subtle/30">
                          <p>{item.answer}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-surface-subtle p-10 text-center space-y-3">
          <HelpCircle className="h-8 w-8 text-ink-muted mx-auto" />
          <h3 className="text-h3 font-bold text-ink">No matching questions found</h3>
          <p className="text-small text-ink-muted max-w-md mx-auto">
            We couldn&apos;t find any FAQs matching &ldquo;{searchQuery}&rdquo;. Try another keyword or submit an admissions enquiry.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSearchQuery("");
              setActiveTab("All");
            }}
          >
            Clear Filters
          </Button>
        </div>
      )}

      {/* Still Have Questions Banner */}
      <div className="rounded-2xl border border-border bg-gradient-to-r from-surface-subtle to-surface p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-card">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-h3 font-bold text-ink flex items-center justify-center sm:justify-start gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <span>Still have questions about batches or coaching?</span>
          </h3>
          <p className="text-small text-ink-muted">
            Our campus counselors are available Mon–Sat to help you choose the right cohort.
          </p>
        </div>
        <Link href="/contact" className="shrink-0">
          <Button variant="primary" className="font-semibold shadow-xs">
            Contact Admissions Desk
          </Button>
        </Link>
      </div>
    </div>
  );
}
