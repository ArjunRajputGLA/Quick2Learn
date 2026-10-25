import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  Share,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  X,
  Phone,
  MessageCircle,
  Copy,
  Share2,
  Trash2,
  Plus,
  School,
  Calendar,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Award,
  Layers,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react-native';
import { Badge } from '../ui/Badge';
import type { AdminStudentItem, BatchItem } from '../../lib/adminDataStore';

interface StudentDetailModalProps {
  visible: boolean;
  student: AdminStudentItem | null;
  batches: BatchItem[];
  onClose: () => void;
  onEnrollInBatch?: (student: AdminStudentItem) => void;
  onDeleteStudent?: (studentId: string, studentName: string) => void;
  onGenerateParentCode?: (studentId: string) => Promise<string>;
  onToast?: (toast: { type: 'success' | 'error' | 'info'; message: string }) => void;
}

export function StudentDetailModal({
  visible,
  student,
  batches,
  onClose,
  onEnrollInBatch,
  onDeleteStudent,
  onGenerateParentCode,
  onToast,
}: StudentDetailModalProps) {
  const insets = useSafeAreaInsets();
  const [copiedCode, setCopiedCode] = useState(false);

  if (!student) return null;

  // Extract initials for avatar
  const initials = student.fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

  const handleCopyParentCode = async () => {
    try {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const code = student.parentInviteCode || 'ARJ175';
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
      Alert.alert('Parent Code Copied', `Parent Link Code: ${code}\n\nShare this code with the parent to link the Quick2Learn app.`);
    } catch {
      // ignore
    }
  };

  const handleShareParentCode = async () => {
    try {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const code = student.parentInviteCode || 'ARJ175';
      await Share.share({
        title: `Parent Access Code for ${student.fullName}`,
        message: `Quick2Learn Parent Access Portal\n\nDear Parent of ${student.fullName},\nUse Link Code: ${code} to connect your account and track class attendance, tests, homework, and fee dues on the Quick2Learn App.\n\nDownload app: https://quick2learn.in`,
      });
    } catch {
      // ignore
    }
  };

  const handleCallStudent = () => {
    if (student.phone) {
      void Linking.openURL(`tel:${student.phone}`);
    } else {
      Alert.alert('No Phone', 'No contact phone number registered for this student.');
    }
  };

  const handleWhatsAppStudent = () => {
    if (student.phone) {
      const cleanPhone = student.phone.replace(/[^0-9]/g, '');
      const greeting = encodeURIComponent(
        `Hello ${student.fullName}, this is an academic update from Quick2Learn Institute.`
      );
      void Linking.openURL(`whatsapp://send?phone=${cleanPhone}&text=${greeting}`);
    } else {
      Alert.alert('No WhatsApp', 'No phone number available for WhatsApp.');
    }
  };

  const handleCallParent = () => {
    if (student.parentPhone) {
      void Linking.openURL(`tel:${student.parentPhone}`);
    } else {
      Alert.alert('No Parent Phone', 'No parent phone number on file for this student.');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Remove Student Record',
      `Are you sure you want to remove ${student.fullName} from the institute directory? All enrolled batch records will be unassigned.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove Student',
          style: 'destructive',
          onPress: () => {
            onClose();
            onDeleteStudent?.(student.id, student.fullName);
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' }}>
        <View
          style={{
            backgroundColor: '#F8FAFC',
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            maxHeight: '92%',
            paddingTop: 10,
            paddingBottom: Math.max(insets.bottom, 16),
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 12,
          }}
        >
          {/* Drag Handle Bar */}
          <View style={{ alignItems: 'center', paddingVertical: 4 }}>
            <View
              style={{
                width: 44,
                height: 5,
                borderRadius: 2.5,
                backgroundColor: '#CBD5E1',
              }}
            />
          </View>

          {/* Modal Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 18,
              paddingVertical: 10,
              borderBottomWidth: 1,
              borderBottomColor: '#E2E8F0',
            }}
          >
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontSize: 17, fontWeight: '800', color: '#0F172A' }} numberOfLines={1}>
                Student Profile
              </Text>
              <Text style={{ fontSize: 11.5, color: '#64748B' }} numberOfLines={1}>
                Class {student.classLevel} • {student.board.toUpperCase()} Roster
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: '#E2E8F0',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={17} color="#475569" />
            </TouchableOpacity>
          </View>

          {/* Scrollable Content */}
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingTop: 14,
              paddingBottom: 24,
              gap: 14,
            }}
            showsVerticalScrollIndicator={false}
          >
            {/* 1. HERO STUDENT PROFILE CARD */}
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 18,
                padding: 16,
                borderWidth: 1,
                borderColor: '#E2E8F0',
                gap: 14,
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.04,
                shadowRadius: 3,
                elevation: 1,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <View
                  style={{
                    width: 58,
                    height: 58,
                    borderRadius: 29,
                    backgroundColor: '#EFF6FF',
                    borderWidth: 2,
                    borderColor: '#BFDBFE',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Text style={{ fontSize: 22, fontWeight: '900', color: '#1E40AF' }}>
                    {initials || 'ST'}
                  </Text>
                </View>

                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    style={{ fontSize: 18, fontWeight: '800', color: '#0F172A', letterSpacing: -0.2 }}
                    numberOfLines={1}
                  >
                    {student.fullName}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 }}>
                    <School size={13} color="#64748B" />
                    <Text style={{ fontSize: 12.5, color: '#475569', fontWeight: '500' }} numberOfLines={1}>
                      {student.school || 'Institute Student'}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
                    ID: {student.id.toUpperCase().slice(0, 10)}
                  </Text>
                </View>
              </View>

              {/* Status Badges Row */}
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: 6,
                  paddingTop: 10,
                  borderTopWidth: 1,
                  borderTopColor: '#F1F5F9',
                }}
              >
                <Badge label={`CLASS ${student.classLevel}`} variant="primary" size="sm" />
                <Badge label={student.board.toUpperCase()} variant="neutral" size="sm" />
                <Badge
                  label={student.feeStatus.toUpperCase()}
                  variant={student.feeStatus === 'paid' ? 'success' : student.feeStatus === 'due' ? 'warning' : 'danger'}
                  size="sm"
                />
                <View
                  style={{
                    backgroundColor: student.attendanceRate >= 90 ? '#ECFDF5' : '#EFF6FF',
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: student.attendanceRate >= 90 ? '#A7F3D0' : '#BFDBFE',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '800',
                      color: student.attendanceRate >= 90 ? '#059669' : '#2563EB',
                    }}
                  >
                    {student.attendanceRate}% ATTENDANCE
                  </Text>
                </View>
              </View>
            </View>

            {/* 2. QUICK CONTACT & COMMUNICATION BAR */}
            <View
              style={{
                flexDirection: 'row',
                gap: 8,
              }}
            >
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleCallStudent}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#EFF6FF',
                  borderWidth: 1.2,
                  borderColor: '#BFDBFE',
                  paddingVertical: 10,
                  paddingHorizontal: 8,
                  borderRadius: 12,
                  gap: 6,
                }}
              >
                <Phone size={14} color="#2563EB" />
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#1E40AF' }} numberOfLines={1}>
                  Call Student
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleWhatsAppStudent}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#DCFCE7',
                  borderWidth: 1.2,
                  borderColor: '#86EFAC',
                  paddingVertical: 10,
                  paddingHorizontal: 8,
                  borderRadius: 12,
                  gap: 6,
                }}
              >
                <MessageCircle size={14} color="#15803D" />
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#166534' }} numberOfLines={1}>
                  WhatsApp
                </Text>
              </TouchableOpacity>

              {student.parentPhone ? (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleCallParent}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#F3E8FF',
                    borderWidth: 1.2,
                    borderColor: '#D8B4FE',
                    paddingVertical: 10,
                    paddingHorizontal: 8,
                    borderRadius: 12,
                    gap: 6,
                  }}
                >
                  <Users size={14} color="#7E22CE" />
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#6B21A8' }} numberOfLines={1}>
                    Call Parent
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {/* 3. DEDICATED PARENT ACCESS & LINK CODE CARD (ZERO OVERLAPPING) */}
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                padding: 14,
                borderWidth: 1,
                borderColor: '#E2E8F0',
                gap: 12,
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.04,
                shadowRadius: 3,
                elevation: 1,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                <ShieldCheck size={16} color="#7C3AED" />
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#0F172A' }}>
                  Parent Portal Link Code
                </Text>
              </View>

              <Text style={{ fontSize: 11.5, color: '#64748B', lineHeight: 16 }}>
                Parents enter this verification code in their Quick2Learn app to track attendance, report cards, and fee receipts.
              </Text>

              {/* Code Pill + Copy & Share Buttons */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                }}
              >
                <View
                  style={{
                    flex: 1,
                    backgroundColor: '#F5F3FF',
                    borderWidth: 1.2,
                    borderColor: '#DDD6FE',
                    borderRadius: 10,
                    paddingVertical: 9,
                    paddingHorizontal: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: '900',
                      color: '#6D28D9',
                      letterSpacing: 1.5,
                    }}
                    numberOfLines={1}
                  >
                    {student.parentInviteCode || 'ARJ175'}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', gap: 7, flexShrink: 0 }}>
                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={handleCopyParentCode}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 5,
                      backgroundColor: '#FFFFFF',
                      borderWidth: 1.2,
                      borderColor: '#CBD5E1',
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                    }}
                  >
                    <Copy size={13} color="#334155" />
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#334155' }}>
                      {copiedCode ? 'Copied' : 'Copy'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleShareParentCode}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 5,
                      backgroundColor: '#7C3AED',
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                    }}
                  >
                    <Share2 size={13} color="#FFFFFF" />
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFFFFF' }}>
                      Share
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Parent Contact Details */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#F8FAFC',
                  paddingHorizontal: 11,
                  paddingVertical: 8,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: '#F1F5F9',
                }}
              >
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontSize: 10.5, color: '#64748B', fontWeight: '600' }}>Parent / Guardian</Text>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#1E293B', marginTop: 1 }} numberOfLines={1}>
                    {student.parentName || 'Primary Parent Guardian'}
                  </Text>
                </View>
                <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#475569', flexShrink: 0 }}>
                  {student.parentPhone || 'Phone pending'}
                </Text>
              </View>
            </View>

            {/* 4. ACADEMIC & ATTENDANCE PERFORMANCE CARD */}
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                padding: 14,
                borderWidth: 1,
                borderColor: '#E2E8F0',
                gap: 12,
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.04,
                shadowRadius: 3,
                elevation: 1,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#0F172A' }}>
                Academic & Attendance Metrics
              </Text>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                {/* Attendance Metric */}
                <View
                  style={{
                    flex: 1,
                    backgroundColor: '#F8FAFC',
                    borderRadius: 12,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: '#F1F5F9',
                  }}
                >
                  <Text style={{ fontSize: 10, color: '#64748B', fontWeight: '800', letterSpacing: 0.5 }}>
                    ATTENDANCE
                  </Text>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: '#059669', marginTop: 3 }}>
                    {student.attendanceRate}%
                  </Text>
                  <View
                    style={{
                      height: 4,
                      backgroundColor: '#E2E8F0',
                      borderRadius: 2,
                      marginTop: 8,
                      overflow: 'hidden',
                    }}
                  >
                    <View
                      style={{
                        width: `${Math.min(100, student.attendanceRate)}%`,
                        height: '100%',
                        backgroundColor: '#10B981',
                      }}
                    />
                  </View>
                  <Text style={{ fontSize: 9.5, color: '#64748B', fontWeight: '600', marginTop: 5 }}>
                    Regular classroom presence
                  </Text>
                </View>

                {/* Fee Status Metric */}
                <View
                  style={{
                    flex: 1,
                    backgroundColor: '#F8FAFC',
                    borderRadius: 12,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: '#F1F5F9',
                  }}
                >
                  <Text style={{ fontSize: 10, color: '#64748B', fontWeight: '800', letterSpacing: 0.5 }}>
                    TUITION STATUS
                  </Text>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: '900',
                      color: student.feeStatus === 'paid' ? '#059669' : student.feeStatus === 'due' ? '#D97706' : '#DC2626',
                      marginTop: 3,
                    }}
                  >
                    {student.feeStatus.toUpperCase()}
                  </Text>
                  <Text style={{ fontSize: 9.5, color: '#64748B', fontWeight: '600', marginTop: 12 }}>
                    {student.feeStatus === 'paid' ? 'All dues settled' : 'Installment due'}
                  </Text>
                </View>
              </View>

              {/* Student Contact Info Row */}
              <View
                style={{
                  backgroundColor: '#F8FAFC',
                  padding: 11,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: '#F1F5F9',
                  gap: 6,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 11, color: '#64748B' }}>Primary Phone</Text>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#0F172A' }}>{student.phone}</Text>
                </View>
                <View style={{ height: 1, backgroundColor: '#E2E8F0' }} />
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 11, color: '#64748B' }}>Registered Email</Text>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#0F172A' }}>
                    {student.email || 'student@quick2learn.in'}
                  </Text>
                </View>
              </View>
            </View>

            {/* 5. ENROLLED BATCHES CARD */}
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                padding: 14,
                borderWidth: 1,
                borderColor: '#E2E8F0',
                gap: 12,
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.04,
                shadowRadius: 3,
                elevation: 1,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Layers size={15} color="#2563EB" />
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#0F172A' }}>
                    Enrolled Batches ({student.enrolledBatchNames.length})
                  </Text>
                </View>

                {onEnrollInBatch && (
                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={() => {
                      onClose();
                      onEnrollInBatch(student);
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      backgroundColor: '#EFF6FF',
                      borderWidth: 1,
                      borderColor: '#BFDBFE',
                      paddingHorizontal: 9,
                      paddingVertical: 4.5,
                      borderRadius: 8,
                    }}
                  >
                    <Plus size={12} color="#2563EB" strokeWidth={2.5} />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#2563EB' }}>Enroll Batch</Text>
                  </TouchableOpacity>
                )}
              </View>

              {student.enrolledBatchNames.length > 0 ? (
                <View style={{ gap: 8 }}>
                  {student.enrolledBatchNames.map((name, i) => (
                    <View
                      key={i}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: '#F8FAFC',
                        borderRadius: 10,
                        padding: 10,
                        borderWidth: 1,
                        borderColor: '#F1F5F9',
                      }}
                    >
                      <View style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
                        <Text style={{ fontSize: 12.5, fontWeight: '800', color: '#0F172A' }} numberOfLines={1}>
                          {name}
                        </Text>
                        <Text style={{ fontSize: 10.5, color: '#64748B', marginTop: 1 }}>
                          Active Program Enrollment
                        </Text>
                      </View>
                      <View
                        style={{
                          backgroundColor: '#EFF6FF',
                          paddingHorizontal: 7,
                          paddingVertical: 3,
                          borderRadius: 6,
                        }}
                      >
                        <Text style={{ fontSize: 10.5, fontWeight: '800', color: '#2563EB' }}>ACTIVE</Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View
                  style={{
                    backgroundColor: '#F8FAFC',
                    borderRadius: 10,
                    padding: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: '#F1F5F9',
                  }}
                >
                  <Text style={{ fontSize: 12, color: '#64748B', fontStyle: 'italic' }}>
                    Student is not enrolled in any batch yet.
                  </Text>
                </View>
              )}
            </View>

            {/* 6. REMOVE STUDENT ACTION */}
            <View style={{ paddingTop: 4 }}>
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={handleDelete}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#FEF2F2',
                  borderWidth: 1.2,
                  borderColor: '#FECACA',
                  paddingVertical: 12,
                  borderRadius: 12,
                  gap: 6,
                }}
              >
                <Trash2 size={15} color="#DC2626" />
                <Text style={{ fontSize: 12.5, fontWeight: '800', color: '#DC2626' }}>
                  Remove Student from Institute
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
