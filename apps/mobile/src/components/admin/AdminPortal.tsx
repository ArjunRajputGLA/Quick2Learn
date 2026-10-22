import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Share,
  Linking,
  ActivityIndicator,
  RefreshControl,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as DocumentPicker from 'expo-document-picker';
import {
  ShieldCheck,
  LayoutDashboard,
  GraduationCap,
  FileText,
  Video,
  HelpCircle,
  Award,
  Users,
  CreditCard,
  Bell,
  MessageSquare,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  AlertTriangle,
  ArrowRight,
  Phone,
  MessageCircle,
  Copy,
  Edit3,
  Trash2,
  ExternalLink,
  ChevronRight,
  BookOpen,
  Send,
  Upload,
  RefreshCw,
  X,
  FileUp,
  Download,
  IndianRupee,
  School,
  Check,
  Play,
} from 'lucide-react-native';
import { Screen } from '../ui/Screen';
import { AppHeader } from '../ui/AppHeader';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Toast } from '../ui/Toast';
import { EmptyState } from '../ui/EmptyState';
import { colors, radii } from '@quick2learn/shared';
import { BatchDetailAdminModal } from './BatchDetailAdminModal';
import {
  useAdminStore,
  type BatchItem,
  type AdminLectureItem,
  type AdminResourceItem,
  type AdminQuestionItem,
  type AdminTestItem,
  type AdminStudentItem,
  type AdminPaymentItem,
  type AdminDoubtItem,
  type AdminAnnouncementItem,
  type AdminEnquiryItem,
} from '../../lib/adminDataStore';

type AdminSection =
  | 'overview'
  | 'batches'
  | 'resources'
  | 'lectures'
  | 'questions'
  | 'tests'
  | 'students'
  | 'fees'
  | 'doubts'
  | 'announcements'
  | 'enquiries';

export function AdminPortal() {
  const store = useAdminStore();
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState<'all' | '9' | '10' | '11' | '12'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Initialize store on mount
  useEffect(() => {
    store.init();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await store.init();
    setIsRefreshing(false);
  };

  // Section Tab Badges count
  const badgesCount = useMemo(() => {
    const pendingReqs = store.joinRequests.filter((r) => r.status === 'pending').length;
    const openDoubts = store.doubts.filter((d) => d.status === 'open').length;
    const newEnqs = store.enquiries.filter((e) => e.status === 'new').length;
    const overdueDues = store.feeDues.filter((d) => d.status === 'overdue').length;
    return {
      batches: pendingReqs > 0 ? pendingReqs : undefined,
      doubts: openDoubts > 0 ? openDoubts : undefined,
      enquiries: newEnqs > 0 ? newEnqs : undefined,
      fees: overdueDues > 0 ? overdueDues : undefined,
    };
  }, [store.joinRequests, store.doubts, store.enquiries, store.feeDues]);

  // Modals visibility
  const [batchModalVisible, setBatchModalVisible] = useState(false);
  const [editingBatch, setEditingBatch] = useState<BatchItem | null>(null);
  const [selectedBatchForConsole, setSelectedBatchForConsole] = useState<BatchItem | null>(null);

  const [resourceModalVisible, setResourceModalVisible] = useState(false);
  const [editingResource, setEditingResource] = useState<AdminResourceItem | null>(null);

  const [lectureModalVisible, setLectureModalVisible] = useState(false);
  const [editingLecture, setEditingLecture] = useState<AdminLectureItem | null>(null);

  const [questionModalVisible, setQuestionModalVisible] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<AdminQuestionItem | null>(null);

  const [testModalVisible, setTestModalVisible] = useState(false);
  const [editingTest, setEditingTest] = useState<AdminTestItem | null>(null);

  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [enrollModalVisible, setEnrollModalVisible] = useState(false);
  const [selectedStudentForEnroll, setSelectedStudentForEnroll] = useState<AdminStudentItem | null>(null);

  const [announcementModalVisible, setAnnouncementModalVisible] = useState(false);
  const [doubtReplyModalVisible, setDoubtReplyModalVisible] = useState(false);
  const [selectedDoubt, setSelectedDoubt] = useState<AdminDoubtItem | null>(null);

  const [enquiryModalVisible, setEnquiryModalVisible] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState<AdminEnquiryItem | null>(null);

  // Totals & KPIs
  const totalStudents = store.students.length;
  const totalCollections = store.payments.reduce((acc, p) => acc + p.amount, 0);
  const totalOverdue = store.feeDues
    .filter((d) => d.status === 'overdue')
    .reduce((acc, d) => acc + d.amount, 0);
  const ongoingBatches = store.batches.filter((b) => b.status === 'ongoing').length;

  return (
    <Screen
      scrollable={false}
      header={
        <AppHeader
          title="Institute Admin"
          rightActions={
            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  'Reset Admin Demo Data',
                  'Restore all batches, lectures, resources, and tests to default seed state?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Reset Data',
                      style: 'destructive',
                      onPress: async () => {
                        await store.resetToDefault();
                        setToastMessage({ type: 'info', message: 'Admin data reset to default.' });
                      },
                    },
                  ]
                );
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: radii.full,
                backgroundColor: '#EFF6FF',
                borderWidth: 1,
                borderColor: '#BFDBFE',
              }}
            >
              <RefreshCw size={12} color="#2563EB" />
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#2563EB', marginLeft: 4 }}>
                Reset
              </Text>
            </TouchableOpacity>
          }
        />
      }
    >
      {/* 1. SECTION NAVIGATION BAR (HORIZONTAL PILL SELECTOR) */}
      <View style={{ backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8, gap: 6 }}
        >
          <SectionPill
            label="Overview"
            icon={<LayoutDashboard size={14} color={activeSection === 'overview' ? '#FFFFFF' : '#4B5563'} />}
            isActive={activeSection === 'overview'}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveSection('overview');
            }}
          />
          <SectionPill
            label="Batches"
            icon={<GraduationCap size={14} color={activeSection === 'batches' ? '#FFFFFF' : '#4B5563'} />}
            isActive={activeSection === 'batches'}
            badge={badgesCount.batches}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveSection('batches');
            }}
          />
          <SectionPill
            label="Resources"
            icon={<FileText size={14} color={activeSection === 'resources' ? '#FFFFFF' : '#4B5563'} />}
            isActive={activeSection === 'resources'}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveSection('resources');
            }}
          />
          <SectionPill
            label="Lectures"
            icon={<Video size={14} color={activeSection === 'lectures' ? '#FFFFFF' : '#4B5563'} />}
            isActive={activeSection === 'lectures'}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveSection('lectures');
            }}
          />
          <SectionPill
            label="Questions"
            icon={<BookOpen size={14} color={activeSection === 'questions' ? '#FFFFFF' : '#4B5563'} />}
            isActive={activeSection === 'questions'}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveSection('questions');
            }}
          />
          <SectionPill
            label="Tests & Exams"
            icon={<Award size={14} color={activeSection === 'tests' ? '#FFFFFF' : '#4B5563'} />}
            isActive={activeSection === 'tests'}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveSection('tests');
            }}
          />
          <SectionPill
            label="Students"
            icon={<Users size={14} color={activeSection === 'students' ? '#FFFFFF' : '#4B5563'} />}
            isActive={activeSection === 'students'}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveSection('students');
            }}
          />
          <SectionPill
            label="Fees"
            icon={<CreditCard size={14} color={activeSection === 'fees' ? '#FFFFFF' : '#4B5563'} />}
            isActive={activeSection === 'fees'}
            badge={badgesCount.fees}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveSection('fees');
            }}
          />
          <SectionPill
            label="Doubts"
            icon={<HelpCircle size={14} color={activeSection === 'doubts' ? '#FFFFFF' : '#4B5563'} />}
            isActive={activeSection === 'doubts'}
            badge={badgesCount.doubts}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveSection('doubts');
            }}
          />
          <SectionPill
            label="Announce"
            icon={<Bell size={14} color={activeSection === 'announcements' ? '#FFFFFF' : '#4B5563'} />}
            isActive={activeSection === 'announcements'}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveSection('announcements');
            }}
          />
          <SectionPill
            label="Leads"
            icon={<MessageSquare size={14} color={activeSection === 'enquiries' ? '#FFFFFF' : '#4B5563'} />}
            isActive={activeSection === 'enquiries'}
            badge={badgesCount.enquiries}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveSection('enquiries');
            }}
          />
        </ScrollView>
      </View>

      {/* 2. MAIN SCROLLABLE CONTENT BODY */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 12, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* OVERVIEW SECTION */}
        {activeSection === 'overview' && (
          <OverviewSection
            store={store}
            totalStudents={totalStudents}
            totalCollections={totalCollections}
            totalOverdue={totalOverdue}
            ongoingBatches={ongoingBatches}
            onNavigate={(sec) => setActiveSection(sec)}
            onCreateBatch={() => {
              setEditingBatch(null);
              setBatchModalVisible(true);
            }}
            onUploadResource={() => {
              setEditingResource(null);
              setResourceModalVisible(true);
            }}
            onAddLecture={() => {
              setEditingLecture(null);
              setLectureModalVisible(true);
            }}
            onAddQuestion={() => {
              setEditingQuestion(null);
              setQuestionModalVisible(true);
            }}
            onCreateTest={() => {
              setEditingTest(null);
              setTestModalVisible(true);
            }}
            onRecordFee={() => setPaymentModalVisible(true)}
            onBroadcast={() => setAnnouncementModalVisible(true)}
          />
        )}

        {/* BATCHES SECTION */}
        {activeSection === 'batches' && (
          <BatchesManagerSection
            store={store}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            classFilter={classFilter}
            setClassFilter={setClassFilter}
            onCreateBatch={() => {
              setEditingBatch(null);
              setBatchModalVisible(true);
            }}
            onEditBatch={(b) => {
              setEditingBatch(b);
              setBatchModalVisible(true);
            }}
            onOpenBatchConsole={(b) => {
              setSelectedBatchForConsole(b);
            }}
            onToast={(t) => setToastMessage(t)}
          />
        )}

        {/* RESOURCES / STUDY MATERIALS */}
        {activeSection === 'resources' && (
          <ResourcesManagerSection
            store={store}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            classFilter={classFilter}
            setClassFilter={setClassFilter}
            onUploadResource={() => {
              setEditingResource(null);
              setResourceModalVisible(true);
            }}
            onEditResource={(r) => {
              setEditingResource(r);
              setResourceModalVisible(true);
            }}
            onToast={(t) => setToastMessage(t)}
          />
        )}

        {/* LECTURES SECTION */}
        {activeSection === 'lectures' && (
          <LecturesManagerSection
            store={store}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            classFilter={classFilter}
            setClassFilter={setClassFilter}
            onAddLecture={() => {
              setEditingLecture(null);
              setLectureModalVisible(true);
            }}
            onEditLecture={(l) => {
              setEditingLecture(l);
              setLectureModalVisible(true);
            }}
            onToast={(t) => setToastMessage(t)}
          />
        )}

        {/* QUESTION BANK SECTION */}
        {activeSection === 'questions' && (
          <QuestionsManagerSection
            store={store}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            classFilter={classFilter}
            setClassFilter={setClassFilter}
            onAddQuestion={() => {
              setEditingQuestion(null);
              setQuestionModalVisible(true);
            }}
            onEditQuestion={(q) => {
              setEditingQuestion(q);
              setQuestionModalVisible(true);
            }}
            onToast={(t) => setToastMessage(t)}
          />
        )}

        {/* TESTS & EXAMS SECTION */}
        {activeSection === 'tests' && (
          <TestsManagerSection
            store={store}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            classFilter={classFilter}
            setClassFilter={setClassFilter}
            onCreateTest={() => {
              setEditingTest(null);
              setTestModalVisible(true);
            }}
            onEditTest={(t) => {
              setEditingTest(t);
              setTestModalVisible(true);
            }}
            onToast={(t) => setToastMessage(t)}
          />
        )}

        {/* STUDENTS DIRECTORY */}
        {activeSection === 'students' && (
          <StudentsDirectorySection
            store={store}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            classFilter={classFilter}
            setClassFilter={setClassFilter}
            onEnrollStudent={(stud) => {
              setSelectedStudentForEnroll(stud);
              setEnrollModalVisible(true);
            }}
            onToast={(t) => setToastMessage(t)}
          />
        )}

        {/* FEES & COLLECTIONS SECTION */}
        {activeSection === 'fees' && (
          <FeesManagerSection
            store={store}
            onRecordFee={() => setPaymentModalVisible(true)}
            onToast={(t) => setToastMessage(t)}
          />
        )}

        {/* DOUBTS INBOX */}
        {activeSection === 'doubts' && (
          <DoubtsInboxSection
            store={store}
            onReplyDoubt={(d) => {
              setSelectedDoubt(d);
              setDoubtReplyModalVisible(true);
            }}
            onToast={(t) => setToastMessage(t)}
          />
        )}

        {/* ANNOUNCEMENTS SECTION */}
        {activeSection === 'announcements' && (
          <AnnouncementsManagerSection
            store={store}
            onBroadcast={() => setAnnouncementModalVisible(true)}
            onToast={(t) => setToastMessage(t)}
          />
        )}

        {/* ADMISSION LEADS / ENQUIRIES */}
        {activeSection === 'enquiries' && (
          <EnquiriesManagerSection
            store={store}
            onSelectEnquiry={(e) => {
              setSelectedEnquiry(e);
              setEnquiryModalVisible(true);
            }}
            onToast={(t) => setToastMessage(t)}
          />
        )}
      </ScrollView>

      {/* 3. MODALS FOR UPLOADING & EDITING */}

      {/* A. Batch Create / Edit Modal */}
      <BatchFormModal
        visible={batchModalVisible}
        batch={editingBatch}
        onClose={() => setBatchModalVisible(false)}
        onSave={async (batchData) => {
          if (editingBatch) {
            await store.updateBatch(editingBatch.id, batchData);
            setToastMessage({ type: 'success', message: 'Batch updated successfully!' });
          } else {
            await store.createBatch(batchData as any);
            setToastMessage({ type: 'success', message: 'New batch published!' });
          }
          setBatchModalVisible(false);
        }}
        onDelete={async (id) => {
          await store.deleteBatch(id);
          setToastMessage({ type: 'info', message: 'Batch removed.' });
          setBatchModalVisible(false);
        }}
      />

      {/* B. Resource Upload / Edit Modal */}
      <ResourceFormModal
        visible={resourceModalVisible}
        resource={editingResource}
        batches={store.batches}
        onClose={() => setResourceModalVisible(false)}
        onSave={async (resourceData) => {
          if (editingResource) {
            await store.updateResource(editingResource.id, resourceData);
            setToastMessage({ type: 'success', message: 'Resource updated!' });
          } else {
            await store.uploadResource(resourceData as any);
            setToastMessage({ type: 'success', message: 'Study material uploaded successfully!' });
          }
          setResourceModalVisible(false);
        }}
        onDelete={async (id) => {
          await store.deleteResource(id);
          setToastMessage({ type: 'info', message: 'Resource removed.' });
          setResourceModalVisible(false);
        }}
      />

      {/* C. Lecture Add / Edit Modal */}
      <LectureFormModal
        visible={lectureModalVisible}
        lecture={editingLecture}
        onClose={() => setLectureModalVisible(false)}
        onSave={async (lectureData) => {
          if (editingLecture) {
            await store.updateLecture(editingLecture.id, lectureData);
            setToastMessage({ type: 'success', message: 'Lecture updated!' });
          } else {
            await store.addLecture(lectureData as any);
            setToastMessage({ type: 'success', message: 'Lecture video added to syllabus!' });
          }
          setLectureModalVisible(false);
        }}
        onDelete={async (id) => {
          await store.deleteLecture(id);
          setToastMessage({ type: 'info', message: 'Lecture deleted.' });
          setLectureModalVisible(false);
        }}
      />

      {/* D. Question Add / Edit Modal */}
      <QuestionFormModal
        visible={questionModalVisible}
        question={editingQuestion}
        onClose={() => setQuestionModalVisible(false)}
        onSave={async (qData) => {
          if (editingQuestion) {
            await store.updateQuestion(editingQuestion.id, qData);
            setToastMessage({ type: 'success', message: 'Question updated in bank!' });
          } else {
            await store.addQuestion(qData as any);
            setToastMessage({ type: 'success', message: 'New question saved to bank!' });
          }
          setQuestionModalVisible(false);
        }}
        onDelete={async (id) => {
          await store.deleteQuestion(id);
          setToastMessage({ type: 'info', message: 'Question removed.' });
          setQuestionModalVisible(false);
        }}
      />

      {/* E. Test Create / Edit Modal */}
      <TestFormModal
        visible={testModalVisible}
        test={editingTest}
        onClose={() => setTestModalVisible(false)}
        onSave={async (testData) => {
          if (editingTest) {
            await store.updateTest(editingTest.id, testData);
            setToastMessage({ type: 'success', message: 'Test schedule updated!' });
          } else {
            await store.createTest(testData as any);
            setToastMessage({ type: 'success', message: 'New test scheduled and published!' });
          }
          setTestModalVisible(false);
        }}
        onDelete={async (id) => {
          await store.deleteTest(id);
          setToastMessage({ type: 'info', message: 'Test cancelled.' });
          setTestModalVisible(false);
        }}
      />

      {/* F. Record Offline Payment Modal */}
      <OfflinePaymentModal
        visible={paymentModalVisible}
        students={store.students}
        batches={store.batches}
        onClose={() => setPaymentModalVisible(false)}
        onRecord={async (payInput) => {
          const rec = await store.recordOfflinePayment(payInput);
          setToastMessage({
            type: 'success',
            message: `Payment of ₹${payInput.amount} recorded! Receipt: ${rec.receiptNo}`,
          });
          setPaymentModalVisible(false);
        }}
      />

      {/* G. Enroll Student Modal */}
      <EnrollStudentModal
        visible={enrollModalVisible}
        student={selectedStudentForEnroll}
        batches={store.batches}
        onClose={() => setEnrollModalVisible(false)}
        onEnroll={async (batchId) => {
          if (selectedStudentForEnroll) {
            await store.enrollStudentInBatch(selectedStudentForEnroll.id, batchId);
            setToastMessage({
              type: 'success',
              message: `${selectedStudentForEnroll.fullName} enrolled into batch!`,
            });
          }
          setEnrollModalVisible(false);
        }}
      />

      {/* H. Broadcast Announcement Modal */}
      <AnnouncementModal
        visible={announcementModalVisible}
        batches={store.batches}
        onClose={() => setAnnouncementModalVisible(false)}
        onBroadcast={async (ann) => {
          await store.createAnnouncement(ann);
          setToastMessage({ type: 'success', message: 'Announcement broadcasted to students!' });
          setAnnouncementModalVisible(false);
        }}
      />

      {/* I. Reply Doubt Modal */}
      <DoubtReplyModal
        visible={doubtReplyModalVisible}
        doubt={selectedDoubt}
        onClose={() => setDoubtReplyModalVisible(false)}
        onReply={async (replyText) => {
          if (selectedDoubt) {
            await store.replyDoubt(selectedDoubt.id, replyText);
            setToastMessage({ type: 'success', message: 'Reply sent to student!' });
          }
          setDoubtReplyModalVisible(false);
        }}
      />

      {/* J. Enquiry Detail Modal */}
      <EnquiryDetailModal
        visible={enquiryModalVisible}
        enquiry={selectedEnquiry}
        onClose={() => setEnquiryModalVisible(false)}
        onUpdateStatus={async (status, notes) => {
          if (selectedEnquiry) {
            await store.updateEnquiryStatus(selectedEnquiry.id, status, notes);
            setToastMessage({ type: 'success', message: `Lead updated to ${status.toUpperCase()}!` });
          }
          setEnquiryModalVisible(false);
        }}
      />

      {/* K. Batch Command Center (Classplus 8 Tabs) */}
      <BatchDetailAdminModal
        visible={!!selectedBatchForConsole}
        batch={selectedBatchForConsole}
        onClose={() => setSelectedBatchForConsole(null)}
        onEditBatch={(b) => {
          setSelectedBatchForConsole(null);
          setEditingBatch(b);
          setBatchModalVisible(true);
        }}
        onToast={(t) => setToastMessage(t)}
      />

      {/* Toast Feedback */}
      {toastMessage && (
        <Toast
          type={toastMessage.type}
          message={toastMessage.message}
          onDismiss={() => setToastMessage(null)}
        />
      )}
    </Screen>
  );
}

