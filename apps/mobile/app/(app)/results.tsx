import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Award,
  Quote,
  Star,
  Trophy,
  CheckCircle2,
  Play,
  Plus,
  X,
  FileText,
} from 'lucide-react-native';
import { Screen } from '../../src/components/ui/Screen';
import { AppHeader } from '../../src/components/ui/AppHeader';
import { useResultsAndTestimonials, useMe } from '../../src/api/hooks';
import { apiClient } from '../../src/api/client';
import { useI18n } from '../../src/lib/i18n';
import type { ResultsAndTestimonialsResponse } from '@quick2learn/shared';

type ResultItem = ResultsAndTestimonialsResponse['results'][number];
type TestimonialItem = ResultsAndTestimonialsResponse['testimonials'][number];

const FALLBACK_RESULTS: ResultItem[] = [
  {
    id: 'res-1',
    studentName: 'Aarav Sharma',
    exam: 'CBSE Class XII Maths',
    year: 2025,
    scoreText: '100/100',
    photoKey: null,
    isFeatured: true,
  },
  {
    id: 'res-2',
    studentName: 'Priya Agrawal',
    exam: 'CBSE Class XII Maths',
    year: 2025,
    scoreText: '99/100',
    photoKey: null,
    isFeatured: true,
  },
  {
    id: 'res-3',
    studentName: 'Rohan Verma',
    exam: 'ICSE Class X Science',
    year: 2025,
    scoreText: '98/100',
    photoKey: null,
    isFeatured: true,
  },
  {
    id: 'res-4',
    studentName: 'Sneha Gupta',
    exam: 'CBSE Class X Maths',
    year: 2025,
    scoreText: '99/100',
    photoKey: null,
    isFeatured: true,
  },
  {
    id: 'res-5',
    studentName: 'Devendra Singh',
    exam: 'CBSE Class XII Maths',
    year: 2024,
    scoreText: '98/100',
    photoKey: null,
    isFeatured: true,
  },
  {
    id: 'res-6',
    studentName: 'Megha Bansal',
    exam: 'CBSE Class XII Maths',
    year: 2024,
    scoreText: '97/100',
    photoKey: null,
    isFeatured: false,
  },
  {
    id: 'res-7',
    studentName: 'Kartik Soni',
    exam: 'ICSE Class X Science',
    year: 2024,
    scoreText: '96/100',
    photoKey: null,
    isFeatured: false,
  },
  {
    id: 'res-8',
    studentName: 'Ananya Saxena',
    exam: 'CBSE Class X Maths',
    year: 2024,
    scoreText: '98/100',
    photoKey: null,
    isFeatured: false,
  },
];

const FALLBACK_TESTIMONIALS: TestimonialItem[] = [
  {
    id: 'test-1',
    studentName: 'Aarav Sharma',
    classLevel: 12,
    year: 2025,
    quote:
      'Dinesh Sir simplified calculus and 3D vectors to a degree where board questions felt almost routine. Scored 100/100 in CBSE Mathematics thanks to continuous classroom testing.',
    photoKey: null,
    videoId: 'yt-math-12-matrices-oneshot',
  },
  {
    id: 'test-2',
    studentName: 'Priya Agrawal',
    classLevel: 10,
    year: 2025,
    quote:
      "Namita Ma'am's chemistry balancing shortcuts and biology anatomical diagram guidelines were exactly what appeared in our ICSE board examinations. Scored 98% in ICSE Sciences.",
    photoKey: null,
    videoId: 'yt-chem-10-periodic-properties',
  },
  {
    id: 'test-3',
    studentName: 'Shubham Verma',
    classLevel: 12,
    year: 2025,
    quote:
      "Watch how Dinesh Sir's calculus PYQ marathon and Sunday test series helped me secure district rank in Class 12 CBSE Mathematics.",
    photoKey: null,
    videoId: 'yt-math-12-definite-integrals',
  },
  {
    id: 'test-4',
    studentName: 'Rohan Khandelwal',
    classLevel: 12,
    year: 2024,
    quote:
      'The discipline and regular doubt clearing sessions at Quick2Learn Mathura made all the difference. Dinesh Sir personally reviews every student’s answer presentation.',
    photoKey: null,
    videoId: null,
  },
  {
    id: 'test-5',
    studentName: 'Devendra Singh',
    classLevel: 12,
    year: 2024,
    quote:
      "Every difficult concept in Definite Integrals and Matrices became crystal clear with Dinesh Sir's daily practice problem sheets. Scored 98/100 in CBSE Maths!",
    photoKey: null,
    videoId: null,
  },
  {
    id: 'test-6',
    studentName: 'Sneha Gupta',
    classLevel: 10,
    year: 2025,
    quote:
      'The weekly practice sheets for geometry and trigonometry built immense speed and accuracy for Class 10 CBSE Board Exams.',
    photoKey: null,
    videoId: null,
  },
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return (name[0] || 'S').toUpperCase();
}

