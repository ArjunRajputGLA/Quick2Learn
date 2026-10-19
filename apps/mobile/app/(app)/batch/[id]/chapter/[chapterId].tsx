import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  PlayCircle,
  FileText,
} from 'lucide-react-native';
import { Screen } from '../../../../../src/components/ui/Screen';
import { AppHeader } from '../../../../../src/components/ui/AppHeader';
import { Badge } from '../../../../../src/components/ui/Badge';
import { SegmentedControl } from '../../../../../src/components/ui/SegmentedControl';
import { Skeleton } from '../../../../../src/components/ui/Skeleton';
import { LectureRow } from '../../../../../src/components/composite/LectureRow';
import { PdfRow, type PdfDownloadState } from '../../../../../src/components/composite/PdfRow';
import {
  useBatchChapterContent,
  getContentFilePresignedUrl,
} from '../../../../../src/api/hooks';
import type { BatchContentItem, BatchChapterContentSection } from '@quick2learn/shared';
import {
  getBatchDownloads,
  downloadAndSavePdf,
  type DownloadedItem,
} from '../../../../../src/lib/offline-downloads';

export default function BatchChapterScreen() {
  const router = useRouter();
  const { id, chapterId, batchTitle, subjectName } = useLocalSearchParams<{
    id: string;
    chapterId: string;
    batchTitle?: string;
    subjectName?: string;
  }>();

  const [activeTabIdx, setActiveTabIdx] = useState(0);
  const [downloads, setDownloads] = useState<Record<string, DownloadedItem>>({});
  const [downloadingIds, setDownloadingIds] = useState<Record<string, boolean>>({});

  const {
    data: chapterData,
    isLoading,
    refetch,
    isRefetching,
  } = useBatchChapterContent(id || '', chapterId || '');

  // Load offline downloaded state for this batch
  const loadOfflineState = useCallback(async () => {
    if (!id) return;
    try {
      const items = await getBatchDownloads(id);
      const map: Record<string, DownloadedItem> = {};
      items.forEach((item) => {
        map[item.id] = item;
      });
      setDownloads(map);
    } catch (err) {
      console.warn('[BatchChapterScreen] Failed to load local downloads:', err);
    }
  }, [id]);

  useEffect(() => {
    loadOfflineState();
  }, [loadOfflineState]);

  const lectures: BatchContentItem[] = chapterData?.lectures || [];
  const notes: BatchContentItem[] = chapterData?.notes || [];
  const sections: BatchChapterContentSection[] = chapterData?.sections || [];

  const chapterTitle = chapterData?.chapterTitle || 'Chapter';
  const currentSubjectName = subjectName || chapterData?.subjectName || 'Subject';
  const currentBatchTitle = batchTitle || chapterData?.batchTitle || 'Batch';

  // Handler for tapping a PDF note
  const handleOpenPdf = async (item: BatchContentItem) => {
    try {
      const existing = downloads[item.id];
      if (existing) {
        // Open local offline copy
        router.push({
          pathname: '/(app)/pdf-viewer' as any,
          params: {
            contentId: item.id,
            localUri: existing.localPath,
            title: item.title,
            isBatch: '1',
            batchId: id,
          },
        });
        return;
      }

      // Fetch 15-minute presigned URL from backend (enforces active enrollment)
      const presignedUrl = await getContentFilePresignedUrl(item.id);

      router.push({
        pathname: '/(app)/pdf-viewer' as any,
        params: {
          contentId: item.id,
          remoteUrl: presignedUrl,
          title: item.title,
          isBatch: '1',
          batchId: id,
        },
      });
    } catch (err: any) {
      const msg = err?.message || 'Could not load PDF. Please make sure you are actively enrolled in this batch.';
      Alert.alert('Unable to Open PDF', msg);
    }
  };

  // Handler for downloading a PDF note offline
  const handleDownloadPdf = async (item: BatchContentItem) => {
    if (downloads[item.id]) {
      // Already downloaded, simply open it
      handleOpenPdf(item);
      return;
    }

    if (downloadingIds[item.id]) {
      return;
    }

    try {
      setDownloadingIds((prev) => ({ ...prev, [item.id]: true }));

      // 1. Get presigned URL
      const presignedUrl = await getContentFilePresignedUrl(item.id);

      // 2. Download and save to app private directory & SQLite
      const saved = await downloadAndSavePdf({
        id: item.id,
        batchId: id || '',
        batchTitle: currentBatchTitle,
        subjectName: currentSubjectName,
        chapterId: chapterId || '',
        chapterTitle,
        section: item.section || undefined,
        title: item.title,
        downloadUrl: presignedUrl,
        pageCount: item.pageCount || undefined,
      });

      setDownloads((prev) => ({ ...prev, [saved.id]: saved }));
    } catch (err: any) {
      Alert.alert('Download Failed', err?.message || 'Failed to download PDF for offline reading.');
    } finally {
      setDownloadingIds((prev) => ({ ...prev, [item.id]: false }));
    }
  };

  return (
    <Screen
      scrollable={false}
      header={
        <AppHeader
          title={chapterTitle}
          subtitle={chapterData ? `${currentSubjectName}` : undefined}
          showBack
        />
      }
    >
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              refetch();
              loadOfflineState();
            }}
            tintColor="#2563EB"
            colors={['#2563EB']}
          />
        }
      >
        {/* Chapter Header Card */}
        {isLoading && !chapterData ? (
          <View className="space-y-3 mb-4">
            <Skeleton width="100%" height={90} borderRadius={16} />
            <Skeleton width="100%" height={44} borderRadius={12} />
          </View>
        ) : (
          <View className="bg-surface rounded-3xl p-5 border border-border mb-4 shadow-xs space-y-2">
            <View className="flex-row items-center space-x-2">
              <Badge
                label="Chapter"
                variant="primary"
                size="sm"
              />
              <Badge
                label={currentSubjectName}
                variant="neutral"
                size="sm"
              />
            </View>

            <Text className="text-h2 font-black text-ink leading-tight">
              {chapterTitle}
            </Text>

            <Text className="text-caption text-ink-muted">
              {lectures.length} {lectures.length === 1 ? 'Lecture' : 'Lectures'} · {notes.length} {notes.length === 1 ? 'Study Note' : 'Study Notes'}
            </Text>
          </View>
        )}

        {/* Tab Switcher: Lectures and Notes */}
        <View className="mb-4">
          <SegmentedControl
            options={[`Lectures (${lectures.length})`, `Notes (${notes.length})`]}
            selectedIndex={activeTabIdx}
            onChange={(idx) => setActiveTabIdx(idx)}
          />
        </View>

        {/* Tab 0: Lectures */}
        {activeTabIdx === 0 && (
          <View className="space-y-3">
            {lectures.length === 0 ? (
              <View className="p-8 rounded-2xl bg-surface border border-border items-center justify-center space-y-2">
                <PlayCircle size={36} color="#9CA3AF" />
                <Text className="text-body font-bold text-ink text-center">
                  No Lectures Published Yet
                </Text>
                <Text className="text-caption text-ink-muted text-center max-w-[260px]">
                  Video lectures for this chapter will appear here once published by faculty.
                </Text>
              </View>
            ) : (
              <View className="bg-surface rounded-2xl border border-border overflow-hidden divide-y divide-border/60 shadow-xs">
                {lectures.map((lec) => {
                  const thumb = lec.youtubeVideoId
                    ? `https://img.youtube.com/vi/${lec.youtubeVideoId}/hqdefault.jpg`
                    : undefined;

                  return (
                    <LectureRow
                      key={lec.id}
                      title={lec.title}
                      duration={lec.publishedAtFormatted || 'Video'}
                      thumbnailUrl={thumb}
                      watched={lec.isWatched || lec.isCompleted}
                      progressPercentage={lec.isWatched || lec.isCompleted ? 100 : 0}
                      isNew={lec.isNew}
                      chapterOrSubject={lec.section || currentSubjectName}
                      onPress={() => {
                        router.push({
                          pathname: `/(app)/lecture/${lec.id}` as any,
                          params: {
                            batchId: id,
                            youtubeId: lec.youtubeVideoId || undefined,
                          },
                        });
                      }}
                    />
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* Tab 1: Notes (grouped by Section) */}
        {activeTabIdx === 1 && (
          <View className="space-y-5">
            {sections.length === 0 || notes.length === 0 ? (
              <View className="p-8 rounded-2xl bg-surface border border-border items-center justify-center space-y-2">
                <FileText size={36} color="#9CA3AF" />
                <Text className="text-body font-bold text-ink text-center">
                  No Notes Published Yet
                </Text>
                <Text className="text-caption text-ink-muted text-center max-w-[260px]">
                  Notes, exercises, and formula sheets for this chapter will appear here.
                </Text>
              </View>
            ) : (
              sections.map((secGroup) => {
                if (secGroup.items.length === 0) return null;

                return (
                  <View key={secGroup.section} className="space-y-2">
                    {/* Section Header */}
                    <View className="flex-row items-center justify-between px-1">
                      <Text className="text-h3 font-bold text-ink">
                        {secGroup.section}
                      </Text>
                      <Badge
                        label={`${secGroup.items.length}`}
                        variant="neutral"
                        size="sm"
                      />
                    </View>

                    {/* Section Notes Rows */}
                    <View className="bg-surface rounded-2xl border border-border overflow-hidden divide-y divide-border/60 shadow-xs">
                      {secGroup.items.map((note) => {
                        const isDownloaded = Boolean(downloads[note.id]);
                        const isDownloading = Boolean(downloadingIds[note.id]);

                        let downloadState: PdfDownloadState = 'idle';
                        if (isDownloading) downloadState = 'downloading';
                        else if (isDownloaded) downloadState = 'downloaded';

                        return (
                          <PdfRow
                            key={note.id}
                            title={note.title}
                            size={note.sizeFormatted || 'PDF'}
                            downloadState={downloadState}
                            isNew={note.isNew}
                            onPress={() => handleOpenPdf(note)}
                            onDownloadPress={() => handleDownloadPdf(note)}
                          />
                        );
                      })}
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