// -------------------------------------------------------------
// SUB-SECTIONS
// -------------------------------------------------------------

function SectionPill({
  label,
  icon,
  isActive,
  badge,
  onPress,
}: {
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  badge?: number;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: radii.full,
        backgroundColor: isActive ? '#2563EB' : '#F1F5F9',
        borderWidth: 1,
        borderColor: isActive ? '#1D4ED8' : '#E2E8F0',
        minHeight: 34,
      }}
    >
      {icon}
      <Text
        style={{
          fontSize: 12.5,
          fontWeight: '700',
          color: isActive ? '#FFFFFF' : '#334155',
          marginLeft: 5,
        }}
      >
        {label}
      </Text>
      {badge !== undefined && (
        <View
          style={{
            marginLeft: 5,
            backgroundColor: isActive ? '#FFFFFF' : '#EF4444',
            borderRadius: radii.full,
            paddingHorizontal: 5,
            paddingVertical: 1,
            minWidth: 16,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontSize: 10,
              fontWeight: '800',
              color: isActive ? '#2563EB' : '#FFFFFF',
            }}
          >
            {badge}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function OverviewSection({
  store,
  totalStudents,
  totalCollections,
  totalOverdue,
  ongoingBatches,
  onNavigate,
  onCreateBatch,
  onUploadResource,
  onAddLecture,
  onAddQuestion,
  onCreateTest,
  onRecordFee,
  onBroadcast,
}: {
  store: any;
  totalStudents: number;
  totalCollections: number;
  totalOverdue: number;
  ongoingBatches: number;
  onNavigate: (sec: AdminSection) => void;
  onCreateBatch: () => void;
  onUploadResource: () => void;
  onAddLecture: () => void;
  onAddQuestion: () => void;
  onCreateTest: () => void;
  onRecordFee: () => void;
  onBroadcast: () => void;
}) {
  return (
    <View style={{ gap: 14 }}>
      {/* 1. INSTITUTE STATS STRIP */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <StatBox
          label="Active Students"
          value={totalStudents.toString()}
          sub="Enrolled in batches"
          icon={<Users size={16} color="#2563EB" />}
          bg="#EFF6FF"
          border="#DBEAFE"
          onPress={() => onNavigate('students')}
        />
        <StatBox
          label="Ongoing Batches"
          value={ongoingBatches.toString()}
          sub="Maths & Sciences"
          icon={<GraduationCap size={16} color="#059669" />}
          bg="#ECFDF5"
          border="#D1FAE5"
          onPress={() => onNavigate('batches')}
        />
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <StatBox
          label="Collections (₹)"
          value={`₹${(totalCollections / 1000).toFixed(0)}k`}
          sub="Tuition fees paid"
          icon={<IndianRupee size={16} color="#4F46E5" />}
          bg="#EEF2FF"
          border="#E0E7FF"
          onPress={() => onNavigate('fees')}
        />
        <StatBox
          label="Overdue Dues"
          value={`₹${(totalOverdue / 1000).toFixed(0)}k`}
          sub="Action required"
          icon={<AlertTriangle size={16} color="#DC2626" />}
          bg="#FEF2F2"
          border="#FEE2E2"
          valueColor="#DC2626"
          onPress={() => onNavigate('fees')}
        />
      </View>

      {/* 2. ADMIN QUICK ACTIONS BAR */}
      <View
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          padding: 12,
          borderWidth: 1,
          borderColor: '#E2E8F0',
        }}
      >
        <Text style={{ fontSize: 13, fontWeight: '800', color: '#0F172A', marginBottom: 10 }}>
          Quick Creation & Upload Center
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          <QuickActionBtn
            label="+ New Batch"
            icon={<GraduationCap size={16} color="#FFFFFF" />}
            bg="#2563EB"
            onPress={onCreateBatch}
          />
          <QuickActionBtn
            label="+ Upload PDF"
            icon={<FileUp size={16} color="#FFFFFF" />}
            bg="#059669"
            onPress={onUploadResource}
          />
          <QuickActionBtn
            label="+ Add Video"
            icon={<Video size={16} color="#FFFFFF" />}
            bg="#7C3AED"
            onPress={onAddLecture}
          />
          <QuickActionBtn
            label="+ Question"
            icon={<BookOpen size={16} color="#FFFFFF" />}
            bg="#D97706"
            onPress={onAddQuestion}
          />
          <QuickActionBtn
            label="+ Create Test"
            icon={<Award size={16} color="#FFFFFF" />}
            bg="#0891B2"
            onPress={onCreateTest}
          />
          <QuickActionBtn
            label="+ Record Fee"
            icon={<CreditCard size={16} color="#FFFFFF" />}
            bg="#4F46E5"
            onPress={onRecordFee}
          />
          <QuickActionBtn
            label="+ Announce"
            icon={<Bell size={16} color="#FFFFFF" />}
            bg="#E11D48"
            onPress={onBroadcast}
          />
        </ScrollView>
      </View>

      {/* 3. PENDING ITEMS REQUIRING ATTENTION */}
      {store.joinRequests.filter((r: any) => r.status === 'pending').length > 0 && (
        <View
          style={{
            backgroundColor: '#FFFBEB',
            borderRadius: 16,
            padding: 12,
            borderWidth: 1,
            borderColor: '#FDE68A',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Clock size={16} color="#D97706" />
              <Text style={{ fontSize: 13.5, fontWeight: '800', color: '#92400E' }}>
                Pending Batch Join Requests ({store.joinRequests.filter((r: any) => r.status === 'pending').length})
              </Text>
            </View>
            <TouchableOpacity onPress={() => onNavigate('batches')}>
              <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#B45309' }}>View All</Text>
            </TouchableOpacity>
          </View>

          {store.joinRequests
            .filter((r: any) => r.status === 'pending')
            .slice(0, 2)
            .map((req: any) => (
              <View
                key={req.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 12,
                  padding: 10,
                  marginTop: 6,
                  borderWidth: 1,
                  borderColor: '#FEF3C7',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#0F172A' }}>{req.studentName}</Text>
                  <Text style={{ fontSize: 11, color: '#64748B' }}>
                    {req.batchTitle} • Class {req.classLevel}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <TouchableOpacity
                    onPress={() => store.approveJoinRequest(req.id)}
                    style={{
                      backgroundColor: '#16A34A',
                      paddingHorizontal: 9,
                      paddingVertical: 5,
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#FFFFFF' }}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => store.rejectJoinRequest(req.id)}
                    style={{
                      backgroundColor: '#F1F5F9',
                      paddingHorizontal: 9,
                      paddingVertical: 5,
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569' }}>Decline</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
        </View>
      )}

      {/* 4. RECENT ADMISSION ENQUIRIES */}
      <View
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          padding: 12,
          borderWidth: 1,
          borderColor: '#E2E8F0',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <MessageSquare size={16} color="#2563EB" />
            <Text style={{ fontSize: 13.5, fontWeight: '800', color: '#0F172A' }}>
              Recent Admission Leads
            </Text>
          </View>
          <TouchableOpacity onPress={() => onNavigate('enquiries')}>
            <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#2563EB' }}>Manage Leads</Text>
          </TouchableOpacity>
        </View>

        {store.enquiries.slice(0, 3).map((enq: any) => (
          <View
            key={enq.id}
            style={{
              paddingVertical: 8,
              borderBottomWidth: 1,
              borderBottomColor: '#F1F5F9',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flex: 1, marginRight: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#0F172A' }}>{enq.studentName}</Text>
                <Badge
                  label={enq.status.toUpperCase()}
                  variant={enq.status === 'new' ? 'warning' : enq.status === 'enrolled' ? 'success' : 'neutral'}
                  size="sm"
                />
              </View>
              <Text style={{ fontSize: 11, color: '#64748B', marginTop: 2 }} numberOfLines={1}>
                Class {enq.classLevel} • {enq.message}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <TouchableOpacity
                onPress={() => Linking.openURL(`tel:${enq.phone}`)}
                style={{
                  backgroundColor: '#EFF6FF',
                  padding: 7,
                  borderRadius: radii.full,
                }}
              >
                <Phone size={14} color="#2563EB" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => Linking.openURL(`https://wa.me/${enq.phone.replace(/[^0-9]/g, '')}`)}
                style={{
                  backgroundColor: '#ECFDF5',
                  padding: 7,
                  borderRadius: radii.full,
                }}
              >
                <MessageCircle size={14} color="#059669" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function StatBox({
  label,
  value,
  sub,
  icon,
  bg,
  border,
  valueColor = '#0F172A',
  onPress,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  bg: string;
  border: string;
  valueColor?: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={{
        flex: 1,
        backgroundColor: bg,
        borderRadius: 14,
        padding: 11,
        borderWidth: 1,
        borderColor: border,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B' }}>{label}</Text>
        {icon}
      </View>
      <Text style={{ fontSize: 20, fontWeight: '800', color: valueColor, letterSpacing: -0.5 }}>{value}</Text>
      <Text style={{ fontSize: 10, color: '#64748B', marginTop: 1 }}>{sub}</Text>
    </TouchableOpacity>
  );
}

function QuickActionBtn({
  label,
  icon,
  bg,
  onPress,
}: {
  label: string;
  icon: React.ReactNode;
  bg: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: bg,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: radii.full,
        gap: 6,
      }}
    >
      {icon}
      <Text style={{ fontSize: 12, fontWeight: '800', color: '#FFFFFF' }}>{label}</Text>
    </TouchableOpacity>
  );
}

// -------------------------------------------------------------
// BATCHES MANAGER SECTION
// -------------------------------------------------------------

function BatchesManagerSection({
  store,
  searchQuery,
  setSearchQuery,
  classFilter,
  setClassFilter,
  onCreateBatch,
  onEditBatch,
  onOpenBatchConsole,
  onToast,
}: {
  store: any;
  searchQuery: string;
  setSearchQuery: (s: string) => void;
  classFilter: 'all' | '9' | '10' | '11' | '12';
  setClassFilter: (c: any) => void;
  onCreateBatch: () => void;
  onEditBatch: (b: BatchItem) => void;
  onOpenBatchConsole: (b: BatchItem) => void;
  onToast: (t: any) => void;
}) {
  const filteredBatches = useMemo(() => {
    return store.batches.filter((b: BatchItem) => {
      const matchSearch =
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.joinCode.toLowerCase().includes(searchQuery.toLowerCase());
      const matchClass = classFilter === 'all' || b.classLevel.toString() === classFilter;
      return matchSearch && matchClass;
    });
  }, [store.batches, searchQuery, classFilter]);

  return (
    <View style={{ gap: 12 }}>
      {/* Search & Actions Header */}
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            paddingHorizontal: 10,
            borderWidth: 1,
            borderColor: '#E2E8F0',
            height: 40,
          }}
        >
          <Search size={16} color="#94A3B8" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search batches, codes, faculty..."
            placeholderTextColor="#94A3B8"
            style={{ flex: 1, marginLeft: 8, fontSize: 13, color: '#0F172A' }}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={14} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity
          onPress={onCreateBatch}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#2563EB',
            paddingHorizontal: 12,
            paddingVertical: 9,
            borderRadius: 12,
            height: 40,
            gap: 4,
          }}
        >
          <Plus size={16} color="#FFFFFF" />
          <Text style={{ fontSize: 12.5, fontWeight: '800', color: '#FFFFFF' }}>New Batch</Text>
        </TouchableOpacity>
      </View>

      {/* Class Level Filters */}
      <ClassFilterRow selected={classFilter} onSelect={setClassFilter} />

      {/* Batches List */}
      {filteredBatches.length === 0 ? (
        <EmptyState
          title="No batches found"
          description="Create your first classroom batch to admit students."
          actionLabel="Create Batch"
          onAction={onCreateBatch}
        />
      ) : (
        filteredBatches.map((b: BatchItem) => (
          <TouchableOpacity
            key={b.id}
            onPress={() => onOpenBatchConsole(b)}
            activeOpacity={0.88}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 14,
              borderWidth: 1,
              borderColor: '#E2E8F0',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 1,
              gap: 8,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <Badge label={`CLASS ${b.classLevel}`} variant="primary" size="sm" />
                  <Badge label={b.board.toUpperCase()} variant="neutral" size="sm" />
                  <Badge
                    label={b.mode.toUpperCase()}
                    variant={b.mode === 'offline' ? 'success' : b.mode === 'hybrid' ? 'primary' : 'warning'}
                    size="sm"
                  />
                </View>
                <Text style={{ fontSize: 15, fontWeight: '800', color: '#0F172A' }}>{b.title}</Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 6,
                    backgroundColor: '#EFF6FF',
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#2563EB' }}>
                    Console →
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation?.();
                    onEditBatch(b);
                  }}
                  style={{
                    padding: 6,
                    borderRadius: 8,
                    backgroundColor: '#F1F5F9',
                  }}
                >
                  <Edit3 size={15} color="#475569" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Timetable & Room */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Calendar size={13} color="#64748B" />
                <Text style={{ fontSize: 11.5, color: '#475569' }}>
                  {b.scheduleDays.join(', ')} • {b.scheduleTime}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <School size={13} color="#64748B" />
                <Text style={{ fontSize: 11.5, color: '#475569' }}>{b.room}</Text>
              </View>
            </View>

            {/* Enrolled & Fee info footer */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: 8,
                borderTopWidth: 1,
                borderTopColor: '#F1F5F9',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View>
                  <Text style={{ fontSize: 10, color: '#94A3B8', fontWeight: '700' }}>ENROLLED</Text>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#0F172A' }}>
                    {b.enrolledCount} / {b.capacity}
                  </Text>
                </View>
                <View>
                  <Text style={{ fontSize: 10, color: '#94A3B8', fontWeight: '700' }}>FEES</Text>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#0F172A' }}>
                    ₹{b.fee.toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>

              {/* Join Code Copy */}
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation?.();
                  Share.share({
                    message: `Join ${b.title} at Quick2Learn using Batch Code: ${b.joinCode}`,
                  });
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#EFF6FF',
                  paddingHorizontal: 9,
                  paddingVertical: 5,
                  borderRadius: 8,
                  gap: 4,
                }}
              >
                <Copy size={12} color="#2563EB" />
                <Text style={{ fontSize: 11.5, fontWeight: '800', color: '#2563EB' }}>Code: {b.joinCode}</Text>
              </TouchableOpacity>
            </View>

            {/* Tap prompt */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#F8FAFC',
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 8,
                marginTop: 2,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B' }}>
                Manage Videos • Study Material • Homework • Attendance
              </Text>
              <ChevronRight size={14} color="#2563EB" />
            </View>
          </TouchableOpacity>
        ))
      )}
    </View>
  );
}

// -------------------------------------------------------------
// RESOURCES / STUDY MATERIALS SECTION
// -------------------------------------------------------------

function ResourcesManagerSection({
  store,
  searchQuery,
  setSearchQuery,
  classFilter,
  setClassFilter,
  onUploadResource,
  onEditResource,
  onToast,
}: {
  store: any;
  searchQuery: string;
  setSearchQuery: (s: string) => void;
  classFilter: 'all' | '9' | '10' | '11' | '12';
  setClassFilter: (c: any) => void;
  onUploadResource: () => void;
  onEditResource: (r: AdminResourceItem) => void;
  onToast: (t: any) => void;
}) {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  const filteredResources = useMemo(() => {
    return store.resources.filter((r: AdminResourceItem) => {
      const matchSearch =
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.chapter.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.folderName && r.folderName.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchClass = classFilter === 'all' || r.classLevel.toString() === classFilter;
      return matchSearch && matchClass;
    });
  }, [store.resources, searchQuery, classFilter]);

  const availableFolders = useMemo(() => {
    return Array.from(
      new Set<string>(
        filteredResources.map((r: AdminResourceItem) => r.folderName || r.chapter || 'Class Study Material')
      )
    );
  }, [filteredResources]);

  const displayedResources = useMemo(() => {
    if (!selectedFolder) return filteredResources;
    return filteredResources.filter(
      (r: AdminResourceItem) =>
        (r.folderName || r.chapter || 'Class Study Material') === selectedFolder
    );
  }, [filteredResources, selectedFolder]);

  return (
    <View style={{ gap: 12 }}>
      {/* Search & Actions */}
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            paddingHorizontal: 10,
            borderWidth: 1,
            borderColor: '#E2E8F0',
            height: 40,
          }}
        >
          <Search size={16} color="#94A3B8" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search notes, solutions, DPPs..."
            placeholderTextColor="#94A3B8"
            style={{ flex: 1, marginLeft: 8, fontSize: 13, color: '#0F172A' }}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={14} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity
          onPress={onUploadResource}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#059669',
            paddingHorizontal: 12,
            paddingVertical: 9,
            borderRadius: 12,
            height: 40,
            gap: 4,
          }}
        >
          <FileUp size={16} color="#FFFFFF" />
          <Text style={{ fontSize: 12.5, fontWeight: '800', color: '#FFFFFF' }}>Upload PDF</Text>
        </TouchableOpacity>
      </View>

      <ClassFilterRow selected={classFilter} onSelect={setClassFilter} />

      {/* Breadcrumb if folder selected */}
      {selectedFolder && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#ECFDF5',
            padding: 10,
            borderRadius: 10,
            gap: 6,
            borderWidth: 1,
            borderColor: '#A7F3D0',
          }}
        >
          <TouchableOpacity onPress={() => setSelectedFolder(null)}>
            <Text style={{ fontSize: 12, fontWeight: '800', color: '#059669' }}>← All Solution Folders</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 12, color: '#64748B' }}>/</Text>
          <Text style={{ fontSize: 12, fontWeight: '800', color: '#065F46' }}>{selectedFolder}</Text>
        </View>
      )}

      {/* Folder Categories Row if not in a folder */}
      {!selectedFolder && availableFolders.length > 0 && (
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 11, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase' }}>
            Material Categories & Books ({availableFolders.length})
          </Text>
          <View style={{ gap: 6 }}>
            {availableFolders.map((fName) => {
              const count = filteredResources.filter(
                (r: AdminResourceItem) =>
                  (r.folderName || r.chapter || 'Class Study Material') === fName
              ).length;
              return (
                <TouchableOpacity
                  key={fName}
                  onPress={() => setSelectedFolder(fName)}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 12,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        backgroundColor: '#ECFDF5',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <FileText size={18} color="#059669" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13.5, fontWeight: '800', color: '#0F172A' }}>{fName}</Text>
                      <Text style={{ fontSize: 11, color: '#64748B' }}>
                        {count} PDF document{count !== 1 ? 's' : ''}
                      </Text>
                    </View>
                  </View>
                  <ChevronRight size={16} color="#94A3B8" />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* List */}
      <View style={{ gap: 8 }}>
        <Text style={{ fontSize: 11, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase' }}>
          {selectedFolder ? `Documents in ${selectedFolder}` : 'All Study Material Files'}
        </Text>
        {displayedResources.length === 0 ? (
          <EmptyState
            title="No study materials found"
            description="Upload your chapter notes, formula sheets, and DPP worksheets for students."
            actionLabel="Upload Material"
            onAction={onUploadResource}
          />
        ) : (
          displayedResources.map((r: AdminResourceItem) => (
            <View
              key={r.id}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 14,
                padding: 13,
                borderWidth: 1,
                borderColor: '#E2E8F0',
                gap: 8,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <Badge label={r.type.toUpperCase().replace('_', ' ')} variant="success" size="sm" />
                    <Badge label={`CLASS ${r.classLevel}`} variant="neutral" size="sm" />
                    <Badge
                      label={r.visibility === 'public' ? 'FREE MATERIAL' : 'BATCH ONLY'}
                      variant={r.visibility === 'public' ? 'success' : 'primary'}
                      size="sm"
                    />
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F172A' }}>{r.title}</Text>
                  <Text style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                    {r.chapter} • {r.fileSize} • {r.filePages} pages • {r.downloadCount} downloads
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => onEditResource(r)}
                  style={{
                    padding: 7,
                    borderRadius: radii.full,
                    backgroundColor: '#F1F5F9',
                  }}
                >
                  <Edit3 size={15} color="#475569" />
                </TouchableOpacity>
              </View>

              {/* Action buttons */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: 6,
                  borderTopWidth: 1,
                  borderTopColor: '#F1F5F9',
                }}
              >
                <TouchableOpacity
                  onPress={() => Linking.openURL(r.fileUrl)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                >
                  <Download size={13} color="#059669" />
                  <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#059669' }}>Download / View PDF</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={async () => {
                    const newVis = r.visibility === 'public' ? 'batch_only' : 'public';
                    await store.updateResource(r.id, { visibility: newVis });
                    onToast({
                      type: 'info',
                      message: `Visibility set to ${newVis === 'public' ? 'Free Material' : 'Batch Only'}.`,
                    });
                  }}
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 6,
                    backgroundColor: '#F1F5F9',
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569' }}>
                    {r.visibility === 'public' ? 'Make Batch Only' : 'Make Public'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>
    </View>
  );
}

// -------------------------------------------------------------
// LECTURES / VIDEO LESSONS SECTION
// -------------------------------------------------------------

function LecturesManagerSection({
  store,
  searchQuery,
  setSearchQuery,
  classFilter,
  setClassFilter,
  onAddLecture,
  onEditLecture,
  onToast,
}: {
  store: any;
  searchQuery: string;
  setSearchQuery: (s: string) => void;
  classFilter: 'all' | '9' | '10' | '11' | '12';
  setClassFilter: (c: any) => void;
  onAddLecture: () => void;
  onEditLecture: (l: AdminLectureItem) => void;
  onToast: (t: any) => void;
}) {
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);

  const filteredLectures = useMemo(() => {
    return store.lectures.filter((l: AdminLectureItem) => {
      const matchSearch =
        l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.chapter.toLowerCase().includes(searchQuery.toLowerCase());
      const matchClass = classFilter === 'all' || l.classLevel.toString() === classFilter;
      return matchSearch && matchClass;
    });
  }, [store.lectures, searchQuery, classFilter]);

  const lectureChapters = useMemo(() => {
    return Array.from(new Set<string>(filteredLectures.map((l: AdminLectureItem) => l.chapter)));
  }, [filteredLectures]);

  const displayedLectures = useMemo(() => {
    if (!selectedChapter) return filteredLectures;
    return filteredLectures.filter((l: AdminLectureItem) => l.chapter === selectedChapter);
  }, [filteredLectures, selectedChapter]);

  return (
    <View style={{ gap: 12 }}>
      {/* Search & Actions */}
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            paddingHorizontal: 10,
            borderWidth: 1,
            borderColor: '#E2E8F0',
            height: 40,
          }}
        >
          <Search size={16} color="#94A3B8" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search YouTube lectures, chapters..."
            placeholderTextColor="#94A3B8"
            style={{ flex: 1, marginLeft: 8, fontSize: 13, color: '#0F172A' }}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={14} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity
          onPress={onAddLecture}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#7C3AED',
            paddingHorizontal: 12,
            paddingVertical: 9,
            borderRadius: 12,
            height: 40,
            gap: 4,
          }}
        >
          <Plus size={16} color="#FFFFFF" />
          <Text style={{ fontSize: 12.5, fontWeight: '800', color: '#FFFFFF' }}>Add Video</Text>
        </TouchableOpacity>
      </View>

      <ClassFilterRow selected={classFilter} onSelect={setClassFilter} />

      {/* Breadcrumb if chapter selected */}
      {selectedChapter && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#F5F3FF',
            padding: 10,
            borderRadius: 10,
            gap: 6,
            borderWidth: 1,
            borderColor: '#DDD6FE',
          }}
        >
          <TouchableOpacity onPress={() => setSelectedChapter(null)}>
            <Text style={{ fontSize: 12, fontWeight: '800', color: '#7C3AED' }}>← All Chapter Folders</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 12, color: '#64748B' }}>/</Text>
          <Text style={{ fontSize: 12, fontWeight: '800', color: '#5B21B6' }}>{selectedChapter}</Text>
        </View>
      )}

      {/* Chapter Folders Scroll if not in a chapter */}
      {!selectedChapter && lectureChapters.length > 0 && (
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 11, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase' }}>
            Chapter Folders ({lectureChapters.length})
          </Text>
          <View style={{ gap: 6 }}>
            {lectureChapters.map((chName) => {
              const count = filteredLectures.filter((l: AdminLectureItem) => l.chapter === chName).length;
              return (
                <TouchableOpacity
                  key={chName}
                  onPress={() => setSelectedChapter(chName)}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 12,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        backgroundColor: '#F5F3FF',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Video size={18} color="#7C3AED" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13.5, fontWeight: '800', color: '#0F172A' }}>{chName}</Text>
                      <Text style={{ fontSize: 11, color: '#64748B' }}>
                        {count} lecture{count !== 1 ? 's' : ''}
                      </Text>
                    </View>
                  </View>
                  <ChevronRight size={16} color="#94A3B8" />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* List */}
      <View style={{ gap: 8 }}>
        <Text style={{ fontSize: 11, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase' }}>
          {selectedChapter ? `Lectures in ${selectedChapter}` : 'All Video Lectures'}
        </Text>
        {displayedLectures.length === 0 ? (
          <EmptyState
            title="No lectures added yet"
            description="Map your YouTube lectures from @Quick2Learn to course chapters."
            actionLabel="Add Video Lecture"
            onAction={onAddLecture}
          />
        ) : (
          displayedLectures.map((l: AdminLectureItem) => (
            <View
              key={l.id}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 14,
                padding: 13,
                borderWidth: 1,
                borderColor: '#E2E8F0',
                gap: 8,
              }}
            >
              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                <TouchableOpacity
                  onPress={() => Linking.openURL(`https://www.youtube.com/watch?v=${l.youtubeId}`)}
                  style={{
                    width: 76,
                    height: 52,
                    borderRadius: 8,
                    backgroundColor: '#0F172A',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Play size={18} color="#FFFFFF" fill="#FFFFFF" />
                  <View
                    style={{
                      position: 'absolute',
                      bottom: 2,
                      right: 2,
                      backgroundColor: 'rgba(0,0,0,0.7)',
                      paddingHorizontal: 4,
                      borderRadius: 3,
                    }}
                  >
                    <Text style={{ fontSize: 9, fontWeight: '700', color: '#FFFFFF' }}>{l.duration}</Text>
                  </View>
                </TouchableOpacity>

                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <Badge label={`CLASS ${l.classLevel}`} variant="primary" size="sm" />
                    <Badge label={l.isPublished ? 'PUBLISHED' : 'DRAFT'} variant={l.isPublished ? 'success' : 'neutral'} size="sm" />
                  </View>
                  <Text style={{ fontSize: 13.5, fontWeight: '800', color: '#0F172A' }} numberOfLines={2}>
                    {l.title}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                    {l.chapter} • {l.viewsCount} views
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => onEditLecture(l)}
                  style={{
                    padding: 7,
                    borderRadius: radii.full,
                    backgroundColor: '#F1F5F9',
                  }}
                >
                  <Edit3 size={15} color="#475569" />
                </TouchableOpacity>
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: 6,
                  borderTopWidth: 1,
                  borderTopColor: '#F1F5F9',
                }}
              >
                <TouchableOpacity
                  onPress={() => Linking.openURL(`https://www.youtube.com/watch?v=${l.youtubeId}`)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                >
                  <ExternalLink size={12} color="#7C3AED" />
                  <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#7C3AED' }}>Watch on YouTube</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={async () => {
                    await store.updateLecture(l.id, { isPublished: !l.isPublished });
                    onToast({
                      type: 'info',
                      message: `Lecture ${l.isPublished ? 'unpublished' : 'published'}.`,
                    });
                  }}
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 6,
                    backgroundColor: '#F1F5F9',
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569' }}>
                    {l.isPublished ? 'Unpublish' : 'Publish'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>
    </View>
  );
}

// -------------------------------------------------------------
// QUESTION BANK SECTION
// -------------------------------------------------------------

function QuestionsManagerSection({
  store,
  searchQuery,
  setSearchQuery,
  classFilter,
  setClassFilter,
  onAddQuestion,
  onEditQuestion,
  onToast,
}: {
  store: any;
  searchQuery: string;
  setSearchQuery: (s: string) => void;
  classFilter: 'all' | '9' | '10' | '11' | '12';
  setClassFilter: (c: any) => void;
  onAddQuestion: () => void;
  onEditQuestion: (q: AdminQuestionItem) => void;
  onToast: (t: any) => void;
}) {
  const filteredQuestions = useMemo(() => {
    return store.questions.filter((q: AdminQuestionItem) => {
      const matchSearch =
        q.statement.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.chapter.toLowerCase().includes(searchQuery.toLowerCase());
      const matchClass = classFilter === 'all' || q.classLevel.toString() === classFilter;
      return matchSearch && matchClass;
    });
  }, [store.questions, searchQuery, classFilter]);

  return (
    <View style={{ gap: 12 }}>
      {/* Search & Actions */}
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            paddingHorizontal: 10,
            borderWidth: 1,
            borderColor: '#E2E8F0',
            height: 40,
          }}
        >
          <Search size={16} color="#94A3B8" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search questions by text or chapter..."
            placeholderTextColor="#94A3B8"
            style={{ flex: 1, marginLeft: 8, fontSize: 13, color: '#0F172A' }}
          />
        </View>

        <TouchableOpacity
          onPress={onAddQuestion}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#D97706',
            paddingHorizontal: 12,
            paddingVertical: 9,
            borderRadius: 12,
            height: 40,
            gap: 4,
          }}
        >
          <Plus size={16} color="#FFFFFF" />
          <Text style={{ fontSize: 12.5, fontWeight: '800', color: '#FFFFFF' }}>Add Q</Text>
        </TouchableOpacity>
      </View>

      <ClassFilterRow selected={classFilter} onSelect={setClassFilter} />

      {/* List */}
      {filteredQuestions.length === 0 ? (
        <EmptyState
          title="Question Bank Empty"
          description="Add MCQ and objective practice questions with step-by-step solutions."
          actionLabel="Add Question"
          onAction={onAddQuestion}
        />
      ) : (
        filteredQuestions.map((q: AdminQuestionItem, idx: number) => (
          <View
            key={q.id}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 14,
              borderWidth: 1,
              borderColor: '#E2E8F0',
              gap: 8,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Badge label={`Q${idx + 1}`} variant="primary" size="sm" />
                <Badge label={`CLASS ${q.classLevel}`} variant="neutral" size="sm" />
                <Badge
                  label={q.difficulty.toUpperCase()}
                  variant={q.difficulty === 'easy' ? 'success' : q.difficulty === 'medium' ? 'warning' : 'danger'}
                  size="sm"
                />
                <Badge label={`+${q.marks} / -${q.negativeMarks}`} variant="neutral" size="sm" />
              </View>

              <TouchableOpacity
                onPress={() => onEditQuestion(q)}
                style={{
                  padding: 6,
                  borderRadius: 8,
                  backgroundColor: '#F1F5F9',
                }}
              >
                <Edit3 size={15} color="#475569" />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F172A', lineHeight: 20 }}>
              {q.statement}
            </Text>

            {/* Options */}
            <View style={{ gap: 4, marginTop: 4 }}>
              {q.options.map((opt, optIdx) => {
                const isCorrect = optIdx === q.correctOptionIndex;
                return (
                  <View
                    key={optIdx}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 8,
                      backgroundColor: isCorrect ? '#ECFDF5' : '#F8FAFC',
                      borderWidth: 1,
                      borderColor: isCorrect ? '#A7F3D0' : '#E2E8F0',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '800',
                        color: isCorrect ? '#065F46' : '#64748B',
                        marginRight: 6,
                      }}
                    >
                      {String.fromCharCode(65 + optIdx)}.
                    </Text>
                    <Text
                      style={{
                        fontSize: 12.5,
                        fontWeight: isCorrect ? '700' : '400',
                        color: isCorrect ? '#065F46' : '#334155',
                        flex: 1,
                      }}
                    >
                      {opt}
                    </Text>
                    {isCorrect && <Check size={14} color="#059669" />}
                  </View>
                );
              })}
            </View>

            {/* Explanation */}
            {q.explanation && (
              <View
                style={{
                  marginTop: 4,
                  padding: 8,
                  borderRadius: 8,
                  backgroundColor: '#F1F5F9',
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569' }}>Solution Explanation:</Text>
                <Text style={{ fontSize: 11.5, color: '#334155', marginTop: 2 }}>{q.explanation}</Text>
              </View>
            )}
          </View>
        ))
      )}
    </View>
  );
}

// -------------------------------------------------------------
// TESTS & EXAMS SECTION
// -------------------------------------------------------------

function TestsManagerSection({
  store,
  searchQuery,
  setSearchQuery,
  classFilter,
  setClassFilter,
  onCreateTest,
  onEditTest,
  onToast,
}: {
  store: any;
  searchQuery: string;
  setSearchQuery: (s: string) => void;
  classFilter: 'all' | '9' | '10' | '11' | '12';
  setClassFilter: (c: any) => void;
  onCreateTest: () => void;
  onEditTest: (t: AdminTestItem) => void;
  onToast: (t: any) => void;
}) {
  const filteredTests = useMemo(() => {
    return store.tests.filter((t: AdminTestItem) => {
      const matchSearch =
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.subject.toLowerCase().includes(searchQuery.toLowerCase());
      const matchClass = classFilter === 'all' || t.classLevel.toString() === classFilter;
      return matchSearch && matchClass;
    });
  }, [store.tests, searchQuery, classFilter]);

  return (
    <View style={{ gap: 12 }}>
      {/* Search & Actions */}
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            paddingHorizontal: 10,
            borderWidth: 1,
            borderColor: '#E2E8F0',
            height: 40,
          }}
        >
          <Search size={16} color="#94A3B8" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search tests, mock exams..."
            placeholderTextColor="#94A3B8"
            style={{ flex: 1, marginLeft: 8, fontSize: 13, color: '#0F172A' }}
          />
        </View>

        <TouchableOpacity
          onPress={onCreateTest}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#0891B2',
            paddingHorizontal: 12,
            paddingVertical: 9,
            borderRadius: 12,
            height: 40,
            gap: 4,
          }}
        >
          <Plus size={16} color="#FFFFFF" />
          <Text style={{ fontSize: 12.5, fontWeight: '800', color: '#FFFFFF' }}>New Test</Text>
        </TouchableOpacity>
      </View>

      <ClassFilterRow selected={classFilter} onSelect={setClassFilter} />

      {/* List */}
      {filteredTests.length === 0 ? (
        <EmptyState
          title="No Tests Scheduled"
          description="Build chapter unit tests and full-syllabus mock assessments."
          actionLabel="Create Test"
          onAction={onCreateTest}
        />
      ) : (
        filteredTests.map((t: AdminTestItem) => (
          <View
            key={t.id}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 14,
              borderWidth: 1,
              borderColor: '#E2E8F0',
              gap: 8,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <Badge label={`CLASS ${t.classLevel}`} variant="primary" size="sm" />
                  <Badge
                    label={t.status.toUpperCase()}
                    variant={t.status === 'live' ? 'danger' : t.status === 'completed' ? 'success' : 'warning'}
                    size="sm"
                  />
                  <Badge label={`${t.durationMinutes} MINS`} variant="neutral" size="sm" />
                </View>
                <Text style={{ fontSize: 15, fontWeight: '800', color: '#0F172A' }}>{t.title}</Text>
              </View>

              <TouchableOpacity
                onPress={() => onEditTest(t)}
                style={{
                  padding: 6,
                  borderRadius: 8,
                  backgroundColor: '#F1F5F9',
                }}
              >
                <Edit3 size={15} color="#475569" />
              </TouchableOpacity>
            </View>

            {/* Chapters covered */}
            <Text style={{ fontSize: 11.5, color: '#64748B' }}>
              Chapters: {t.chapters.join(', ')}
            </Text>

            {/* Stats strip */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: 8,
                borderTopWidth: 1,
                borderTopColor: '#F1F5F9',
              }}
            >
              <View style={{ flexDirection: 'row', gap: 14 }}>
                <View>
                  <Text style={{ fontSize: 10, color: '#94A3B8', fontWeight: '700' }}>TOTAL MARKS</Text>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#0F172A' }}>{t.totalMarks}</Text>
                </View>
                <View>
                  <Text style={{ fontSize: 10, color: '#94A3B8', fontWeight: '700' }}>QUESTIONS</Text>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#0F172A' }}>{t.questionsCount}</Text>
                </View>
                <View>
                  <Text style={{ fontSize: 10, color: '#94A3B8', fontWeight: '700' }}>SUBMISSIONS</Text>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#0F172A' }}>{t.submissionsCount}</Text>
                </View>
              </View>

              {/* Publish Results Button if completed */}
              {t.submissionsCount > 0 && !t.isPublished && (
                <TouchableOpacity
                  onPress={async () => {
                    await store.publishTestResults(t.id);
                    onToast({ type: 'success', message: 'Test results released to students & parents!' });
                  }}
                  style={{
                    backgroundColor: '#16A34A',
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ fontSize: 11.5, fontWeight: '800', color: '#FFFFFF' }}>Publish Results</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))
      )}
    </View>
  );
}

