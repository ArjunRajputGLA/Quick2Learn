import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Download,
  Trash2,
  FileText,
  AlertCircle,
  HardDrive,
  FolderOpen,
  ChevronRight,
  ExternalLink,
} from 'lucide-react-native';
import { Screen } from '../../src/components/ui/Screen';
import { AppHeader } from '../../src/components/ui/AppHeader';
import { Badge } from '../../src/components/ui/Badge';
import {
  getAllDownloads,
  deleteDownloadedPdf,
  deleteAllBatchDownloads,
  deleteAllDownloads,
  formatBytes,
  type DownloadedItem,
} from '../../src/lib/offline-downloads';

export default function DownloadsScreen() {
  const router = useRouter();
  const [downloads, setDownloads] = useState<DownloadedItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const loadDownloads = useCallback(async () => {
    try {
      const items = await getAllDownloads();
      setDownloads(items);
    } catch (err) {
      console.warn('[DownloadsScreen] Failed to load offline items:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDownloads();
  }, [loadDownloads]);

  const totalSizeBytes = downloads.reduce((acc, it) => acc + (it.sizeBytes || 0), 0);

  // Group by batch
  const groupedByBatch: Record<string, { batchTitle: string; items: DownloadedItem[]; batchSizeBytes: number }> = {};
  for (const item of downloads) {
    const bId = item.batchId || 'unassigned';
    if (!groupedByBatch[bId]) {
      groupedByBatch[bId] = {
        batchTitle: item.batchTitle || 'Batch Study Material',
        items: [],
        batchSizeBytes: 0,
      };
    }
    groupedByBatch[bId].items.push(item);
    groupedByBatch[bId].batchSizeBytes += item.sizeBytes || 0;
  }

  const handleDeleteOne = (item: DownloadedItem) => {
    Alert.alert(
      'Delete Download',
      `Are you sure you want to delete "${item.title}" from offline storage?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteDownloadedPdf(item.id);
            loadDownloads();
          },
        },
      ]
    );
  };

  const handleDeleteBatch = (batchId: string, batchTitle: string) => {
    Alert.alert(
      'Delete All Batch Downloads',
      `Delete all downloaded notes for "${batchTitle}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            await deleteAllBatchDownloads(batchId);
            loadDownloads();
          },
        },
      ]
    );
  };

  const handleDeleteAll = () => {
    Alert.alert(
      'Clear All Offline Downloads',
      'Are you sure you want to delete all downloaded study materials across all batches? This frees up local device storage.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All Storage',
          style: 'destructive',
          onPress: async () => {
            await deleteAllDownloads();
            loadDownloads();
          },
        },
      ]
    );
  };

  const handleOpenLocalPdf = (item: DownloadedItem) => {
    router.push({
      pathname: '/(app)/pdf-viewer' as any,
      params: {
        contentId: item.id,
        localUri: item.localPath,
        title: item.title,
        isBatch: '1',
        batchId: item.batchId,
      },
    });
  };

  return (
    <Screen
      scrollable={false}
      header={<AppHeader title="Offline Downloads" showBack />}
    >
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              setIsRefreshing(true);
              loadDownloads();
            }}
            tintColor="#2563EB"
            colors={['#2563EB']}
          />
        }
      >
        {/* Requirement 7: Terms of service notice regarding YouTube videos */}
        <View className="bg-amber-50 rounded-2xl p-4 border border-amber-200 mb-4 flex-row items-start space-x-3">
          <AlertCircle size={20} color="#D97706" style={{ marginTop: 2 }} />
          <View className="flex-1">
            <Text className="text-caption font-bold text-amber-900 leading-snug">
              Note on Video Lectures
            </Text>
            <Text className="text-[12px] text-amber-800 mt-0.5 leading-relaxed">
              Videos cannot be downloaded due to YouTube's Terms of Service. All batch notes, solutions, and formula sheets are saved to device storage and open fully offline without internet.
            </Text>
          </View>
        </View>

        {/* Storage Summary Card */}
        <View className="bg-surface rounded-3xl p-5 border border-border mb-5 shadow-xs flex-row items-center justify-between">
          <View className="flex-row items-center space-x-3 flex-1">
            <View className="w-12 h-12 rounded-2xl bg-primary-soft items-center justify-center">
              <HardDrive size={24} color="#2563EB" />
            </View>
            <View>
              <Text className="text-caption text-ink-muted">Device Storage Used</Text>
              <Text className="text-h2 font-black text-ink">
                {formatBytes(totalSizeBytes)}
              </Text>
              <Text className="text-[11px] text-ink-muted">
                {downloads.length} {downloads.length === 1 ? 'document' : 'documents'} offline
              </Text>
            </View>
          </View>

          {downloads.length > 0 && (
            <TouchableOpacity
              onPress={handleDeleteAll}
              className="px-3.5 py-2 rounded-xl bg-red-50 border border-red-200 flex-row items-center space-x-1.5 active:bg-red-100"
            >
              <Trash2 size={14} color="#DC2626" />
              <Text className="text-caption font-bold text-red-600">
                Clear All
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Loading state */}
        {isLoading ? (
          <View className="py-12 items-center justify-center">
            <ActivityIndicator size="large" color="#2563EB" />
          </View>
        ) : downloads.length === 0 ? (
          /* Empty State */
          <View className="p-8 rounded-3xl bg-surface border border-border items-center justify-center text-center space-y-3 mt-4">
            <View className="w-16 h-16 rounded-full bg-slate-100 items-center justify-center">
              <FolderOpen size={32} color="#94A3B8" />
            </View>
            <Text className="text-h3 font-black text-ink text-center">
              No Offline Downloads Yet
            </Text>
            <Text className="text-caption text-ink-muted text-center max-w-[280px] leading-relaxed">
              Tap the download button next to any batch notes, solutions, or formula sheets to read them anywhere without internet.
            </Text>
          </View>
        ) : (
          /* Grouped by Batch */
          <View className="space-y-6">
            {Object.entries(groupedByBatch).map(([bId, group]) => (
              <View key={bId} className="space-y-2.5">
                {/* Batch Group Header */}
                <View className="flex-row items-center justify-between px-1">
                  <View className="flex-1 mr-2">
                    <Text className="text-h3 font-black text-ink" numberOfLines={1}>
                      {group.batchTitle}
                    </Text>
                    <Text className="text-[11px] text-ink-muted">
                      {group.items.length} {group.items.length === 1 ? 'file' : 'files'} · {formatBytes(group.batchSizeBytes)}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleDeleteBatch(bId, group.batchTitle)}
                    className="p-1.5 rounded-lg active:bg-surface-subtle"
                  >
                    <Text className="text-[11px] font-bold text-red-500">
                      Delete Batch
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Batch Items List */}
                <View className="bg-surface rounded-2xl border border-border overflow-hidden divide-y divide-border/60 shadow-xs">
                  {group.items.map((item) => (
                    <View
                      key={item.id}
                      className="min-h-[58px] py-3 px-4 flex-row items-center justify-between bg-surface"
                    >
                      <TouchableOpacity
                        onPress={() => handleOpenLocalPdf(item)}
                        className="flex-row items-center flex-1 mr-3"
                      >
                        <View className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 items-center justify-center mr-3">
                          <FileText size={20} color="#B91C1C" />
                        </View>

                        <View className="flex-1 justify-center">
                          <Text
                            className="text-body font-semibold text-ink leading-snug"
                            numberOfLines={2}
                          >
                            {item.title}
                          </Text>
                          <Text className="text-caption text-ink-muted mt-0.5">
                            {item.section || item.chapterTitle || 'Study Note'} · {formatBytes(item.sizeBytes)}
                          </Text>
                        </View>
                      </TouchableOpacity>

                      {/* Delete item button */}
                      <TouchableOpacity
                        onPress={() => handleDeleteOne(item)}
                        accessibilityRole="button"
                        accessibilityLabel="Delete offline copy"
                        className="w-10 h-10 items-center justify-center rounded-full active:bg-surface-subtle"
                      >
                        <Trash2 size={16} color="#9CA3AF" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
