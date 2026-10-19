import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  GraduationCap,
  Plus,
  KeyRound,
  QrCode,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react-native';
import { Screen } from '../../../src/components/ui/Screen';
import { AppHeader } from '../../../src/components/ui/AppHeader';
import { Button } from '../../../src/components/ui/Button';
import { Badge } from '../../../src/components/ui/Badge';
import { Skeleton } from '../../../src/components/ui/Skeleton';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { useStudentBatches } from '../../../src/api/hooks';
import { BatchCard } from '../../../src/components/batches/BatchCard';
import { JoinBatchModal } from '../../../src/components/batches/JoinBatchModal';
import { cleanupOrphanedBatchDownloads } from '../../../src/lib/offline-downloads';

export default function BatchesScreen() {
  const router = useRouter();
  const { data, isLoading, refetch, isRefetching } = useStudentBatches();
  const [showJoinModal, setShowJoinModal] = useState(false);

  const batches = data?.enrolled || [];
  const pendingRequests = data?.pendingRequests || [];

  // If the student leaves a batch, its downloads are removed on next launch
  React.useEffect(() => {
    if (data?.enrolled) {
      const activeIds = data.enrolled.map((b) => b.id);
      void cleanupOrphanedBatchDownloads(activeIds);
    }
  }, [data?.enrolled]);

  return (
    <Screen
      scrollable={false}
      header={
        <AppHeader
          title="Batches"
          rightActions={
            <TouchableOpacity
              onPress={() => setShowJoinModal(true)}
              className="px-3 py-1.5 rounded-full bg-primary-soft border border-primary/20 flex-row items-center space-x-1 min-h-[48px] justify-center"
              accessibilityLabel="Join a Batch"
            >
              <Plus size={16} color="#2563EB" />
              <Text className="text-caption font-bold text-primary ml-1">
                Join Batch
              </Text>
            </TouchableOpacity>
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
        {/* Loading Skeletons */}
        {isLoading && !data && (
          <View className="space-y-4">
            <Skeleton width="100%" height={160} borderRadius={16} />
            <Skeleton width="100%" height={160} borderRadius={16} />
          </View>
        )}

        {/* Pending Requests Section */}
        {pendingRequests.length > 0 && (
          <View className="mb-6 space-y-2">
            <View className="flex-row items-center justify-between">
              <Text className="text-caption font-bold text-ink-muted uppercase tracking-wider">
                Pending Requests ({pendingRequests.length})
              </Text>
            </View>

            {pendingRequests.map((req) => (
              <View
                key={req.id}
                className="bg-surface rounded-2xl border border-amber-200/80 p-4 shadow-2xs space-y-2"
              >
                <View className="flex-row items-center justify-between">
                  <Badge
                    label={
                      req.status === 'pending'
                        ? 'WAITING FOR APPROVAL'
                        : req.status.toUpperCase()
                    }
                    variant={req.status === 'pending' ? 'neutral' : 'danger'}
                    size="sm"
                  />
                  <Text className="text-[11px] font-semibold text-ink-muted">
                    Class {req.classLevel}
                  </Text>
                </View>

                <Text className="text-body font-bold text-ink">
                  {req.batchTitle}
                </Text>

                <Text className="text-caption text-ink-muted leading-relaxed">
                  {req.status === 'pending'
                    ? 'Your join request was submitted. Quick2Learn administration will approve your enrollment shortly.'
                    : req.note
                    ? `Reason: ${req.note}`
                    : 'Your request could not be approved. Please contact the centre office.'}
                </Text>

                <View className="flex-row items-center pt-1 border-t border-border/40">
                  <Clock size={13} color="#9CA3AF" />
                  <Text className="text-[11px] text-ink-muted ml-1.5">
                    Requested on {new Date(req.requestedAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Enrolled Batches Section */}
        {!isLoading && batches.length > 0 && (
          <View className="space-y-3">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-caption font-bold text-ink-muted uppercase tracking-wider">
                My Enrolled Batches ({batches.length})
              </Text>
            </View>

            {batches.map((batch) => (
              <BatchCard
                key={batch.id}
                batch={batch}
                onPress={() => router.push(`/batch/${batch.id}`)}
              />
            ))}
          </View>
        )}

        {/* Empty State when no enrolled batches & no pending requests */}
        {!isLoading && batches.length === 0 && pendingRequests.length === 0 && (
          <View className="bg-surface rounded-3xl p-6 border border-border items-center shadow-xs mt-4">
            <View className="w-16 h-16 rounded-2xl bg-primary-soft items-center justify-center mb-4 border border-primary/20">
              <GraduationCap size={32} color="#2563EB" />
            </View>
            <Text className="text-h2 font-bold text-ink text-center mb-1">
              Join Your First Batch
            </Text>
            <Text className="text-body text-ink-muted text-center mb-6 leading-relaxed max-w-xs">
              Access your timetable, live lectures, notes, test series, and teacher announcements.
            </Text>

            <View className="w-full space-y-3">
              <Button
                variant="primary"
                size="lg"
                onPress={() => setShowJoinModal(true)}
                icon={<KeyRound size={18} color="#FFFFFF" />}
              >
                Enter Batch Join Code
              </Button>

              <Button
                variant="outline"
                size="lg"
                onPress={() => setShowJoinModal(true)}
                icon={<QrCode size={18} color="#2563EB" />}
              >
                Scan Classroom QR Code
              </Button>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Join Batch Modal */}
      <JoinBatchModal
        visible={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onSuccess={() => {
          refetch();
        }}
      />
    </Screen>
  );
}
