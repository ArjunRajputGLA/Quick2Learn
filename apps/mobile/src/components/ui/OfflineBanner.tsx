import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import * as Network from 'expo-network';
import { WifiOff } from 'lucide-react-native';

export interface OfflineBannerProps {
  forcedOffline?: boolean;
  className?: string;
}

export function OfflineBanner({
  forcedOffline,
  className = '',
}: OfflineBannerProps) {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);

  useEffect(() => {
    let mounted = true;

    async function checkNetwork() {
      try {
        const state = await Network.getNetworkStateAsync();
        if (mounted) {
          setIsConnected(Boolean(state.isConnected && state.isInternetReachable !== false));
        }
      } catch {
        if (mounted) setIsConnected(true);
      }
    }

    checkNetwork();
    const interval = setInterval(checkNetwork, 10000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const isOffline = forcedOffline !== undefined ? forcedOffline : isConnected === false;

  if (!isOffline) return null;

  return (
    <View
      accessibilityRole="alert"
      className={`bg-amber-500 py-2.5 px-4 flex-row items-center justify-center border-b border-amber-600 ${className}`}
    >
      <WifiOff size={16} color="#FFFFFF" className="mr-2" />
      <Text className="text-small font-semibold text-white ml-2 text-center">
        You are offline. Showing cached content.
      </Text>
    </View>
  );
}
