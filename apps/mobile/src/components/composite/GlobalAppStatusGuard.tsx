import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from 'react-native';
import Constants from 'expo-constants';
import { RefreshCw, ArrowUpCircle, Wrench } from 'lucide-react-native';
import { useAppConfig } from '../../api/hooks';
import { Button } from '../ui/Button';

/**
 * Compare two semver strings like "1.0.2" and "1.1.0".
 * Returns true if current is strictly less than target.
 */
export function isVersionBelow(current: string, target?: string | null): boolean {
  if (!target) return false;

  const parse = (v: string) =>
    v
      .replace(/^v/, '')
      .split('.')
      .map((n) => parseInt(n, 10) || 0);

  const [cMaj = 0, cMin = 0, cPatch = 0] = parse(current);
  const [tMaj = 0, tMin = 0, tPatch = 0] = parse(target);

  if (cMaj < tMaj) return true;
  if (cMaj > tMaj) return false;
  if (cMin < tMin) return true;
  if (cMin > tMin) return false;
  return cPatch < tPatch;
}

export interface GlobalAppStatusGuardProps {
  children: React.ReactNode;
}

export function GlobalAppStatusGuard({ children }: GlobalAppStatusGuardProps) {
  const { data: config, isLoading, isError, refetch } = useAppConfig();
  const currentVersion = Constants.expoConfig?.version || '1.0.0';

  // 1. Maintenance Screen
  if (config?.maintenance) {
    return (
      <View className="flex-1 bg-surface items-center justify-center p-6">
        <View className="w-16 h-16 rounded-2xl bg-amber-50 items-center justify-center mb-6 border border-amber-200">
          <Wrench size={32} color="#D97706" />
        </View>

        <Text className="text-h2 font-bold text-ink text-center mb-2">
          Under Scheduled Maintenance
        </Text>

        <Text className="text-body text-ink-muted text-center max-w-xs mb-8 leading-relaxed">
          Quick2Learn is currently undergoing scheduled maintenance to improve your experience. Dinesh Sir and the team are working on it. Your learning progress is safe!
        </Text>

        <View className="w-full max-w-xs">
          <Button
            variant="outline"
            size="lg"
            onPress={() => refetch()}
            icon={<RefreshCw size={18} color="#2563EB" />}
          >
            Check Again
          </Button>
        </View>
      </View>
    );
  }

  // 2. Force Update Screen
  const isForceUpdateRequired =
    Boolean(config?.minSupportedVersion) &&
    isVersionBelow(currentVersion, config?.minSupportedVersion);

  if (isForceUpdateRequired) {
    const playStoreUrl = 'https://play.google.com/store/apps/details?id=in.quick2learn.app';

    return (
      <View className="flex-1 bg-surface items-center justify-center p-6">
        <View className="w-20 h-20 rounded-2xl bg-primary-soft items-center justify-center mb-6 border border-primary/20">
          <ArrowUpCircle size={40} color="#2563EB" />
        </View>

        <Text className="text-h2 font-bold text-ink text-center mb-2">
          Update Required
        </Text>

        <Text className="text-body text-ink-muted text-center max-w-xs mb-4 leading-relaxed">
          A newer version of Quick2Learn is available with important updates and bug fixes. Please update to continue learning.
        </Text>

        <View className="bg-surface-subtle px-3 py-1.5 rounded-full mb-8">
          <Text className="text-caption text-ink-muted">
            Installed: v{currentVersion} • Minimum: v{config?.minSupportedVersion}
          </Text>
        </View>

        <View className="w-full max-w-xs">
          <Button
            variant="primary"
            size="lg"
            onPress={() => Linking.openURL(playStoreUrl)}
          >
            Update Now
          </Button>
        </View>
      </View>
    );
  }

  return <>{children}</>;
}
