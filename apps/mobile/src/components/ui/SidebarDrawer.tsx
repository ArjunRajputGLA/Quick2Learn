import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  useWindowDimensions,
  ScrollView,
  Share,
  Linking,
  Platform,
  Easing,
  StyleSheet,
  BackHandler,
  PanResponder,
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
import { useDrawerStore } from '../../lib/drawerStore';
import { useMe } from '../../api/hooks';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  onPress: () => void;
}

export function SidebarDrawer() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isOpen, closeDrawer } = useDrawerStore();
  const { data: me } = useMe();

  const { width: screenWidth } = useWindowDimensions();
  const drawerWidth = Math.min(320, screenWidth * 0.82);

  // Native hardware-accelerated animated progress: 0 (closed) to 1 (open)
  const anim = useRef(new Animated.Value(0)).current;

  // Intercept Android hardware back press when drawer is open
  useEffect(() => {
    if (!isOpen) return;
    const onBackPress = () => {
      closeDrawer();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [isOpen, closeDrawer]);

  // Smooth, immediate, 0ms latency spring & timing transitions
  useEffect(() => {
    if (isOpen) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      anim.stopAnimation();
      Animated.spring(anim, {
        toValue: 1,
        damping: 26,
        mass: 0.85,
        stiffness: 240,
        useNativeDriver: true,
      }).start();
    } else {
      anim.stopAnimation();
      Animated.timing(anim, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [isOpen, anim]);

  // Gesture handling: Swipe left to drag & dismiss drawer smoothly
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dx < -10 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          const progress = Math.max(0, Math.min(1, 1 + gestureState.dx / drawerWidth));
          anim.setValue(progress);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -55 || gestureState.vx < -0.4) {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          closeDrawer();
        } else {
          Animated.spring(anim, {
            toValue: 1,
            damping: 26,
            mass: 0.85,
            stiffness: 240,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const handleClose = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    closeDrawer();
  };

  const navigateTo = (route: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    closeDrawer();
    setTimeout(() => {
      router.push(route as any);
    }, 120);
  };

  const handleOpenPrivacyPolicy = async () => {
    closeDrawer();
    try {
      await WebBrowser.openBrowserAsync('https://quick2learn.in/privacy');
    } catch {
      try {
        await Linking.openURL('https://quick2learn.in/privacy');
      } catch (e) {
        console.warn('Cannot open privacy policy:', e);
      }
    }
  };

  const handleShareOnFacebook = async () => {
    closeDrawer();
    const appUrl = 'https://play.google.com/store/apps/details?id=in.quick2learn.app';
    const fbShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(appUrl)}`;
    try {
      const canOpen = await Linking.canOpenURL(fbShareUrl);
      if (canOpen) {
        await Linking.openURL(fbShareUrl);
      } else {
        await Share.share({
          title: 'Quick2Learn App',
          message: `Master CBSE & ICSE Mathematics with Dinesh Sir on Quick2Learn: ${appUrl}`,
          url: appUrl,
        });
      }
    } catch (err) {
      console.warn('Share error:', err);
    }
  };

  const fullName = me?.profile?.fullName || me?.user?.name || 'Arjun Singh Rajput';
  const orgCode = 'Organization Code KFVMT';

  const menuItems: MenuItem[] = [
    {
      id: 'downloads',
      label: 'Offline Downloads',
      icon: <Download size={22} color="#475569" strokeWidth={1.8} />,
      badge: 'NEW',
      onPress: () => navigateTo('/downloads'),
    },
    {
      id: 'free-material',
      label: 'Free Material',
      icon: <Folder size={22} color="#475569" strokeWidth={1.8} />,
      onPress: () => navigateTo('/search'),
    },
    {
      id: 'testimonials',
      label: 'Students Testimonial',
      icon: <MessageSquare size={22} color="#475569" strokeWidth={1.8} />,
      badge: 'NEW',
      onPress: () => navigateTo('/results'),
    },
    {
      id: 'edit-profile',
      label: 'Edit Profile',
      icon: <User size={22} color="#475569" strokeWidth={1.8} />,
      onPress: () => navigateTo('/profile/edit'),
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings size={22} color="#475569" strokeWidth={1.8} />,
      onPress: () => navigateTo('/settings'),
    },
    {
      id: 'help',
      label: 'How to use the App',
      icon: <HelpCircle size={22} color="#475569" strokeWidth={1.8} />,
      badge: 'NEW',
      onPress: () => navigateTo('/help'),
    },
    {
      id: 'privacy',
      label: 'Privacy Policy',
      icon: <Shield size={22} color="#475569" strokeWidth={1.8} />,
      onPress: handleOpenPrivacyPolicy,
    },
    {
      id: 'payments',
      label: 'Payments',
      icon: <CreditCard size={22} color="#475569" strokeWidth={1.8} />,
      onPress: () => navigateTo('/fees'),
    },
  ];

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-drawerWidth, 0],
  });

  const backdropOpacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.45],
  });

  return (
    <View
      pointerEvents={isOpen ? 'auto' : 'none'}
      aria-hidden={!isOpen}
      style={[
        StyleSheet.absoluteFill,
        {
          zIndex: 99999,
          elevation: 99999,
        },
      ]}
    >
      {/* 1. Dimmed Animated Backdrop */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: '#000000',
            opacity: backdropOpacity,
          },
        ]}
      />

      {/* 2. Backdrop touchable to close */}
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        activeOpacity={1}
        onPress={handleClose}
        accessibilityLabel="Close sidebar"
        accessibilityRole="button"
      />

      {/* 3. Sliding Drawer Panel (with Pan Gesture support) */}
      <Animated.View
        {...panResponder.panHandlers}
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          width: drawerWidth,
          backgroundColor: '#FFFFFF',
          shadowColor: '#000',
          shadowOffset: { width: 4, height: 0 },
          shadowOpacity: 0.22,
          shadowRadius: 18,
          elevation: 28,
          transform: [{ translateX }],
          paddingTop: insets.top + 16,
        }}
      >
        {/* Close button top right */}
        <TouchableOpacity
          onPress={handleClose}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel="Close sidebar drawer"
          accessibilityRole="button"
          style={{
            position: 'absolute',
            top: insets.top + 12,
            right: 14,
            width: 32,
            height: 32,
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#F1F5F9',
            zIndex: 10,
          }}
        >
          <X size={18} color="#64748B" />
        </TouchableOpacity>

        {/* Top Profile Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 16 }}>
          {/* Avatar Circle */}
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: '#EFF6FF',
              borderWidth: 2,
              borderColor: '#BFDBFE',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14,
            }}
          >
            <User size={38} color="#2563EB" strokeWidth={1.8} />
          </View>

          {/* User Full Name */}
          <Text
            style={{
              fontSize: 19,
              fontWeight: '700',
              color: '#0F172A',
              marginBottom: 4,
              letterSpacing: -0.2,
            }}
            numberOfLines={1}
          >
            {fullName}
          </Text>

          {/* Organization Code */}
          <Text
            style={{
              fontSize: 13.5,
              fontWeight: '500',
              color: '#64748B',
            }}
            numberOfLines={1}
          >
            {orgCode}
          </Text>
        </View>

        {/* Thin subtle divider */}
        <View style={{ height: 1, backgroundColor: '#F1F5F9', marginBottom: 4 }} />

        {/* Menu Items List */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingVertical: 4 }}
          showsVerticalScrollIndicator={false}
        >
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={item.onPress}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 13,
                paddingHorizontal: 20,
              }}
            >
              <View style={{ width: 28, alignItems: 'center', marginRight: 16 }}>
                {item.icon}
              </View>
              <Text
                style={{
                  flex: 1,
                  fontSize: 15,
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
                    paddingHorizontal: 7.5,
                    paddingVertical: 2.5,
                    marginLeft: 8,
                  }}
                >
                  <Text
                    style={{
                      color: '#FFFFFF',
                      fontSize: 10,
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
        </ScrollView>

        {/* Bottom Facebook Share Button */}
        <View style={{ paddingHorizontal: 16, paddingBottom: Math.max(16, insets.bottom + 8), paddingTop: 8 }}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleShareOnFacebook}
            accessibilityRole="button"
            accessibilityLabel="Share on facebook"
            style={{
              backgroundColor: '#1877F2',
              borderRadius: 12,
              height: 48,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              shadowColor: '#1877F2',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: '#FFFFFF',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                  color: '#1877F2',
                  fontWeight: '900',
                  fontSize: 16,
                  lineHeight: 18,
                  fontFamily: Platform.OS === 'ios' ? 'HelveticaNeue-Bold' : 'sans-serif-black',
                }}
              >
                f
              </Text>
            </View>
            <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700' }}>
              Share on facebook
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}
