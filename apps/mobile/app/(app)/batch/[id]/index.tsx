import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import {
  GraduationCap,
  Users,
  ChevronLeft,
  Share2,
  Clock,
  CheckCircle2,
  Lock,
  RotateCcw,
  MessageCircle,
  AlertCircle,
  PlayCircle,
  FileText,
  Award,
} from 'lucide-react-native';
import { Screen } from '../../../../src/components/ui/Screen';
import { AppHeader } from '../../../../src/components/ui/AppHeader';
import { Badge } from '../../../../src/components/ui/Badge';
import { SegmentedControl } from '../../../../src/components/ui/SegmentedControl';
import { Skeleton } from '../../../../src/components/ui/Skeleton';
import { useBatchDetail, useMe } from '../../../../src/api/hooks';
import { BatchTodaySection } from '../../../../src/components/batches/BatchTodaySection';
import { BatchContentSection } from '../../../../src/components/batches/BatchContentSection';
import { BatchTestsSection } from '../../../../src/components/batches/BatchTestsSection';
import { BatchMoreSection } from '../../../../src/components/batches/BatchMoreSection';
import { JoinBatchModal } from '../../../../src/components/batches/JoinBatchModal';
import { getFacultyAvatarSource } from '../../../../src/lib/facultyImages';

const SECTIONS = ['Today', 'Content', 'Tests', 'More'];