// -------------------------------------------------------------
// STUDENTS DIRECTORY SECTION
// -------------------------------------------------------------

function StudentsDirectorySection({
  store,
  searchQuery,
  setSearchQuery,
  classFilter,
  setClassFilter,
  onEnrollStudent,
  onToast,
}: {
  store: any;
  searchQuery: string;
  setSearchQuery: (s: string) => void;
  classFilter: 'all' | '9' | '10' | '11' | '12';
  setClassFilter: (c: any) => void;
  onEnrollStudent: (s: AdminStudentItem) => void;
  onToast: (t: any) => void;
}) {
  const filteredStudents = useMemo(() => {
    return store.students.filter((s: AdminStudentItem) => {
      const matchSearch =
        s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.phone.includes(searchQuery) ||
        s.school.toLowerCase().includes(searchQuery.toLowerCase());
      const matchClass = classFilter === 'all' || s.classLevel.toString() === classFilter;
      return matchSearch && matchClass;
    });
  }, [store.students, searchQuery, classFilter]);

  return (
    <View style={{ gap: 12 }}>
      {/* Search */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#FFFFFF',
          borderRadius: 12,
          paddingHorizontal: 10,
          borderWidth: 1,
          borderColor: '#E2E8F0',
          height: 40,
        }}
      >
        <Search size={16} color="#94A3B8" />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search student by name, phone, school..."
          placeholderTextColor="#94A3B8"
          style={{ flex: 1, marginLeft: 8, fontSize: 13, color: '#0F172A' }}
        />
      </View>

      <ClassFilterRow selected={classFilter} onSelect={setClassFilter} />

      {/* List */}
      {filteredStudents.length === 0 ? (
        <EmptyState title="No students found" description="Try adjusting your search criteria." />
      ) : (
        filteredStudents.map((s: AdminStudentItem) => (
          <View
            key={s.id}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 14,
              borderWidth: 1,
              borderColor: '#E2E8F0',
              gap: 8,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <Badge label={`CLASS ${s.classLevel}`} variant="primary" size="sm" />
                  <Badge label={s.board.toUpperCase()} variant="neutral" size="sm" />
                  <Badge
                    label={s.feeStatus.toUpperCase()}
                    variant={s.feeStatus === 'paid' ? 'success' : s.feeStatus === 'due' ? 'warning' : 'danger'}
                    size="sm"
                  />
                </View>
                <Text style={{ fontSize: 15, fontWeight: '800', color: '#0F172A' }}>{s.fullName}</Text>
                <Text style={{ fontSize: 11.5, color: '#64748B' }}>{s.school}</Text>
              </View>

              {/* Attendance badge */}
              <View
                style={{
                  backgroundColor: '#ECFDF5',
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 8,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#059669' }}>{s.attendanceRate}%</Text>
                <Text style={{ fontSize: 9, fontWeight: '700', color: '#059669' }}>ATTENDANCE</Text>
              </View>
            </View>

            {/* Enrolled Batches */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
              {s.enrolledBatchNames.map((name, i) => (
                <View
                  key={i}
                  style={{
                    backgroundColor: '#F1F5F9',
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 6,
                  }}
                >
                  <Text style={{ fontSize: 11, color: '#475569', fontWeight: '600' }}>{name}</Text>
                </View>
              ))}
            </View>

            {/* Actions Bar */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: 8,
                borderTopWidth: 1,
                borderTopColor: '#F1F5F9',
              }}
            >
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <TouchableOpacity
                  onPress={() => Linking.openURL(`tel:${s.phone}`)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#EFF6FF',
                    paddingHorizontal: 8,
                    paddingVertical: 5,
                    borderRadius: 8,
                    gap: 4,
                  }}
                >
                  <Phone size={13} color="#2563EB" />
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#2563EB' }}>Call</Text>
                </TouchableOpacity>

                {s.parentPhone && (
                  <TouchableOpacity
                    onPress={() => Linking.openURL(`tel:${s.parentPhone}`)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: '#F8FAFC',
                      paddingHorizontal: 8,
                      paddingVertical: 5,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: '#E2E8F0',
                      gap: 4,
                    }}
                  >
                    <Users size={13} color="#64748B" />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569' }}>Parent</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={{ flexDirection: 'row', gap: 6 }}>
                <TouchableOpacity
                  onPress={async () => {
                    const code = await store.generateParentCode(s.id);
                    Share.share({
                      message: `Parent code for ${s.fullName} on Quick2Learn app: ${code}`,
                    });
                  }}
                  style={{
                    backgroundColor: '#F3E8FF',
                    paddingHorizontal: 8,
                    paddingVertical: 5,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#7C3AED' }}>
                    Invite Code: {s.parentInviteCode}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => onEnrollStudent(s)}
                  style={{
                    backgroundColor: '#2563EB',
                    paddingHorizontal: 9,
                    paddingVertical: 5,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#FFFFFF' }}>+ Batch</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))
      )}
    </View>
  );
}

// -------------------------------------------------------------
// FEES & COLLECTIONS SECTION
// -------------------------------------------------------------

function FeesManagerSection({
  store,
  onRecordFee,
  onToast,
}: {
  store: any;
  onRecordFee: () => void;
  onToast: (t: any) => void;
}) {
  const [feeTab, setFeeTab] = useState<'receipts' | 'dues'>('receipts');

  return (
    <View style={{ gap: 12 }}>
      {/* Header bar */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <TouchableOpacity
            onPress={() => setFeeTab('receipts')}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: radii.full,
              backgroundColor: feeTab === 'receipts' ? '#4F46E5' : '#F1F5F9',
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: '700',
                color: feeTab === 'receipts' ? '#FFFFFF' : '#475569',
              }}
            >
              Fee Receipts ({store.payments.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFeeTab('dues')}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: radii.full,
              backgroundColor: feeTab === 'dues' ? '#DC2626' : '#F1F5F9',
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: '700',
                color: feeTab === 'dues' ? '#FFFFFF' : '#475569',
              }}
            >
              Overdue Dues ({store.feeDues.length})
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={onRecordFee}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#4F46E5',
            paddingHorizontal: 10,
            paddingVertical: 7,
            borderRadius: 10,
            gap: 4,
          }}
        >
          <Plus size={14} color="#FFFFFF" />
          <Text style={{ fontSize: 12, fontWeight: '800', color: '#FFFFFF' }}>Record Fee</Text>
        </TouchableOpacity>
      </View>

      {/* Content based on tab */}
      {feeTab === 'receipts' ? (
        store.payments.length === 0 ? (
          <EmptyState title="No transactions yet" description="Record offline or view online fee payments." />
        ) : (
          store.payments.map((p: AdminPaymentItem) => (
            <View
              key={p.id}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 14,
                padding: 13,
                borderWidth: 1,
                borderColor: '#E2E8F0',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flex: 1, marginRight: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#4F46E5' }}>{p.receiptNo}</Text>
                  <Badge label={p.paymentMethod.toUpperCase()} variant="neutral" size="sm" />
                </View>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F172A' }}>{p.studentName}</Text>
                <Text style={{ fontSize: 11.5, color: '#64748B' }}>
                  {p.batchTitle} • {p.notes || 'Tuition fee'}
                </Text>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#16A34A' }}>
                  ₹{p.amount.toLocaleString('en-IN')}
                </Text>
                <Text style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>
                  {new Date(p.paidAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
          ))
        )
      ) : store.feeDues.length === 0 ? (
        <EmptyState title="No Overdue Dues" description="All student tuition fee dues are clear!" />
      ) : (
        store.feeDues.map((d: any) => (
          <View
            key={d.id}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 14,
              padding: 13,
              borderWidth: 1,
              borderColor: '#FEE2E2',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flex: 1, marginRight: 8 }}>
              <View style={{ marginBottom: 3 }}>
                <Badge label="OVERDUE" variant="danger" size="sm" />
              </View>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F172A' }}>{d.studentName}</Text>
              <Text style={{ fontSize: 11.5, color: '#64748B' }}>
                {d.batchTitle} • Due: {d.dueDate}
              </Text>
            </View>

            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#DC2626' }}>
                ₹{d.amount.toLocaleString('en-IN')}
              </Text>
              <TouchableOpacity
                onPress={onRecordFee}
                style={{
                  backgroundColor: '#4F46E5',
                  paddingHorizontal: 9,
                  paddingVertical: 5,
                  borderRadius: 8,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#FFFFFF' }}>Pay Cash</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </View>
  );
}

// -------------------------------------------------------------
// DOUBTS INBOX SECTION
// -------------------------------------------------------------

function DoubtsInboxSection({
  store,
  onReplyDoubt,
  onToast,
}: {
  store: any;
  onReplyDoubt: (d: AdminDoubtItem) => void;
  onToast: (t: any) => void;
}) {
  return (
    <View style={{ gap: 12 }}>
      {store.doubts.length === 0 ? (
        <EmptyState title="No Student Doubts" description="All doubts have been answered by faculty!" />
      ) : (
        store.doubts.map((d: AdminDoubtItem) => (
          <View
            key={d.id}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 14,
              borderWidth: 1,
              borderColor: d.status === 'open' ? '#FED7AA' : '#E2E8F0',
              gap: 8,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Badge
                  label={d.status.toUpperCase()}
                  variant={d.status === 'open' ? 'warning' : 'success'}
                  size="sm"
                />
                <Badge label={d.subject} variant="neutral" size="sm" />
              </View>
              <Text style={{ fontSize: 11, color: '#94A3B8' }}>{d.batchTitle}</Text>
            </View>

            <View>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748B' }}>
                Student: {d.studentName}
              </Text>
              <Text style={{ fontSize: 13.5, fontWeight: '600', color: '#0F172A', marginTop: 2, lineHeight: 19 }}>
                {d.questionText}
              </Text>
            </View>

            {/* Replies */}
            {d.replies.length > 0 && (
              <View style={{ backgroundColor: '#F8FAFC', padding: 8, borderRadius: 8, gap: 4 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569' }}>
                  {d.replies[0].authorName}:
                </Text>
                <Text style={{ fontSize: 12, color: '#334155' }}>{d.replies[0].text}</Text>
              </View>
            )}

            {/* Action */}
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingTop: 6 }}>
              <TouchableOpacity
                onPress={() => onReplyDoubt(d)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: d.status === 'open' ? '#2563EB' : '#F1F5F9',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8,
                  gap: 4,
                }}
              >
                <Send size={13} color={d.status === 'open' ? '#FFFFFF' : '#475569'} />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '700',
                    color: d.status === 'open' ? '#FFFFFF' : '#475569',
                  }}
                >
                  {d.status === 'open' ? 'Reply to Student' : 'View Thread'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </View>
  );
}

// -------------------------------------------------------------
// ANNOUNCEMENTS SECTION
// -------------------------------------------------------------

function AnnouncementsManagerSection({
  store,
  onBroadcast,
  onToast,
}: {
  store: any;
  onBroadcast: () => void;
  onToast: (t: any) => void;
}) {
  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 14, fontWeight: '800', color: '#0F172A' }}>
          Broadcast Announcements ({store.announcements.length})
        </Text>
        <TouchableOpacity
          onPress={onBroadcast}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#E11D48',
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 10,
            gap: 4,
          }}
        >
          <Plus size={15} color="#FFFFFF" />
          <Text style={{ fontSize: 12.5, fontWeight: '800', color: '#FFFFFF' }}>Post</Text>
        </TouchableOpacity>
      </View>

      {store.announcements.map((a: AdminAnnouncementItem) => (
        <View
          key={a.id}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 14,
            borderWidth: 1,
            borderColor: a.priority === 'urgent' ? '#FECDD3' : '#E2E8F0',
            gap: 6,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Badge
              label={a.priority.toUpperCase()}
              variant={a.priority === 'urgent' ? 'danger' : 'neutral'}
              size="sm"
            />
            <TouchableOpacity onPress={() => store.deleteAnnouncement(a.id)}>
              <Trash2 size={15} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <Text style={{ fontSize: 15, fontWeight: '800', color: '#0F172A' }}>{a.title}</Text>
          <Text style={{ fontSize: 12.5, color: '#334155', lineHeight: 18 }}>{a.body}</Text>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
            <Text style={{ fontSize: 11, color: '#64748B' }}>Target: {a.targetAudience}</Text>
            <Text style={{ fontSize: 11, color: '#94A3B8' }}>{a.authorName}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

// -------------------------------------------------------------
// ADMISSION LEADS / ENQUIRIES SECTION
// -------------------------------------------------------------

function EnquiriesManagerSection({
  store,
  onSelectEnquiry,
  onToast,
}: {
  store: any;
  onSelectEnquiry: (e: AdminEnquiryItem) => void;
  onToast: (t: any) => void;
}) {
  return (
    <View style={{ gap: 12 }}>
      {store.enquiries.map((e: AdminEnquiryItem) => (
        <TouchableOpacity
          key={e.id}
          activeOpacity={0.7}
          onPress={() => onSelectEnquiry(e)}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 14,
            borderWidth: 1,
            borderColor: e.status === 'new' ? '#BFDBFE' : '#E2E8F0',
            gap: 6,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Badge
                label={e.status.toUpperCase()}
                variant={e.status === 'new' ? 'primary' : e.status === 'enrolled' ? 'success' : 'neutral'}
                size="sm"
              />
              <Badge label={`CLASS ${e.classLevel}`} variant="neutral" size="sm" />
            </View>
            <Text style={{ fontSize: 11, color: '#94A3B8' }}>
              {new Date(e.createdAt).toLocaleDateString()}
            </Text>
          </View>

          <Text style={{ fontSize: 15, fontWeight: '800', color: '#0F172A' }}>{e.studentName}</Text>
          <Text style={{ fontSize: 12.5, color: '#475569', lineHeight: 17 }} numberOfLines={2}>
            {e.message}
          </Text>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: 8,
              borderTopWidth: 1,
              borderTopColor: '#F1F5F9',
              marginTop: 4,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#2563EB' }}>{e.phone}</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                onPress={() => Linking.openURL(`tel:${e.phone}`)}
                style={{
                  backgroundColor: '#EFF6FF',
                  paddingHorizontal: 9,
                  paddingVertical: 5,
                  borderRadius: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Phone size={13} color="#2563EB" />
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#2563EB' }}>Call</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => Linking.openURL(`https://wa.me/${e.phone.replace(/[^0-9]/g, '')}`)}
                style={{
                  backgroundColor: '#ECFDF5',
                  paddingHorizontal: 9,
                  paddingVertical: 5,
                  borderRadius: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <MessageCircle size={13} color="#059669" />
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#059669' }}>WhatsApp</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// -------------------------------------------------------------
// FILTER CHIP ROW
// -------------------------------------------------------------

function ClassFilterRow({
  selected,
  onSelect,
}: {
  selected: 'all' | '9' | '10' | '11' | '12';
  onSelect: (val: 'all' | '9' | '10' | '11' | '12') => void;
}) {
  const options: Array<{ label: string; value: 'all' | '9' | '10' | '11' | '12' }> = [
    { label: 'All Classes', value: 'all' },
    { label: 'Class IX', value: '9' },
    { label: 'Class X', value: '10' },
    { label: 'Class XI', value: '11' },
    { label: 'Class XII', value: '12' },
  ];

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
      {options.map((opt) => {
        const isSelected = selected === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            onPress={() => onSelect(opt.value)}
            style={{
              paddingHorizontal: 11,
              paddingVertical: 5,
              borderRadius: radii.full,
              backgroundColor: isSelected ? '#0F172A' : '#F1F5F9',
            }}
          >
            <Text
              style={{
                fontSize: 11.5,
                fontWeight: '700',
                color: isSelected ? '#FFFFFF' : '#475569',
              }}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

// -------------------------------------------------------------
// MODALS IMPLEMENTATION
// -------------------------------------------------------------

function BatchFormModal({
  visible,
  batch,
  onClose,
  onSave,
  onDelete,
}: {
  visible: boolean;
  batch: BatchItem | null;
  onClose: () => void;
  onSave: (b: Partial<BatchItem>) => void;
  onDelete: (id: string) => void;
}) {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Mathematics');
  const [classLevel, setClassLevel] = useState<9 | 10 | 11 | 12>(12);
  const [board, setBoard] = useState<'cbse' | 'icse' | 'isc'>('cbse');
  const [mode, setMode] = useState<'offline' | 'hybrid' | 'online'>('offline');
  const [fee, setFee] = useState('20000');
  const [capacity, setCapacity] = useState('35');
  const [room, setRoom] = useState('Hall 1, Quick2Learn Mathura');
  const [faculty, setFaculty] = useState('Dinesh Singh Rajput');
  const [scheduleTime, setScheduleTime] = useState('5:00 PM - 6:30 PM');

  useEffect(() => {
    if (batch) {
      setTitle(batch.title);
      setSubject(batch.subject);
      setClassLevel(batch.classLevel);
      setBoard(batch.board);
      setMode(batch.mode);
      setFee(batch.fee.toString());
      setCapacity(batch.capacity.toString());
      setRoom(batch.room);
      setFaculty(batch.faculty);
      setScheduleTime(batch.scheduleTime);
    } else {
      setTitle('');
      setSubject('Mathematics');
      setClassLevel(12);
      setBoard('cbse');
      setMode('offline');
      setFee('20000');
      setCapacity('35');
      setRoom('Hall 1, Quick2Learn Mathura');
      setFaculty('Dinesh Singh Rajput');
      setScheduleTime('5:00 PM - 6:30 PM');
    }
  }, [batch, visible]);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
      >
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: '90%',
            padding: 16,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 17, fontWeight: '800', color: '#0F172A' }}>
              {batch ? 'Edit Batch' : 'Create New Batch'}
            </Text>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 20 }}>
            <FormField label="Batch Title" value={title} onChangeText={setTitle} placeholder="e.g. Class XII CBSE Target 100" />
            <FormField label="Subject" value={subject} onChangeText={setSubject} placeholder="Mathematics, Chemistry, etc." />
            
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 4 }}>Class Level</Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {([9, 10, 11, 12] as const).map((lvl) => (
                    <TouchableOpacity
                      key={lvl}
                      onPress={() => setClassLevel(lvl)}
                      style={{
                        flex: 1,
                        paddingVertical: 7,
                        borderRadius: 8,
                        backgroundColor: classLevel === lvl ? '#2563EB' : '#F1F5F9',
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '800', color: classLevel === lvl ? '#FFFFFF' : '#475569' }}>
                        {lvl}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 4 }}>Mode</Text>
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  {(['offline', 'hybrid', 'online'] as const).map((m) => (
                    <TouchableOpacity
                      key={m}
                      onPress={() => setMode(m)}
                      style={{
                        flex: 1,
                        paddingVertical: 7,
                        borderRadius: 8,
                        backgroundColor: mode === m ? '#059669' : '#F1F5F9',
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '700', color: mode === m ? '#FFFFFF' : '#475569' }}>
                        {m.slice(0, 3).toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <FormField label="Tuition Fee (₹)" value={fee} onChangeText={setFee} keyboardType="numeric" />
              </View>
              <View style={{ flex: 1 }}>
                <FormField label="Seat Capacity" value={capacity} onChangeText={setCapacity} keyboardType="numeric" />
              </View>
            </View>

            <FormField label="Schedule Time" value={scheduleTime} onChangeText={setScheduleTime} placeholder="e.g. 5:00 PM - 6:30 PM" />
            <FormField label="Classroom / Center" value={room} onChangeText={setRoom} placeholder="Room 101, Mathura Center" />
            <FormField label="Faculty" value={faculty} onChangeText={setFaculty} />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              {batch && (
                <TouchableOpacity
                  onPress={() => onDelete(batch.id)}
                  style={{
                    backgroundColor: '#FEE2E2',
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    borderRadius: 12,
                    alignItems: 'center',
                  }}
                >
                  <Trash2 size={18} color="#DC2626" />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => {
                  if (!title.trim()) {
                    Alert.alert('Required', 'Please enter batch title.');
                    return;
                  }
                  onSave({
                    title,
                    subject,
                    classLevel,
                    board,
                    mode,
                    fee: parseInt(fee) || 20000,
                    capacity: parseInt(capacity) || 35,
                    room,
                    faculty,
                    scheduleTime,
                    scheduleDays: ['Mon', 'Wed', 'Fri'],
                    startDate: '2026-04-10',
                    endDate: '2027-02-28',
                    status: 'ongoing',
                  });
                }}
                style={{
                  flex: 1,
                  backgroundColor: '#2563EB',
                  paddingVertical: 13,
                  borderRadius: 12,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '800', color: '#FFFFFF' }}>
                  {batch ? 'Save Changes' : 'Publish Batch'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function ResourceFormModal({
  visible,
  resource,
  batches,
  onClose,
  onSave,
  onDelete,
}: {
  visible: boolean;
  resource: AdminResourceItem | null;
  batches: BatchItem[];
  onClose: () => void;
  onSave: (r: Partial<AdminResourceItem>) => void;
  onDelete: (id: string) => void;
}) {
  const [title, setTitle] = useState('');
  const [chapter, setChapter] = useState('');
  const [type, setType] = useState<AdminResourceItem['type']>('notes');
  const [classLevel, setClassLevel] = useState<9 | 10 | 11 | 12>(12);
  const [visibility, setVisibility] = useState<'public' | 'batch_only'>('public');
  const [fileUrl, setFileUrl] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');

  useEffect(() => {
    if (resource) {
      setTitle(resource.title);
      setChapter(resource.chapter);
      setType(resource.type);
      setClassLevel(resource.classLevel);
      setVisibility(resource.visibility);
      setFileUrl(resource.fileUrl);
      setSelectedFileName('');
    } else {
      setTitle('');
      setChapter('');
      setType('notes');
      setClassLevel(12);
      setVisibility('public');
      setFileUrl('https://cdn.quick2learn.in/resources/notes.pdf');
      setSelectedFileName('');
    }
  }, [resource, visible]);

  const handlePickDocument = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        const file = res.assets[0];
        setSelectedFileName(file.name);
        setFileUrl(file.uri);
        if (!title) {
          setTitle(file.name.replace(/\.[^/.]+$/, ''));
        }
      }
    } catch (e) {
      console.warn('Error picking doc', e);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
      >
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: '90%',
            padding: 16,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 17, fontWeight: '800', color: '#0F172A' }}>
              {resource ? 'Edit Study Material' : 'Upload Study Material'}
            </Text>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 20 }}>
            {/* Native Document Picker trigger */}
            <TouchableOpacity
              onPress={handlePickDocument}
              style={{
                borderWidth: 1.5,
                borderColor: '#059669',
                borderStyle: 'dashed',
                borderRadius: 14,
                padding: 16,
                alignItems: 'center',
                backgroundColor: '#ECFDF5',
                gap: 4,
              }}
            >
              <FileUp size={24} color="#059669" />
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#065F46' }}>
                {selectedFileName ? selectedFileName : 'Tap to select PDF file from device'}
              </Text>
              <Text style={{ fontSize: 11, color: '#059669' }}>Accepts .pdf (Formula Sheets, DPPs, Notes)</Text>
            </TouchableOpacity>

            <FormField label="Document Title" value={title} onChangeText={setTitle} placeholder="e.g. Chapter 1 Formula Sheet" />
            <FormField label="Chapter Name" value={chapter} onChangeText={setChapter} placeholder="e.g. Relations and Functions" />

            {/* Type selector */}
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#475569' }}>Material Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              {(['notes', 'formula_sheet', 'dpp', 'pyq', 'solution'] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setType(t)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 8,
                    backgroundColor: type === t ? '#059669' : '#F1F5F9',
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: type === t ? '#FFFFFF' : '#475569' }}>
                    {t.replace('_', ' ').toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Class and Visibility */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 4 }}>Class</Text>
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  {([9, 10, 11, 12] as const).map((lvl) => (
                    <TouchableOpacity
                      key={lvl}
                      onPress={() => setClassLevel(lvl)}
                      style={{
                        flex: 1,
                        paddingVertical: 7,
                        borderRadius: 8,
                        backgroundColor: classLevel === lvl ? '#2563EB' : '#F1F5F9',
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '800', color: classLevel === lvl ? '#FFFFFF' : '#475569' }}>
                        {lvl}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 4 }}>Access</Text>
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  {(['public', 'batch_only'] as const).map((v) => (
                    <TouchableOpacity
                      key={v}
                      onPress={() => setVisibility(v)}
                      style={{
                        flex: 1,
                        paddingVertical: 7,
                        borderRadius: 8,
                        backgroundColor: visibility === v ? '#0F172A' : '#F1F5F9',
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '700', color: visibility === v ? '#FFFFFF' : '#475569' }}>
                        {v === 'public' ? 'Free' : 'Batch'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              {resource && (
                <TouchableOpacity
                  onPress={() => onDelete(resource.id)}
                  style={{
                    backgroundColor: '#FEE2E2',
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    borderRadius: 12,
                    alignItems: 'center',
                  }}
                >
                  <Trash2 size={18} color="#DC2626" />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => {
                  if (!title.trim()) {
                    Alert.alert('Required', 'Please enter resource title.');
                    return;
                  }
                  onSave({
                    title,
                    chapter: chapter || 'General',
                    type,
                    classLevel,
                    visibility,
                    fileUrl: fileUrl || 'https://cdn.quick2learn.in/resources/notes.pdf',
                    fileSize: '2.5 MB',
                    filePages: 12,
                    subject: 'Mathematics',
                  });
                }}
                style={{
                  flex: 1,
                  backgroundColor: '#059669',
                  paddingVertical: 13,
                  borderRadius: 12,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '800', color: '#FFFFFF' }}>
                  {resource ? 'Save Changes' : 'Upload Resource'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function LectureFormModal({
  visible,
  lecture,
  onClose,
  onSave,
  onDelete,
}: {
  visible: boolean;
  lecture: AdminLectureItem | null;
  onClose: () => void;
  onSave: (l: Partial<AdminLectureItem>) => void;
  onDelete: (id: string) => void;
}) {
  const [title, setTitle] = useState('');
  const [youtubeInput, setYoutubeInput] = useState('');
  const [chapter, setChapter] = useState('');
  const [duration, setDuration] = useState('45:00');
  const [classLevel, setClassLevel] = useState<9 | 10 | 11 | 12>(12);
  const [orderNo, setOrderNo] = useState('1');

  useEffect(() => {
    if (lecture) {
      setTitle(lecture.title);
      setYoutubeInput(lecture.youtubeId);
      setChapter(lecture.chapter);
      setDuration(lecture.duration);
      setClassLevel(lecture.classLevel);
      setOrderNo(lecture.orderNo.toString());
    } else {
      setTitle('');
      setYoutubeInput('');
      setChapter('');
      setDuration('45:00');
      setClassLevel(12);
      setOrderNo('1');
    }
  }, [lecture, visible]);

  // Extract clean ID from url or raw string
  const cleanYoutubeId = useMemo(() => {
    const raw = youtubeInput.trim();
    if (raw.includes('v=')) {
      return raw.split('v=')[1].split('&')[0];
    }
    if (raw.includes('youtu.be/')) {
      return raw.split('youtu.be/')[1].split('?')[0];
    }
    return raw;
  }, [youtubeInput]);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
      >
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: '90%',
            padding: 16,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 17, fontWeight: '800', color: '#0F172A' }}>
              {lecture ? 'Edit Lecture' : 'Add Video Lecture'}
            </Text>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 20 }}>
            <FormField
              label="YouTube Video URL or ID"
              value={youtubeInput}
              onChangeText={setYoutubeInput}
              placeholder="e.g. https://www.youtube.com/watch?v=... or ID"
            />
            {cleanYoutubeId ? (
              <Text style={{ fontSize: 11, color: '#059669', fontWeight: '700' }}>
                Detected Video ID: {cleanYoutubeId}
              </Text>
            ) : null}

            <FormField label="Lecture Title" value={title} onChangeText={setTitle} placeholder="e.g. Relations & Functions - Lec 01" />
            <FormField label="Chapter Name" value={chapter} onChangeText={setChapter} placeholder="e.g. Relations and Functions" />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <FormField label="Duration" value={duration} onChangeText={setDuration} placeholder="e.g. 52:14" />
              </View>
              <View style={{ flex: 1 }}>
                <FormField label="Order Sequence" value={orderNo} onChangeText={setOrderNo} keyboardType="numeric" />
              </View>
            </View>

            <View>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 4 }}>Class Level</Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {([9, 10, 11, 12] as const).map((lvl) => (
                  <TouchableOpacity
                    key={lvl}
                    onPress={() => setClassLevel(lvl)}
                    style={{
                      flex: 1,
                      paddingVertical: 7,
                      borderRadius: 8,
                      backgroundColor: classLevel === lvl ? '#7C3AED' : '#F1F5F9',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '800', color: classLevel === lvl ? '#FFFFFF' : '#475569' }}>
                      {lvl}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              {lecture && (
                <TouchableOpacity
                  onPress={() => onDelete(lecture.id)}
                  style={{
                    backgroundColor: '#FEE2E2',
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    borderRadius: 12,
                    alignItems: 'center',
                  }}
                >
                  <Trash2 size={18} color="#DC2626" />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => {
                  if (!title.trim() || !cleanYoutubeId) {
                    Alert.alert('Required', 'Please provide lecture title and valid YouTube link/ID.');
                    return;
                  }
                  onSave({
                    title,
                    youtubeId: cleanYoutubeId,
                    youtubeUrl: `https://www.youtube.com/watch?v=${cleanYoutubeId}`,
                    chapter: chapter || 'General',
                    duration,
                    classLevel,
                    board: 'cbse',
                    subject: 'Mathematics',
                    orderNo: parseInt(orderNo) || 1,
                    isPublished: true,
                  });
                }}
                style={{
                  flex: 1,
                  backgroundColor: '#7C3AED',
                  paddingVertical: 13,
                  borderRadius: 12,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '800', color: '#FFFFFF' }}>
                  {lecture ? 'Save Lecture' : 'Add to Syllabus'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function QuestionFormModal({
  visible,
  question,
  onClose,
  onSave,
  onDelete,
}: {
  visible: boolean;
  question: AdminQuestionItem | null;
  onClose: () => void;
  onSave: (q: Partial<AdminQuestionItem>) => void;
  onDelete: (id: string) => void;
}) {
  const [statement, setStatement] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [correctIndex, setCorrectIndex] = useState(0);
  const [chapter, setChapter] = useState('');
  const [classLevel, setClassLevel] = useState<9 | 10 | 11 | 12>(12);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [explanation, setExplanation] = useState('');

  useEffect(() => {
    if (question) {
      setStatement(question.statement);
      setOptA(question.options[0] || '');
      setOptB(question.options[1] || '');
      setOptC(question.options[2] || '');
      setOptD(question.options[3] || '');
      setCorrectIndex(question.correctOptionIndex);
      setChapter(question.chapter);
      setClassLevel(question.classLevel);
      setDifficulty(question.difficulty);
      setExplanation(question.explanation);
    } else {
      setStatement('');
      setOptA('');
      setOptB('');
      setOptC('');
      setOptD('');
      setCorrectIndex(0);
      setChapter('');
      setClassLevel(12);
      setDifficulty('medium');
      setExplanation('');
    }
  }, [question, visible]);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
      >
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: '92%',
            padding: 16,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 17, fontWeight: '800', color: '#0F172A' }}>
              {question ? 'Edit Question' : 'Add New Question'}
            </Text>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 20 }}>
            <FormField
              label="Question Statement (Supports LaTeX Math)"
              value={statement}
              onChangeText={setStatement}
              placeholder="e.g. Find the domain of f(x) = sqrt(x^2 - 4)..."
              multiline
              numberOfLines={3}
            />

            <Text style={{ fontSize: 12, fontWeight: '700', color: '#475569' }}>
              Options (Select radio for Correct Answer):
            </Text>

            <OptionRow index={0} label="A" value={optA} onChange={setOptA} isSelected={correctIndex === 0} onSelect={() => setCorrectIndex(0)} />
            <OptionRow index={1} label="B" value={optB} onChange={setOptB} isSelected={correctIndex === 1} onSelect={() => setCorrectIndex(1)} />
            <OptionRow index={2} label="C" value={optC} onChange={setOptC} isSelected={correctIndex === 2} onSelect={() => setCorrectIndex(2)} />
            <OptionRow index={3} label="D" value={optD} onChange={setOptD} isSelected={correctIndex === 3} onSelect={() => setCorrectIndex(3)} />

            <FormField label="Chapter Name" value={chapter} onChangeText={setChapter} placeholder="Relations and Functions" />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 4 }}>Difficulty</Text>
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  {(['easy', 'medium', 'hard'] as const).map((d) => (
                    <TouchableOpacity
                      key={d}
                      onPress={() => setDifficulty(d)}
                      style={{
                        flex: 1,
                        paddingVertical: 7,
                        borderRadius: 8,
                        backgroundColor: difficulty === d ? '#D97706' : '#F1F5F9',
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '700', color: difficulty === d ? '#FFFFFF' : '#475569' }}>
                        {d.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <FormField
              label="Step-by-Step Solution / Explanation"
              value={explanation}
              onChangeText={setExplanation}
              placeholder="Explain how to solve step by step..."
              multiline
              numberOfLines={3}
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              {question && (
                <TouchableOpacity
                  onPress={() => onDelete(question.id)}
                  style={{
                    backgroundColor: '#FEE2E2',
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    borderRadius: 12,
                    alignItems: 'center',
                  }}
                >
                  <Trash2 size={18} color="#DC2626" />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => {
                  if (!statement.trim() || !optA || !optB) {
                    Alert.alert('Required', 'Please enter question text and at least options A & B.');
                    return;
                  }
                  onSave({
                    statement,
                    options: [optA, optB, optC || 'None of these', optD || 'All of these'],
                    correctOptionIndex: correctIndex,
                    chapter: chapter || 'General',
                    classLevel,
                    subject: 'Mathematics',
                    difficulty,
                    marks: 4,
                    negativeMarks: 1,
                    explanation,
                  });
                }}
                style={{
                  flex: 1,
                  backgroundColor: '#D97706',
                  paddingVertical: 13,
                  borderRadius: 12,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '800', color: '#FFFFFF' }}>
                  {question ? 'Update Question' : 'Save to Question Bank'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function OptionRow({
  index,
  label,
  value,
  onChange,
  isSelected,
  onSelect,
}: {
  index: number;
  label: string;
  value: string;
  onChange: (v: string) => void;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <TouchableOpacity
        onPress={onSelect}
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: isSelected ? '#16A34A' : '#E2E8F0',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: 12, fontWeight: '800', color: isSelected ? '#FFFFFF' : '#475569' }}>{label}</Text>
      </TouchableOpacity>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={`Option ${label}`}
        placeholderTextColor="#94A3B8"
        style={{
          flex: 1,
          backgroundColor: isSelected ? '#ECFDF5' : '#F8FAFC',
          borderWidth: 1,
          borderColor: isSelected ? '#A7F3D0' : '#E2E8F0',
          borderRadius: 10,
          paddingHorizontal: 10,
          paddingVertical: 7,
          fontSize: 13,
          color: '#0F172A',
        }}
      />
    </View>
  );
}

function TestFormModal({
  visible,
  test,
  onClose,
  onSave,
  onDelete,
}: {
  visible: boolean;
  test: AdminTestItem | null;
  onClose: () => void;
  onSave: (t: Partial<AdminTestItem>) => void;
  onDelete: (id: string) => void;
}) {
  const [title, setTitle] = useState('');
  const [chapters, setChapters] = useState('');
  const [duration, setDuration] = useState('60');
  const [totalMarks, setTotalMarks] = useState('40');
  const [passingMarks, setPassingMarks] = useState('14');
  const [questionsCount, setQuestionsCount] = useState('10');
  const [classLevel, setClassLevel] = useState<9 | 10 | 11 | 12>(12);

  useEffect(() => {
    if (test) {
      setTitle(test.title);
      setChapters(test.chapters.join(', '));
      setDuration(test.durationMinutes.toString());
      setTotalMarks(test.totalMarks.toString());
      setPassingMarks(test.passingMarks.toString());
      setQuestionsCount(test.questionsCount.toString());
      setClassLevel(test.classLevel);
    } else {
      setTitle('');
      setChapters('Relations & Functions, Matrices');
      setDuration('60');
      setTotalMarks('40');
      setPassingMarks('14');
      setQuestionsCount('10');
      setClassLevel(12);
    }
  }, [test, visible]);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
      >
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: '90%',
            padding: 16,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 17, fontWeight: '800', color: '#0F172A' }}>
              {test ? 'Edit Test' : 'Create & Schedule Test'}
            </Text>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 20 }}>
            <FormField label="Test Title" value={title} onChangeText={setTitle} placeholder="e.g. Unit Test 1: Algebra & Calculus" />
            <FormField label="Chapters Included" value={chapters} onChangeText={setChapters} placeholder="Comma separated chapter names" />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <FormField label="Duration (mins)" value={duration} onChangeText={setDuration} keyboardType="numeric" />
              </View>
              <View style={{ flex: 1 }}>
                <FormField label="Total Marks" value={totalMarks} onChangeText={setTotalMarks} keyboardType="numeric" />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <FormField label="Questions Count" value={questionsCount} onChangeText={setQuestionsCount} keyboardType="numeric" />
              </View>
              <View style={{ flex: 1 }}>
                <FormField label="Passing Marks" value={passingMarks} onChangeText={setPassingMarks} keyboardType="numeric" />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              {test && (
                <TouchableOpacity
                  onPress={() => onDelete(test.id)}
                  style={{
                    backgroundColor: '#FEE2E2',
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    borderRadius: 12,
                    alignItems: 'center',
                  }}
                >
                  <Trash2 size={18} color="#DC2626" />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => {
                  if (!title.trim()) {
                    Alert.alert('Required', 'Please enter test title.');
                    return;
                  }
                  onSave({
                    title,
                    chapters: chapters.split(',').map((c) => c.trim()).filter(Boolean),
                    durationMinutes: parseInt(duration) || 60,
                    totalMarks: parseInt(totalMarks) || 40,
                    passingMarks: parseInt(passingMarks) || 14,
                    questionsCount: parseInt(questionsCount) || 10,
                    classLevel,
                    subject: 'Mathematics',
                    status: 'upcoming',
                    isPublished: true,
                    scheduledStart: new Date().toISOString(),
                    scheduledEnd: new Date(Date.now() + 86400000).toISOString(),
                  });
                }}
                style={{
                  flex: 1,
                  backgroundColor: '#0891B2',
                  paddingVertical: 13,
                  borderRadius: 12,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '800', color: '#FFFFFF' }}>
                  {test ? 'Save Test' : 'Schedule & Publish Test'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function OfflinePaymentModal({
  visible,
  students,
  batches,
  onClose,
  onRecord,
}: {
  visible: boolean;
  students: AdminStudentItem[];
  batches: BatchItem[];
  onClose: () => void;
  onRecord: (pay: any) => void;
}) {
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || '');
  const [batchTitle, setBatchTitle] = useState(batches[0]?.title || '');
  const [amount, setAmount] = useState('6000');
  const [method, setMethod] = useState<'cash' | 'upi' | 'cheque' | 'bank_transfer'>('cash');
  const [notes, setNotes] = useState('Tuition fee instalment received at Mathura center');

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
      >
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: '90%',
            padding: 16,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 17, fontWeight: '800', color: '#0F172A' }}>Record Offline Fee Payment</Text>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 20 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#475569' }}>Select Student</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              {students.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  onPress={() => setSelectedStudentId(s.id)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                    borderRadius: 10,
                    backgroundColor: selectedStudentId === s.id ? '#4F46E5' : '#F1F5F9',
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: selectedStudentId === s.id ? '#FFFFFF' : '#334155' }}>
                    {s.fullName}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <FormField label="Tuition Amount (₹)" value={amount} onChangeText={setAmount} keyboardType="numeric" />

            <Text style={{ fontSize: 12, fontWeight: '700', color: '#475569' }}>Payment Mode</Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {(['cash', 'upi', 'cheque', 'bank_transfer'] as const).map((m) => (
                <TouchableOpacity
                  key={m}
                  onPress={() => setMethod(m)}
                  style={{
                    flex: 1,
                    paddingVertical: 8,
                    borderRadius: 8,
                    backgroundColor: method === m ? '#4F46E5' : '#F1F5F9',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '800', color: method === m ? '#FFFFFF' : '#475569' }}>
                    {m.toUpperCase().replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <FormField label="Notes & Reference" value={notes} onChangeText={setNotes} placeholder="Cash receipt details..." />

            <TouchableOpacity
              onPress={() => {
                onRecord({
                  studentId: selectedStudentId || students[0]?.id,
                  batchTitle: batchTitle || batches[0]?.title,
                  amount: parseInt(amount) || 5000,
                  paymentMethod: method,
                  notes,
                });
              }}
              style={{
                backgroundColor: '#4F46E5',
                paddingVertical: 14,
                borderRadius: 12,
                alignItems: 'center',
                marginTop: 10,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#FFFFFF' }}>Issue Official Receipt</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function EnrollStudentModal({
  visible,
  student,
  batches,
  onClose,
  onEnroll,
}: {
  visible: boolean;
  student: AdminStudentItem | null;
  batches: BatchItem[];
  onClose: () => void;
  onEnroll: (batchId: string) => void;
}) {
  const [selectedBatchId, setSelectedBatchId] = useState(batches[0]?.id || '');

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 16,
            gap: 12,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F172A' }}>
              Enroll {student?.fullName}
            </Text>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <Text style={{ fontSize: 12, color: '#64748B' }}>
            Select the batch to grant immediate access to this student:
          </Text>

          {batches.map((b) => (
            <TouchableOpacity
              key={b.id}
              onPress={() => setSelectedBatchId(b.id)}
              style={{
                padding: 12,
                borderRadius: 12,
                backgroundColor: selectedBatchId === b.id ? '#EFF6FF' : '#F8FAFC',
                borderWidth: 1,
                borderColor: selectedBatchId === b.id ? '#2563EB' : '#E2E8F0',
              }}
            >
              <Text style={{ fontSize: 13.5, fontWeight: '700', color: '#0F172A' }}>{b.title}</Text>
              <Text style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                Class {b.classLevel} • {b.room} • ₹{b.fee}
              </Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            onPress={() => onEnroll(selectedBatchId || batches[0]?.id)}
            style={{
              backgroundColor: '#2563EB',
              paddingVertical: 13,
              borderRadius: 12,
              alignItems: 'center',
              marginTop: 6,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '800', color: '#FFFFFF' }}>Confirm Enrollment</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function AnnouncementModal({
  visible,
  batches,
  onClose,
  onBroadcast,
}: {
  visible: boolean;
  batches: BatchItem[];
  onClose: () => void;
  onBroadcast: (ann: any) => void;
}) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState<'normal' | 'urgent'>('normal');
  const [target, setTarget] = useState('All Batches (Classes IX–XII)');

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
      >
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 16,
            gap: 12,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 17, fontWeight: '800', color: '#0F172A' }}>Broadcast Announcement</Text>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <FormField label="Headline" value={title} onChangeText={setTitle} placeholder="e.g. Schedule Update or Exam Notice" />
          <FormField
            label="Message Content"
            value={body}
            onChangeText={setBody}
            placeholder="Write announcement body..."
            multiline
            numberOfLines={3}
          />

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 4 }}>Priority</Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {(['normal', 'urgent'] as const).map((p) => (
                  <TouchableOpacity
                    key={p}
                    onPress={() => setPriority(p)}
                    style={{
                      flex: 1,
                      paddingVertical: 7,
                      borderRadius: 8,
                      backgroundColor: priority === p ? (p === 'urgent' ? '#DC2626' : '#2563EB') : '#F1F5F9',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '700', color: priority === p ? '#FFFFFF' : '#475569' }}>
                      {p.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => {
              if (!title.trim() || !body.trim()) {
                Alert.alert('Required', 'Please enter title and announcement content.');
                return;
              }
              onBroadcast({
                title,
                body,
                priority,
                targetAudience: target,
                authorName: 'Dinesh Singh Rajput',
              });
            }}
            style={{
              backgroundColor: '#E11D48',
              paddingVertical: 13,
              borderRadius: 12,
              alignItems: 'center',
              marginTop: 6,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '800', color: '#FFFFFF' }}>Broadcast to Mobile Devices</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function DoubtReplyModal({
  visible,
  doubt,
  onClose,
  onReply,
}: {
  visible: boolean;
  doubt: AdminDoubtItem | null;
  onClose: () => void;
  onReply: (text: string) => void;
}) {
  const [replyText, setReplyText] = useState('');

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
      >
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 16,
            gap: 12,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F172A' }}>
              Reply to {doubt?.studentName}
            </Text>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <View style={{ backgroundColor: '#F8FAFC', padding: 10, borderRadius: 10 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B' }}>Doubt Question:</Text>
            <Text style={{ fontSize: 13, color: '#0F172A', marginTop: 2 }}>{doubt?.questionText}</Text>
          </View>

          <FormField
            label="Your Solution & Explanation"
            value={replyText}
            onChangeText={setReplyText}
            placeholder="Type mathematical solution steps..."
            multiline
            numberOfLines={4}
          />

          <TouchableOpacity
            onPress={() => {
              if (!replyText.trim()) {
                Alert.alert('Required', 'Please enter your reply.');
                return;
              }
              onReply(replyText);
              setReplyText('');
            }}
            style={{
              backgroundColor: '#2563EB',
              paddingVertical: 13,
              borderRadius: 12,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '800', color: '#FFFFFF' }}>Send & Resolve Doubt</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function EnquiryDetailModal({
  visible,
  enquiry,
  onClose,
  onUpdateStatus,
}: {
  visible: boolean;
  enquiry: AdminEnquiryItem | null;
  onClose: () => void;
  onUpdateStatus: (status: AdminEnquiryItem['status'], notes?: string) => void;
}) {
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (enquiry) {
      setNotes(enquiry.notes || '');
    }
  }, [enquiry, visible]);

  if (!enquiry) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 16,
            gap: 12,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 17, fontWeight: '800', color: '#0F172A' }}>Admission Lead Details</Text>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F172A' }}>{enquiry.studentName}</Text>
            <Text style={{ fontSize: 12, color: '#64748B' }}>
              Class {enquiry.classLevel} • {enquiry.board.toUpperCase()} • Phone: {enquiry.phone}
            </Text>
            <View style={{ backgroundColor: '#F8FAFC', padding: 10, borderRadius: 10, marginTop: 4 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B' }}>Inquiry Message:</Text>
              <Text style={{ fontSize: 12.5, color: '#334155', marginTop: 2 }}>{enquiry.message}</Text>
            </View>
          </View>

          <FormField
            label="Follow-up Notes"
            value={notes}
            onChangeText={setNotes}
            placeholder="e.g. Called parent, invited for trial class..."
          />

          <Text style={{ fontSize: 12, fontWeight: '700', color: '#475569' }}>Change Lead Status:</Text>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {(['new', 'contacted', 'enrolled', 'closed'] as const).map((st) => (
              <TouchableOpacity
                key={st}
                onPress={() => onUpdateStatus(st, notes)}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: 8,
                  backgroundColor: enquiry.status === st ? '#2563EB' : '#F1F5F9',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: '800', color: enquiry.status === st ? '#FFFFFF' : '#475569' }}>
                  {st.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
            <TouchableOpacity
              onPress={() => Linking.openURL(`tel:${enquiry.phone}`)}
              style={{
                flex: 1,
                backgroundColor: '#EFF6FF',
                paddingVertical: 12,
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Phone size={16} color="#2563EB" />
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#2563EB' }}>Call Lead</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => Linking.openURL(`https://wa.me/${enquiry.phone.replace(/[^0-9]/g, '')}`)}
              style={{
                flex: 1,
                backgroundColor: '#ECFDF5',
                paddingVertical: 12,
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <MessageCircle size={16} color="#059669" />
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#059669' }}>WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  numberOfLines = 1,
  keyboardType = 'default',
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: 'default' | 'numeric' | 'email-address';
}) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={{ fontSize: 12, fontWeight: '700', color: '#475569' }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        multiline={multiline}
        numberOfLines={numberOfLines}
        keyboardType={keyboardType}
        style={{
          backgroundColor: '#F8FAFC',
          borderWidth: 1,
          borderColor: '#E2E8F0',
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: multiline ? 8 : 8,
          fontSize: 13,
          color: '#0F172A',
          textAlignVertical: multiline ? 'top' : 'center',
        }}
      />
    </View>
  );
}