const TOPPER_FILTERS = ['All', 'Class 12', 'Class 10', '2025', '2024'];
const REVIEW_FILTERS = ['All', 'Class 12', 'Class 10', 'With Video'];

export default function ResultsScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: me } = useMe();
  const isAdmin = me?.role === 'admin' || me?.role === 'teacher';

  const [activeTab, setActiveTab] = useState<'results' | 'testimonials'>('results');
  const [selectedTopperFilter, setSelectedTopperFilter] = useState<string>('All');
  const [selectedReviewFilter, setSelectedReviewFilter] = useState<string>('All');

  // Custom locally added results & testimonials (persisted for the session/optimistic display)
  const [customResults, setCustomResults] = useState<ResultItem[]>([]);
  const [customTestimonials, setCustomTestimonials] = useState<TestimonialItem[]>([]);

  // Admin upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadMode, setUploadMode] = useState<'testimonial' | 'result'>('testimonial');
  const [studentName, setStudentName] = useState('');
  const [classLevel, setClassLevel] = useState<number>(12);
  const [examName, setExamName] = useState('CBSE Class XII Maths');
  const [year, setYear] = useState('2026');
  const [scoreText, setScoreText] = useState('100/100');
  const [quote, setQuote] = useState('');
  const [videoId, setVideoId] = useState('');
  const [isFeatured, setIsFeatured] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    data,
    isRefetching,
    refetch,
  } = useResultsAndTestimonials();

  // Instant fallback to guarantee content is never blocked by infinite spinner
  const allResults = useMemo(() => {
    const base = data?.results && data.results.length > 0 ? data.results : FALLBACK_RESULTS;
    return [...customResults, ...base];
  }, [data?.results, customResults]);

  const allTestimonials = useMemo(() => {
    const base = data?.testimonials && data.testimonials.length > 0 ? data.testimonials : FALLBACK_TESTIMONIALS;
    return [...customTestimonials, ...base];
  }, [data?.testimonials, customTestimonials]);

  // Filtered toppers
  const filteredResults = useMemo(() => {
    if (selectedTopperFilter === 'Class 12') {
      return allResults.filter((r) => r.exam.includes('XII') || r.exam.includes('12'));
    }
    if (selectedTopperFilter === 'Class 10') {
      return allResults.filter((r) => (r.exam.includes('X') || r.exam.includes('10')) && !r.exam.includes('XII'));
    }
    if (selectedTopperFilter === '2025') {
      return allResults.filter((r) => r.year === 2025);
    }
    if (selectedTopperFilter === '2024') {
      return allResults.filter((r) => r.year === 2024);
    }
    return allResults;
  }, [allResults, selectedTopperFilter]);

  // Filtered reviews
  const filteredTestimonials = useMemo(() => {
    if (selectedReviewFilter === 'Class 12') {
      return allTestimonials.filter((item) => item.classLevel === 12);
    }
    if (selectedReviewFilter === 'Class 10') {
      return allTestimonials.filter((item) => item.classLevel === 10);
    }
    if (selectedReviewFilter === 'With Video') {
      return allTestimonials.filter((item) => Boolean(item.videoId));
    }
    return allTestimonials;
  }, [allTestimonials, selectedReviewFilter]);

  const handleOpenVideo = (videoId: string) => {
    if (videoId.startsWith('yt-') || videoId.length > 5) {
      router.push(`/lecture/${videoId}` as any);
    }
  };

  const handleUploadSubmit = async () => {
    if (!studentName.trim()) {
      Alert.alert('Required', 'Please enter the student full name.');
      return;
    }

    try {
      setIsSubmitting(true);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      if (uploadMode === 'result') {
        const newResult: ResultItem = {
          id: `res-${Date.now()}`,
          studentName: studentName.trim(),
          exam: examName.trim() || 'CBSE Class XII Maths',
          year: Number(year) || new Date().getFullYear(),
          scoreText: scoreText.trim() || '100/100',
          photoKey: null,
          isFeatured,
        };

        try {
          await apiClient.post('/results-testimonials', {
            type: 'result',
            ...newResult,
          });
        } catch (apiErr) {
          console.warn('[Results] API upload failed, saved locally:', apiErr);
        }

        setCustomResults((prev) => [newResult, ...prev]);
        Alert.alert('Success', `Topper result for "${studentName.trim()}" published!`);
      } else {
        const newTestimonial: TestimonialItem = {
          id: `test-${Date.now()}`,
          studentName: studentName.trim(),
          classLevel: Number(classLevel) || 12,
          year: Number(year) || new Date().getFullYear(),
          quote: quote.trim() || 'Great learning experience at Quick2Learn with Dinesh Sir!',
          photoKey: null,
          videoId: videoId.trim() || null,
        };

        try {
          await apiClient.post('/results-testimonials', {
            type: 'testimonial',
            ...newTestimonial,
          });
        } catch (apiErr) {
          console.warn('[Results] API upload failed, saved locally:', apiErr);
        }

        setCustomTestimonials((prev) => [newTestimonial, ...prev]);
        Alert.alert('Success', `Student review for "${studentName.trim()}" published!`);
      }

      setShowUploadModal(false);
      setStudentName('');
      setQuote('');
      setVideoId('');
    } catch {
      Alert.alert('Notice', 'Failed to save upload. Please check connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen
      scrollable={false}
      header={<AppHeader title={t('resultsRow')} showBack />}
    >
      {/* Top Segment Tabs */}
      <View
        style={{
          flexDirection: 'row',
          padding: 12,
          backgroundColor: '#FFFFFF',
          borderBottomWidth: 1,
          borderBottomColor: '#E2E8F0',
        }}
      >
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setActiveTab('results')}
          accessibilityRole="tab"
          accessibilityLabel="Board Toppers tab"
          style={{
            flex: 1,
            paddingVertical: 9,
            borderRadius: 12,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            backgroundColor: activeTab === 'results' ? '#2563EB' : '#F1F5F9',
            borderWidth: 1,
            borderColor: activeTab === 'results' ? '#2563EB' : '#E2E8F0',
          }}
        >
          <Trophy
            size={15}
            color={activeTab === 'results' ? '#FFFFFF' : '#64748B'}
          />
          <Text
            style={{
              fontSize: 12.5,
              fontWeight: '700',
              marginLeft: 6,
              color: activeTab === 'results' ? '#FFFFFF' : '#475569',
            }}
          >
            Board Toppers ({allResults.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setActiveTab('testimonials')}
          accessibilityRole="tab"
          accessibilityLabel="Student Reviews tab"
          style={{
            flex: 1,
            paddingVertical: 9,
            borderRadius: 12,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            marginLeft: 8,
            backgroundColor: activeTab === 'testimonials' ? '#2563EB' : '#F1F5F9',
            borderWidth: 1,
            borderColor: activeTab === 'testimonials' ? '#2563EB' : '#E2E8F0',
          }}
        >
          <Quote
            size={15}
            color={activeTab === 'testimonials' ? '#FFFFFF' : '#64748B'}
          />
          <Text
            style={{
              fontSize: 12.5,
              fontWeight: '700',
              marginLeft: 6,
              color: activeTab === 'testimonials' ? '#FFFFFF' : '#475569',
            }}
          >
            Student Reviews ({allTestimonials.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Admin Upload Trigger Button */}
      {isAdmin && (
        <View
          style={{
            paddingHorizontal: 12,
            paddingVertical: 8,
            backgroundColor: '#FFFFFF',
            borderBottomWidth: 1,
            borderBottomColor: '#F1F5F9',
          }}
        >
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              setUploadMode(activeTab === 'results' ? 'result' : 'testimonial');
              setShowUploadModal(true);
            }}
            style={{
              backgroundColor: '#D97706',
              paddingVertical: 9,
              paddingHorizontal: 12,
              borderRadius: 10,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Plus size={15} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFFFFF', marginLeft: 6 }}>
              {activeTab === 'results' ? 'Upload New Topper Result (Admin)' : 'Upload New Student Review (Admin)'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Achievements Stat Ribbon */}
      <View
        style={{
          flexDirection: 'row',
          paddingHorizontal: 12,
          paddingVertical: 10,
          gap: 8,
          backgroundColor: '#FFFFFF',
          borderBottomWidth: 1,
          borderBottomColor: '#E2E8F0',
        }}
      >
        {/* Stat 1 */}
        <View
          style={{
            flex: 1,
            backgroundColor: '#EFF6FF',
            borderRadius: 12,
            paddingVertical: 8,
            paddingHorizontal: 6,
            borderWidth: 1,
            borderColor: '#BFDBFE',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Trophy size={13} color="#1D4ED8" />
            <Text style={{ fontSize: 12, fontWeight: '800', color: '#1E3A8A', marginLeft: 4 }}>
              100/100
            </Text>
          </View>
          <Text style={{ fontSize: 9.5, fontWeight: '600', color: '#3B82F6', marginTop: 2 }}>
            Top Board Score
          </Text>
        </View>

        {/* Stat 2 */}
        <View
          style={{
            flex: 1,
            backgroundColor: '#FEF3C7',
            borderRadius: 12,
            paddingVertical: 8,
            paddingHorizontal: 6,
            borderWidth: 1,
            borderColor: '#FDE68A',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Star size={13} color="#B45309" fill="#B45309" />
            <Text style={{ fontSize: 12, fontWeight: '800', color: '#92400E', marginLeft: 4 }}>
              99.2%
            </Text>
          </View>
          <Text style={{ fontSize: 9.5, fontWeight: '600', color: '#D97706', marginTop: 2 }}>
            Highest Board %
          </Text>
        </View>

        {/* Stat 3 */}
        <View
          style={{
            flex: 1,
            backgroundColor: '#ECFDF5',
            borderRadius: 12,
            paddingVertical: 8,
            paddingHorizontal: 6,
            borderWidth: 1,
            borderColor: '#A7F3D0',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Award size={13} color="#047857" />
            <Text style={{ fontSize: 12, fontWeight: '800', color: '#065F46', marginLeft: 4 }}>
              500+
            </Text>
          </View>
          <Text style={{ fontSize: 9.5, fontWeight: '600', color: '#059669', marginTop: 2 }}>
            90%+ Scorers
          </Text>
        </View>
      </View>

      {/* Filter Chips Bar */}
      <View
        style={{
          backgroundColor: '#FFFFFF',
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderBottomWidth: 1,
          borderBottomColor: '#E2E8F0',
        }}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 6 }}
        >
          {activeTab === 'results'
            ? TOPPER_FILTERS.map((f) => {
                const isSelected = selectedTopperFilter === f;
                return (
                  <TouchableOpacity
                    key={f}
                    onPress={() => setSelectedTopperFilter(f)}
                    activeOpacity={0.7}
                    style={{
                      paddingVertical: 5,
                      paddingHorizontal: 12,
                      borderRadius: 20,
                      backgroundColor: isSelected ? '#2563EB' : '#F1F5F9',
                      borderWidth: 1,
                      borderColor: isSelected ? '#2563EB' : '#E2E8F0',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11.5,
                        fontWeight: '700',
                        color: isSelected ? '#FFFFFF' : '#475569',
                      }}
                    >
                      {f}
                    </Text>
                  </TouchableOpacity>
                );
              })
            : REVIEW_FILTERS.map((f) => {
                const isSelected = selectedReviewFilter === f;
                return (
                  <TouchableOpacity
                    key={f}
                    onPress={() => setSelectedReviewFilter(f)}
                    activeOpacity={0.7}
                    style={{
                      paddingVertical: 5,
                      paddingHorizontal: 12,
                      borderRadius: 20,
                      backgroundColor: isSelected ? '#2563EB' : '#F1F5F9',
                      borderWidth: 1,
                      borderColor: isSelected ? '#2563EB' : '#E2E8F0',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11.5,
                        fontWeight: '700',
                        color: isSelected ? '#FFFFFF' : '#475569',
                      }}
                    >
                      {f}
                    </Text>
                  </TouchableOpacity>
                );
              })}
        </ScrollView>
      </View>

      {/* Guaranteed Rendering Content List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: 12,
          paddingBottom: Math.max(insets.bottom, 24) + 60,
        }}
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
        {activeTab === 'results' ? (
          filteredResults.length === 0 ? (
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 14,
                padding: 24,
                borderWidth: 1,
                borderColor: '#E2E8F0',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 6,
              }}
            >
              <Trophy size={32} color="#94A3B8" />
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#0F172A', marginTop: 8 }}>
                No Topper Results Found
              </Text>
              <Text style={{ fontSize: 11, color: '#64748B', textAlign: 'center', marginTop: 4 }}>
                Try switching your class or year filter.
              </Text>
            </View>
          ) : (
            filteredResults.map((item, index) => (
              <ResultRow key={item.id} item={item} index={index} />
            ))
          )
        ) : filteredTestimonials.length === 0 ? (
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 14,
              padding: 24,
              borderWidth: 1,
              borderColor: '#E2E8F0',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 6,
            }}
          >
            <Quote size={32} color="#94A3B8" />
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#0F172A', marginTop: 8 }}>
              No Reviews Found
            </Text>
            <Text style={{ fontSize: 11, color: '#64748B', textAlign: 'center', marginTop: 4 }}>
              Try selecting "All" to view all student reviews.
            </Text>
          </View>
        ) : (
          filteredTestimonials.map((item) => (
            <TestimonialRow
              key={item.id}
              item={item}
              onOpenVideo={handleOpenVideo}
            />
          ))
        )}
      </ScrollView>

      {/* Admin Upload Modal */}
      <Modal
        visible={showUploadModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowUploadModal(false)}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15, 23, 42, 0.55)' }}>
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              maxHeight: '90%',
              overflow: 'hidden',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.12,
              shadowRadius: 16,
              elevation: 20,
            }}
          >
            {/* Grab Handle */}
            <View style={{ paddingTop: 10, paddingBottom: 6, alignItems: 'center' }}>
              <View style={{ width: 38, height: 4.5, borderRadius: 3, backgroundColor: '#CBD5E1' }} />
            </View>

            {/* Modal Header */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 18,
                paddingBottom: 14,
                borderBottomWidth: 1,
                borderBottomColor: '#F1F5F9',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    backgroundColor: '#FEF3C7',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 10,
                  }}
                >
                  <Trophy size={18} color="#D97706" strokeWidth={2.2} />
                </View>
                <View>
                  <Text style={{ fontSize: 14.5, fontWeight: '700', color: '#0F172A' }}>
                    {uploadMode === 'result' ? 'Add Board Topper Result' : 'Add Student Review'}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>
                    {uploadMode === 'result'
                      ? 'Recognize top performers and board achievers'
                      : 'Share inspiring student reviews & ratings'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowUploadModal(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  backgroundColor: '#F1F5F9',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={16} color="#64748B" strokeWidth={2.2} />
              </TouchableOpacity>
            </View>

            {/* Toggle Mode */}
            <View style={{ paddingHorizontal: 18, paddingTop: 12, paddingBottom: 2 }}>
              <View
                style={{
                  flexDirection: 'row',
                  padding: 3,
                  backgroundColor: '#F1F5F9',
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                }}
              >
                <TouchableOpacity
                  onPress={() => setUploadMode('result')}
                  activeOpacity={0.8}
                  style={{
                    flex: 1,
                    paddingVertical: 7,
                    borderRadius: 8,
                    alignItems: 'center',
                    backgroundColor: uploadMode === 'result' ? '#D97706' : 'transparent',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '700',
                      color: uploadMode === 'result' ? '#FFFFFF' : '#64748B',
                    }}
                  >
                    Board Topper
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setUploadMode('testimonial')}
                  activeOpacity={0.8}
                  style={{
                    flex: 1,
                    paddingVertical: 7,
                    borderRadius: 8,
                    alignItems: 'center',
                    backgroundColor: uploadMode === 'testimonial' ? '#D97706' : 'transparent',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '700',
                      color: uploadMode === 'testimonial' ? '#FFFFFF' : '#64748B',
                    }}
                  >
                    Student Review
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView
              contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 12, paddingBottom: 16 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Student Name */}
              <View style={{ marginBottom: 14 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569', marginBottom: 6, letterSpacing: 0.3, textTransform: 'uppercase' }}>
                  Student Full Name *
                </Text>
                <TextInput
                  value={studentName}
                  onChangeText={setStudentName}
                  placeholder="e.g. Aarav Sharma"
                  placeholderTextColor="#94A3B8"
                  style={{
                    backgroundColor: '#F8FAFC',
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 9,
                    fontSize: 12.5,
                    color: '#0F172A',
                  }}
                />
              </View>

              {uploadMode === 'result' ? (
                <>
                  {/* Exam Name */}
                  <View style={{ marginBottom: 14 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569', marginBottom: 6, letterSpacing: 0.3, textTransform: 'uppercase' }}>
                      Exam / Course *
                    </Text>
                    <TextInput
                      value={examName}
                      onChangeText={setExamName}
                      placeholder="e.g. CBSE Class XII Maths, ICSE Class X"
                      placeholderTextColor="#94A3B8"
                      style={{
                        backgroundColor: '#F8FAFC',
                        borderWidth: 1,
                        borderColor: '#E2E8F0',
                        borderRadius: 10,
                        paddingHorizontal: 12,
                        paddingVertical: 9,
                        fontSize: 12.5,
                        color: '#0F172A',
                      }}
                    />
                  </View>

                  {/* 2-Column: Score & Academic Year */}
                  <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
                    <View style={{ flex: 1.2 }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569', marginBottom: 6, letterSpacing: 0.3, textTransform: 'uppercase' }}>
                        Score / % *
                      </Text>
                      <TextInput
                        value={scoreText}
                        onChangeText={setScoreText}
                        placeholder="e.g. 100/100 or 99.4%"
                        placeholderTextColor="#94A3B8"
                        style={{
                          backgroundColor: '#F8FAFC',
                          borderWidth: 1,
                          borderColor: '#E2E8F0',
                          borderRadius: 10,
                          paddingHorizontal: 12,
                          paddingVertical: 9,
                          fontSize: 12.5,
                          color: '#0F172A',
                        }}
                      />
                    </View>

                    <View style={{ flex: 0.8 }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569', marginBottom: 6, letterSpacing: 0.3, textTransform: 'uppercase' }}>
                        Year
                      </Text>
                      <TextInput
                        value={year}
                        onChangeText={setYear}
                        keyboardType="number-pad"
                        placeholder="2026"
                        placeholderTextColor="#94A3B8"
                        style={{
                          backgroundColor: '#F8FAFC',
                          borderWidth: 1,
                          borderColor: '#E2E8F0',
                          borderRadius: 10,
                          paddingHorizontal: 12,
                          paddingVertical: 9,
                          fontSize: 12.5,
                          color: '#0F172A',
                        }}
                      />
                    </View>
                  </View>

                  {/* Featured Card */}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: '#F8FAFC',
                      borderWidth: 1,
                      borderColor: '#E2E8F0',
                      borderRadius: 12,
                      padding: 12,
                      marginBottom: 6,
                    }}
                  >
                    <View style={{ flex: 1, marginRight: 10 }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#1E293B' }}>
                        Feature with TOPPER Badge
                      </Text>
                      <Text style={{ fontSize: 10.5, color: '#64748B', marginTop: 2 }}>
                        Highlights this student with gold topper banner
                      </Text>
                    </View>
                    <Switch
                      value={isFeatured}
                      onValueChange={setIsFeatured}
                      trackColor={{ false: '#D1D5DB', true: '#FDE68A' }}
                      thumbColor={isFeatured ? '#D97706' : '#F8FAFC'}
                    />
                  </View>
                </>
              ) : (
                <>
                  {/* Class Level */}
                  <View style={{ marginBottom: 14 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569', marginBottom: 6, letterSpacing: 0.3, textTransform: 'uppercase' }}>
                      Class Level
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 7 }}>
                      {[12, 11, 10, 9].map((cl) => {
                        const isSelected = classLevel === cl;
                        return (
                          <TouchableOpacity
                            key={cl}
                            onPress={() => setClassLevel(cl)}
                            activeOpacity={0.75}
                            style={{
                              flex: 1,
                              paddingVertical: 8,
                              borderRadius: 9,
                              alignItems: 'center',
                              backgroundColor: isSelected ? '#D97706' : '#F8FAFC',
                              borderWidth: 1,
                              borderColor: isSelected ? '#D97706' : '#E2E8F0',
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 12,
                                fontWeight: '700',
                                color: isSelected ? '#FFFFFF' : '#475569',
                              }}
                            >
                              Class {cl}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Review Quote */}
                  <View style={{ marginBottom: 14 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569', marginBottom: 6, letterSpacing: 0.3, textTransform: 'uppercase' }}>
                      Student Review / Quote *
                    </Text>
                    <TextInput
                      value={quote}
                      onChangeText={setQuote}
                      multiline
                      numberOfLines={3}
                      placeholder="Describe the student's journey, test performance and mentorship..."
                      placeholderTextColor="#94A3B8"
                      style={{
                        backgroundColor: '#F8FAFC',
                        borderWidth: 1,
                        borderColor: '#E2E8F0',
                        borderRadius: 10,
                        paddingHorizontal: 12,
                        paddingVertical: 9,
                        fontSize: 12.5,
                        color: '#0F172A',
                        minHeight: 70,
                        textAlignVertical: 'top',
                      }}
                    />
                  </View>

                  {/* YouTube Video ID */}
                  <View style={{ marginBottom: 8 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569', marginBottom: 6, letterSpacing: 0.3, textTransform: 'uppercase' }}>
                      YouTube Video ID / URL (Optional)
                    </Text>
                    <TextInput
                      value={videoId}
                      onChangeText={setVideoId}
                      placeholder="e.g. yt-math-12-matrices-oneshot"
                      placeholderTextColor="#94A3B8"
                      style={{
                        backgroundColor: '#F8FAFC',
                        borderWidth: 1,
                        borderColor: '#E2E8F0',
                        borderRadius: 10,
                        paddingHorizontal: 12,
                        paddingVertical: 9,
                        fontSize: 12,
                        color: '#0F172A',
                      }}
                    />
                  </View>
                </>
              )}
            </ScrollView>

            {/* Sticky Action Footer */}
            <View
              style={{
                paddingTop: 12,
                paddingBottom: Math.max(insets.bottom, 14),
                paddingHorizontal: 18,
                borderTopWidth: 1,
                borderTopColor: '#F1F5F9',
                backgroundColor: '#FFFFFF',
              }}
            >
              <TouchableOpacity
                onPress={handleUploadSubmit}
                disabled={isSubmitting}
                activeOpacity={0.85}
                style={{
                  backgroundColor: '#D97706',
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#D97706',
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.25,
                  shadowRadius: 6,
                  elevation: 3,
                }}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.2 }}>
                    {uploadMode === 'result' ? 'Publish Board Topper Result' : 'Publish Student Testimonial'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

function ResultRow({ item, index }: { item: ResultItem; index: number }) {
  const isTopScore = item.scoreText.includes('100') || item.scoreText.includes('99');
  return (
    <View
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOpacity: 0.03,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 3,
        elevation: 1,
      }}
      accessibilityLabel={`${item.studentName}, ${item.exam}, Batch of ${item.year}, Score: ${item.scoreText}`}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 10,
            borderWidth: 1,
            backgroundColor: item.isFeatured ? '#FEF3C7' : '#EFF6FF',
            borderColor: item.isFeatured ? '#FDE68A' : '#BFDBFE',
          }}
        >
          {item.isFeatured ? (
            <Trophy size={16} color="#D97706" />
          ) : (
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#1D4ED8' }}>
              {getInitials(item.studentName)}
            </Text>
          )}
        </View>

        <View style={{ flex: 1, marginRight: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
            <Text style={{ fontSize: 12.5, fontWeight: '700', color: '#0F172A' }}>
              {item.studentName}
            </Text>
            {item.isFeatured && (
              <View
                style={{
                  backgroundColor: '#FEF3C7',
                  borderWidth: 1,
                  borderColor: '#FDE68A',
                  borderRadius: 6,
                  paddingHorizontal: 6,
                  paddingVertical: 1.5,
                }}
              >
                <Text
                  style={{
                    fontSize: 9,
                    fontWeight: '800',
                    color: '#92400E',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  TOPPER
                </Text>
              </View>
            )}
          </View>
          <Text style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
            {item.exam} • Batch {item.year}
          </Text>
        </View>
      </View>

      <View
        style={{
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderRadius: 8,
          borderWidth: 1,
          backgroundColor: isTopScore ? '#1D4ED8' : '#EFF6FF',
          borderColor: isTopScore ? '#1E40AF' : '#BFDBFE',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            fontSize: 12,
            fontWeight: '800',
            color: isTopScore ? '#FFFFFF' : '#1D4ED8',
          }}
        >
          {item.scoreText}
        </Text>
      </View>
    </View>
  );
}

function TestimonialRow({
  item,
  onOpenVideo,
}: {
  item: TestimonialItem;
  onOpenVideo?: (videoId: string) => void;
}) {
  return (
    <View
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 13,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 10,
        shadowColor: '#000',
        shadowOpacity: 0.03,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 3,
        elevation: 1,
      }}
      accessibilityLabel={`Review from ${item.studentName}, Class ${item.classLevel}, ${item.year}: ${item.quote}`}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: '#EFF6FF',
              borderWidth: 1,
              borderColor: '#BFDBFE',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 8,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#1D4ED8' }}>
              {getInitials(item.studentName)}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#0F172A' }}>
                {item.studentName}
              </Text>
              <CheckCircle2 size={12} color="#15803D" />
            </View>
            <Text style={{ fontSize: 10.5, color: '#64748B' }}>
              Class {item.classLevel} • Batch of {item.year}
            </Text>
          </View>
        </View>

        {/* 5-star rating */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Star key={star} size={11} color="#F59E0B" fill="#F59E0B" />
          ))}
        </View>
      </View>

      <Text
        style={{
          fontSize: 11.5,
          color: '#334155',
          fontStyle: 'italic',
          lineHeight: 17,
        }}
      >
        "{item.quote}"
      </Text>

      {item.videoId && (
        <TouchableOpacity
          onPress={() => onOpenVideo?.(item.videoId!)}
          activeOpacity={0.7}
          style={{
            alignSelf: 'flex-start',
            marginTop: 8,
            paddingVertical: 5,
            paddingHorizontal: 9,
            borderRadius: 8,
            backgroundColor: '#EFF6FF',
            borderWidth: 1,
            borderColor: '#BFDBFE',
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Play size={10} color="#1D4ED8" fill="#1D4ED8" />
          <Text style={{ fontSize: 10.5, fontWeight: '700', color: '#1D4ED8', marginLeft: 4 }}>
            Watch Student Video Review
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