export default function BatchScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [selectedSectionIndex, setSelectedSectionIndex] = useState(0);
  const [showJoinModal, setShowJoinModal] = useState(false);

  const { data: me } = useMe();
  const isStaff = me?.role === 'admin' || me?.role === 'teacher';

  const {
    data: batch,
    isLoading,
    refetch,
    isRefetching,
  } = useBatchDetail(id || '');

  const enrollmentStatus = batch?.enrollment?.status;
  const isEnrolled = isStaff || enrollmentStatus === 'enrolled' || enrollmentStatus === 'active';
  const isPending = !isEnrolled && enrollmentStatus === 'pending';
  const isRejected = !isEnrolled && enrollmentStatus === 'rejected';

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
        contentContainerStyle={{ padding: 16, paddingBottom: 64 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              void refetch();
            }}
            tintColor="#2563EB"
            colors={['#2563EB']}
          />
        }
      >
        {/* Header Card: Title, Class/Board, Teacher Avatars & Dynamic Approval Badge */}
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

            {/* Teacher Avatars Row & Enrollment Status */}
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

              {/* Dynamic Badge reflecting Enrolled / Approval Pending / Rejected */}
              {isEnrolled ? (
                <Badge label="ENROLLED" variant="success" size="sm" />
              ) : isPending ? (
                <Badge label="WAITING FOR APPROVAL" variant="warning" size="sm" />
              ) : isRejected ? (
                <Badge label="REQUEST DECLINED" variant="danger" size="sm" />
              ) : (
                <Badge label="NOT ENROLLED" variant="neutral" size="sm" />
              )}
            </View>
          </View>
        )}

        {/* ----------------- STATE 1: ENROLLED (FULL CONTENT UNLOCKED) ----------------- */}
        {isEnrolled && (
          <>
            {/* Four Clear Sections Controlled by SegmentedControl */}
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
          </>
        )}

        {/* ----------------- STATE 2: PENDING APPROVAL (LOCKED CONTENT) ----------------- */}
        {isPending && (
          <View style={{ gap: 14 }}>
            {/* Status Card */}
            <View
              style={{
                backgroundColor: '#FFFDF5',
                borderRadius: 20,
                borderWidth: 1.5,
                borderColor: '#FDE68A',
                padding: 18,
                shadowColor: '#D97706',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 6,
                elevation: 2,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: '#FEF3C7',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Clock size={20} color="#D97706" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: '#92400E' }}>
                    Join Request Under Review
                  </Text>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#B45309', marginTop: 1 }}>
                    Waiting for tutor / admin approval
                  </Text>
                </View>
              </View>

              <Text style={{ fontSize: 13, color: '#78350F', lineHeight: 20, marginBottom: 14 }}>
                Your request to join <Text style={{ fontWeight: '700' }}>{batch?.title}</Text> has been submitted to Dinesh Sir and institute administration. Once approved, all batch lectures, chapter notes, DPPs, and tests will unlock automatically.
              </Text>

              {/* Progress Steps */}
              <View
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 14,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: '#FEF3C7',
                  gap: 10,
                  marginBottom: 14,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <CheckCircle2 size={16} color="#16A34A" />
                  <Text style={{ fontSize: 12.5, fontWeight: '700', color: '#166534', flex: 1 }}>
                    Join Request Submitted
                  </Text>
                  <Text style={{ fontSize: 11, color: '#16A34A', fontWeight: '700' }}>Done</Text>
                </View>
                <View style={{ height: 1, backgroundColor: '#F1F5F9' }} />
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Clock size={16} color="#D97706" />
                  <Text style={{ fontSize: 12.5, fontWeight: '700', color: '#92400E', flex: 1 }}>
                    Admin Review & Approval
                  </Text>
                  <Text style={{ fontSize: 11, color: '#D97706', fontWeight: '800' }}>In Progress</Text>
                </View>
                <View style={{ height: 1, backgroundColor: '#F1F5F9' }} />
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Lock size={16} color="#94A3B8" />
                  <Text style={{ fontSize: 12.5, fontWeight: '600', color: '#64748B', flex: 1 }}>
                    All Batch Materials Unlock
                  </Text>
                  <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '600' }}>Locked</Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    void refetch();
                  }}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#FEF3C7',
                    borderWidth: 1,
                    borderColor: '#FCD34D',
                    borderRadius: 12,
                    paddingVertical: 10,
                    gap: 6,
                  }}
                >
                  <RotateCcw size={14} color="#92400E" />
                  <Text style={{ fontSize: 12.5, fontWeight: '800', color: '#92400E' }}>
                    Check Status
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    const msg = `Hello Dinesh Sir, I have submitted a join request for "${batch?.title || 'Batch'}" (Code: ${batch?.joinCode || '—'}). Please approve my enrollment.`;
                    void Linking.openURL(`https://wa.me/919412278910?text=${encodeURIComponent(msg)}`);
                  }}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#25D366',
                    borderRadius: 12,
                    paddingVertical: 10,
                    gap: 6,
                  }}
                >
                  <MessageCircle size={14} color="#FFFFFF" />
                  <Text style={{ fontSize: 12.5, fontWeight: '800', color: '#FFFFFF' }}>
                    WhatsApp Admin
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Locked Content Preview Section */}
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 20,
                borderWidth: 1,
                borderColor: '#E2E8F0',
                padding: 16,
                gap: 12,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Batch Contents
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Lock size={12} color="#64748B" />
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B' }}>Unlocks on Approval</Text>
                </View>
              </View>

              <View style={{ gap: 8 }}>
                {[
                  {
                    icon: PlayCircle,
                    title: 'Interactive Video Lectures',
                    desc: 'Full syllabus chapters recorded and taught by Dinesh Sir',
                  },
                  {
                    icon: FileText,
                    title: 'Chapter Notes & Daily DPPs',
                    desc: 'Formula sheets, handwritten notes, and homework questions',
                  },
                  {
                    icon: Award,
                    title: 'Chapter Tests & Mock Series',
                    desc: 'Exam-pattern tests with detailed solutions & analysis',
                  },
                  {
                    icon: Users,
                    title: 'Batch Discussion & Timetable',
                    desc: 'Class schedules, live room links, and faculty announcements',
                  },
                ].map((item, idx) => (
                  <View
                    key={idx}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: '#F8FAFC',
                      borderRadius: 12,
                      padding: 12,
                      borderWidth: 1,
                      borderColor: '#F1F5F9',
                      gap: 12,
                    }}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: '#EFF6FF',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <item.icon size={18} color="#2563EB" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E293B' }}>
                        {item.title}
                      </Text>
                      <Text style={{ fontSize: 11.5, color: '#64748B', marginTop: 1 }}>
                        {item.desc}
                      </Text>
                    </View>
                    <Lock size={15} color="#94A3B8" />
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ----------------- STATE 3: REQUEST DECLINED ----------------- */}
        {isRejected && (
          <View
            style={{
              backgroundColor: '#FEF2F2',
              borderRadius: 20,
              borderWidth: 1.5,
              borderColor: '#FECACA',
              padding: 18,
              gap: 12,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: '#FEE2E2',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AlertCircle size={20} color="#DC2626" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#991B1B' }}>
                  Request Not Approved
                </Text>
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#B91C1C' }}>
                  Admission declined by administrator
                </Text>
              </View>
            </View>
            <Text style={{ fontSize: 13, color: '#7F1D1D', lineHeight: 20 }}>
              Your join request for this batch could not be accepted. Please contact Quick2Learn administration if you need assistance with admission.
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setShowJoinModal(true)}
                style={{
                  flex: 1,
                  backgroundColor: '#DC2626',
                  borderRadius: 12,
                  paddingVertical: 10,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 12.5, fontWeight: '800', color: '#FFFFFF' }}>
                  Try Another Code
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  void Linking.openURL('https://wa.me/919412278910?text=Hello%20Dinesh%20Sir,%20my%20batch%20request%20was%20declined.%20Please%20help.');
                }}
                style={{
                  flex: 1,
                  backgroundColor: '#25D366',
                  borderRadius: 12,
                  paddingVertical: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <MessageCircle size={14} color="#FFFFFF" />
                <Text style={{ fontSize: 12.5, fontWeight: '800', color: '#FFFFFF' }}>
                  WhatsApp Help
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ----------------- STATE 4: NOT ENROLLED (EXPLORE / PREVIEW) ----------------- */}
        {!isEnrolled && !isPending && !isRejected && (
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 20,
              borderWidth: 1,
              borderColor: '#E2E8F0',
              padding: 18,
              gap: 14,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: '#EFF6FF',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <GraduationCap size={20} color="#2563EB" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F172A' }}>
                  Join This Batch
                </Text>
                <Text style={{ fontSize: 12, color: '#64748B' }}>
                  Class {batch?.classLevel} • {batch?.board?.toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={{ fontSize: 13, color: '#475569', lineHeight: 20 }}>
              To view lecture recordings, chapter notes, DPPs, and take online tests, send a join request with your 6-character batch code.
            </Text>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setShowJoinModal(true)}
              style={{
                backgroundColor: '#2563EB',
                borderRadius: 12,
                paddingVertical: 12,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#FFFFFF' }}>
                Request to Join Batch
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Join Batch Modal */}
      <JoinBatchModal
        visible={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        initialCode={batch?.joinCode || ''}
      />
    </Screen>
  );
}
