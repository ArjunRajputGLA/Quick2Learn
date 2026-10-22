import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  Animated,
  useWindowDimensions,
  ScrollView,
  Share,
  Linking,
  Platform,
  Easing,
  StyleSheet,
  BackHandler,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Haptics from 'expo-haptics';
import {
  Download,
  Folder,
  MessageSquare,
  User,
  Settings,
  HelpCircle,
  Shield,
  CreditCard,
  X,
} from 'lucide-react-native';
import { useDropdownStore } from '../../lib/drawerStore';
import { useMe } from '../../api/hooks';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  onPress: () => void;
}

export function RollingDropdownMenu() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isOpen = useDropdownStore((state) => state.isOpen);
  const closeDropdown = useDropdownStore((state) => state.closeDropdown);
  const { data: me } = useMe();

  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const menuWidth = Math.min(315, Math.round(screenWidth * 0.84));
  const maxMenuHeight = Math.min(590, Math.round(screenHeight * 0.78));

  const [visible, setVisible] = useState(false);
  const rollAnim = useRef(new Animated.Value(0)).current;
  const openTimeRef = useRef(0);

  // Handle hardware back button on Android
  useEffect(() => {
    if (!visible) return;
    const backSub = BackHandler.addEventListener('hardwareBackPress', () => {
      handleClose();
      return true;
    });
    return () => backSub.remove();
  }, [visible]);

  useEffect(() => {
    if (isOpen) {
      openTimeRef.current = Date.now();
      setVisible(true);
      rollAnim.stopAnimation();
      rollAnim.setValue(0);
      Animated.spring(rollAnim, {
        toValue: 1,
        damping: 22,
        mass: 0.8,
        stiffness: 220,
        useNativeDriver: true,
      }).start();
    } else if (visible) {
      rollAnim.stopAnimation();
      Animated.timing(rollAnim, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          setVisible(false);
        }
      });
    }
  }, [isOpen]);

  const handleClose = () => {
    closeDropdown();
  };

  const handleBackdropPress = () => {
    // Guard against accidental immediate close from opening tap release
    if (Date.now() - openTimeRef.current < 400) {
      return;
    }
    handleClose();
  };

  const navigateTo = (route: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    closeDropdown();
    requestAnimationFrame(() => {
      try {
        router.push(route as any);
      } catch (err) {
        console.warn('[RollingDropdown] push error, using navigate:', err);
        router.navigate(route as any);
      }
    });
  };

  const handleOpenPrivacyPolicy = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    closeDropdown();
    setTimeout(async () => {
      try {
        await WebBrowser.openBrowserAsync('https://quick2learn.in/privacy');
      } catch {
        try {
          await Linking.openURL('https://quick2learn.in/privacy');
        } catch (e) {
          console.warn('Cannot open privacy policy:', e);
        }
      }
    }, 120);
  };

  const handleShareOnFacebook = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    closeDropdown();
    const appUrl = 'https://play.google.com/store/apps/details?id=in.quick2learn.app';
    const fbShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(appUrl)}`;
    setTimeout(async () => {
      try {
        const canOpen = await Linking.canOpenURL(fbShareUrl);
        if (canOpen) {
          await Linking.openURL(fbShareUrl);
        } else {
          await Share.share({
            title: 'Quick2Learn App',
            message: `Master CBSE & ICSE Mathematics with Dinesh Sir on Quick2Learn: ${appUrl} (Organization Code: KFVMT)`,
          });
        }
      } catch (err) {
        console.warn('Share error:', err);
      }
    }, 120);
  };

  if (!visible && !isOpen) {
    return null;
  }

  const fullName = me?.profile?.fullName || me?.user?.name || 'Arjun Singh Rajput';
  const orgCode = 'Organization Code KFVMT';

  // All exact options from APPLICATION FOLDER\Old App screenshots\2.jpeg
  const menuItems: MenuItem[] = [
    {
      id: 'downloads',
      label: 'Offline Downloads',
      icon: <Download size={20} color="#475569" strokeWidth={1.8} />,
      badge: 'NEW',
      onPress: () => navigateTo('/downloads'),
    },
    {
      id: 'free-material',
      label: 'Free Material',
      icon: <Folder size={20} color="#475569" strokeWidth={1.8} />,
      onPress: () => navigateTo('/search'),
    },
    {
      id: 'testimonials',
      label: 'Students Testimonial',
      icon: <MessageSquare size={20} color="#475569" strokeWidth={1.8} />,
      badge: 'NEW',
      onPress: () => navigateTo('/results'),
    },
    {
      id: 'edit-profile',
      label: 'Edit Profile',
      icon: <User size={20} color="#475569" strokeWidth={1.8} />,
      onPress: () => navigateTo('/profile/edit'),
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings size={20} color="#475569" strokeWidth={1.8} />,
      onPress: () => navigateTo('/settings'),
    },
    {
      id: 'help',
      label: 'How to use the App',
      icon: <HelpCircle size={20} color="#475569" strokeWidth={1.8} />,
      badge: 'NEW',
      onPress: () => navigateTo('/help'),
    },
    {
      id: 'privacy',
      label: 'Privacy Policy',
      icon: <Shield size={20} color="#475569" strokeWidth={1.8} />,
      onPress: handleOpenPrivacyPolicy,
    },
    {
      id: 'payments',
      label: 'Payments',
      icon: <CreditCard size={20} color="#475569" strokeWidth={1.8} />,
      onPress: () => navigateTo('/fees'),
    },
  ];

  // Rolling animation interpolations
  const translateY = rollAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-45, 0],
  });

  const opacity = rollAnim.interpolate({
    inputRange: [0, 0.25, 1],
    outputRange: [0, 0.7, 1],
  });

  const backdropOpacity = rollAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.45],
  });

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        {
          zIndex: 99999,
          elevation: 99999,
        },
      ]}
      pointerEvents="box-none"
    >
      {/* 1. Backdrop */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: '#0F172A',
            opacity: backdropOpacity,
          },
        ]}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={handleBackdropPress}
          accessibilityLabel="Close dropdown backdrop"
          accessibilityRole="button"
        />
      </Animated.View>

      {/* 2. Rolling Dropdown Card */}
      <Animated.View
        style={{
          position: 'absolute',
          top: insets.top + 52,
          left: 12,
          width: menuWidth,
          maxHeight: maxMenuHeight,
          backgroundColor: '#FFFFFF',
          borderRadius: 18,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.28,
          shadowRadius: 22,
          elevation: 100000,
          borderWidth: 1,
          borderColor: '#E2E8F0',
          transform: [{ translateY }],
          opacity,
          zIndex: 100000,
        }}
      >
        {/* Top Profile Header matching 2.jpeg */}
        <View
          style={{
            paddingHorizontal: 18,
            paddingTop: 16,
            paddingBottom: 12,
            borderTopLeftRadius: 18,
            borderTopRightRadius: 18,
            backgroundColor: '#FFFFFF',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Avatar circle */}
            <View
              style={{
                width: 58,
                height: 58,
                borderRadius: 29,
                backgroundColor: '#EFF6FF',
                borderWidth: 1.5,
                borderColor: '#BFDBFE',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <User size={30} color="#2563EB" strokeWidth={1.8} />
            </View>

            {/* Close (X) icon */}
            <TouchableOpacity
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                handleClose();
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Close dropdown"
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#F1F5F9',
              }}
            >
              <X size={15} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Name */}
          <Text
            style={{
              fontSize: 16,
              fontWeight: '700',
              color: '#0F172A',
              marginTop: 10,
              letterSpacing: -0.2,
            }}
            numberOfLines={1}
          >
            {fullName}
          </Text>

          {/* Organization Code */}
          <Text
            style={{
              fontSize: 12,
              fontWeight: '500',
              color: '#64748B',
              marginTop: 2,
            }}
            numberOfLines={1}
          >
            {orgCode}
          </Text>
        </View>

        {/* Thin divider */}
        <View style={{ height: 1, backgroundColor: '#F1F5F9' }} />

        {/* Menu Items List from 2.jpeg */}
        <ScrollView
          style={{ flexShrink: 1, maxHeight: maxMenuHeight - 110 }}
          contentContainerStyle={{ paddingVertical: 4 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={item.onPress}
              activeOpacity={0.65}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 10,
                paddingHorizontal: 18,
              }}
            >
              <View style={{ width: 26, alignItems: 'center', marginRight: 14 }}>
                {item.icon}
              </View>
              <Text
                style={{
                  flex: 1,
                  fontSize: 13.5,
                  fontWeight: '500',
                  color: '#334155',
                }}
                numberOfLines={1}
              >
                {item.label}
              </Text>
              {item.badge ? (
                <View
                  style={{
                    backgroundColor: '#2563EB',
                    borderRadius: 10,
                    paddingHorizontal: 7,
                    paddingVertical: 2,
                    marginLeft: 8,
                  }}
                >
                  <Text
                    style={{
                      color: '#FFFFFF',
                      fontSize: 9.5,
                      fontWeight: '700',
                      letterSpacing: 0.5,
                    }}
                  >
                    {item.badge}
                  </Text>
                </View>
              ) : null}
            </TouchableOpacity>
          ))}

          {/* Bottom "Share on facebook" Button matching 2.jpeg */}
          <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 14 }}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleShareOnFacebook}
              accessibilityRole="button"
              accessibilityLabel="Share on facebook"
              style={{
                backgroundColor: '#1877F2',
                borderRadius: 10,
                height: 42,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 9,
                shadowColor: '#1877F2',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.22,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              {/* White circle with blue 'f' */}
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  backgroundColor: '#FFFFFF',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={{
                    color: '#1877F2',
                    fontWeight: '900',
                    fontSize: 15,
                    lineHeight: 17,
                    fontFamily: Platform.OS === 'ios' ? 'HelveticaNeue-Bold' : 'sans-serif-black',
                  }}
                >
                  f
                </Text>
              </View>
              <Text style={{ color: '#FFFFFF', fontSize: 13.5, fontWeight: '700' }}>
                Share on facebook
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

// Export alias for compatibility
export const SidebarDrawer = RollingDropdownMenu;
