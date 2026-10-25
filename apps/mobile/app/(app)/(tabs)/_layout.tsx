import React from 'react';
import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import {
  Home,
  BookOpen,
  GraduationCap,
  HelpCircle,
  MessageSquare,
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
import { CurvedBottomTabBar } from '../../../src/components/navigation/CurvedBottomTabBar';

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
        tabBar={(props) => <CurvedBottomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
        }}
      >
      {/* 1. Home Tab (Visible for all) */}
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
        name="parent-attendance"
        options={{
          href: isParent ? '/parent-attendance' : null,
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

      {/* 5. Batches Tab (Student & Staff, matching 3.jpeg order) */}
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

      {/* 6. Learn / Store Tab (Student only, matching 3.jpeg order) */}
      <Tabs.Screen
        name="learn"
        options={{
          href: !isParent && !isTeacherOrStaff ? '/learn' : null,
          title: 'Store',
          tabBarLabel: 'Store',
          tabBarBadge: 'New',
          tabBarIcon: ({ color }: { color: string }) => (
            <BookOpen size={20} color={color} />
          ),
        } as any}
      />

      {/* 7. Chats Tab (Functional and visible for all roles, matching 3.jpeg & 5.jpeg) */}
      <Tabs.Screen
        name="chats"
        options={{
          title: 'Chats',
          tabBarLabel: 'Chats',
          tabBarBadge: 'dot',
          tabBarIcon: ({ color }: { color: string }) => (
            <MessageSquare size={20} color={color} />
          ),
        } as any}
      />

      {/* 8. Legacy doubts route (kept for deep-links, hidden from footer) */}
      <Tabs.Screen
        name="doubts"
        options={{
          href: null,
        }}
      />

      {/* 9. Admin / Teacher Tab */}
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

      {/* 10. Profile Tab (Visible for all) */}
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
