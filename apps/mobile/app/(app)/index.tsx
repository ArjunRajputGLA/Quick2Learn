import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  LayoutGrid,
  LogOut,
  Users,
  KeyRound,
  GraduationCap,
  Calendar,
  CreditCard,
  ClipboardList,
  Clock,
  Sparkles,
  Share2,
  Check,
} from 'lucide-react-native';
import { Screen } from '../../src/components/ui/Screen';
import { AppHeader } from '../../src/components/ui/AppHeader';
import { SectionHeader } from '../../src/components/ui/SectionHeader';
import { BatchCard } from '../../src/components/composite/BatchCard';
import { LectureRow } from '../../src/components/composite/LectureRow';
import { PdfRow } from '../../src/components/composite/PdfRow';
import { LiveBanner } from '../../src/components/composite/LiveBanner';
import { OfflineBanner } from '../../src/components/ui/OfflineBanner';
import { Button } from '../../src/components/ui/Button';
import { TextField } from '../../src/components/ui/TextField';
import { authClient } from '../../src/api/auth-client';
import {
  useMe,
  useStudentInviteCode,
  useGenerateStudentInviteCode,
  useClaimInviteCode,
  useUnregisterDevice,
} from '../../src/api/hooks';

export default function HomeScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: me, isLoading: isMeLoading } = useMe();
  const { data: inviteCodeData, isLoading: isInviteLoading } = useStudentInviteCode();
  const generateCodeMutation = useGenerateStudentInviteCode();
  const claimCodeMutation = useClaimInviteCode();
  const unregisterDeviceMutation = useUnregisterDevice();

  const [refreshing, setRefreshing] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showParentLinkModal, setShowParentLinkModal] = useState(false);
  const [parentInviteInput, setParentInviteInput] = useState('');
  const [claimError, setClaimError] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [selectedChildIndex, setSelectedChildIndex] = useState(0);

  const role = me?.role || 'student';
  const isParent = role === 'parent';
  const linkedStudents = me?.linkedStudents || [];
  const activeChild = linkedStudents[selectedChildIndex];

  const handleRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries();
    setRefreshing(false);
  };

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      // 1. Better Auth Sign Out
      await authClient.signOut().catch(() => {});

      // 2. Clear entire query cache
      queryClient.clear();

      // 3. Route to welcome
      router.replace('/(auth)/welcome' as any);
    } catch (err) {
      console.warn('[auth] Sign-out error:', err);
      queryClient.clear();
      router.replace('/(auth)/welcome' as any);
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleClaimChild = async () => {
    if (parentInviteInput.trim().length !== 6) {
      setClaimError('Invite code must be 6 characters');
      return;
    }

    setClaimError(null);
    try {
      await claimCodeMutation.mutateAsync({
        code: parentInviteInput.trim().toUpperCase(),
      });
      setShowParentLinkModal(false);
      setParentInviteInput('');
      await queryClient.invalidateQueries();
    } catch (err: any) {
      setClaimError(err?.message || 'Failed to link student. Please verify the code.');
    }
  };

  const handleShareInviteCode = async () => {
    if (!inviteCodeData?.code) return;
    try {
      await Share.share({
        message: `Join me on Quick2Learn! Use my parent invite code ${inviteCodeData.code} to follow my maths learning progress. (Valid for 24 hours)`,
      });
    } catch (err) {
      console.warn('[share] Error sharing invite code:', err);
    }
  };

  return (
    <Screen
      subtle
      header={
        <>
          <OfflineBanner />
          <AppHeader
            title="Quick2Learn"
            subtitle={
              isParent
                ? 'Parent Portal • Mathura'
                : me?.profile?.classLevel
                ? `Class ${me.profile.classLevel} • ${me.profile.board?.toUpperCase() || 'CBSE'}`
                : 'Mathura Coaching Center'
            }
            rightActions={
              <View className="flex-row items-center">
                {__DEV__ && (
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Component Showcase"
                    onPress={() => router.push('/dev/ui' as any)}
                    className="w-10 h-10 items-center justify-center rounded-full bg-primary-soft mr-1 active:bg-primary/20"
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <LayoutGrid size={18} color="#3B82F6" />
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Sign Out"
                  onPress={handleSignOut}
                  disabled={isSigningOut}
                  className="w-10 h-10 items-center justify-center rounded-full active:bg-danger-soft mr-1"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <LogOut size={18} color="#EF4444" />
                </TouchableOpacity>

                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Notifications"
                  className="w-10 h-10 items-center justify-center rounded-full active:bg-surface-subtle"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Bell size={20} color="#1F2937" />
                </TouchableOpacity>
              </View>
            }
          />
        </>
      }
      refreshing={refreshing}
      onRefresh={handleRefresh}
    >
      <View className="p-4 space-y-4">
        {/* Welcome Callout Banner */}
        <View className="bg-surface rounded-2xl p-4 border border-border flex-row items-center justify-between shadow-xs">
          <View className="flex-1 pr-3">
            <Text className="text-small font-semibold text-primary uppercase tracking-wide">
              {isParent ? 'Parent Dashboard' : 'Student Dashboard'}
            </Text>
            <Text className="text-h3 font-bold text-ink mt-0.5">
              Welcome, {me?.profile?.fullName || me?.user?.name || 'Learner'}
            </Text>
            <Text className="text-caption text-ink-muted mt-0.5">
              {isParent
                ? `${linkedStudents.length} linked ${linkedStudents.length === 1 ? 'student' : 'students'}`
                : 'Targeting 95%+ in Mathematics Board Exam'}
            </Text>
          </View>

          {/* Student: Show Parent Invite Code Button */}
          {!isParent && (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Parent Invite Code"
              onPress={() => setShowInviteModal(true)}
              className="bg-primary-soft px-3 py-2 rounded-xl flex-row items-center border border-primary/20 active:bg-primary/20"
            >
              <KeyRound size={16} color="#3B82F6" />
              <Text className="text-caption font-bold text-primary ml-1.5">
                Parent Code
              </Text>
            </TouchableOpacity>
          )}

          {/* Parent: Link Another Child Button */}
          {isParent && (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Link Child"
              onPress={() => setShowParentLinkModal(true)}
              className="bg-success-soft px-3 py-2 rounded-xl flex-row items-center border border-success/20 active:bg-success/20"
            >
              <Users size={16} color="#10B981" />
              <Text className="text-caption font-bold text-success ml-1.5">
                Link Child
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Parent Mode: Child Selector & Academic Widgets */}
        {isParent && (
          <View className="space-y-4">
            {linkedStudents.length === 0 ? (
              <View className="bg-surface p-5 rounded-2xl border border-dashed border-border items-center">
                <Users size={36} color="#9CA3AF" />
                <Text className="text-body font-bold text-ink mt-2">
                  No Students Linked Yet
                </Text>
                <Text className="text-caption text-ink-muted text-center mt-1 mb-4 max-w-[260px]">
                  Ask your child to share their 6-character parent invite code from their app.
                </Text>
                <Button
                  variant="primary"
                  size="sm"
                  onPress={() => setShowParentLinkModal(true)}
                  icon={<KeyRound size={16} color="#FFFFFF" />}
                >
                  Enter Invite Code
                </Button>
              </View>
            ) : (
              <>
                {/* Child Selector Tabs (if more than 1 student) */}
                {linkedStudents.length > 1 && (
                  <View className="flex-row space-x-2">
                    {linkedStudents.map((child, idx) => (
                      <TouchableOpacity
                        key={child.id}
                        onPress={() => setSelectedChildIndex(idx)}
                        className={`flex-1 py-2 px-3 rounded-xl border ${
                          selectedChildIndex === idx
                            ? 'bg-primary border-primary'
                            : 'bg-surface border-border'
                        }`}
                      >
                        <Text
                          className={`text-small font-bold text-center ${
                            selectedChildIndex === idx ? 'text-white' : 'text-ink'
                          }`}
                        >
                          {child.fullName}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Active Child Overview Card */}
                {activeChild && (
                  <View className="bg-surface p-4 rounded-2xl border border-border">
                    <View className="flex-row items-center justify-between pb-3 border-b border-border/40 mb-3">
                      <View>
                        <Text className="text-body font-bold text-ink">
                          {activeChild.fullName}
                        </Text>
                        <Text className="text-caption text-ink-muted">
                          Class {activeChild.classLevel} • {activeChild.board?.toUpperCase()} • {activeChild.school}
                        </Text>
                      </View>
                      <View className="bg-primary-soft px-2.5 py-1 rounded-full">
                        <Text className="text-caption font-semibold text-primary">
                          Verified
                        </Text>
                      </View>
                    </View>

                    {/* Quick Parent Stats Allowed by Authz: attendance, tests, fees, timetable */}
                    <View className="flex-row space-x-2">
                      <View className="flex-1 bg-surface-subtle p-3 rounded-xl border border-border/40 items-center">
                        <ClipboardList size={18} color="#3B82F6" />
                        <Text className="text-h3 font-bold text-ink mt-1">94%</Text>
                        <Text className="text-caption text-ink-muted">Attendance</Text>
                      </View>

                      <View className="flex-1 bg-surface-subtle p-3 rounded-xl border border-border/40 items-center">
                        <GraduationCap size={18} color="#10B981" />
                        <Text className="text-h3 font-bold text-ink mt-1">42/50</Text>
                        <Text className="text-caption text-ink-muted">Last Test</Text>
                      </View>

                      <View className="flex-1 bg-surface-subtle p-3 rounded-xl border border-border/40 items-center">
                        <CreditCard size={18} color="#F59E0B" />
                        <Text className="text-h3 font-bold text-ink mt-1">Clear</Text>
                        <Text className="text-caption text-ink-muted">Fee Due</Text>
                      </View>
                    </View>
                  </View>
                )}
              </>
            )}
          </View>
        )}

        {/* Live Class Banner */}
        <LiveBanner
          title="Definite Integrals & Area under Curves"
          timeOrCountdown="Live now"
          onJoin={() => {}}
        />

        {/* Enrolled Batches Section */}
        <SectionHeader
          title={isParent ? "Child's Batches" : "My Batches"}
          onSeeAll={() => {}}
          className="px-0 pt-2"
        />

        <BatchCard
          classNameBadge="Class XII"
          boardBadge="CBSE"
          title="Target Board 2027 Mathematics"
          teacher="Dinesh Singh Rajput"
          nextClassTime="Mon, 22 Apr at 8:00 PM"
          progressPercentage={68}
          completedLectures={34}
          totalLectures={50}
          onPress={() => {}}
        />

        {/* Recent Lectures Section (Student Only) */}
        {!isParent && (
          <>
            <SectionHeader
              title="Recent Lectures"
              onSeeAll={() => {}}
              className="px-0 pt-2"
            />

            <View className="bg-surface rounded-2xl border border-border overflow-hidden">
              <LectureRow
                title="Matrices & Determinants - Part 1: Row Reduction"
                chapterOrSubject="Mathematics • Chapter 3"
                duration="48:20"
                watched={true}
                onPress={() => {}}
              />
              <LectureRow
                title="Inverse Trigonometric Functions: Principal Values"
                chapterOrSubject="Mathematics • Chapter 2"
                duration="36:45"
                progressPercentage={45}
                onPress={() => {}}
              />
              <LectureRow
                title="Continuity & Differentiability: Limits Revision"
                chapterOrSubject="Mathematics • Chapter 5"
                duration="52:10"
                progressPercentage={0}
                onPress={() => {}}
              />
            </View>

            {/* Study Materials & Notes Section */}
            <SectionHeader
              title="Study Notes & Assignments"
              onSeeAll={() => {}}
              className="px-0 pt-2"
            />

            <View className="bg-surface rounded-2xl border border-border overflow-hidden">
              <PdfRow
                title="Class XII Math Formula Cheat Sheet & Derivations"
                size="2.4 MB"
                downloadState="downloaded"
                onPress={() => {}}
              />
              <PdfRow
                title="NCERT Exemplar Selected Problems - Chapter 3"
                size="4.1 MB"
                downloadState="idle"
                onPress={() => {}}
              />
            </View>
          </>
        )}
      </View>

      {/* Student: Parent Invite Code Modal */}
      <Modal
        visible={showInviteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowInviteModal(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center p-6">
          <View className="w-full max-w-[340px] bg-surface rounded-3xl p-6 border border-border shadow-lg">
            <View className="w-12 h-12 rounded-2xl bg-primary-soft items-center justify-center self-center mb-3">
              <KeyRound size={24} color="#3B82F6" />
            </View>

            <Text className="text-h3 font-bold text-ink text-center mb-1">
              Parent Invite Code
            </Text>
            <Text className="text-caption text-ink-muted text-center mb-4 leading-5">
              Share this 6-character code with your parent to let them link to your Quick2Learn account. Valid for 24 hours.
            </Text>

            {/* Code Display */}
            <View className="bg-surface-subtle p-4 rounded-2xl border border-primary/30 items-center mb-4">
              {isInviteLoading || generateCodeMutation.isPending ? (
                <ActivityIndicator color="#3B82F6" />
              ) : (
                <Text className="text-h1 font-black text-primary tracking-widest">
                  {inviteCodeData?.code || '------'}
                </Text>
              )}
              <Text className="text-caption text-ink-muted mt-1">
                Valid for 24 hours
              </Text>
            </View>

            <View className="space-y-2">
              <Button
                variant="primary"
                size="md"
                fullWidth
                onPress={handleShareInviteCode}
                icon={<Share2 size={16} color="#FFFFFF" />}
              >
                Share Code
              </Button>

              <Button
                variant="ghost"
                size="sm"
                fullWidth
                onPress={() => setShowInviteModal(false)}
              >
                Close
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* Parent: Link Child via Invite Code Modal */}
      <Modal
        visible={showParentLinkModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowParentLinkModal(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center p-6">
          <View className="w-full max-w-[340px] bg-surface rounded-3xl p-6 border border-border shadow-lg">
            <View className="w-12 h-12 rounded-2xl bg-success-soft items-center justify-center self-center mb-3">
              <Users size={24} color="#10B981" />
            </View>

            <Text className="text-h3 font-bold text-ink text-center mb-1">
              Link Your Child
            </Text>
            <Text className="text-caption text-ink-muted text-center mb-4 leading-5">
              Enter the 6-character code displayed on your child's Quick2Learn app profile.
            </Text>

            {claimError && (
              <View className="bg-danger-soft p-3 rounded-xl border border-danger/20 mb-3">
                <Text className="text-caption text-danger font-medium text-center">
                  {claimError}
                </Text>
              </View>
            )}

            <View className="mb-4">
              <TextField
                placeholder="6-character code (e.g. 8K4M9P)"
                value={parentInviteInput}
                onChangeText={(val) => setParentInviteInput(val.toUpperCase())}
                autoCapitalize="characters"
                maxLength={6}
                autoFocus
              />
            </View>

            <View className="space-y-2">
              <Button
                variant="primary"
                size="md"
                fullWidth
                loading={claimCodeMutation.isPending}
                disabled={claimCodeMutation.isPending || parentInviteInput.trim().length !== 6}
                onPress={handleClaimChild}
              >
                Confirm Link
              </Button>

              <Button
                variant="ghost"
                size="sm"
                fullWidth
                onPress={() => setShowParentLinkModal(false)}
              >
                Cancel
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
