"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export interface ScrollAnimatedItem {
  id: string;
  number: number;
  title: string;
  subtitle?: string;
  badge?: string;
  href: string;
  meta?: string[];
  tag?: string;
}

interface ScrollAnimatedListProps {
  items: ScrollAnimatedItem[];
  emptyMessage?: string;
}

export function ScrollAnimatedList({
  items,
  emptyMessage = "No items available at this time.",
}: ScrollAnimatedListProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center text-ink-muted">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/60 rounded-2xl border border-border/80 bg-surface shadow-xs overflow-hidden">
      {items.map((item, index) => (
        <AnimatedRow key={item.id} item={item} index={index} />
      ))}
    </div>
  );
}

function AnimatedRow({ item, index }: { item: ScrollAnimatedItem; index: number }) {
  const rowRef = useRef<HTMLAnchorElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;

    // Use IntersectionObserver to trigger animation when scrolled into view
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry && entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -40px 0px",
      },
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Stagger animation timing based on index within visible batch
  const staggerDelay = `${(index % 8) * 85}ms`;

  const isMath = /math/i.test(item.title);
  const isPhysics = /physics/i.test(item.title);
  const isHindi = /hindi/i.test(item.title);
  const isHistory = /history|civics/i.test(item.title);
  const isChem = /chem/i.test(item.title);

  return (
    <Link
      ref={rowRef}
      href={item.href}
      style={{
        transitionDelay: isVisible ? staggerDelay : "0ms",
      }}
      className={`p-5 sm:p-6 flex items-center justify-between gap-4 hover:bg-surface-subtle transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group block cursor-pointer transform ${
        isVisible
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 translate-y-8 scale-[0.98]"
      }`}
    >
      <div className="flex items-center gap-4 sm:gap-5 min-w-0">
        {/* Number Badge with micro-animation */}
        <div
          className={`h-12 w-12 rounded-2xl font-black text-[16px] flex items-center justify-center shrink-0 border shadow-xs transition-all duration-300 group-hover:scale-105 ${
            isMath
              ? "bg-sky-50 text-sky-700 border-sky-200 group-hover:bg-sky-600 group-hover:text-white"
              : isPhysics
              ? "bg-cyan-50 text-cyan-700 border-cyan-200 group-hover:bg-cyan-600 group-hover:text-white"
              : isHindi
              ? "bg-teal-50 text-teal-700 border-teal-200 group-hover:bg-teal-600 group-hover:text-white"
              : isHistory
              ? "bg-amber-50 text-amber-800 border-amber-200 group-hover:bg-amber-700 group-hover:text-white"
              : isChem
              ? "bg-emerald-50 text-emerald-700 border-emerald-200 group-hover:bg-emerald-600 group-hover:text-white"
              : "bg-primary-soft text-primary border-primary/20 group-hover:bg-primary group-hover:text-white"
          }`}
        >
          {item.number}
        </div>

        {/* Text Details */}
        <div className="space-y-1.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-[17px] sm:text-[18px] text-ink group-hover:text-primary transition-colors leading-snug truncate sm:whitespace-normal">
              {item.title}
            </h3>
            {item.badge && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-surface-subtle text-ink-muted border border-border">
                {item.badge}
              </span>
            )}
          </div>

          {item.subtitle && (
            <p className="text-small text-ink-muted leading-relaxed line-clamp-1 sm:line-clamp-none">
              {item.subtitle}
            </p>
          )}

          {item.meta && item.meta.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-ink-muted">
              {item.meta.map((m, i) => (
                <span key={i} className="flex items-center gap-1">
                  {i > 0 && <span className="opacity-40">•</span>}
                  <span>{m}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Action Button with slide micro-animation */}
      <div className="shrink-0 flex items-center justify-center h-10 w-10 rounded-full border border-border/80 bg-surface text-ink-muted group-hover:bg-primary group-hover:text-white group-hover:border-primary shadow-xs transition-all duration-300">
        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
      </div>
    </Link>
  );
}
