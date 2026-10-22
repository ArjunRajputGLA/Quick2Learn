import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  Sparkles,
  Plus,
  Search,
  BookOpen,
  Edit3,
  Trash2,
  CheckCircle2,
  Clock,
  IndianRupee,
  Star,
  Users,
  Eye,
  EyeOff,
  X,
  ChevronRight,
  School,
  GraduationCap,
} from 'lucide-react-native';
import { Badge } from '../ui/Badge';
import { EmptyState } from '../ui/EmptyState';
import { Chip } from '../ui/Chip';
import {
  useAdminStore,
  type AdminStore,
  type AdminCourseItem,
} from '../../lib/adminDataStore';

export interface CoursesManagerSectionProps {
  store: AdminStore;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  classFilter?: 'all' | '9' | '10' | '11' | '12';
  setClassFilter?: (c: any) => void;
  onCreateCourse?: () => void;
  onAddCourse?: () => void;
  onEditCourse: (course: AdminCourseItem) => void;
  onToast?: (toast: { type: 'success' | 'error' | 'info'; message: string }) => void;
  onNotify?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export function CoursesManagerSection({
  store,
  searchQuery,
  setSearchQuery,
  classFilter = 'all',
  setClassFilter,
  onCreateCourse,
  onAddCourse,
  onEditCourse,
  onToast,
  onNotify,
}: CoursesManagerSectionProps) {
  const notify = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    if (onToast) onToast({ type, message: msg });
    if (onNotify) onNotify(msg, type);
  };
  const triggerCreate = onCreateCourse || onAddCourse || (() => {});
  const courses = store.courses || [];

  const filteredCourses = courses.filter((c: AdminCourseItem) => {
    const matchSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.subtitle || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.faculty || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.subjects || []).some((s: string) => s.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchClass =
      classFilter === 'all' || (c.targetClass || c.classLevel || 9).toString() === classFilter;
    return matchSearch && matchClass;
  });

  const handleTogglePublish = async (course: AdminCourseItem) => {
    const nextStatus = course.status === 'published' ? 'draft' : 'published';
    await store.updateCourse(course.id, { status: nextStatus });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    notify(`Course ${nextStatus === 'draft' ? 'unpublished to Draft' : 'published for students'}.`, 'info');
  };

