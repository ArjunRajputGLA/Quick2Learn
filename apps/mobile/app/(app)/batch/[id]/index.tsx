import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import {
  GraduationCap,
  Users,
  ChevronLeft,
  Share2,
} from 'lucide-react-native';
import { Screen } from '../../../../src/components/ui/Screen';
import { AppHeader } from '../../../../src/components/ui/AppHeader';
import { Badge } from '../../../../src/components/ui/Badge';
import { SegmentedControl } from '../../../../src/components/ui/SegmentedControl';
import { Skeleton } from '../../../../src/components/ui/Skeleton';
import { useBatchDetail } from '../../../../src/api/hooks';
import { BatchTodaySection } from '../../../../src/components/batches/BatchTodaySection';
import { BatchContentSection } from '../../../../src/components/batches/BatchContentSection';
import { BatchTestsSection } from '../../../../src/components/batches/BatchTestsSection';
import { BatchMoreSection } from '../../../../src/components/batches/BatchMoreSection';
import { getFacultyAvatarSource } from '../../../../src/lib/facultyImages';

const SECTIONS = ['Today', 'Content', 'Tests', 'More'];

export default function BatchScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [selectedSectionIndex, setSelectedSectionIndex] = useState(0);

  const {
    data: batch,
    isLoading,
    refetch,
    isRefetching,
  } = useBatchDetail(id || '');

  return (
    <Screen
      scrollable={false}
      header={
        <AppHeader
          title={batch?.title || 'Batch'}
          showBack
          rightActions={
            <View className="flex-row items-center space-x-1">
              <Badge
                label={batch?.mode ? batch.mode.toUpperCase() : 'OFFLINE'}
                variant={batch?.mode === 'online' ? 'primary' : 'neutral'}
                size="sm"
              />
            </View>
          }
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
            }}
            tintColor="#2563EB"
            colors={['#2563EB']}
          />
        }
      >
        {/* Header Card: Title, Class/Board, Teacher Avatars */}
        {isLoading && !batch ? (
          <View className="space-y-3 mb-4">
            <Skeleton width="100%" height={100} borderRadius={16} />
            <Skeleton width="100%" height={48} borderRadius={12} />
          </View>
        ) : (
          <View className="bg-surface rounded-3xl p-5 border border-border mb-4 shadow-xs space-y-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center space-x-1.5">
                <Badge
                  label={`Class ${batch?.classLevel || 12}`}
                  variant="neutral"
                  size="sm"
                />
                <Badge
                  label={(batch?.board || 'cbse').toUpperCase()}
                  variant="neutral"
                  size="sm"
                />
                {batch?.academicYear && (
                  <Badge
                    label={batch.academicYear}
                    variant="neutral"
                    size="sm"
                  />
                )}
              </View>

              <Badge
                label={`CODE: ${batch?.joinCode || '—'}`}
                variant="neutral"
                size="sm"
              />
            </View>

            <View>
              <Text className="text-h2 font-black text-ink leading-tight">
                {batch?.title}
              </Text>
              {batch?.subtitle && (
                <Text className="text-caption text-ink-muted mt-0.5">
                  {batch.subtitle}
                </Text>
              )}
            </View>

            {/* Teacher Avatars Row */}
            <View className="flex-row items-center justify-between pt-2 border-t border-border/50">
              <View className="flex-row items-center space-x-2">
                {(() => {
                  const effectiveTeachers =
                    batch?.teachers && batch.teachers.length > 0
                      ? batch.teachers
                      : [{ id: 'faculty-dinesh', name: 'Dinesh Singh Rajput', role: 'Founder & Senior Faculty', avatarUrl: undefined }];

                  return (
                    <>
                      <View className="flex-row -space-x-2">
                        {effectiveTeachers.map((t, idx) => (
                          <View
                            key={t.id || idx}
                            className="border-2 border-surface rounded-full overflow-hidden"
                          >
                            {getFacultyAvatarSource(t.name) || t.avatarUrl ? (
                              <Image
                                source={getFacultyAvatarSource(t.name) || { uri: t.avatarUrl! }}
                                style={{ width: 32, height: 32, borderRadius: 16 }}
                                contentFit="cover"
                              />
                            ) : (
                              <View className="w-8 h-8 rounded-full bg-primary-soft items-center justify-center">
                                <Text className="text-caption font-bold text-primary">
                                  {t.name.slice(0, 1)}
                                </Text>
                              </View>
                            )}
                          </View>
                        ))}
                      </View>

                      <View>
                        <Text className="text-caption font-bold text-ink">
                          {effectiveTeachers.map((t) => t.name).join(', ')}
                        </Text>
                        <Text className="text-[11px] text-ink-muted">
                          {effectiveTeachers[0]?.role || 'Senior Faculty'}
                        </Text>
                      </View>
                    </>
                  );
                })()}
              </View>

              {batch?.enrollment && (
                <Badge label="ENROLLED" variant="success" size="sm" />
              )}
            </View>
          </View>
        )}

        {/* Four Clear Sections Controlled by SegmentedControl (Never Sideways Scrolling) */}
        <View className="mb-4">
          <SegmentedControl
            options={SECTIONS}
            selectedIndex={selectedSectionIndex}
            onChange={(idx) => setSelectedSectionIndex(idx)}
          />
        </View>

        {/* Section 0: Today */}
        {selectedSectionIndex === 0 && (
          <BatchTodaySection
            batchId={id || ''}
            batchDetail={batch}
            isLoadingDetail={isLoading}
          />
        )}

        {/* Section 1: Content (Subjects -> Chapters) */}
        {selectedSectionIndex === 1 && (
          <BatchContentSection
            batchId={id || ''}
            batchDetail={batch}
            isLoading={isLoading}
          />
        )}

        {/* Section 2: Tests */}
        {selectedSectionIndex === 2 && (
          <BatchTestsSection
            batchDetail={batch}
            isLoading={isLoading}
          />
        )}

        {/* Section 3: More (Timetable, Attendance, Batch info, WhatsApp, Report) */}
        {selectedSectionIndex === 3 && (
          <BatchMoreSection
            batchId={id || ''}
            batchDetail={batch}
            isLoadingDetail={isLoading}
          />
        )}
      </ScrollView>
    </Screen>
  );
}
