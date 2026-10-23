import React from 'react';
import {
  Modal,
  StatusBar,
  View,
  Text,
  TouchableOpacity,
  Pressable,
  useWindowDimensions,
  ScrollView,
  Share,
  Linking,
  Platform,
  StyleSheet,
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
  ChevronRight,
} from 'lucide-react-native';
import { useDropdownStore, useDrawerStore } from '../../lib/drawerStore';
import { useMe } from '../../api/hooks';

interface MenuItem {
  id: string;
  label: string;
  subtitle?: string;
  icon: React.ReactNode;
  iconBg: string;
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
  const menuWidth = Math.min(320, Math.round(screenWidth * 0.85));
  const maxMenuHeight = Math.min(620, Math.round(screenHeight * 0.82));

  const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;
  const safeTop = Math.max(insets?.top ?? 0, statusBarHeight);
  const menuTop = safeTop + 58;

  const handleClose = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    closeDropdown();
  };

  const navigateTo = (route: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    closeDropdown();
    setTimeout(() => {
      try {
        router.push(route as any);
      } catch (err) {
        console.warn('[RollingDropdownMenu] push error, using navigate:', err);
        router.navigate(route as any);
      }
    }, 120);
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

  if (!isOpen) {
    return null;
  }

  const rawName = me?.profile?.fullName || me?.user?.name || 'Arjun Singh Rajput';
  const fullName = rawName.replace(/\s*\([^)]*\)/g, '').trim() || 'Arjun Singh Rajput';
  const roleName =
    me?.role === 'teacher'
      ? 'Faculty'
      : me?.role === 'admin'
      ? 'Administrator'
      : me?.profile?.classLevel
      ? `Class ${me.profile.classLevel} • ${(me.profile.board || 'CBSE').toUpperCase()}`
      : 'CBSE Mathematics';

  const orgCode = 'KFVMT';

  const menuItems: MenuItem[] = [
    {
      id: 'downloads',
      label: 'Offline Downloads',
      subtitle: 'Downloaded lectures & notes',
      icon: <Download size={18} color="#2563EB" strokeWidth={2.1} />,
      iconBg: '#EFF6FF',
      badge: 'NEW',
      onPress: () => navigateTo('/downloads'),
    },
    {
      id: 'free-material',
      label: 'Free Material',
      subtitle: 'Sample papers & formula sheets',
      icon: <Folder size={18} color="#0D9488" strokeWidth={2.1} />,
      iconBg: '#F0FDFA',
      onPress: () => navigateTo('/search'),
    },
    {
      id: 'testimonials',
      label: 'Students Testimonial',
      subtitle: 'Past toppers & success stories',
      icon: <MessageSquare size={18} color="#D97706" strokeWidth={2.1} />,
      iconBg: '#FFFBEB',
      badge: 'NEW',
      onPress: () => navigateTo('/results'),
    },
    {
      id: 'edit-profile',
      label: 'Edit Profile',
      subtitle: 'Class, board & personal info',
      icon: <User size={18} color="#7C3AED" strokeWidth={2.1} />,
      iconBg: '#F5F3FF',
      onPress: () => navigateTo('/profile/edit'),
    },
    {
      id: 'settings',
      label: 'Settings',
      subtitle: 'App preferences & notifications',
      icon: <Settings size={18} color="#475569" strokeWidth={2.1} />,
      iconBg: '#F1F5F9',
      onPress: () => navigateTo('/settings'),
    },
    {
      id: 'help',
      label: 'How to use the App',
      subtitle: 'Video walkthroughs & FAQs',
      icon: <HelpCircle size={18} color="#0284C7" strokeWidth={2.1} />,
      iconBg: '#F0F9FF',
      badge: 'NEW',
      onPress: () => navigateTo('/help'),
    },
    {
      id: 'privacy',
      label: 'Privacy Policy',
      subtitle: 'Student privacy & security policy',
      icon: <Shield size={18} color="#059669" strokeWidth={2.1} />,
      iconBg: '#ECFDF5',
      onPress: handleOpenPrivacyPolicy,
    },
    {
      id: 'payments',
      label: 'Payments',
      subtitle: 'Fee invoices & payment history',
      icon: <CreditCard size={18} color="#DB2777" strokeWidth={2.1} />,
      iconBg: '#FDF2F8',
      onPress: () => navigateTo('/fees'),
    },
  ];

  return (
    <Modal
      visible={Boolean(isOpen)}
      transparent
      animationType="fade"
      statusBarTranslucent
      hardwareAccelerated
      onRequestClose={handleClose}
    >
      <View style={{ flex: 1, width: '100%', height: '100%', position: 'relative' }}>
        {/* 1. Fullscreen dark backdrop */}
        <Pressable
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: 'rgba(15, 23, 42, 0.45)', zIndex: 1 },
          ]}
          onPress={handleClose}
          accessibilityLabel="Close menu backdrop"
          accessibilityRole="button"
        />

        {/* 2. Menu Card on top directly below floating header */}
        <View
          style={{
            position: 'absolute',
            top: menuTop,
            left: 12,
            width: menuWidth,
            maxHeight: maxMenuHeight,
            backgroundColor: '#FFFFFF',
            borderRadius: 20,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.28,
            shadowRadius: 22,
            elevation: 24,
            borderWidth: 1,
            borderColor: '#E2E8F0',
            overflow: 'hidden',
            zIndex: 10,
          }}
        >
          {/* Top User Profile Header */}
          <View
            style={{
              paddingTop: 16,
              paddingBottom: 14,
              paddingHorizontal: 16,
              backgroundColor: '#F8FAFC',
              borderBottomWidth: 1,
              borderBottomColor: '#F1F5F9',
            }}
          >
            {/* Avatar & Close button row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              {/* Circular Avatar */}
              <View
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 25,
                  backgroundColor: '#EFF6FF',
                  borderWidth: 2,
                  borderColor: '#BFDBFE',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                <User size={26} color="#2563EB" strokeWidth={2} />
                <View
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: '#10B981',
                    borderWidth: 2,
                    borderColor: '#FFFFFF',
                  }}
                />
              </View>

              {/* Close Button (X) */}
              <TouchableOpacity
                onPress={handleClose}
                accessibilityRole="button"
                accessibilityLabel="Close menu"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  backgroundColor: '#FFFFFF',
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1,
                }}
              >
                <X size={15} color="#64748B" strokeWidth={2.2} />
              </TouchableOpacity>
            </View>

            {/* Name */}
            <Text
              style={{
                fontSize: 16.5,
                fontWeight: '700',
                color: '#0F172A',
                letterSpacing: -0.3,
              }}
              numberOfLines={1}
            >
              {fullName}
            </Text>

            {/* Role / Class Badge & Org Code Row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
              <View
                style={{
                  backgroundColor: '#EFF6FF',
                  borderWidth: 1,
                  borderColor: 'rgba(37, 99, 235, 0.2)',
                  borderRadius: 12,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: '600', color: '#2563EB' }}>
                  {roleName}
                </Text>
              </View>

              <View
                style={{
                  backgroundColor: '#FFFFFF',
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  borderRadius: 12,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                }}
              >
                <Text style={{ fontSize: 10.5, fontWeight: '600', color: '#64748B' }}>
                  Code: <Text style={{ color: '#0F172A', fontWeight: '700' }}>{orgCode}</Text>
                </Text>
              </View>
            </View>
          </View>

          {/* Navigation Items List */}
          <ScrollView
            style={{ flexShrink: 1, maxHeight: maxMenuHeight - 170 }}
            contentContainerStyle={{ paddingVertical: 6, paddingHorizontal: 10 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
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
                  paddingVertical: 9,
                  paddingHorizontal: 8,
                  borderRadius: 12,
                  marginBottom: 2,
                }}
              >
                {/* Icon in soft pastel container */}
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    backgroundColor: item.iconBg,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 11,
                  }}
                >
                  {item.icon}
                </View>

                {/* Text Block */}
                <View style={{ flex: 1, justifyContent: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text
                      style={{
                        fontSize: 13.5,
                        fontWeight: '600',
                        color: '#1E293B',
                      }}
                      numberOfLines={1}
                    >
                      {item.label}
                    </Text>
                    {item.badge ? (
                      <View
                        style={{
                          backgroundColor: '#2563EB',
                          borderRadius: 8,
                          paddingHorizontal: 5.5,
                          paddingVertical: 1.5,
                        }}
                      >
                        <Text
                          style={{
                            color: '#FFFFFF',
                            fontSize: 9,
                            fontWeight: '700',
                            letterSpacing: 0.4,
                          }}
                        >
                          {item.badge}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  {item.subtitle ? (
                    <Text
                      style={{
                        fontSize: 10.5,
                        color: '#64748B',
                        marginTop: 1,
                      }}
                      numberOfLines={1}
                    >
                      {item.subtitle}
                    </Text>
                  ) : null}
                </View>

                {/* Subtle Right Chevron */}
                <ChevronRight size={14} color="#CBD5E1" strokeWidth={2.2} />
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Bottom Facebook Share Button & Footer */}
          <View
            style={{
              paddingHorizontal: 14,
              paddingTop: 10,
              paddingBottom: 12,
              borderTopWidth: 1,
              borderTopColor: '#F1F5F9',
              backgroundColor: '#FFFFFF',
            }}
          >
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleShareOnFacebook}
              accessibilityRole="button"
              accessibilityLabel="Share on facebook"
              style={{
                backgroundColor: '#1877F2',
                borderRadius: 11,
                height: 40,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 9,
                shadowColor: '#1877F2',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.22,
                shadowRadius: 4,
                elevation: 3,
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
              <Text style={{ color: '#FFFFFF', fontSize: 13.5, fontWeight: '700', letterSpacing: -0.1 }}>
                Share on facebook
              </Text>
            </TouchableOpacity>

            {/* Subtle Footer attribution */}
            <Text
              style={{
                textAlign: 'center',
                fontSize: 10,
                color: '#94A3B8',
                marginTop: 8,
                fontWeight: '500',
              }}
            >
              Quick2Learn • Learn Maths The Quick & Easy Way
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// Export aliases
export const SidebarDrawer = RollingDropdownMenu;
export default RollingDropdownMenu;
