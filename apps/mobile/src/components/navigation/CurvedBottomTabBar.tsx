import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  useWindowDimensions,
  Platform,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useTabBarVisibilityStore } from '../../lib/tabBarVisibilityStore';

export interface CurvedBottomTabBarRoute {
  key: string;
  name: string;
  params?: Record<string, any>;
}

export interface CurvedBottomTabBarProps {
  state: {
    index: number;
    routes: CurvedBottomTabBarRoute[];
  };
  descriptors: Record<
    string,
    {
      options: any;
      navigation?: any;
    }
  >;
  navigation?: {
    emit?: (event: any) => any;
    navigate?: (name: string, params?: any) => void;
    [key: string]: any;
  };
  emitter?: {
    emit: (options: any) => any;
  };
  navigateToTab?: (routeKey: string) => void;
  insets?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  [key: string]: any;
}

export function CurvedBottomTabBar({
  state,
  descriptors,
  navigation,
  emitter,
  navigateToTab,
}: CurvedBottomTabBarProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();

  // Filter routes that are actual visible tabs (i.e. href is not null)
  const visibleRoutes = useMemo(() => {
    return state.routes.filter((route) => {
      const { options } = descriptors[route.key];
      // In expo-router, href: null hides the tab from the footer
      return (options as any).href !== null;
    });
  }, [state.routes, descriptors]);

  // Find index of current route in visibleRoutes
  const currentRouteKey = state.routes[state.index]?.key;
  const activeVisibleIndex = useMemo(() => {
    const idx = visibleRoutes.findIndex((r) => r.key === currentRouteKey);
    return idx >= 0 ? idx : 0;
  }, [visibleRoutes, currentRouteKey]);

  const numTabs = Math.max(visibleRoutes.length, 1);
  const tabWidth = windowWidth / numTabs;

  // Bar dimensions
  const barContentHeight = 58;
  const bottomInset = Platform.OS === 'ios' ? insets.bottom : Math.max(insets.bottom, 6);
  const totalBarHeight = barContentHeight + bottomInset;

  // Active tab center target
  const targetCenterX = (activeVisibleIndex + 0.5) * tabWidth;

  // Animated values
  const animatedX = useRef(new Animated.Value(targetCenterX)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const tabBarTranslateY = useRef(new Animated.Value(0)).current;

  // Real-time track animated X for dynamic SVG notch rendering
  const [currentX, setCurrentX] = useState(targetCenterX);

  // Subscribe to visibility store for hide-on-scroll
  const isTabBarVisible = useTabBarVisibilityStore((s) => s.isVisible);

  useEffect(() => {
    const listenerId = animatedX.addListener(({ value }) => {
      setCurrentX(value);
    });
    return () => {
      animatedX.removeListener(listenerId);
    };
  }, [animatedX]);

  // Animate horizontal sliding when active tab changes
  useEffect(() => {
    Animated.parallel([
      Animated.spring(animatedX, {
        toValue: targetCenterX,
        friction: 8,
        tension: 65,
        useNativeDriver: false,
      }),
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.78,
          duration: 90,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 130,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [activeVisibleIndex, targetCenterX, animatedX, scaleAnim]);

  // Animate hide-on-scroll (translate down when scrolling down, up when scrolling up)
  useEffect(() => {
    Animated.spring(tabBarTranslateY, {
      toValue: isTabBarVisible ? 0 : totalBarHeight + 20,
      friction: 8,
      tension: 50,
      useNativeDriver: true,
    }).start();
  }, [isTabBarVisible, totalBarHeight, tabBarTranslateY]);

  // SVG Curve Math
  // Notch parameters: half width ~34-36px, dip depth ~28px, corner radius 20px
  const halfW = Math.min(36, Math.max(28, tabWidth * 0.44));
  const dipDepth = 28;
  const cornerRadius = 20;

  const leftX = Math.max(cornerRadius, currentX - halfW);
  const rightX = Math.min(windowWidth - cornerRadius, currentX + halfW);
  const c1x = currentX - halfW * 0.56;
  const c2x = currentX - halfW * 0.48;
  const c3x = currentX + halfW * 0.48;
  const c4x = currentX + halfW * 0.56;

  // Closed background shape
  const notchPath = `
    M 0 ${totalBarHeight}
    V ${cornerRadius}
    Q 0 0 ${cornerRadius} 0
    H ${leftX}
    C ${c1x} 0 ${c2x} ${dipDepth} ${currentX} ${dipDepth}
    C ${c3x} ${dipDepth} ${c4x} 0 ${rightX} 0
    H ${windowWidth - cornerRadius}
    Q ${windowWidth} 0 ${windowWidth} ${cornerRadius}
    V ${totalBarHeight}
    Z
  `;

  // Top border line shape for crisp outline
  const topBorderPath = `
    M 0 ${cornerRadius}
    Q 0 0 ${cornerRadius} 0
    H ${leftX}
    C ${c1x} 0 ${c2x} ${dipDepth} ${currentX} ${dipDepth}
    C ${c3x} ${dipDepth} ${c4x} 0 ${rightX} 0
    H ${windowWidth - cornerRadius}
    Q ${windowWidth} 0 ${windowWidth} ${cornerRadius}
  `;

  const activeRoute = visibleRoutes[activeVisibleIndex];
  const activeDescriptor = activeRoute ? descriptors[activeRoute.key] : null;
  const activeLabel = activeDescriptor
    ? (activeDescriptor.options.tabBarLabel as string) ||
      (activeDescriptor.options.title as string) ||
      activeRoute.name
    : '';

  return (
    <Animated.View
      style={[
        styles.container,
        {
          height: totalBarHeight,
          transform: [{ translateY: tabBarTranslateY }],
        },
      ]}
      pointerEvents={isTabBarVisible ? 'auto' : 'none'}
    >
      {/* 1. Curved SVG Tab Bar Canvas */}
      <View style={StyleSheet.absoluteFill}>
        <Svg width={windowWidth} height={totalBarHeight}>
          {/* Main White Curved Fill */}
          <Path d={notchPath} fill="#FFFFFF" />
          {/* Top Border Accent Line */}
          <Path
            d={topBorderPath}
            fill="none"
            stroke="#E2E8F0"
            strokeWidth={1}
          />
        </Svg>
      </View>

      {/* 2. Inactive Tab Buttons */}
      <View style={styles.tabsRow}>
        {visibleRoutes.map((route, index) => {
          const isFocused = index === activeVisibleIndex;
          const { options } = descriptors[route.key];

          const label =
            options.tabBarLabel !== undefined
              ? (options.tabBarLabel as string)
              : options.title !== undefined
              ? options.title
              : route.name;

          const onPress = () => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            // Ensure tab bar is shown when user taps a tab
            useTabBarVisibilityStore.getState().setVisible(true);

            let defaultPrevented = false;
            if (emitter?.emit) {
              const res = emitter.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              defaultPrevented = Boolean(res?.defaultPrevented);
            } else if (navigation?.emit) {
              const res = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              defaultPrevented = Boolean(res?.defaultPrevented);
            }

            if (!isFocused && !defaultPrevented) {
              if (typeof navigateToTab === 'function') {
                navigateToTab(route.key);
              } else if (navigation?.navigate) {
                navigation.navigate(route.name);
              } else {
                router.push(route.name as any);
              }
            }
          };

          const onLongPress = () => {
            if (emitter?.emit) {
              emitter.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            } else if (navigation?.emit) {
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarButtonTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              activeOpacity={0.8}
              style={[styles.tabButton, { width: tabWidth }]}
            >
              {/* Only show inactive icon & text when this tab is NOT active */}
              {!isFocused && (
                <View style={styles.inactiveTabContent}>
                  {options.tabBarIcon
                    ? options.tabBarIcon({
                        focused: false,
                        color: '#94A3B8',
                        size: 20,
                      })
                    : null}
                  <Text style={styles.inactiveLabel} numberOfLines={1}>
                    {label}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 3. Floating Active Circular Button (Slides smoothly with spring) */}
      {activeDescriptor && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.floatingCircleWrapper,
            {
              left: currentX - 26,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.floatingCircleOuter}>
            <View style={styles.floatingCircleInner}>
              {activeDescriptor.options.tabBarIcon
                ? activeDescriptor.options.tabBarIcon({
                    focused: true,
                    color: '#2563EB',
                    size: 22,
                  })
                : null}
            </View>
          </View>
        </Animated.View>
      )}

      {/* 4. Active Tab Label (Placed neatly below the scoop) */}
      <View
        pointerEvents="none"
        style={[
          styles.activeLabelContainer,
          {
            left: currentX - tabWidth / 2,
            width: tabWidth,
          },
        ]}
      >
        <Text style={styles.activeLabel} numberOfLines={1}>
          {activeLabel}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    elevation: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    zIndex: 100,
  },
  tabsRow: {
    flexDirection: 'row',
    height: 58,
    alignItems: 'center',
  },
  tabButton: {
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactiveTabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingTop: 4,
  },
  inactiveLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: -0.1,
  },
  floatingCircleWrapper: {
    position: 'absolute',
    top: -14,
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 105,
  },
  floatingCircleOuter: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#F1F5F9',
    elevation: 8,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  floatingCircleInner: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeLabelContainer: {
    position: 'absolute',
    top: 34,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 104,
  },
  activeLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.1,
  },
});
