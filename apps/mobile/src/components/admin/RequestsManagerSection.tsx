import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  UserCheck,
  Clock,
  CheckCircle2,
  Search,
  CheckCheck,
  Phone,
  MessageCircle,
  GraduationCap,
  X,
  RotateCcw,
  Trash2,
} from 'lucide-react-native';
import {
  type AdminStore,
  type JoinRequestItem,
} from '../../lib/adminDataStore';

export interface RequestsManagerSectionProps {
  store: AdminStore;
  onToast?: (toast: { type: 'success' | 'error' | 'info'; message: string }) => void;
  onNotify?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

type RequestTabFilter = 'all' | 'pending' | 'approved' | 'rejected';

export function RequestsManagerSection({
  store,
  onToast,
  onNotify,
}: RequestsManagerSectionProps) {
  const [activeTab, setActiveTab] = useState<RequestTabFilter>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBatchFilter, setSelectedBatchFilter] = useState<string>('all');
  const [selectedClassFilter, setSelectedClassFilter] = useState<'all' | '9' | '10' | '11' | '12'>('all');

  const notify = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    if (onNotify) onNotify(msg, type);
    else if (onToast) onToast({ type, message: msg });
  };

  // KPI Metrics
  const pendingCount = useMemo(
    () => store.joinRequests.filter((r) => r.status === 'pending').length,
    [store.joinRequests]
  );
  const approvedCount = useMemo(
    () => store.joinRequests.filter((r) => r.status === 'approved').length,
    [store.joinRequests]
  );
  const rejectedCount = useMemo(
    () => store.joinRequests.filter((r) => r.status === 'rejected').length,
    [store.joinRequests]
  );
  const totalCount = store.joinRequests.length;

  // Filtered requests list
  const filteredRequests = useMemo(() => {
    return store.joinRequests.filter((req) => {
      if (activeTab !== 'all' && req.status !== activeTab) {
        return false;
      }
      if (selectedBatchFilter !== 'all' && req.batchId !== selectedBatchFilter) {
        return false;
      }
      if (selectedClassFilter !== 'all' && req.classLevel.toString() !== selectedClassFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesName = req.studentName.toLowerCase().includes(q);
        const matchesPhone = req.studentPhone.toLowerCase().includes(q);
        const matchesBatch = req.batchTitle.toLowerCase().includes(q);
        const matchesNote = req.note ? req.note.toLowerCase().includes(q) : false;
        if (!matchesName && !matchesPhone && !matchesBatch && !matchesNote) {
          return false;
        }
      }
      return true;
    });
  }, [
    store.joinRequests,
    activeTab,
    selectedBatchFilter,
    selectedClassFilter,
    searchQuery,
  ]);

  // Action handlers
  const handleApprove = async (req: JoinRequestItem) => {
    try {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await store.approveJoinRequest(req.id);
      notify(`${req.studentName} accepted into ${req.batchTitle}!`, 'success');
    } catch {
      notify('Failed to approve join request', 'error');
    }
  };

  const handleReject = (req: JoinRequestItem) => {
    Alert.alert(
      'Decline Join Request',
      `Decline admission request for ${req.studentName} into ${req.batchTitle}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              await store.rejectJoinRequest(req.id);
              notify(`Declined join request for ${req.studentName}`, 'info');
            } catch {
              notify('Failed to update request', 'error');
            }
          },
        },
      ]
    );
  };

  const handleApproveAllPending = () => {
    if (pendingCount === 0) return;
    Alert.alert(
      'Approve All Pending Requests',
      `Accept and enroll all ${pendingCount} pending students into their respective batches immediately?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `Approve (${pendingCount})`,
          onPress: async () => {
            try {
              void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              await store.approveAllPendingJoinRequests();
              notify(`All ${pendingCount} pending join requests accepted!`, 'success');
            } catch {
              notify('Failed to approve requests', 'error');
            }
          },
        },
      ]
    );
  };

  const handleReconsider = async (req: JoinRequestItem) => {
    try {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await store.approveJoinRequest(req.id);
      notify(`Reconsidered and approved ${req.studentName}!`, 'success');
    } catch {
      notify('Failed to update request', 'error');
    }
  };

  const handleDelete = (req: JoinRequestItem) => {
    Alert.alert(
      'Delete Request Record',
      `Permanently remove the request record for ${req.studentName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              await store.deleteJoinRequest(req.id);
              notify('Request record deleted', 'info');
            } catch {
              notify('Failed to delete request', 'error');
            }
          },
        },
      ]
    );
  };

  const handleCallStudent = (phone: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const cleaned = phone.replace(/[^0-9+]/g, '');
    void Linking.openURL(`tel:${cleaned}`);
  };

  const handleWhatsAppStudent = (phone: string, studentName: string, batchTitle: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const cleaned = phone.replace(/[^0-9]/g, '');
    const msg = encodeURIComponent(
      `Hello ${studentName}! Regarding your admission request for "${batchTitle}" at Quick2Learn...`
    );
    void Linking.openURL(`https://wa.me/${cleaned}?text=${msg}`);
  };

  const formatRequestedDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return (name.slice(0, 2) || 'ST').toUpperCase();
  };

  const TABS = [
    {
      id: 'pending' as const,
      label: 'Pending',
      count: pendingCount,
      color: '#D97706',
      activeBg: '#FEF3C7',
      inactiveBg: '#FFFBEB',
      border: '#FDE68A',
    },
    {
      id: 'approved' as const,
      label: 'Accepted',
      count: approvedCount,
      color: '#059669',
      activeBg: '#D1FAE5',
      inactiveBg: '#ECFDF5',
      border: '#A7F3D0',
    },
    {
      id: 'rejected' as const,
      label: 'Rejected',
      count: rejectedCount,
      color: '#DC2626',
      activeBg: '#FEE2E2',
      inactiveBg: '#FEF2F2',
      border: '#FECACA',
    },
    {
      id: 'all' as const,
      label: 'Total',
      count: totalCount,
      color: '#2563EB',
      activeBg: '#EFF6FF',
      inactiveBg: '#F8FAFC',
      border: '#BFDBFE',
    },
  ];

  return (
    <View style={{ gap: 8 }}>
      {/* 1. Header Card with Title & Single Unified Metric-Filter Tabs */}
      <View
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 14,
          padding: 10,
          borderWidth: 1,
          borderColor: '#E2E8F0',
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.04,
          shadowRadius: 4,
          elevation: 1,
          gap: 8,
        }}
      >
        {/* Title row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, marginRight: 6 }}>
            <View
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                backgroundColor: '#EFF6FF',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: '#BFDBFE',
              }}
            >
              <UserCheck size={16} color="#2563EB" />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{ fontSize: 14, fontWeight: '800', color: '#0F172A', letterSpacing: -0.2 }}
                numberOfLines={1}
              >
                Join Requests
              </Text>
              <Text
                style={{ fontSize: 10.5, color: '#64748B', marginTop: 0.5 }}
                numberOfLines={1}
              >
                Review & approve batch join requests
              </Text>
            </View>
          </View>

          {pendingCount > 0 && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleApproveAllPending}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#ECFDF5',
                borderWidth: 1,
                borderColor: '#A7F3D0',
                paddingHorizontal: 8,
                paddingVertical: 4.5,
                borderRadius: 7,
                gap: 4,
              }}
            >
              <CheckCheck size={12} color="#059669" />
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#059669' }}>
                Approve All
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 2. Unified Metric / Filter Tabs (4 clean equal boxes, no duplicate rows, no overflow) */}
        <View style={{ flexDirection: 'row', gap: 5 }}>
          {TABS.map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                activeOpacity={0.75}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveTab(tab.id);
                }}
                style={{
                  flex: 1,
                  paddingVertical: 5,
                  paddingHorizontal: 3,
                  alignItems: 'center',
                  borderRadius: 8,
                  backgroundColor: isSelected ? tab.activeBg : tab.inactiveBg,
                  borderWidth: isSelected ? 1.5 : 1,
                  borderColor: isSelected ? tab.color : tab.border,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '900',
                    color: isSelected ? tab.color : '#334155',
                    lineHeight: 17,
                  }}
                >
                  {tab.count}
                </Text>
                <Text
                  style={{
                    fontSize: 9.5,
                    fontWeight: isSelected ? '800' : '600',
                    color: isSelected ? tab.color : '#64748B',
                    marginTop: 0.5,
                  }}
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 3. Compact Search Bar */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#FFFFFF',
          borderWidth: 1,
          borderColor: '#CBD5E1',
          borderRadius: 9,
          paddingHorizontal: 9,
          height: 36,
          gap: 6,
        }}
      >
        <Search size={14} color="#64748B" />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search student, phone, or batch..."
          placeholderTextColor="#94A3B8"
          style={{
            flex: 1,
            fontSize: 12,
            color: '#0F172A',
            paddingVertical: 0,
          }}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X size={13} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {/* 4. Compact Class Filter Horizontal Chips */}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ fontSize: 10.5, fontWeight: '700', color: '#64748B', marginRight: 6 }}>
          Class:
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 4 }}
        >
          {(['all', '9', '10', '11', '12'] as const).map((lvl) => {
            const isSelected = selectedClassFilter === lvl;
            return (
              <TouchableOpacity
                key={lvl}
                activeOpacity={0.7}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedClassFilter(lvl);
                }}
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 3.5,
                  borderRadius: 6,
                  backgroundColor: isSelected ? '#0F172A' : '#FFFFFF',
                  borderWidth: 1,
                  borderColor: isSelected ? '#0F172A' : '#E2E8F0',
                }}
              >
                <Text
                  style={{
                    fontSize: 10.5,
                    fontWeight: isSelected ? '700' : '500',
                    color: isSelected ? '#FFFFFF' : '#475569',
                  }}
                >
                  {lvl === 'all' ? 'All Classes' : `Cl ${lvl}`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 5. Request Cards List */}
      <View style={{ gap: 8 }}>
        {filteredRequests.map((req) => {
          const isPending = req.status === 'pending';
          const isApproved = req.status === 'approved';
          const isRejected = req.status === 'rejected';

          return (
            <View
              key={req.id}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                padding: 10,
                borderWidth: 1,
                borderColor: isPending ? '#FDE68A' : isApproved ? '#A7F3D0' : '#FECACA',
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.03,
                shadowRadius: 4,
                elevation: 1,
                gap: 7,
              }}
            >
              {/* Top Row: Avatar, Name, Phone & Status Badge */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                  {/* Initials Avatar */}
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      backgroundColor: isPending ? '#FEF3C7' : isApproved ? '#D1FAE5' : '#FEE2E2',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: isPending ? '#FDE68A' : isApproved ? '#A7F3D0' : '#FECACA',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11.5,
                        fontWeight: '800',
                        color: isPending ? '#B45309' : isApproved ? '#047857' : '#DC2626',
                      }}
                    >
                      {getInitials(req.studentName)}
                    </Text>
                  </View>

                  {/* Name and Phone */}
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{ fontSize: 13, fontWeight: '700', color: '#0F172A', lineHeight: 16 }}
                      numberOfLines={1}
                    >
                      {req.studentName}
                    </Text>
                    <Text style={{ fontSize: 10.5, color: '#64748B', marginTop: 0.5 }} numberOfLines={1}>
                      {req.studentPhone} • Class {req.classLevel}
                    </Text>
                  </View>
                </View>

                {/* Status Badge */}
                <View
                  style={{
                    backgroundColor: isPending ? '#FFFBEB' : isApproved ? '#ECFDF5' : '#FEF2F2',
                    paddingHorizontal: 7,
                    paddingVertical: 2.5,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: isPending ? '#FDE68A' : isApproved ? '#A7F3D0' : '#FECACA',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 9.5,
                      fontWeight: '800',
                      color: isPending ? '#D97706' : isApproved ? '#059669' : '#DC2626',
                    }}
                  >
                    {isPending ? '⏳ Pending' : isApproved ? '✓ Accepted' : '✕ Declined'}
                  </Text>
                </View>
              </View>

              {/* Target Batch Info Box */}
              <View
                style={{
                  backgroundColor: '#F8FAFC',
                  borderRadius: 8,
                  paddingHorizontal: 8,
                  paddingVertical: 6,
                  borderWidth: 1,
                  borderColor: '#F1F5F9',
                  gap: 3,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1 }}>
                    <GraduationCap size={13} color="#2563EB" />
                    <Text
                      style={{ fontSize: 11.5, fontWeight: '700', color: '#1E293B', flex: 1 }}
                      numberOfLines={1}
                    >
                      {req.batchTitle}
                    </Text>
                  </View>
                  <View
                    style={{
                      backgroundColor: '#EFF6FF',
                      paddingHorizontal: 5,
                      paddingVertical: 1,
                      borderRadius: 4,
                    }}
                  >
                    <Text style={{ fontSize: 9.5, fontWeight: '800', color: '#2563EB' }}>
                      Class {req.classLevel}
                    </Text>
                  </View>
                </View>

                {/* Note / Details if present */}
                {req.note ? (
                  <Text
                    style={{ fontSize: 10.5, color: '#475569', fontStyle: 'italic', marginTop: 1 }}
                    numberOfLines={2}
                  >
                    "{req.note}"
                  </Text>
                ) : null}

                {/* Timestamp */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 }}>
                  <Clock size={10} color="#94A3B8" />
                  <Text style={{ fontSize: 9.5, color: '#94A3B8' }}>
                    Requested: {formatRequestedDate(req.requestedAt)}
                  </Text>
                </View>
              </View>

              {/* Action Buttons Row */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                {/* Contact Shortcuts */}
                <View style={{ flexDirection: 'row', gap: 5 }}>
                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={() => handleCallStudent(req.studentPhone)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      backgroundColor: '#EFF6FF',
                      borderWidth: 1,
                      borderColor: '#DBEAFE',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    accessibilityLabel="Call student"
                  >
                    <Phone size={12} color="#2563EB" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={() => handleWhatsAppStudent(req.studentPhone, req.studentName, req.batchTitle)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      backgroundColor: '#ECFDF5',
                      borderWidth: 1,
                      borderColor: '#A7F3D0',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    accessibilityLabel="WhatsApp student"
                  >
                    <MessageCircle size={12} color="#059669" />
                  </TouchableOpacity>
                </View>

                {/* Decision Actions */}
                <View style={{ flexDirection: 'row', gap: 6, flex: 1, justifyContent: 'flex-end', alignItems: 'center' }}>
                  {isPending && (
                    <>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => handleReject(req)}
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 4.5,
                          borderRadius: 6,
                          backgroundColor: '#FFF1F2',
                          borderWidth: 1,
                          borderColor: '#FECDD3',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#E11D48' }}>
                          Decline
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => handleApprove(req)}
                        style={{
                          paddingHorizontal: 11,
                          paddingVertical: 4.5,
                          borderRadius: 6,
                          backgroundColor: '#059669',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexDirection: 'row',
                          gap: 4,
                          elevation: 1,
                        }}
                      >
                        <CheckCircle2 size={12} color="#FFFFFF" />
                        <Text style={{ fontSize: 11, fontWeight: '800', color: '#FFFFFF' }}>
                          Accept & Enroll
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {isApproved && (
                    <>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 3,
                          paddingHorizontal: 6,
                        }}
                      >
                        <CheckCircle2 size={12} color="#059669" />
                        <Text style={{ fontSize: 10.5, fontWeight: '700', color: '#059669' }}>
                          Enrolled
                        </Text>
                      </View>

                      <TouchableOpacity
                        activeOpacity={0.75}
                        onPress={() => handleReject(req)}
                        style={{
                          paddingHorizontal: 8,
                          paddingVertical: 3.5,
                          borderRadius: 6,
                          backgroundColor: '#F1F5F9',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text style={{ fontSize: 10, fontWeight: '700', color: '#64748B' }}>
                          Revoke
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {isRejected && (
                    <>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => handleReconsider(req)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 3,
                          paddingHorizontal: 9,
                          paddingVertical: 4.5,
                          borderRadius: 6,
                          backgroundColor: '#ECFDF5',
                          borderWidth: 1,
                          borderColor: '#A7F3D0',
                        }}
                      >
                        <RotateCcw size={11} color="#059669" />
                        <Text style={{ fontSize: 10.5, fontWeight: '700', color: '#059669' }}>
                          Reconsider
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        activeOpacity={0.75}
                        onPress={() => handleDelete(req)}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 6,
                          backgroundColor: '#FEE2E2',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        accessibilityLabel="Delete request"
                      >
                        <Trash2 size={12} color="#DC2626" />
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            </View>
          );
        })}

        {/* Empty State */}
        {filteredRequests.length === 0 && (
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              paddingVertical: 24,
              paddingHorizontal: 16,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#E2E8F0',
              gap: 6,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#F1F5F9',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 2,
              }}
            >
              <UserCheck size={20} color="#94A3B8" />
            </View>
            <Text style={{ fontSize: 13, fontWeight: '800', color: '#1E293B', textAlign: 'center' }}>
              No {activeTab !== 'all' ? activeTab : ''} Join Requests Found
            </Text>
            <Text style={{ fontSize: 11, color: '#64748B', textAlign: 'center', maxWidth: 260 }}>
              {searchQuery
                ? `No requests match "${searchQuery}". Try clearing search filter.`
                : activeTab === 'pending'
                ? 'All student batch join requests are currently reviewed and processed!'
                : 'No join requests in this category.'}
            </Text>
            {(searchQuery || activeTab !== 'all' || selectedClassFilter !== 'all') && (
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => {
                  setSearchQuery('');
                  setActiveTab('all');
                  setSelectedClassFilter('all');
                }}
                style={{
                  marginTop: 4,
                  backgroundColor: '#2563EB',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#FFFFFF' }}>
                  Show All Requests
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
}
