import React from 'react';
import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import {
  Home,
  BookOpen,
  GraduationCap,
  HelpCircle,
  MessageCircle,
  User,
  Calendar,
  Award,
  CreditCard,
  Briefcase,
  ShieldCheck,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useMe } from '../../../src/api/hooks';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { data: me } = useMe();
  const role = me?.role || 'student';

  const isParent = role === 'parent';
  const isAdmin = role === 'admin';
  const isTeacherOrStaff = role === 'teacher' || role === 'admin';

  return (
    <>
      <StatusBar style="dark" />
      <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563EB', // Primary
        tabBarInactiveTintColor: '#6B7280', // Ink Muted
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          height: 52 + (Platform.OS === 'ios' ? insets.bottom : Math.max(insets.bottom, 4)),
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : Math.max(insets.bottom, 4),
          paddingTop: 4,
          elevation: 6,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.04,
          shadowRadius: 3,
        },
        tabBarItemStyle: {
          minHeight: 44,
          paddingVertical: 1,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 1,
        },
      }}
    >
      {/* 1. Home Tab (Visible for both student and parent) */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => <Home size={20} color={color} />,
        }}
      />

      {/* 2. Parent Attendance Tab (Only visible for parents) */}
      <Tabs.Screen
        name="attendance"
        options={{
          href: isParent ? '/attendance' : null,
          title: 'Attendance',
          tabBarLabel: 'Attendance',
          tabBarIcon: ({ color }) => <Calendar size={20} color={color} />,
        }}
      />

      {/* 3. Parent Tests Tab (Only visible for parents) */}
      <Tabs.Screen
        name="tests"
        options={{
          href: isParent ? '/tests' : null,
          title: 'Tests',
          tabBarLabel: 'Tests',
          tabBarIcon: ({ color }) => <Award size={20} color={color} />,
        }}
      />

      {/* 4. Parent Fees Tab (Only visible for parents) */}
      <Tabs.Screen
        name="fees"
        options={{
          href: isParent ? '/fees' : null,
          title: 'Fees',
          tabBarLabel: 'Fees',
          tabBarIcon: ({ color }) => <CreditCard size={20} color={color} />,
        }}
      />

      {/* 5. Student Learn Tab (Hidden for parents and staff; staff uses Teach/Admin tab) */}
      <Tabs.Screen
        name="learn"
        options={{
          href: !isParent && !isTeacherOrStaff ? '/learn' : null,
          title: 'Learn',
          tabBarLabel: 'Learn',
          tabBarIcon: ({ color }) => (
            <BookOpen size={20} color={color} />
          ),
        }}
      />

      {/* 6. Student Batches Tab (Hidden for parents) */}
      <Tabs.Screen
        name="batches"
        options={{
          href: !isParent ? '/batches' : null,
          title: 'Batches',
          tabBarLabel: 'Batches',
          tabBarIcon: ({ color }) => (
            <GraduationCap size={20} color={color} />
          ),
        }}
      />

      {/* 7. Student Chats & Doubts Tab */}
      <Tabs.Screen
        name="doubts"
        options={{
          href: !isParent && !isTeacherOrStaff ? '/doubts' : null,
          title: 'Chats',
          tabBarLabel: 'Chats',
          tabBarIcon: ({ color }) => (
            <MessageCircle size={20} color={color} />
          ),
        }}
      />

      {/* 8. Admin / Teacher Tab */}
      <Tabs.Screen
        name="teach"
        options={{
          href: isTeacherOrStaff ? '/teach' : null,
          title: isAdmin ? 'Admin' : 'Teach',
          tabBarLabel: isAdmin ? 'Admin' : 'Teach',
          tabBarIcon: ({ color }) => (
            isAdmin ? <ShieldCheck size={20} color={color} /> : <Briefcase size={20} color={color} />
          ),
        }}
      />

      {/* 8. Profile Tab (Visible for both student and parent) */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => <User size={20} color={color} />,
        }}
      />
    </Tabs>
    </>
  );
}
