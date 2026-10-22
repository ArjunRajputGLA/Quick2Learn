import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  UserCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  CheckCheck,
  Phone,
  MessageCircle,
  GraduationCap,
  ChevronDown,
  X,
  RotateCcw,
  Trash2,
  User,
  Sparkles,
} from 'lucide-react-native';
import {
  type AdminStore,
  type JoinRequestItem,
  type BatchItem,
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
      // Tab filter
      if (activeTab !== 'all' && req.status !== activeTab) {
        return false;
      }
      // Batch filter
      if (selectedBatchFilter !== 'all' && req.batchId !== selectedBatchFilter) {
        return false;
      }
      // Class filter
      if (selectedClassFilter !== 'all' && req.classLevel.toString() !== selectedClassFilter) {
        return false;
      }
      // Search query
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
    } catch (e) {
      notify('Failed to approve join request', 'error');
    }
  };

  const handleReject = async (req: JoinRequestItem) => {
    try {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await store.rejectJoinRequest(req.id);
      notify(`Declined join request for ${req.studentName}`, 'info');
    } catch (e) {
      notify('Failed to decline join request', 'error');
    }
  };

  const handleApproveAllPending = () => {
    if (pendingCount === 0) return;
    Alert.alert(
      'Approve All Pending Requests',
      `Are you sure you want to approve and enroll all ${pendingCount} pending students into their respective batches?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `Approve All (${pendingCount})`,
          style: 'default',
          onPress: async () => {
            try {
              void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              await store.approveAllPendingJoinRequests();
              notify(`Successfully approved all ${pendingCount} pending requests!`, 'success');
            } catch {
              notify('Failed to bulk approve requests', 'error');
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
      `Hello ${studentName}! Regarding your admission/join request for "${batchTitle}" at Quick2Learn...`
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

  return (
    <View style={{ gap: 14 }}>
      {/* 1. Header Card with Top Metrics */}
      <View
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 20,
          padding: 16,
          borderWidth: 1,
          borderColor: '#E2E8F0',
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 2,
          gap: 14,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                backgroundColor: '#EFF6FF',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: '#BFDBFE',
              }}
            >
              <UserCheck size={22} color="#2563EB" />
            </View>
            <View>
              <Text style={{ fontSize: 17.5, fontWeight: '800', color: '#0F172A', letterSpacing: -0.3 }}>
                Batch Join Requests
              </Text>
              <Text style={{ fontSize: 12, color: '#64748B', marginTop: 1 }}>
                Review, accept, and manage student enrollment requests
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
                borderWidth: 1.5,
                borderColor: '#A7F3D0',
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: 10,
                gap: 5,
              }}
            >
              <CheckCheck size={14} color="#059669" />
              <Text style={{ fontSize: 11.5, fontWeight: '800', color: '#059669' }}>
                Approve All
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 4 Metric KPI Cards */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {/* Total */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => setActiveTab('all')}
            style={{
              flex: 1,
              backgroundColor: activeTab === 'all' ? '#F1F5F9' : '#F8FAFC',
              borderWidth: 1.5,
              borderColor: activeTab === 'all' ? '#64748B' : '#E2E8F0',
              borderRadius: 12,
              paddingVertical: 10,
              paddingHorizontal: 8,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: '900', color: '#1E293B' }}>{totalCount}</Text>
            <Text style={{ fontSize: 10.5, fontWeight: '700', color: '#64748B', marginTop: 2 }}>Total</Text>
          </TouchableOpacity>

          {/* Pending */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => setActiveTab('pending')}
            style={{
              flex: 1,
              backgroundColor: activeTab === 'pending' ? '#FEF3C7' : '#FFFBEB',
              borderWidth: 1.5,
              borderColor: activeTab === 'pending' ? '#D97706' : '#FDE68A',
              borderRadius: 12,
              paddingVertical: 10,
              paddingHorizontal: 8,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: '900', color: '#D97706' }}>{pendingCount}</Text>
            <Text style={{ fontSize: 10.5, fontWeight: '700', color: '#B45309', marginTop: 2 }}>Pending</Text>
          </TouchableOpacity>

          {/* Accepted */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => setActiveTab('approved')}
            style={{
              flex: 1,
              backgroundColor: activeTab === 'approved' ? '#D1FAE5' : '#ECFDF5',
              borderWidth: 1.5,
              borderColor: activeTab === 'approved' ? '#059669' : '#A7F3D0',
              borderRadius: 12,
              paddingVertical: 10,
              paddingHorizontal: 8,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: '900', color: '#059669' }}>{approvedCount}</Text>
            <Text style={{ fontSize: 10.5, fontWeight: '700', color: '#047857', marginTop: 2 }}>Accepted</Text>
          </TouchableOpacity>

          {/* Rejected */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => setActiveTab('rejected')}
            style={{
              flex: 1,
              backgroundColor: activeTab === 'rejected' ? '#FEE2E2' : '#FEF2F2',
              borderWidth: 1.5,
              borderColor: activeTab === 'rejected' ? '#DC2626' : '#FECACA',
              borderRadius: 12,
              paddingVertical: 10,
              paddingHorizontal: 8,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: '900', color: '#DC2626' }}>{rejectedCount}</Text>
            <Text style={{ fontSize: 10.5, fontWeight: '700', color: '#991B1B', marginTop: 2 }}>Rejected</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Filter Navigation Pills */}
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {(
          [
            { id: 'pending', label: 'Pending', count: pendingCount, color: '#D97706' },
            { id: 'approved', label: 'Accepted', count: approvedCount, color: '#059669' },
            { id: 'rejected', label: 'Rejected', count: rejectedCount, color: '#DC2626' },
            { id: 'all', label: 'All Requests', count: totalCount, color: '#2563EB' },
          ] as const
        ).map((tab) => {
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
                paddingVertical: 8,
                borderRadius: 10,
                backgroundColor: isSelected ? tab.color : '#FFFFFF',
                borderWidth: 1.5,
                borderColor: isSelected ? tab.color : '#E2E8F0',
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 5,
                elevation: isSelected ? 2 : 0,
              }}
            >
              <Text
                style={{
                  fontSize: 11.5,
                  fontWeight: '800',
                  color: isSelected ? '#FFFFFF' : '#475569',
                }}
              >
                {tab.label}
              </Text>
              <View
                style={{
                  backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : '#F1F5F9',
                  paddingHorizontal: 5,
                  paddingVertical: 1,
                  borderRadius: 6,
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: '900',
                    color: isSelected ? '#FFFFFF' : '#64748B',
                  }}
                >
                  {tab.count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 3. Search Bar */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#FFFFFF',
          borderWidth: 1.5,
          borderColor: '#CBD5E1',
          borderRadius: 12,
          paddingHorizontal: 12,
          height: 44,
          gap: 8,
        }}
      >
        <Search size={16} color="#64748B" />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search requests by student, phone, or batch..."
          placeholderTextColor="#94A3B8"
          style={{ flex: 1, fontSize: 13, color: '#0F172A', paddingVertical: 0 }}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity activeOpacity={0.7} onPress={() => setSearchQuery('')}>
            <X size={15} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {/* 4. Class Filter Chips */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#64748B', marginRight: 2 }}>
          Class:
        </Text>
        {(['all', '9', '10', '11', '12'] as const).map((lvl) => {
          const isSelected = selectedClassFilter === lvl;
          return (
            <TouchableOpacity
              key={lvl}
              activeOpacity={0.75}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedClassFilter(lvl);
              }}
              style={{
                paddingHorizontal: 11,
                paddingVertical: 5,
                borderRadius: 8,
                backgroundColor: isSelected ? '#0F172A' : '#FFFFFF',
                borderWidth: 1,
                borderColor: isSelected ? '#020617' : '#E2E8F0',
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: isSelected ? '#FFFFFF' : '#475569',
                }}
              >
                {lvl === 'all' ? 'All Classes' : `Cl ${lvl}`}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 5. Request Cards List */}
      <View style={{ gap: 10 }}>
        {filteredRequests.map((req) => {
          const isPending = req.status === 'pending';
          const isApproved = req.status === 'approved';
          const isRejected = req.status === 'rejected';

          return (
            <View
              key={req.id}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                padding: 14,
                borderWidth: 1.5,
                borderColor: isPending ? '#FDE68A' : isApproved ? '#A7F3D0' : '#FECACA',
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 6,
                elevation: 1,
                gap: 12,
              }}
            >
              {/* Top Row: Student Avatar, Name, Phone & Status Badge */}
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                  {/* Initials Avatar */}
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      backgroundColor: isPending ? '#FEF3C7' : isApproved ? '#D1FAE5' : '#FEE2E2',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1.5,
                      borderColor: isPending ? '#FDE68A' : isApproved ? '#A7F3D0' : '#FECACA',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: '800',
                        color: isPending ? '#B45309' : isApproved ? '#047857' : '#DC2626',
                      }}
                    >
                      {getInitials(req.studentName)}
                    </Text>
                  </View>

                  {/* Name and Phone */}
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: '#0F172A' }} numberOfLines={1}>
                      {req.studentName}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#64748B', marginTop: 1 }}>
                      {req.studentPhone} • Class {req.classLevel}
                    </Text>
                  </View>
                </View>

                {/* Status Badge */}
                <View
                  style={{
                    backgroundColor: isPending ? '#FFFBEB' : isApproved ? '#ECFDF5' : '#FEF2F2',
                    paddingHorizontal: 9,
                    paddingVertical: 4,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: isPending ? '#FDE68A' : isApproved ? '#A7F3D0' : '#FECACA',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
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
                  borderRadius: 10,
                  padding: 10,
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  gap: 4,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                    <GraduationCap size={14} color="#2563EB" />
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E293B' }} numberOfLines={1}>
                      {req.batchTitle}
                    </Text>
                  </View>
                  <View
                    style={{
                      backgroundColor: '#EFF6FF',
                      paddingHorizontal: 6,
                      paddingVertical: 1.5,
                      borderRadius: 6,
                    }}
                  >
                    <Text style={{ fontSize: 10, fontWeight: '800', color: '#2563EB' }}>
                      Class {req.classLevel}
                    </Text>
                  </View>
                </View>

                {/* Note / Details if present */}
                {req.note ? (
                  <Text style={{ fontSize: 11.5, color: '#475569', fontStyle: 'italic', marginTop: 2 }}>
                    "{req.note}"
                  </Text>
                ) : null}

                {/* Timestamp */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  <Clock size={11} color="#94A3B8" />
                  <Text style={{ fontSize: 10.5, color: '#94A3B8' }}>
                    Requested: {formatRequestedDate(req.requestedAt)}
                  </Text>
                </View>
              </View>

              {/* Action Buttons Row */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                {/* Contact Shortcuts */}
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={() => handleCallStudent(req.studentPhone)}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      backgroundColor: '#EFF6FF',
                      borderWidth: 1,
                      borderColor: '#DBEAFE',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Phone size={15} color="#2563EB" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={() => handleWhatsAppStudent(req.studentPhone, req.studentName, req.batchTitle)}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      backgroundColor: '#ECFDF5',
                      borderWidth: 1,
                      borderColor: '#A7F3D0',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <MessageCircle size={15} color="#059669" />
                  </TouchableOpacity>
                </View>

                {/* Decision Actions */}
                <View style={{ flexDirection: 'row', gap: 8, flex: 1, justifyContent: 'flex-end' }}>
                  {isPending && (
                    <>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => handleReject(req)}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 10,
                          backgroundColor: '#FFF1F2',
                          borderWidth: 1.5,
                          borderColor: '#FECDD3',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#E11D48' }}>
                          Decline
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => handleApprove(req)}
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                          borderRadius: 10,
                          backgroundColor: '#059669',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexDirection: 'row',
                          gap: 5,
                          elevation: 2,
                        }}
                      >
                        <CheckCircle2 size={14} color="#FFFFFF" />
                        <Text style={{ fontSize: 12.5, fontWeight: '800', color: '#FFFFFF' }}>
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
                          gap: 4,
                          paddingHorizontal: 8,
                        }}
                      >
                        <CheckCircle2 size={14} color="#059669" />
                        <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#059669' }}>
                          Enrolled in Batch
                        </Text>
                      </View>

                      <TouchableOpacity
                        activeOpacity={0.75}
                        onPress={() => handleReject(req)}
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: 8,
                          backgroundColor: '#F1F5F9',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B' }}>
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
                          gap: 4,
                          paddingHorizontal: 12,
                          paddingVertical: 7,
                          borderRadius: 8,
                          backgroundColor: '#ECFDF5',
                          borderWidth: 1,
                          borderColor: '#A7F3D0',
                        }}
                      >
                        <RotateCcw size={12} color="#059669" />
                        <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#059669' }}>
                          Reconsider & Accept
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        activeOpacity={0.75}
                        onPress={() => handleDelete(req)}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          backgroundColor: '#FEE2E2',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Trash2 size={14} color="#DC2626" />
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
              borderRadius: 16,
              paddingVertical: 36,
              paddingHorizontal: 20,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#E2E8F0',
              gap: 8,
            }}
          >
            <View
              style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                backgroundColor: '#F1F5F9',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 4,
              }}
            >
              <UserCheck size={24} color="#94A3B8" />
            </View>
            <Text style={{ fontSize: 15, fontWeight: '800', color: '#1E293B', textAlign: 'center' }}>
              No {activeTab !== 'all' ? activeTab : ''} Join Requests Found
            </Text>
            <Text style={{ fontSize: 12, color: '#64748B', textAlign: 'center', maxWidth: 280 }}>
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
                  marginTop: 6,
                  backgroundColor: '#2563EB',
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 10,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFFFFF' }}>
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
