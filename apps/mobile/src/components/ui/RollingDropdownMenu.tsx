import React, { useState } from 'react';
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
import * as Haptics from 'expo-haptics';
import {
  Download,
  Folder,
  MessageSquare,
  User,
  Settings,
  HelpCircle,
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

  const { width: screenWidth } = useWindowDimensions();
  const winWidth = screenWidth > 200 ? screenWidth : 375;
  const drawerWidth = Math.min(320, Math.round(winWidth * 0.82));

  const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;
  const safeTop = Math.max(insets?.top ?? 0, statusBarHeight);

  if (!isOpen) {
    return null;
  }

  const handleClose = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    closeDropdown();
  };

  const navigateTo = (route: string) => {
    handleClose();
    try {
      router.push(route as any);
    } catch (err) {
      console.warn('[RollingDropdownMenu] push error, using navigate:', err);
      router.navigate(route as any);
    }
  };


  const handleShareOnFacebook = async () => {
    handleClose();
    const appUrl = 'https://play.google.com/store/apps/details?id=in.quick2learn.app';
    const fbShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(appUrl)}`;
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
  };

  const rawName = me?.profile?.fullName || me?.user?.name || 'Dinesh Sir';
  const fullName = rawName.replace(/\s*\([^)]*\)/g, '').trim() || 'Dinesh Sir';
  const roleName =
    me?.role === 'admin'
      ? 'Administrator'
      : me?.role === 'teacher'
      ? 'Faculty'
      : me?.profile?.classLevel
      ? `Class ${me.profile.classLevel} • ${(me.profile.board || 'CBSE').toUpperCase()}`
      : 'CBSE Mathematics';

  const orgCode = 'KFVMT';
  const isAdmin = me?.role === 'admin' || me?.role === 'teacher';

  const menuItems: MenuItem[] = [
    {
      id: 'downloads',
      label: 'Offline Downloads',
      subtitle: isAdmin ? 'Manage & upload offline notes' : 'Downloaded lectures & notes',
      icon: <Download size={18} color="#2563EB" strokeWidth={2.1} />,
      iconBg: '#EFF6FF',
      badge: isAdmin ? 'UPLOAD' : 'NEW',
      onPress: () => navigateTo('/downloads'),
    },
    {
      id: 'free-material',
      label: 'Free Material',
      subtitle: isAdmin ? 'Upload sample papers & formulas' : 'Sample papers & formula sheets',
      icon: <Folder size={18} color="#0D9488" strokeWidth={2.1} />,
      iconBg: '#F0FDFA',
      badge: isAdmin ? 'UPLOAD' : 'NEW',
      onPress: () => navigateTo('/free-material'),
    },
    {
      id: 'testimonials',
      label: 'Students Testimonial',
      subtitle: isAdmin ? 'Upload toppers & student reviews' : 'Past toppers & success stories',
      icon: <MessageSquare size={18} color="#D97706" strokeWidth={2.1} />,
      iconBg: '#FFFBEB',
      badge: isAdmin ? 'UPLOAD' : 'NEW',
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
      id: 'payments',
      label: 'Payments & Fees',
      subtitle: 'Fee invoices & payment history',
      icon: <CreditCard size={18} color="#DB2777" strokeWidth={2.1} />,
      iconBg: '#FDF2F8',
      onPress: () => navigateTo('/fee-receipts'),
    },
  ];

  return (
    <Modal
      visible={Boolean(isOpen)}
      transparent
      animationType="none"
      statusBarTranslucent
      hardwareAccelerated
      onRequestClose={handleClose}
    >
      <View style={{ flex: 1, width: '100%', height: '100%', position: 'relative' }}>
        {/* 1. Backdrop */}
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: 'rgba(15, 23, 42, 0.52)',
              zIndex: 1,
            },
          ]}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={handleClose}
            accessibilityLabel="Close sidebar backdrop"
            accessibilityRole="button"
          />
        </View>

        {/* 2. Direct Left Sidebar Drawer (No animation, instant visibility) */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            width: drawerWidth,
            height: '100%',
            backgroundColor: '#FFFFFF',
            borderTopRightRadius: 22,
            borderBottomRightRadius: 22,
            borderRightWidth: 1,
            borderRightColor: '#E2E8F0',
            shadowColor: '#000000',
            shadowOffset: { width: 6, height: 0 },
            shadowOpacity: 0.24,
            shadowRadius: 18,
            elevation: 25,
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          {/* Top User Profile Header with Safe Top Padding */}
          <View
            style={{
              paddingTop: safeTop + 14,
              paddingBottom: 16,
              paddingHorizontal: 18,
              backgroundColor: '#F8FAFC',
              borderTopRightRadius: 22,
              borderBottomWidth: 1,
              borderBottomColor: '#F1F5F9',
            }}
          >
            {/* Avatar & Close button row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              {/* Circular Avatar */}
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  backgroundColor: '#EFF6FF',
                  borderWidth: 2,
                  borderColor: '#BFDBFE',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                <User size={28} color="#2563EB" strokeWidth={2} />
                <View
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: 13,
                    height: 13,
                    borderRadius: 6.5,
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
                accessibilityLabel="Close sidebar"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
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
                <X size={16} color="#64748B" strokeWidth={2.2} />
              </TouchableOpacity>
            </View>

            {/* Name */}
            <Text
              style={{
                fontSize: 17,
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
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingVertical: 8, paddingHorizontal: 12 }}
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
                  paddingVertical: 10,
                  paddingHorizontal: 10,
                  borderRadius: 12,
                  marginBottom: 3,
                }}
              >
                {/* Icon in soft pastel container */}
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: item.iconBg,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}
                >
                  {item.icon}
                </View>

                {/* Text Block */}
                <View style={{ flex: 1, justifyContent: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text
                      style={{
                        fontSize: 14,
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
                        fontSize: 11,
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
                <ChevronRight size={15} color="#CBD5E1" strokeWidth={2.2} />
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Bottom Facebook Share Button & Footer with Safe Bottom Padding */}
          <View
            style={{
              paddingHorizontal: 16,
              paddingTop: 12,
              paddingBottom: Math.max(insets.bottom, 16) + 6,
              borderTopWidth: 1,
              borderTopColor: '#F1F5F9',
              backgroundColor: '#FFFFFF',
              borderBottomRightRadius: 22,
            }}
          >
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleShareOnFacebook}
              accessibilityRole="button"
              accessibilityLabel="Share on facebook"
              style={{
                backgroundColor: '#1877F2',
                borderRadius: 12,
                height: 44,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                shadowColor: '#1877F2',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.25,
                shadowRadius: 5,
                elevation: 3,
              }}
            >
              {/* White circle with blue 'f' */}
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
              <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700', letterSpacing: -0.1 }}>
                Share on facebook
              </Text>
            </TouchableOpacity>

            {/* Subtle Footer attribution */}
            <Text
              style={{
                textAlign: 'center',
                fontSize: 10.5,
                color: '#94A3B8',
                marginTop: 10,
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
