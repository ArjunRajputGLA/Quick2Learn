import { useCallback } from 'react';
import {
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { create } from 'zustand';

interface TabBarVisibilityState {
  isVisible: boolean;
  setVisible: (visible: boolean) => void;
  onScroll: (currentY: number) => void;
}

let lastScrollY = 0;
let isCurrentlyVisible = true;

export const useTabBarVisibilityStore = create<TabBarVisibilityState>((set) => ({
  isVisible: true,
  setVisible: (visible: boolean) => {
    if (isCurrentlyVisible !== visible) {
      isCurrentlyVisible = visible;
      set({ isVisible: visible });
    }
  },
  onScroll: (currentY: number) => {
    // If at or near the very top of the scroll view (<= 15px), always keep tab bar visible
    if (currentY <= 15) {
      if (!isCurrentlyVisible) {
        isCurrentlyVisible = true;
        set({ isVisible: true });
      }
      lastScrollY = currentY;
      return;
    }

    const diff = currentY - lastScrollY;
    // Debounce micro-jitter (require at least 10px of scroll delta)
    if (Math.abs(diff) < 10) return;

    if (diff > 0) {
      // User is scrolling downwards into the content:
      // Translate footer navbar down to give full reading area
      if (isCurrentlyVisible) {
        isCurrentlyVisible = false;
        set({ isVisible: false });
      }
    } else {
      // User is scrolling upwards towards the top:
      // Translate footer navbar back up into view
      if (!isCurrentlyVisible) {
        isCurrentlyVisible = true;
        set({ isVisible: true });
      }
    }

    lastScrollY = currentY;
  },
}));

/**
 * Convenient hook to attach to any ScrollView, FlatList, or FlashList
 * Usage:
 *   const { onScroll, scrollEventThrottle } = useTabBarScroll();
 *   <ScrollView onScroll={onScroll} scrollEventThrottle={scrollEventThrottle}>
 */
export function useTabBarScroll() {
  const onScrollState = useTabBarVisibilityStore((s) => s.onScroll);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = event.nativeEvent.contentOffset.y;
      onScrollState(y);
    },
    [onScrollState]
  );

  return {
    onScroll: handleScroll,
    handleScroll,
    scrollEventThrottle: 16,
  };
}
