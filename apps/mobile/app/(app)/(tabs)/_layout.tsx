import React from 'react';
import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import {
  Home,
  BookOpen,
  GraduationCap,
  HelpCircle,
  User,
  Calendar,
  Award,
  CreditCard,
  Briefcase,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMe } from '../../../src/api/hooks';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { data: me } = useMe();
  const role = me?.role || 'student';

  const isParent = role === 'parent';
  const isTeacherOrStaff = role === 'teacher' || role === 'admin';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563EB', // Primary
        tabBarInactiveTintColor: '#6B7280', // Ink Muted
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          height: 60 + (Platform.OS === 'ios' ? insets.bottom : Math.max(insets.bottom, 6)),
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : Math.max(insets.bottom, 6),
          paddingTop: 6,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
        },
        tabBarItemStyle: {
          minHeight: 48,
          paddingVertical: 2,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      {/* 1. Home Tab (Visible for both student and parent) */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size || 22} color={color} />,
        }}
      />

      {/* 2. Parent Attendance Tab (Only visible for parents) */}
      <Tabs.Screen
        name="attendance"
        options={{
          href: isParent ? '/attendance' : null,
          title: 'Attendance',
          tabBarLabel: 'Attendance',
          tabBarIcon: ({ color, size }) => <Calendar size={size || 22} color={color} />,
        }}
      />

      {/* 3. Parent Tests Tab (Only visible for parents) */}
      <Tabs.Screen
        name="tests"
        options={{
          href: isParent ? '/tests' : null,
          title: 'Tests',
          tabBarLabel: 'Tests',
          tabBarIcon: ({ color, size }) => <Award size={size || 22} color={color} />,
        }}
      />

      {/* 4. Parent Fees Tab (Only visible for parents) */}
      <Tabs.Screen
        name="fees"
        options={{
          href: isParent ? '/fees' : null,
          title: 'Fees',
          tabBarLabel: 'Fees',
          tabBarIcon: ({ color, size }) => <CreditCard size={size || 22} color={color} />,
        }}
      />

      {/* 5. Student Learn Tab (Hidden for parents) */}
      <Tabs.Screen
        name="learn"
        options={{
          href: !isParent ? '/learn' : null,
          title: 'Learn',
          tabBarLabel: 'Learn',
          tabBarIcon: ({ color, size }) => (
            <BookOpen size={size || 22} color={color} />
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
          tabBarIcon: ({ color, size }) => (
            <GraduationCap size={size || 22} color={color} />
          ),
        }}
      />

      {/* 7. Student Doubts Tab (Hidden for parents and staff; staff uses Teach tab) */}
      <Tabs.Screen
        name="doubts"
        options={{
          href: !isParent && !isTeacherOrStaff ? '/doubts' : null,
          title: 'Doubts',
          tabBarLabel: 'Doubts',
          tabBarIcon: ({ color, size }) => (
            <HelpCircle size={size || 22} color={color} />
          ),
        }}
      />

      {/* 8. Teacher Teach Tab (Visible for teacher and admin in place of Doubts) */}
      <Tabs.Screen
        name="teach"
        options={{
          href: isTeacherOrStaff ? '/teach' : null,
          title: 'Teach',
          tabBarLabel: 'Teach',
          tabBarIcon: ({ color, size }) => (
            <Briefcase size={size || 22} color={color} />
          ),
        }}
      />

      {/* 8. Profile Tab (Visible for both student and parent) */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size || 22} color={color} />,
        }}
      />
    </Tabs>
  );
}
