import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Share,
  Linking,
  ActivityIndicator,
  BackHandler,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import YoutubePlayer, { YoutubeIframeRef } from 'react-native-youtube-iframe';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as ScreenOrientation from 'expo-screen-orientation';
import { Image } from 'expo-image';
import { getFacultyAvatarSource } from '../../../src/lib/facultyImages';
import {
  Play,
  Share2,
  HelpCircle,
  MessageCircle,
  Clock,
  Calendar,
  BookOpen,
  ChevronRight,
  FileText,
  Sparkles,
  Award,
  CheckCircle2,
} from 'lucide-react-native';
import { Screen } from '../../../src/components/ui/Screen';
import { AppHeader } from '../../../src/components/ui/AppHeader';
import { Button } from '../../../src/components/ui/Button';
import { Badge } from '../../../src/components/ui/Badge';
import { PdfRow } from '../../../src/components/composite/PdfRow';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { useLectureDetail, useSaveProgress } from '../../../src/api/hooks';
import { analytics } from '../../../src/lib/analytics';
import { saveProgressLocally } from '../../../src/lib/offline-progress';
import type { LectureTimestamp } from '@quick2learn/shared';

const { width: WINDOW_WIDTH } = Dimensions.get('window');

export default function LecturePlayerScreen() {
  const { id, t } = useLocalSearchParams<{ id: string; t?: string }>();
  const router = useRouter();
  const playerRef = useRef<YoutubeIframeRef>(null);

  const { data: lecture, isLoading, isError, refetch } = useLectureDetail(id || '');
  const saveProgressMutation = useSaveProgress();

  const [isPlaying, setIsPlaying] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [currentTimeSec, setCurrentTimeSec] = useState(0);

  const hasTrackedPlayRef = useRef(false);
  const hasTrackedCompleteRef = useRef(false);

  // Track lecture_played on initial lecture load
  useEffect(() => {
    if (lecture?.id && !hasTrackedPlayRef.current) {
      hasTrackedPlayRef.current = true;
      analytics.track('lecture_played', {
        lectureId: lecture.id,
        lectureTitle: lecture.title,
        chapterTitle: lecture.chapterTitle || undefined,
        durationSeconds: lecture.durationSeconds,
      });
    }
  }, [lecture?.id, lecture?.title, lecture?.chapterTitle, lecture?.durationSeconds]);

  // Keep screen awake while playing
  useEffect(() => {
    if (isPlaying) {
      activateKeepAwakeAsync().catch(() => {});
    } else {
      deactivateKeepAwake();
    }
    return () => {
      deactivateKeepAwake();
    };
  }, [isPlaying]);

  // Handle Fullscreen & Screen Orientation rotation
  const handleFullScreenChange = useCallback(async (fullscreen: boolean) => {
    setIsFullScreen(fullscreen);
    try {
      if (fullscreen) {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      } else {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      }
    } catch (err) {
      console.warn('Orientation lock error:', err);
    }
  }, []);

  // Sync progress every 10 seconds while playing & check for lecture_completed
  useEffect(() => {
    if (!lecture?.id) return;

    const interval = setInterval(async () => {
      if (playerRef.current && isPlaying) {
        try {
          const time = await playerRef.current.getCurrentTime();
          if (time && time > 0) {
            const sec = Math.floor(time);
            setCurrentTimeSec(sec);

            // Always save progress locally first (works offline)
            saveProgressLocally({
              itemId: lecture.id,
              itemType: 'youtube_video',
              positionSeconds: sec,
              durationSeconds: lecture.durationSeconds,
            });

            // Attempt server sync
            saveProgressMutation.mutate({
              updates: [
                {
                  itemId: lecture.id,
                  itemType: 'youtube_video',
                  positionSeconds: sec,
                  durationSeconds: lecture.durationSeconds,
                },
              ],
            });

            // Check completion threshold (90%)
            if (
              lecture.durationSeconds > 0 &&
              sec >= lecture.durationSeconds * 0.9 &&
              !hasTrackedCompleteRef.current
            ) {
              hasTrackedCompleteRef.current = true;
              analytics.track('lecture_completed', {
                lectureId: lecture.id,
                lectureTitle: lecture.title,
                watchTimeSeconds: sec,
                percentWatched: Math.round((sec / lecture.durationSeconds) * 100),
              });
            }
          }
        } catch {
          // Ignore polling errors
        }
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [lecture?.id, lecture?.durationSeconds, isPlaying, saveProgressMutation]);

  // Flush progress on unmount / leaving
  useEffect(() => {
    return () => {
      if (lecture?.id && currentTimeSec > 0) {
        saveProgressMutation.mutate({
          updates: [
            {
              itemId: lecture.id,
              itemType: 'youtube_video',
              positionSeconds: currentTimeSec,
              durationSeconds: lecture.durationSeconds,
            },
          ],
        });
      }
      // Reset portrait orientation
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
    };
  }, [lecture?.id, lecture?.durationSeconds, currentTimeSec, saveProgressMutation]);

  const handleSeek = (seconds: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(seconds, true);
      setIsPlaying(true);
    }
  };

  const handleShare = async () => {
    if (!lecture) return;
    try {
      await Share.share({
        title: lecture.title,
        message: `Watch "${lecture.title}" by Dinesh Singh Rajput on Quick2Learn: ${lecture.shareUrl}`,
      });
    } catch (err) {
      console.warn('Share error:', err);
    }
  };

  const handleOpenChat = () => {
    router.push('/(app)/(tabs)/chats');
  };

  if (isLoading && !lecture) {
    return (
      <Screen scrollable={false} header={<AppHeader title="Lecture" showBack />}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      </Screen>
    );
  }

  if (!lecture) {
    return (
      <Screen scrollable={false} header={<AppHeader title="Lecture" showBack />}>
        <View className="flex-1 justify-center p-6">
          <EmptyState
            title="Lecture not found"
            description="The video lecture could not be loaded."
            actionLabel="Go Back"
            onAction={() => router.back()}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      scrollable={!isFullScreen}
      onRefresh={async () => {
        await refetch();
      }}
      header={
        isFullScreen ? undefined : (
          <AppHeader
            title={lecture.title}
            subtitle={lecture.chapterTitle || lecture.subjectName || undefined}
            showBack
            rightActions={
              <TouchableOpacity
                onPress={handleShare}
                className="w-12 h-12 -mr-2 items-center justify-center rounded-full active:bg-surface-subtle"
                accessibilityLabel="Share lecture"
              >
                <Share2 size={20} color="#1F2937" />
              </TouchableOpacity>
            }
          />
        )
      }
    >
      {/* 1. YouTube Embedded Player (Terms compliant: no background play, no ad blocking) */}
      <View className="w-full bg-black relative">
        <YoutubePlayer
          ref={playerRef}
          height={isFullScreen ? Dimensions.get('window').height : (WINDOW_WIDTH * 9) / 16}
          width={isFullScreen ? Dimensions.get('window').width : WINDOW_WIDTH}
          play={isPlaying}
          videoId={lecture.id}
          initialPlayerParams={{
            startInSeconds: t
              ? parseInt(t, 10)
              : lecture.positionSeconds > 0
              ? lecture.positionSeconds
              : undefined,
            preventFullScreen: false,
          }}
          onChangeState={(state: string) => {
            if (state === 'playing') {
              setIsPlaying(true);
            } else if (state === 'paused' || state === 'ended') {
              setIsPlaying(false);
            }
          }}
          onFullScreenChange={handleFullScreenChange}
        />
      </View>

      {!isFullScreen && (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 50 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Metadata Under Player: title, chapter, date, share, ask doubt */}
          <View className="bg-surface rounded-2xl p-4 border border-border mb-5 shadow-xs">
            <View className="flex-row items-center space-x-2 mb-2">
              {lecture.classLevel ? (
                <Badge label={`Class ${lecture.classLevel}`} variant="neutral" size="sm" />
              ) : null}
              {lecture.subjectName ? (
                <Badge label={lecture.subjectName} variant="primary" size="sm" />
              ) : null}
              {lecture.isCompleted ? (
                <Badge label="Completed" variant="success" size="sm" />
              ) : null}
            </View>

            <Text className="text-h2 font-bold text-ink mb-1.5 leading-snug">
              {lecture.title}
            </Text>

            <View className="flex-row items-center space-x-3 text-ink-muted mb-4">
              <View className="flex-row items-center mr-3">
                <Clock size={13} color="#6B7280" />
                <Text className="text-caption text-ink-muted ml-1">
                  {lecture.durationFormatted}
                </Text>
              </View>

              {lecture.facultyName ? (
                <View className="flex-row items-center">
                  {getFacultyAvatarSource(lecture.facultyName) ? (
                    <Image
                      source={getFacultyAvatarSource(lecture.facultyName)!}
                      style={{ width: 16, height: 16, borderRadius: 8, marginRight: 5 }}
                      contentFit="cover"
                    />
                  ) : null}
                  <Text className="text-caption text-ink-muted">
                    Faculty: {lecture.facultyName}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Quick Actions: Discuss in Chat & Share */}
            <View className="flex-row space-x-3 pt-1 border-t border-border/70">
              <View className="flex-1 mr-2">
                <Button
                  variant="outline"
                  size="sm"
                  onPress={handleOpenChat}
                  icon={<MessageCircle size={15} color="#2563EB" />}
                >
                  Discuss in Chat
                </Button>
              </View>
              <View className="flex-1 ml-2">
                <Button
                  variant="outline"
                  size="sm"
                  onPress={handleShare}
                  icon={<Share2 size={15} color="#2563EB" />}
                >
                  Share
                </Button>
              </View>
            </View>
          </View>

          {/* Interactive Timestamps / Milestones */}
          {lecture.timestamps.length > 0 ? (
            <View className="bg-surface rounded-2xl p-4 border border-border mb-5 shadow-xs">
              <View className="flex-row items-center mb-3">
                <Sparkles size={16} color="#2563EB" />
                <Text className="text-h3 font-bold text-ink ml-1.5">
                  Milestones & Timestamps
                </Text>
              </View>

              <View className="space-y-2">
                {lecture.timestamps.map((ts: LectureTimestamp, idx: number) => (
                  <TouchableOpacity
                    key={idx}
                    activeOpacity={0.75}
                    onPress={() => handleSeek(ts.seconds)}
                    className="flex-row items-center justify-between p-2.5 rounded-xl bg-surface-subtle active:bg-primary-soft/50 border border-border/60 mb-1.5"
                  >
                    <Text className="text-body font-semibold text-ink flex-1 mr-2" numberOfLines={1}>
                      {ts.label}
                    </Text>
                    <View className="bg-primary/10 px-2 py-0.5 rounded">
                      <Text className="text-caption font-mono font-bold text-primary">
                        {ts.timeStr}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : null}

          {/* Up Next (From the same chapter) */}
          {lecture.upNext.length > 0 ? (
            <View className="mb-5">
              <Text className="text-h3 font-bold text-ink mb-3">
                Up Next in This Chapter
              </Text>

              <View className="bg-surface rounded-2xl border border-border overflow-hidden divide-y divide-border/60 shadow-xs">
                {lecture.upNext.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.8}
                    onPress={() => router.push(item.route as any)}
                    className="p-3.5 flex-row items-center justify-between active:bg-surface-subtle"
                  >
                    <View className="flex-1 mr-3">
                      <Text className="text-body font-semibold text-ink leading-snug mb-1" numberOfLines={2}>
                        {item.title}
                      </Text>
                      <Text className="text-caption text-ink-muted">
                        {item.durationFormatted}
                      </Text>
                    </View>
                    <ChevronRight size={18} color="#9CA3AF" />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : null}

          {/* Chapter Notes */}
          {lecture.notes.length > 0 ? (
            <View className="mb-4">
              <Text className="text-h3 font-bold text-ink mb-3">
                Chapter Notes & PDFs
              </Text>

              <View className="bg-surface rounded-2xl border border-border overflow-hidden divide-y divide-border/60 shadow-xs">
                {lecture.notes.map((note) => (
                  <PdfRow
                    key={note.id}
                    title={note.title}
                    size={note.fileSize || 'PDF Document'}
                    onPress={() => Linking.openURL(note.fileUrl).catch(() => {})}
                  />
                ))}
              </View>
            </View>
          ) : null}
        </ScrollView>
      )}
    </Screen>
  );
}