  const handleDeleteCourse = (course: AdminCourseItem) => {
    Alert.alert(
      'Delete Course',
      `Are you sure you want to delete "${course.title}"? Students enrolled will lose access.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await store.deleteCourse(course.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            notify('Course deleted successfully.', 'info');
          },
        },
      ]
    );
  };

  return (
    <View style={{ gap: 14 }}>
      {/* Top Banner & Action */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#FFFFFF',
          padding: 14,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: '#E2E8F0',
        }}
      >
        <View style={{ flex: 1, marginRight: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Sparkles size={16} color="#2563EB" />
            <Text style={{ fontSize: 15, fontWeight: '800', color: '#0F172A' }}>
              Institute Courses & Packs
            </Text>
          </View>
          <Text style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>
            {courses.length} courses loaded in student app
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onCreateCourse}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            backgroundColor: '#2563EB',
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 10,
          }}
        >
          <Plus size={15} color="#FFFFFF" />
          <Text style={{ fontSize: 12, fontWeight: '800', color: '#FFFFFF' }}>Create Course</Text>
        </TouchableOpacity>
      </View>

      {/* Search & Class Filter */}
      <View style={{ gap: 10 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            paddingHorizontal: 12,
            borderWidth: 1,
            borderColor: '#E2E8F0',
            height: 42,
          }}
        >
          <Search size={16} color="#94A3B8" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search courses by title, subject, or faculty..."
            placeholderTextColor="#94A3B8"
            style={{ flex: 1, marginLeft: 8, fontSize: 13, color: '#0F172A' }}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={14} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Class Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          {(['all', '9', '10', '11', '12'] as const).map((lvl) => (
            <Chip
              key={lvl}
              label={lvl === 'all' ? 'All Classes' : `Class ${lvl}`}
              selected={classFilter === lvl}
              onPress={() => setClassFilter?.(lvl)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Courses List */}
      {filteredCourses.length === 0 ? (
        <EmptyState
          title="No Courses Found"
          description="Create comprehensive study courses for your coaching institute."
          actionLabel="Create Course"
          onAction={triggerCreate}
        />
      ) : (
        <View style={{ gap: 12 }}>
          {filteredCourses.map((c: AdminCourseItem) => (
            <View
              key={c.id}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: '#E2E8F0',
                gap: 12,
                elevation: 1,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.04,
                shadowRadius: 3,
              }}
            >
              {/* Badges Row */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <Badge label={`CLASS ${c.targetClass || c.classLevel || 9}`} variant="primary" size="sm" />
                  <Badge label={(c.board || 'icse').toUpperCase()} variant="neutral" size="sm" />
                  <Badge
                    label={c.status === 'published' ? 'PUBLISHED' : 'DRAFT'}
                    variant={c.status === 'published' ? 'success' : 'neutral'}
                    size="sm"
                  />
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Star size={13} color="#F59E0B" fill="#F59E0B" />
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#0F172A' }}>4.9</Text>
                  <Text style={{ fontSize: 11, color: '#94A3B8' }}>(180+)</Text>
                </View>
              </View>

              {/* Course Title & Subtitle */}
              <View>
                <Text style={{ fontSize: 15.5, fontWeight: '800', color: '#0F172A', lineHeight: 21 }}>
                  {c.title}
                </Text>
                {c.subtitle ? (
                  <Text style={{ fontSize: 12, color: '#64748B', marginTop: 3 }}>
                    {c.subtitle}
                  </Text>
                ) : null}
                <Text style={{ fontSize: 11.5, color: '#475569', marginTop: 3, fontWeight: '600' }}>
                  Faculty: {c.faculty || 'DINESH SINGH RAJPUT'} • Subjects: {(c.subjects || []).join(', ')}
                </Text>
              </View>

              {/* Price & Validity Strip */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#F8FAFC',
                  padding: 10,
                  borderRadius: 12,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                  <Text style={{ fontSize: 16, fontWeight: '900', color: '#0F172A' }}>
                    ₹{(c.discountedPrice ?? c.price).toLocaleString('en-IN')}
                  </Text>
                  {c.price > (c.discountedPrice ?? c.price) && (
                    <Text
                      style={{
                        fontSize: 12,
                        color: '#94A3B8',
                        textDecorationLine: 'line-through',
                      }}
                    >
                      ₹{c.price.toLocaleString('en-IN')}
                    </Text>
                  )}
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Clock size={12} color="#64748B" />
                  <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#64748B' }}>
                    {c.validity || '365 Days'}
                  </Text>
                </View>
              </View>

              {/* Features Tags */}
              {c.features && c.features.length > 0 && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {c.features.map((f: string, idx: number) => (
                    <View
                      key={idx}
                      style={{
                        backgroundColor: '#EFF6FF',
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 6,
                      }}
                    >
                      <Text style={{ fontSize: 10.5, fontWeight: '700', color: '#1E40AF' }}>
                        ✓ {f}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Enrolled Stats & Actions Footer */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: 10,
                  borderTopWidth: 1,
                  borderTopColor: '#F1F5F9',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Users size={13} color="#64748B" />
                  <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#64748B' }}>
                    {c.enrolledCount} Students Enrolled
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <TouchableOpacity
                    onPress={() => handleTogglePublish(c)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      paddingHorizontal: 9,
                      paddingVertical: 5,
                      borderRadius: 8,
                      backgroundColor: c.isPublished ? '#FEF2F2' : '#F0FDF4',
                    }}
                  >
                    {c.isPublished ? (
                      <>
                        <EyeOff size={12} color="#DC2626" />
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#DC2626' }}>Draft</Text>
                      </>
                    ) : (
                      <>
                        <Eye size={12} color="#16A34A" />
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#16A34A' }}>Publish</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => onEditCourse(c)}
                    style={{
                      paddingHorizontal: 9,
                      paddingVertical: 5,
                      borderRadius: 8,
                      backgroundColor: '#EFF6FF',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Edit3 size={12} color="#2563EB" />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#2563EB' }}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleDeleteCourse(c)}
                    style={{
                      padding: 6,
                      borderRadius: 8,
                      backgroundColor: '#FEE2E2',
                    }}
                  >
                    <Trash2 size={13} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// -------------------------------------------------------------
// COURSE FORM MODAL (CREATE / EDIT)
// -------------------------------------------------------------

interface CourseFormModalProps {
  visible: boolean;
  onClose: () => void;
  course?: AdminCourseItem | null;
  initialData?: AdminCourseItem | null;
  onToast?: (toast: { type: 'success' | 'error' | 'info'; message: string }) => void;
  onSave?: (courseData: Partial<AdminCourseItem>) => Promise<void>;
}

export function CourseFormModal({
  visible,
  onClose,
  course,
  initialData,
  onToast,
  onSave,
}: CourseFormModalProps) {
  const store = useAdminStore();
  const activeCourse = course !== undefined ? course : initialData;

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [classLevel, setClassLevel] = useState<9 | 10 | 11 | 12>(9);
  const [board, setBoard] = useState<'cbse' | 'icse' | 'isc' | 'all'>('icse');
  const [subjectsText, setSubjectsText] = useState('Maths, Science');
  const [priceText, setPriceText] = useState('12999');
  const [originalPriceText, setOriginalPriceText] = useState('16999');
  const [validityText, setValidityText] = useState('365');
  const [faculty, setFaculty] = useState('DINESH SINGH RAJPUT');
  const [featuresText, setFeaturesText] = useState(
    'Complete Selina Solutions PDF, Chapter-wise Recorded Video Lectures, Live Class Access, Chapter Tests'
  );

  React.useEffect(() => {
    if (activeCourse) {
      setTitle(activeCourse.title);
      setSubtitle(activeCourse.subtitle || '');
      setDescription(activeCourse.description || '');
      setClassLevel(activeCourse.classLevel);
      setBoard(activeCourse.board);
      setSubjectsText((activeCourse.subjects || []).join(', '));
      setPriceText((activeCourse.discountedPrice ?? activeCourse.price).toString());
      setOriginalPriceText(activeCourse.price.toString());
      setValidityText('365');
      setFaculty(activeCourse.faculty || 'DINESH SINGH RAJPUT');
      setFeaturesText((activeCourse.features || []).join(', '));
    } else {
      setTitle('');
      setSubtitle('');
      setDescription('');
      setClassLevel(9);
      setBoard('icse');
      setSubjectsText('Maths, Science');
      setPriceText('12999');
      setOriginalPriceText('16999');
      setValidityText('365');
      setFaculty('DINESH SINGH RAJPUT');
      setFeaturesText(
        'Complete Selina Solutions PDF, Chapter-wise Recorded Video Lectures, Live Class Access, Chapter Tests'
      );
    }
  }, [activeCourse, visible]);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter a course title.');
      return;
    }

    const price = parseInt(priceText, 10) || 0;
    const originalPrice = parseInt(originalPriceText, 10) || price;
    const validityDays = parseInt(validityText, 10) || 365;
    const subjects = subjectsText.split(',').map((s) => s.trim()).filter(Boolean);
    const features = featuresText.split(',').map((s) => s.trim()).filter(Boolean);

    try {
      const payload: Partial<AdminCourseItem> = {
        title,
        subtitle,
        description,
        classLevel,
        board,
        subjects,
        discountedPrice: price,
        price: originalPrice,
        validity: `${validityDays} Days`,
        faculty,
        features,
        status: 'published',
      };

      if (onSave) {
        await onSave(payload);
      } else if (activeCourse) {
        await store.updateCourse(activeCourse.id, payload);
        if (onToast) onToast({ type: 'success', message: 'Course updated successfully.' });
      } else {
        await store.createCourse({
          title,
          subtitle,
          description,
          thumbnailUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=600&q=80',
          classLevel,
          board,
          subjects,
          discountedPrice: price,
          price: originalPrice,
          validity: `${validityDays} Days`,
          features,
          status: 'published',
          isPublished: true,
          faculty,
        });
        if (onToast) onToast({ type: 'success', message: 'Course created and published.' });
      }
      onClose();
    } catch {
      Alert.alert('Error', 'Failed to save course.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
      >
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 20,
            maxHeight: '90%',
            gap: 16,
          }}
        >
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ fontSize: 17, fontWeight: '800', color: '#0F172A' }}>
                {course ? 'Edit Course' : 'Create New Course'}
              </Text>
              <Text style={{ fontSize: 12, color: '#64748B' }}>
                Available to all students on the app
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={{ padding: 6 }}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 24 }}>
            {/* Title */}
            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 12.5, fontWeight: '700', color: '#334155' }}>Course Title *</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Class 9 ICSE Complete Maths & Science"
                placeholderTextColor="#94A3B8"
                style={{
                  backgroundColor: '#F8FAFC',
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 9,
                  fontSize: 13.5,
                  color: '#0F172A',
                }}
              />
            </View>

            {/* Subtitle */}
            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 12.5, fontWeight: '700', color: '#334155' }}>Subtitle / Highlights</Text>
              <TextInput
                value={subtitle}
                onChangeText={setSubtitle}
                placeholder="e.g. Comprehensive Selina Solutions & Board Prep"
                placeholderTextColor="#94A3B8"
                style={{
                  backgroundColor: '#F8FAFC',
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 9,
                  fontSize: 13.5,
                  color: '#0F172A',
                }}
              />
            </View>

            {/* Description */}
            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 12.5, fontWeight: '700', color: '#334155' }}>Description</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Explain what is included in this course pack..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
                style={{
                  backgroundColor: '#F8FAFC',
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 9,
                  fontSize: 13,
                  color: '#0F172A',
                  minHeight: 70,
                  textAlignVertical: 'top',
                }}
              />
            </View>

            {/* Class & Board selectors */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ fontSize: 12.5, fontWeight: '700', color: '#334155' }}>Class Level</Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {([9, 10, 11, 12] as const).map((lvl) => (
                    <TouchableOpacity
                      key={lvl}
                      onPress={() => setClassLevel(lvl)}
                      style={{
                        flex: 1,
                        paddingVertical: 8,
                        borderRadius: 8,
                        backgroundColor: classLevel === lvl ? '#2563EB' : '#F1F5F9',
                        alignItems: 'center',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '800',
                          color: classLevel === lvl ? '#FFFFFF' : '#475569',
                        }}
                      >
                        {lvl}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ fontSize: 12.5, fontWeight: '700', color: '#334155' }}>Board</Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {(['icse', 'cbse', 'all'] as const).map((b) => (
                    <TouchableOpacity
                      key={b}
                      onPress={() => setBoard(b)}
                      style={{
                        flex: 1,
                        paddingVertical: 8,
                        borderRadius: 8,
                        backgroundColor: board === b ? '#2563EB' : '#F1F5F9',
                        alignItems: 'center',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: '800',
                          color: board === b ? '#FFFFFF' : '#475569',
                          textTransform: 'uppercase',
                        }}
                      >
                        {b}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Subjects & Faculty */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ fontSize: 12.5, fontWeight: '700', color: '#334155' }}>Subjects (comma sep)</Text>
                <TextInput
                  value={subjectsText}
                  onChangeText={setSubjectsText}
                  placeholder="e.g. Maths, Science"
                  placeholderTextColor="#94A3B8"
                  style={{
                    backgroundColor: '#F8FAFC',
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 9,
                    fontSize: 13,
                    color: '#0F172A',
                  }}
                />
              </View>

              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ fontSize: 12.5, fontWeight: '700', color: '#334155' }}>Faculty</Text>
                <TextInput
                  value={faculty}
                  onChangeText={setFaculty}
                  placeholder="e.g. DINESH SINGH RAJPUT"
                  placeholderTextColor="#94A3B8"
                  style={{
                    backgroundColor: '#F8FAFC',
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 9,
                    fontSize: 13,
                    color: '#0F172A',
                  }}
                />
              </View>
            </View>

            {/* Pricing & Validity */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ fontSize: 12.5, fontWeight: '700', color: '#334155' }}>Fee Price (₹)</Text>
                <TextInput
                  value={priceText}
                  onChangeText={setPriceText}
                  keyboardType="numeric"
                  placeholder="12999"
                  placeholderTextColor="#94A3B8"
                  style={{
                    backgroundColor: '#F8FAFC',
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 9,
                    fontSize: 13,
                    color: '#0F172A',
                  }}
                />
              </View>

              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ fontSize: 12.5, fontWeight: '700', color: '#334155' }}>Original (₹)</Text>
                <TextInput
                  value={originalPriceText}
                  onChangeText={setOriginalPriceText}
                  keyboardType="numeric"
                  placeholder="16999"
                  placeholderTextColor="#94A3B8"
                  style={{
                    backgroundColor: '#F8FAFC',
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 9,
                    fontSize: 13,
                    color: '#0F172A',
                  }}
                />
              </View>

              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ fontSize: 12.5, fontWeight: '700', color: '#334155' }}>Validity (Days)</Text>
                <TextInput
                  value={validityText}
                  onChangeText={setValidityText}
                  keyboardType="numeric"
                  placeholder="365"
                  placeholderTextColor="#94A3B8"
                  style={{
                    backgroundColor: '#F8FAFC',
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 9,
                    fontSize: 13,
                    color: '#0F172A',
                  }}
                />
              </View>
            </View>

            {/* Features list */}
            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 12.5, fontWeight: '700', color: '#334155' }}>Features (comma sep)</Text>
              <TextInput
                value={featuresText}
                onChangeText={setFeaturesText}
                placeholder="Selina Solutions PDF, Video Lectures, Chapter Tests"
                placeholderTextColor="#94A3B8"
                style={{
                  backgroundColor: '#F8FAFC',
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 9,
                  fontSize: 13,
                  color: '#0F172A',
                }}
              />
            </View>

            {/* Save Button */}
            <TouchableOpacity
              onPress={handleSave}
              style={{
                backgroundColor: '#2563EB',
                paddingVertical: 13,
                borderRadius: 12,
                alignItems: 'center',
                marginTop: 8,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#FFFFFF' }}>
                {course ? 'Save Course Changes' : 'Publish Course'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
