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

// Distance thresholds for "scrolling long enough"
const SCROLL_DOWN_HIDE_DISTANCE = 50; // Must scroll down continuously for 50px to hide
const SCROLL_UP_SHOW_DISTANCE = 30; // Must scroll up continuously for 30px to reveal
const TOP_REVEAL_THRESHOLD = 20; // Always keep visible when near the top

let lastScrollY = 0;
let isCurrentlyVisible = true;
let accumulatedDown = 0;
let accumulatedUp = 0;

export const useTabBarVisibilityStore = create<TabBarVisibilityState>((set) => ({
  isVisible: true,
  setVisible: (visible: boolean) => {
    set({ isVisible: visible });
  },
  onScroll: (_currentY: number) => {
    // Footer navbar remains visible during tab scroll
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
