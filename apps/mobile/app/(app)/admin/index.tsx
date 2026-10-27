import React from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { ShieldAlert } from 'lucide-react-native';
import { AdminPortal } from '../../../src/components/admin/AdminPortal';
import { useMe } from '../../../src/api/hooks';
import { Button } from '../../../src/components/ui/Button';
import { Screen } from '../../../src/components/ui/Screen';
import { AppHeader } from '../../../src/components/ui/AppHeader';

export default function AdminRouteScreen() {
  const router = useRouter();
  const { data: me, isLoading } = useMe();
  const isStaff = me?.role === 'admin' || me?.role === 'teacher';

  if (isLoading) {
    return null;
  }

  if (!isStaff) {
    return (
      <Screen scrollable={false} header={<AppHeader title="Access Restricted" showBack />}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: '#FEF2F2',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <ShieldAlert size={32} color="#DC2626" />
          </View>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '800',
              color: '#0F172A',
              marginBottom: 8,
              textAlign: 'center',
            }}
          >
            Administrator Only
          </Text>
          <Text
            style={{
              fontSize: 13.5,
              color: '#64748B',
              textAlign: 'center',
              lineHeight: 20,
              marginBottom: 20,
            }}
          >
            This portal is restricted to Quick2Learn administrators and faculty. Please switch to your student portal.
          </Text>
          <Button variant="primary" onPress={() => router.replace('/(app)/(tabs)' as any)}>
            Return to Student Home
          </Button>
        </View>
      </Screen>
    );
  }

  return <AdminPortal />;
}
