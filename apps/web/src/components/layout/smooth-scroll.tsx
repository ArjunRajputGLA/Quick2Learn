"use client";

import { useEffect } from "react";

/**
 * SmoothScrollLimiter
 * 
 * Imposes a controlled limit per scroll on mouse wheel events
 * and smoothly glides to the target position via requestAnimationFrame lerp.
 * This mimics luxury inertial smooth scrolling while preventing jerky jumps
 * or aggressive multi-page wheel skipping.
 */
export function SmoothScrollLimiter() {
  useEffect(() => {
    // Honor accessibility preference for reduced motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    // Limit and damping tuning - optimized for fast, fluid, effortless scrolling
    const LIMIT_PER_SCROLL = 240; // Generous scroll distance per wheel tick
    const MAX_ACCUMULATED_BUFFER = 1200; // Allows fast wheel flicks to travel swiftly without hitting an artificial wall
    const LERP_FACTOR = 0.20; // Snappy, responsive momentum interpolation
    const EPSILON = 0.5; // Snap threshold to cleanly stop the animation loop

    let currentY = window.scrollY;
    let targetY = window.scrollY;
    let rafId: number | null = null;
    let isAnimating = false;

    function getMaxScrollY() {
      return Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight
      );
    }

    // Detect if mouse pointer is over an independently scrollable container (e.g., modal, sheet, code block)
    function isScrollableElement(el: HTMLElement | null, deltaY: number): boolean {
      let current: HTMLElement | null = el;
      while (current && current !== document.body && current !== document.documentElement) {
        const style = window.getComputedStyle(current);
        const overflowY = style.overflowY;
        const isScrollable =
          (overflowY === "auto" || overflowY === "scroll") &&
          current.scrollHeight > current.clientHeight;

        if (isScrollable) {
          const atTop = current.scrollTop <= 0 && deltaY < 0;
          const atBottom =
            current.scrollTop + current.clientHeight >= current.scrollHeight - 1 &&
            deltaY > 0;
          if (!atTop && !atBottom) {
            return true;
          }
        }
        current = current.parentElement;
      }
      return false;
    }

    function animate() {
      const diff = targetY - currentY;

      if (Math.abs(diff) <= EPSILON) {
        currentY = targetY;
        window.scrollTo({ top: currentY, behavior: "instant" as ScrollBehavior });
        isAnimating = false;
        rafId = null;
        return;
      }

      currentY += diff * LERP_FACTOR;
      window.scrollTo({ top: currentY, behavior: "instant" as ScrollBehavior });
      rafId = requestAnimationFrame(animate);
    }

    function onWheel(e: WheelEvent) {
      // Allow browser zoom (Ctrl/Meta + Wheel) and horizontal trackpad swipes
      if (e.ctrlKey || e.metaKey || e.shiftKey) {
        return;
      }

      // Do not hijack scroll within dialogs, dropdowns, or inner scroll containers
      if (isScrollableElement(e.target as HTMLElement | null, e.deltaY)) {
        return;
      }

      // Normalize delta based on deltaMode (0: pixels, 1: lines, 2: pages)
      let delta = e.deltaY;
      if (e.deltaMode === 1) {
        delta *= 20;
      } else if (e.deltaMode === 2) {
        delta *= window.innerHeight;
      }

      if (delta === 0) return;

      // Allow smooth precision trackpads to scroll natively without delay
      if (e.deltaMode === 0 && Math.abs(e.deltaY) < 25 && !Number.isInteger(e.deltaY)) {
        return;
      }

      // Intercept native jerky window scroll jump
      e.preventDefault();

      // Re-align if user jumped using scrollbar drag or anchor link
      const actualScrollY = window.scrollY;
      if (Math.abs(actualScrollY - currentY) > 80 && !isAnimating) {
        currentY = actualScrollY;
        targetY = actualScrollY;
      }

      // 1. Limit per scroll tick
      const clampedDelta =
        Math.sign(delta) * Math.min(Math.abs(delta), LIMIT_PER_SCROLL);

      // 2. Accumulate target scroll with bounded buffer
      const maxScroll = getMaxScrollY();
      const rawTarget = targetY + clampedDelta;

      // Bound target within MAX_ACCUMULATED_BUFFER distance from current position
      const minAllowed = Math.max(0, currentY - MAX_ACCUMULATED_BUFFER);
      const maxAllowed = Math.min(maxScroll, currentY + MAX_ACCUMULATED_BUFFER);

      targetY = Math.max(minAllowed, Math.min(maxAllowed, rawTarget));

      // Start animation loop if not already running
      if (!isAnimating) {
        isAnimating = true;
        rafId = requestAnimationFrame(animate);
      }
    }

    // Keep state in sync on manual scrollbar drag, spacebar, or touch
    function onNativeScroll() {
      if (!isAnimating) {
        currentY = window.scrollY;
        targetY = window.scrollY;
      }
    }

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("scroll", onNativeScroll, { passive: true });

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("scroll", onNativeScroll);
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, []);

  return null;
}
