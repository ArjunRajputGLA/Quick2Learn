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
import {
  getFacultyAvatarSource,
  getFacultyDetails,
  isNamitaFaculty,
} from '../../../../src/lib/facultyImages';

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

  // Dynamic mentor details (resolves Namita Ma'am for Science/Biology or Dinesh Sir for Maths)
  const mentorDetails = getFacultyDetails(
    batch?.title || batch?.subtitle || (batch?.teachers && batch.teachers[0]?.name)
  );

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
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 24,
              padding: 18,
              borderWidth: 1,
              borderColor: '#E2E8F0',
              marginBottom: 16,
              shadowColor: '#0F172A',
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.05,
              shadowRadius: 10,
              elevation: 2,
              gap: 12,
            }}
          >
            {/* Top Badges Row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <View
                  style={{
                    backgroundColor: '#EFF6FF',
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: '#BFDBFE',
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#1D4ED8' }}>
                    Class {batch?.classLevel || 12}
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: '#F8FAFC',
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569' }}>
                    {(batch?.board || 'cbse').toUpperCase()}
                  </Text>
                </View>
                {batch?.academicYear && (
                  <View
                    style={{
                      backgroundColor: '#F8FAFC',
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: '#E2E8F0',
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '600', color: '#64748B' }}>
                      {batch.academicYear}
                    </Text>
                  </View>
                )}
              </View>

              <View
                style={{
                  backgroundColor: '#F1F5F9',
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 8,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569' }}>
                  CODE: {batch?.joinCode || '—'}
                </Text>
              </View>
            </View>

            {/* Batch Title & Subtitle */}
            <View>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '900',
                  color: '#0F172A',
                  letterSpacing: -0.3,
                  lineHeight: 24,
                }}
              >
                {batch?.title}
              </Text>
              {batch?.subtitle && (
                <Text style={{ fontSize: 12.5, color: '#64748B', marginTop: 3 }}>
                  {batch.subtitle}
                </Text>
              )}
            </View>

            {/* Teacher Row & Enrollment Status */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: 10,
                borderTopWidth: 1,
                borderTopColor: '#F1F5F9',
                gap: 8,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                {(() => {
                  const teacherAvatar = mentorDetails.avatarSource;
                  return (
                    <>
                      <View
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 19,
                          borderWidth: 1.5,
                          borderColor: '#BFDBFE',
                          overflow: 'hidden',
                          backgroundColor: '#EFF6FF',
                        }}
                      >
                        {teacherAvatar ? (
                          <Image
                            source={teacherAvatar}
                            style={{ width: 38, height: 38 }}
                            contentFit="cover"
                          />
                        ) : (
                          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ fontSize: 14, fontWeight: '800', color: '#2563EB' }}>
                              {mentorDetails.name.slice(0, 1)}
                            </Text>
                          </View>
                        )}
                      </View>

                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text
                          style={{ fontSize: 13, fontWeight: '800', color: '#0F172A' }}
                          numberOfLines={1}
                        >
                          {mentorDetails.name}
                        </Text>
                        <Text
                          style={{ fontSize: 11, color: '#64748B', fontWeight: '500' }}
                          numberOfLines={1}
                        >
                          {mentorDetails.role}
                        </Text>
                      </View>
                    </>
                  );
                })()}
              </View>

              {/* Dynamic Badge reflecting Enrolled / Approval Pending / Rejected */}
              {isEnrolled ? (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#ECFDF5',
                    borderColor: '#A7F3D0',
                    borderWidth: 1,
                    paddingHorizontal: 9,
                    paddingVertical: 4.5,
                    borderRadius: 9999,
                    gap: 4,
                    flexShrink: 0,
                  }}
                >
                  <CheckCircle2 size={12} color="#059669" />
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#047857' }}>ENROLLED</Text>
                </View>
              ) : isPending ? (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#FEF3C7',
                    borderColor: '#FCD34D',
                    borderWidth: 1,
                    paddingHorizontal: 9,
                    paddingVertical: 4.5,
                    borderRadius: 9999,
                    gap: 4,
                    flexShrink: 0,
                  }}
                >
                  <Clock size={12} color="#B45309" />
                  <Text style={{ fontSize: 10.5, fontWeight: '800', color: '#B45309' }}>
                    UNDER REVIEW
                  </Text>
                </View>
              ) : isRejected ? (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#FEF2F2',
                    borderColor: '#FECACA',
                    borderWidth: 1,
                    paddingHorizontal: 9,
                    paddingVertical: 4.5,
                    borderRadius: 9999,
                    gap: 4,
                    flexShrink: 0,
                  }}
                >
                  <AlertCircle size={12} color="#DC2626" />
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#DC2626' }}>
                    DECLINED
                  </Text>
                </View>
              ) : (
                <View
                  style={{
                    backgroundColor: '#F1F5F9',
                    paddingHorizontal: 9,
                    paddingVertical: 4.5,
                    borderRadius: 9999,
                    flexShrink: 0,
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B' }}>
                    NOT ENROLLED
                  </Text>
                </View>
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
                borderRadius: 24,
                borderWidth: 1.5,
                borderColor: '#FDE68A',
                padding: 18,
                shadowColor: '#D97706',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.08,
                shadowRadius: 10,
                elevation: 2,
                gap: 14,
              }}
            >
              {/* Card Header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: '#FEF3C7',
                    borderWidth: 1,
                    borderColor: '#FCD34D',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Clock size={22} color="#D97706" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16.5, fontWeight: '900', color: '#92400E', letterSpacing: -0.2 }}>
                    Join Request Under Review
                  </Text>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#B45309', marginTop: 1 }}>
                    Waiting for tutor / admin approval
                  </Text>
                </View>
              </View>

              <Text style={{ fontSize: 13, color: '#78350F', lineHeight: 20 }}>
                Your request to join <Text style={{ fontWeight: '800' }}>{batch?.title}</Text> has been submitted to {mentorDetails.shortName} and Quick2Learn administration. Once approved, all batch lectures, chapter notes, DPPs, and tests will unlock automatically.
              </Text>

              {/* Connected Stepper Timeline */}
              <View
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 18,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: '#FEF3C7',
                  gap: 12,
                }}
              >
                {/* Step 1 */}
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                  <View style={{ alignItems: 'center', width: 24 }}>
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        backgroundColor: '#DCFCE7',
                        borderWidth: 1.5,
                        borderColor: '#16A34A',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CheckCircle2 size={13} color="#16A34A" />
                    </View>
                    <View style={{ width: 2, height: 26, backgroundColor: '#86EFAC', marginTop: 4 }} />
                  </View>
                  <View style={{ flex: 1, paddingTop: 2 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: '#166534' }}>
                        Join Request Submitted
                      </Text>
                      <View
                        style={{
                          backgroundColor: '#DCFCE7',
                          paddingHorizontal: 7,
                          paddingVertical: 1.5,
                          borderRadius: 6,
                        }}
                      >
                        <Text style={{ fontSize: 10, fontWeight: '800', color: '#15803D' }}>Done</Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 11, color: '#15803D', marginTop: 2 }}>
                      Batch join code ({batch?.joinCode || '—'}) registered
                    </Text>
                  </View>
                </View>

                {/* Step 2 */}
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                  <View style={{ alignItems: 'center', width: 24 }}>
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        backgroundColor: '#FEF3C7',
                        borderWidth: 1.5,
                        borderColor: '#D97706',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Clock size={12} color="#D97706" />
                    </View>
                    <View style={{ width: 2, height: 26, backgroundColor: '#E2E8F0', marginTop: 4 }} />
                  </View>
                  <View style={{ flex: 1, paddingTop: 2 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: '#92400E' }}>
                        Admin & Faculty Review
                      </Text>
                      <View
                        style={{
                          backgroundColor: '#FEF3C7',
                          borderWidth: 1,
                          borderColor: '#FCD34D',
                          paddingHorizontal: 7,
                          paddingVertical: 1.5,
                          borderRadius: 6,
                        }}
                      >
                        <Text style={{ fontSize: 10, fontWeight: '800', color: '#B45309' }}>In Progress</Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 11, color: '#B45309', marginTop: 2 }}>
                      Reviewing admission with {mentorDetails.shortName}
                    </Text>
                  </View>
                </View>

                {/* Step 3 */}
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                  <View style={{ alignItems: 'center', width: 24 }}>
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        backgroundColor: '#F1F5F9',
                        borderWidth: 1.5,
                        borderColor: '#CBD5E1',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Lock size={12} color="#94A3B8" />
                    </View>
                  </View>
                  <View style={{ flex: 1, paddingTop: 2 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#64748B' }}>
                        All Batch Materials Unlock
                      </Text>
                      <View
                        style={{
                          backgroundColor: '#F1F5F9',
                          paddingHorizontal: 7,
                          paddingVertical: 1.5,
                          borderRadius: 6,
                        }}
                      >
                        <Text style={{ fontSize: 10, fontWeight: '700', color: '#64748B' }}>Locked</Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
                      Video lectures, notes, DPPs & test series
                    </Text>
                  </View>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    void refetch().then(() => {
                      Alert.alert(
                        'Status Checked',
                        `Your join request for "${batch?.title || 'Batch'}" is currently under review by Quick2Learn administration. You will be notified as soon as it is approved.`
                      );
                    });
                  }}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#FEF3C7',
                    borderWidth: 1.5,
                    borderColor: '#FCD34D',
                    borderRadius: 14,
                    paddingVertical: 11,
                    gap: 6,
                  }}
                >
                  <RotateCcw size={15} color="#92400E" />
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#92400E' }}>
                    Check Status
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    const msg = `Hello ${mentorDetails.shortName}, I have submitted a join request for "${batch?.title || 'Batch'}" (Code: ${batch?.joinCode || '—'}). Please approve my enrollment.`;
                    void Linking.openURL(`https://wa.me/919412278910?text=${encodeURIComponent(msg)}`);
                  }}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#25D366',
                    borderRadius: 14,
                    paddingVertical: 11,
                    gap: 6,
                    shadowColor: '#25D366',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                >
                  <MessageCircle size={15} color="#FFFFFF" />
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#FFFFFF' }}>
                    WhatsApp Admin
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={{ fontSize: 11, color: '#92400E', textAlign: 'center', marginTop: -2 }}>
                ⚡ Typical approval time: 1–2 hours during coaching hours (10 AM – 8 PM)
              </Text>
            </View>

            {/* Locked Content Preview Section */}
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 22,
                borderWidth: 1,
                borderColor: '#E2E8F0',
                padding: 16,
                gap: 12,
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.03,
                shadowRadius: 4,
                elevation: 1,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 12.5, fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Batch Contents
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    backgroundColor: '#F1F5F9',
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 6,
                  }}
                >
                  <Lock size={11} color="#64748B" />
                  <Text style={{ fontSize: 10.5, fontWeight: '700', color: '#64748B' }}>
                    Unlocks on Approval
                  </Text>
                </View>
              </View>

              <View style={{ gap: 8 }}>
                {[
                  {
                    icon: PlayCircle,
                    color: '#2563EB',
                    bgColor: '#EFF6FF',
                    tag: 'Lectures',
                    title: 'Interactive Video Lectures',
                    desc: `Full syllabus chapters recorded and taught by ${mentorDetails.shortName}`,
                  },
                  {
                    icon: FileText,
                    color: '#059669',
                    bgColor: '#ECFDF5',
                    tag: 'Notes',
                    title: 'Chapter Notes & Daily DPPs',
                    desc: 'Formula sheets, handwritten notes, and homework questions',
                  },
                  {
                    icon: Award,
                    color: '#7C3AED',
                    bgColor: '#F5F3FF',
                    tag: 'Tests',
                    title: 'Chapter Tests & Mock Series',
                    desc: 'Exam-pattern tests with detailed solutions & analysis',
                  },
                  {
                    icon: Users,
                    color: '#D97706',
                    bgColor: '#FFFBEB',
                    tag: 'Schedule',
                    title: 'Batch Timetable & Room Links',
                    desc: `Class schedules, live room links, and notices from ${mentorDetails.shortName}`,
                  },
                ].map((item, idx) => (
                  <View
                    key={idx}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: '#F8FAFC',
                      borderRadius: 14,
                      padding: 12,
                      borderWidth: 1,
                      borderColor: '#F1F5F9',
                      gap: 12,
                    }}
                  >
                    <View
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 12,
                        backgroundColor: item.bgColor,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <item.icon size={19} color={item.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E293B' }}>
                        {item.title}
                      </Text>
                      <Text style={{ fontSize: 11.5, color: '#64748B', marginTop: 1 }}>
                        {item.desc}
                      </Text>
                    </View>
                    <View
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderWidth: 1,
                        borderColor: '#E2E8F0',
                        padding: 5,
                        borderRadius: 8,
                      }}
                    >
                      <Lock size={13} color="#94A3B8" />
                    </View>
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
