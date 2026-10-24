import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  X,
  Award,
  Calendar,
  Clock,
  Plus,
  Trash2,
  Check,
  Sparkles,
  Radio,
  Layers,
  Search,
  BookOpen,
} from 'lucide-react-native';
import {
  useAdminStore,
  type BatchItem,
  type AdminTestItem,
} from '../../lib/adminDataStore';
import { getSuggestedChapters } from '../../lib/syllabusChapters';

interface ScheduleTestToBatchModalProps {
  visible: boolean;
  batch: BatchItem | null;
  test: AdminTestItem | null;
  onClose: () => void;
  onSaved: (isEdit: boolean) => void;
  onDelete?: (testId: string) => void;
}

export function ScheduleTestToBatchModal({
  visible,
  batch,
  test,
  onClose,
  onSaved,
  onDelete,
}: ScheduleTestToBatchModalProps) {
  const insets = useSafeAreaInsets();
  const store = useAdminStore();

  // Test details state
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
  const [chapterSearch, setChapterSearch] = useState('');
  const [duration, setDuration] = useState('60');
  const [totalMarks, setTotalMarks] = useState('40');
  const [passingMarks, setPassingMarks] = useState('14');
  const [questionsCount, setQuestionsCount] = useState('15');
  const [status, setStatus] = useState<'upcoming' | 'live' | 'completed'>('upcoming');

  // Schedule date & time state
  const [datePreset, setDatePreset] = useState<'today' | 'tomorrow' | 'saturday' | 'sunday' | 'custom'>('today');
  const [customDate, setCustomDate] = useState('');
  const [timePreset, setTimePreset] = useState<string>('05:00 PM');
  const [customTime, setCustomTime] = useState('');
  const [windowPreset, setWindowPreset] = useState<'2h' | '24h' | '48h'>('24h');

  // Subjects available in this batch
  const batchSubjects = useMemo(() => {
    if (!batch?.subject) return ['Mathematics'];
    return batch.subject
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }, [batch?.subject]);

  // Suggested chapters from curriculum
  const suggestedChapters = useMemo(() => {
    if (!batch) return [];
    return getSuggestedChapters(batch.classLevel, subject || batchSubjects[0]);
  }, [batch, subject, batchSubjects]);

  // Filtered suggested chapters by search
  const filteredSuggestedChapters = useMemo(() => {
    const q = chapterSearch.trim().toLowerCase();
    if (!q) return suggestedChapters;
    return suggestedChapters.filter((ch) => ch.toLowerCase().includes(q));
  }, [suggestedChapters, chapterSearch]);

  // Reset or fill state on open / test change
  useEffect(() => {
    if (!visible || !batch) return;

    if (test) {
      setTitle(test.title);
      setSubject(test.subject);
      setSelectedChapters(test.chapters || []);
      setDuration(test.durationMinutes.toString());
      setTotalMarks(test.totalMarks.toString());
      setPassingMarks(test.passingMarks.toString());
      setQuestionsCount(test.questionsCount.toString());
      setStatus(test.status);

      // Parse scheduledStart
      try {
        const start = new Date(test.scheduledStart);
        const ymd = start.toISOString().split('T')[0];
        setCustomDate(ymd);
        setDatePreset('custom');

        const hours = start.getHours();
        const mins = start.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const formattedHours = hours % 12 || 12;
        const timeStr = `${formattedHours < 10 ? '0' : ''}${formattedHours}:${mins < 10 ? '0' : ''}${mins} ${ampm}`;
        setTimePreset(timeStr);
      } catch {
        setDatePreset('today');
        setTimePreset('05:00 PM');
      }
    } else {
      // Default new test for this batch
      const initialSubject = batchSubjects[0] || 'Mathematics';
      setSubject(initialSubject);
      const initialChaps = getSuggestedChapters(batch.classLevel, initialSubject);
      setSelectedChapters(initialChaps.length > 0 ? [initialChaps[0]] : ['Chapter 1']);
      setTitle(`Unit Assessment: ${initialChaps[0] || 'Unit 1'}`);
      setDuration('60');
      setTotalMarks('40');
      setPassingMarks('14');
      setQuestionsCount('15');
      setStatus('upcoming');
      setDatePreset('today');

      // Check if batch has a schedule time slot
      if (batch.scheduleTime && batch.scheduleTime.includes('-')) {
        const firstSlot = batch.scheduleTime.split('-')[0].trim();
        setTimePreset(firstSlot);
      } else {
        setTimePreset('05:00 PM');
      }
      setWindowPreset('24h');
    }
  }, [visible, test, batch, batchSubjects]);

  if (!batch) return null;

  // Toggle chapter selection
  const handleToggleChapter = (ch: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedChapters((prev) =>
      prev.includes(ch) ? prev.filter((item) => item !== ch) : [...prev, ch]
    );
  };

  // Add custom typed chapter
  const handleAddCustomChapter = () => {
    const trimmed = chapterSearch.trim();
    if (!trimmed) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!selectedChapters.includes(trimmed)) {
      setSelectedChapters((prev) => [...prev, trimmed]);
    }
    setChapterSearch('');
  };

  // Compute scheduled start ISO
  const getComputedStartIso = (): string => {
    const now = new Date();
    let targetDateStr = '';

    if (datePreset === 'today') {
      targetDateStr = now.toISOString().split('T')[0];
    } else if (datePreset === 'tomorrow') {
      const tom = new Date(now);
      tom.setDate(tom.getDate() + 1);
      targetDateStr = tom.toISOString().split('T')[0];
    } else if (datePreset === 'saturday') {
      const sat = new Date(now);
      sat.setDate(sat.getDate() + ((6 - sat.getDay() + 7) % 7 || 7));
      targetDateStr = sat.toISOString().split('T')[0];
    } else if (datePreset === 'sunday') {
      const sun = new Date(now);
      sun.setDate(sun.getDate() + ((0 - sun.getDay() + 7) % 7 || 7));
      targetDateStr = sun.toISOString().split('T')[0];
    } else {
      targetDateStr = customDate.trim() || now.toISOString().split('T')[0];
    }

    const activeTimeStr = timePreset === 'custom' ? customTime : timePreset;
    const cleanTime = (activeTimeStr || '05:00 PM').trim().toUpperCase();
    const isPm = cleanTime.includes('PM');
    const isAm = cleanTime.includes('AM');
    const parts = cleanTime.replace(/(AM|PM)/g, '').trim().split(':');
    let hours = parseInt(parts[0], 10) || 17;
    const minutes = parseInt(parts[1], 10) || 0;
    if (isPm && hours < 12) hours += 12;
    if (isAm && hours === 12) hours = 0;

    try {
      const d = new Date(targetDateStr);
      d.setHours(hours, minutes, 0, 0);
      return d.toISOString();
    } catch {
      return now.toISOString();
    }
  };

  // Compute scheduled end ISO
  const getComputedEndIso = (startIso: string): string => {
    try {
      const start = new Date(startIso);
      let addHours = 24;
      if (windowPreset === '2h') addHours = 2;
      if (windowPreset === '48h') addHours = 48;
      const end = new Date(start.getTime() + addHours * 3600 * 1000);
      return end.toISOString();
    } catch {
      return new Date(Date.now() + 86400000).toISOString();
    }
  };

  // Save handler
  const handleSave = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      Alert.alert('Required Field', 'Please enter a title for the test.');
      return;
    }

    if (selectedChapters.length === 0) {
      Alert.alert('Chapters Required', 'Please select or add at least one chapter covered by this test.');
      return;
    }

    const parsedDuration = parseInt(duration, 10);
    if (!parsedDuration || parsedDuration <= 0) {
      Alert.alert('Invalid Duration', 'Duration must be a positive number of minutes.');
      return;
    }

    const parsedTotalMarks = parseInt(totalMarks, 10);
    if (!parsedTotalMarks || parsedTotalMarks <= 0) {
      Alert.alert('Invalid Total Marks', 'Please enter a valid total marks number.');
      return;
    }

    const parsedPassingMarks = parseInt(passingMarks, 10) || Math.round(parsedTotalMarks * 0.35);
    const parsedQuestions = parseInt(questionsCount, 10) || 10;

    const startIso = getComputedStartIso();
    const endIso = getComputedEndIso(startIso);

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (test) {
      await store.updateTest(test.id, {
        title: trimmedTitle,
        subject: subject || batchSubjects[0],
        chapters: selectedChapters,
        durationMinutes: parsedDuration,
        totalMarks: parsedTotalMarks,
        passingMarks: parsedPassingMarks,
        questionsCount: parsedQuestions,
        scheduledStart: startIso,
        scheduledEnd: endIso,
        status: status,
        batchId: batch.id,
        batchTitle: batch.title,
        classLevel: batch.classLevel,
        isPublished: true,
      });
      onSaved(true);
    } else {
      await store.createTest({
        title: trimmedTitle,
        subject: subject || batchSubjects[0],
        classLevel: batch.classLevel,
        batchId: batch.id,
        batchTitle: batch.title,
        chapters: selectedChapters,
        durationMinutes: parsedDuration,
        totalMarks: parsedTotalMarks,
        passingMarks: parsedPassingMarks,
        questionsCount: parsedQuestions,
        scheduledStart: startIso,
        scheduledEnd: endIso,
        status: status,
        isPublished: true,
      });
      onSaved(false);
    }
  };

  const sheetBottomPadding = Math.max(insets.bottom, 16) + 12;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.65)', justifyContent: 'flex-end' }}
      >
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: sheetBottomPadding,
            maxHeight: '92%',
            gap: 14,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.15,
            shadowRadius: 16,
            elevation: 20,
          }}
        >
          {/* Drag Handle */}
          <View style={{ alignItems: 'center', marginBottom: 2 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#CBD5E1' }} />
          </View>

          {/* Modal Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 8 }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 14,
                  backgroundColor: '#ECFEFF',
                  borderWidth: 1,
                  borderColor: '#A5F3FC',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Award size={21} color="#0891B2" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 17, fontWeight: '800', color: '#0F172A', letterSpacing: -0.2 }}>
                  {test ? 'Edit Batch Test' : 'Schedule Test for Batch'}
                </Text>
                <Text style={{ fontSize: 12, color: '#64748B' }} numberOfLines={1}>
                  {batch.title} • Class {batch.classLevel} ({batch.board.toUpperCase()})
                </Text>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onClose();
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: '#F1F5F9',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={18} color="#475569" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingBottom: 20 }}>
            {/* 1. Target Batch Context Badge */}
            <View
              style={{
                backgroundColor: '#F0FDFA',
                borderRadius: 12,
                padding: 11,
                borderWidth: 1,
                borderColor: '#99F6E4',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <BookOpen size={16} color="#0D9488" />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#134E4A' }} numberOfLines={1}>
                  Assigned Batch: {batch.title}
                </Text>
                <Text style={{ fontSize: 11, color: '#0F766E', marginTop: 1 }}>
                  Faculty: {batch.faculty} • Mode: {batch.mode.toUpperCase()} • Class {batch.classLevel}
                </Text>
              </View>
            </View>

            {/* 2. Subject Picker (if multiple subjects in batch) */}
            {batchSubjects.length > 1 && (
              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#334155' }}>Select Subject *</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {batchSubjects.map((sub) => {
                    const isSelected = subject.toLowerCase() === sub.toLowerCase();
                    return (
                      <TouchableOpacity
                        key={sub}
                        activeOpacity={0.75}
                        onPress={() => {
                          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setSubject(sub);
                        }}
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 7,
                          borderRadius: 10,
                          backgroundColor: isSelected ? '#0891B2' : '#F1F5F9',
                          borderWidth: 1,
                          borderColor: isSelected ? '#0891B2' : '#E2E8F0',
                        }}
                      >
                        <Text style={{ fontSize: 12.5, fontWeight: '800', color: isSelected ? '#FFFFFF' : '#334155' }}>
                          {sub}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* 3. Test Title & Quick Templates */}
            <View style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#334155' }}>Test Title *</Text>
                <Text style={{ fontSize: 11, color: '#64748B' }}>Tap preset to auto-fill</Text>
              </View>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Unit Test 1: Relations & Functions"
                placeholderTextColor="#94A3B8"
                style={{
                  borderWidth: 1.5,
                  borderColor: '#E2E8F0',
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 11,
                  fontSize: 14,
                  color: '#0F172A',
                  backgroundColor: '#F8FAFC',
                }}
              />
              {/* Quick Template Chips */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingTop: 4 }}>
                {[
                  'Unit Test 1',
                  'Chapter Quiz',
                  'Weekly Assessment',
                  'Board Mock Test',
                  'Doubt Clearing Test',
                ].map((tmpl) => (
                  <TouchableOpacity
                    key={tmpl}
                    activeOpacity={0.75}
                    onPress={() => {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      const prefix = selectedChapters[0] ? `${tmpl}: ${selectedChapters[0]}` : tmpl;
                      setTitle(prefix);
                    }}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 8,
                      backgroundColor: '#EFF6FF',
                      borderWidth: 1,
                      borderColor: '#BFDBFE',
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#1D4ED8' }}>+ {tmpl}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* 4. Syllabus / Chapters Included */}
            <View style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#334155' }}>
                  Chapters Included * ({selectedChapters.length} Selected)
                </Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedChapters(suggestedChapters);
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#0891B2' }}>Select All</Text>
                  </TouchableOpacity>
                  <Text style={{ fontSize: 11, color: '#CBD5E1' }}>|</Text>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedChapters([]);
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B' }}>Clear</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Selected Chapters Pills */}
              {selectedChapters.length > 0 && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingVertical: 4 }}>
                  {selectedChapters.map((ch) => (
                    <View
                      key={ch}
                      style={{
                        backgroundColor: '#ECFEFF',
                        borderWidth: 1,
                        borderColor: '#A5F3FC',
                        borderRadius: 8,
                        paddingVertical: 4,
                        paddingHorizontal: 8,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#0E7490' }} numberOfLines={1}>
                        {ch}
                      </Text>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => handleToggleChapter(ch)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <X size={12} color="#0E7490" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {/* Search or Add Custom Chapter */}
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <View
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#F8FAFC',
                    borderWidth: 1.5,
                    borderColor: '#E2E8F0',
                    borderRadius: 10,
                    paddingHorizontal: 10,
                  }}
                >
                  <Search size={14} color="#94A3B8" />
                  <TextInput
                    value={chapterSearch}
                    onChangeText={setChapterSearch}
                    placeholder="Search or type custom chapter..."
                    placeholderTextColor="#94A3B8"
                    style={{ flex: 1, paddingVertical: 8, paddingHorizontal: 6, fontSize: 13, color: '#0F172A' }}
                  />
                  {chapterSearch.trim().length > 0 && (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => setChapterSearch('')}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <X size={13} color="#94A3B8" />
                    </TouchableOpacity>
                  )}
                </View>
                {chapterSearch.trim().length > 0 && (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleAddCustomChapter}
                    style={{
                      backgroundColor: '#0891B2',
                      paddingHorizontal: 12,
                      borderRadius: 10,
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'row',
                      gap: 4,
                    }}
                  >
                    <Plus size={14} color="#FFFFFF" strokeWidth={2.5} />
                    <Text style={{ fontSize: 12, fontWeight: '800', color: '#FFFFFF' }}>Add</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Suggested Chapter Chips */}
              <View style={{ gap: 4 }}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: '#64748B' }}>
                  Tap chapter to add/remove:
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {filteredSuggestedChapters.slice(0, 8).map((ch) => {
                    const isSelected = selectedChapters.includes(ch);
                    return (
                      <TouchableOpacity
                        key={ch}
                        activeOpacity={0.75}
                        onPress={() => handleToggleChapter(ch)}
                        style={{
                          paddingHorizontal: 9,
                          paddingVertical: 5,
                          borderRadius: 8,
                          backgroundColor: isSelected ? '#0891B2' : '#F1F5F9',
                          borderWidth: 1,
                          borderColor: isSelected ? '#0891B2' : '#E2E8F0',
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        {isSelected && <Check size={11} color="#FFFFFF" strokeWidth={3} />}
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: isSelected ? '800' : '600',
                            color: isSelected ? '#FFFFFF' : '#334155',
                          }}
                        >
                          {ch}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* 5. Schedule Date */}
            <View style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Calendar size={14} color="#0891B2" />
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#334155' }}>Schedule Date *</Text>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {[
                  { id: 'today' as const, label: 'Today' },
                  { id: 'tomorrow' as const, label: 'Tomorrow' },
                  { id: 'saturday' as const, label: 'Saturday' },
                  { id: 'sunday' as const, label: 'Sunday' },
                  { id: 'custom' as const, label: 'Custom Date' },
                ].map((item) => {
                  const isSelected = datePreset === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      activeOpacity={0.75}
                      onPress={() => {
                        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setDatePreset(item.id);
                        if (item.id === 'custom' && !customDate) {
                          setCustomDate(new Date().toISOString().split('T')[0]);
                        }
                      }}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 7,
                        borderRadius: 9,
                        backgroundColor: isSelected ? '#0891B2' : '#F8FAFC',
                        borderWidth: 1,
                        borderColor: isSelected ? '#0891B2' : '#E2E8F0',
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '800', color: isSelected ? '#FFFFFF' : '#334155' }}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {datePreset === 'custom' && (
                <TextInput
                  value={customDate}
                  onChangeText={setCustomDate}
                  placeholder="YYYY-MM-DD (e.g. 2026-10-25)"
                  placeholderTextColor="#94A3B8"
                  style={{
                    borderWidth: 1.5,
                    borderColor: '#0891B2',
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 9,
                    fontSize: 13,
                    color: '#0F172A',
                    backgroundColor: '#FFFFFF',
                  }}
                />
              )}
            </View>

            {/* 6. Schedule Start Time */}
            <View style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Clock size={14} color="#0891B2" />
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#334155' }}>Start Time *</Text>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {batch.scheduleTime && (
                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={() => {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      const slot = batch.scheduleTime.split('-')[0].trim();
                      setTimePreset(slot);
                    }}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 8,
                      backgroundColor:
                        timePreset === batch.scheduleTime.split('-')[0].trim() ? '#0891B2' : '#EFF6FF',
                      borderWidth: 1,
                      borderColor:
                        timePreset === batch.scheduleTime.split('-')[0].trim() ? '#0891B2' : '#BFDBFE',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11.5,
                        fontWeight: '800',
                        color:
                          timePreset === batch.scheduleTime.split('-')[0].trim() ? '#FFFFFF' : '#1D4ED8',
                      }}
                    >
                      ⭐ Batch Time ({batch.scheduleTime.split('-')[0].trim()})
                    </Text>
                  </TouchableOpacity>
                )}
                {['09:00 AM', '11:00 AM', '03:00 PM', '05:00 PM', '07:00 PM', '08:00 PM'].map((tStr) => {
                  const isSelected = timePreset === tStr;
                  return (
                    <TouchableOpacity
                      key={tStr}
                      activeOpacity={0.75}
                      onPress={() => {
                        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setTimePreset(tStr);
                      }}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 8,
                        backgroundColor: isSelected ? '#0891B2' : '#F8FAFC',
                        borderWidth: 1,
                        borderColor: isSelected ? '#0891B2' : '#E2E8F0',
                      }}
                    >
                      <Text style={{ fontSize: 11.5, fontWeight: '800', color: isSelected ? '#FFFFFF' : '#475569' }}>
                        {tStr}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 7. Duration & Questions Count */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#334155' }}>Duration (Mins) *</Text>
                <TextInput
                  value={duration}
                  onChangeText={setDuration}
                  keyboardType="numeric"
                  style={{
                    borderWidth: 1.5,
                    borderColor: '#E2E8F0',
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 9,
                    fontSize: 13,
                    color: '#0F172A',
                    backgroundColor: '#F8FAFC',
                  }}
                />
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                  {['30', '45', '60', '90', '120'].map((m) => (
                    <TouchableOpacity
                      key={m}
                      activeOpacity={0.7}
                      onPress={() => setDuration(m)}
                      style={{
                        paddingHorizontal: 6,
                        paddingVertical: 3,
                        borderRadius: 6,
                        backgroundColor: duration === m ? '#ECFEFF' : '#F1F5F9',
                        borderWidth: 1,
                        borderColor: duration === m ? '#A5F3FC' : '#E2E8F0',
                      }}
                    >
                      <Text style={{ fontSize: 10, fontWeight: '700', color: duration === m ? '#0E7490' : '#475569' }}>
                        {m}m
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={{ flex: 1, gap: 6 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#334155' }}>Total Questions *</Text>
                <TextInput
                  value={questionsCount}
                  onChangeText={setQuestionsCount}
                  keyboardType="numeric"
                  style={{
                    borderWidth: 1.5,
                    borderColor: '#E2E8F0',
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 9,
                    fontSize: 13,
                    color: '#0F172A',
                    backgroundColor: '#F8FAFC',
                  }}
                />
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                  {['10', '15', '20', '25', '30'].map((q) => (
                    <TouchableOpacity
                      key={q}
                      activeOpacity={0.7}
                      onPress={() => setQuestionsCount(q)}
                      style={{
                        paddingHorizontal: 6,
                        paddingVertical: 3,
                        borderRadius: 6,
                        backgroundColor: questionsCount === q ? '#ECFEFF' : '#F1F5F9',
                        borderWidth: 1,
                        borderColor: questionsCount === q ? '#A5F3FC' : '#E2E8F0',
                      }}
                    >
                      <Text style={{ fontSize: 10, fontWeight: '700', color: questionsCount === q ? '#0E7490' : '#475569' }}>
                        {q} Qs
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* 8. Marks Assessment */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#334155' }}>Total Marks *</Text>
                <TextInput
                  value={totalMarks}
                  onChangeText={(val) => {
                    setTotalMarks(val);
                    const num = parseInt(val, 10);
                    if (num > 0) setPassingMarks(Math.round(num * 0.35).toString());
                  }}
                  keyboardType="numeric"
                  style={{
                    borderWidth: 1.5,
                    borderColor: '#E2E8F0',
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 9,
                    fontSize: 13,
                    color: '#0F172A',
                    backgroundColor: '#F8FAFC',
                  }}
                />
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                  {['20', '25', '40', '50', '80'].map((mk) => (
                    <TouchableOpacity
                      key={mk}
                      activeOpacity={0.7}
                      onPress={() => {
                        setTotalMarks(mk);
                        setPassingMarks(Math.round(parseInt(mk) * 0.35).toString());
                      }}
                      style={{
                        paddingHorizontal: 6,
                        paddingVertical: 3,
                        borderRadius: 6,
                        backgroundColor: totalMarks === mk ? '#ECFEFF' : '#F1F5F9',
                        borderWidth: 1,
                        borderColor: totalMarks === mk ? '#A5F3FC' : '#E2E8F0',
                      }}
                    >
                      <Text style={{ fontSize: 10, fontWeight: '700', color: totalMarks === mk ? '#0E7490' : '#475569' }}>
                        {mk}M
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={{ flex: 1, gap: 6 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#334155' }}>Passing Marks *</Text>
                <TextInput
                  value={passingMarks}
                  onChangeText={setPassingMarks}
                  keyboardType="numeric"
                  style={{
                    borderWidth: 1.5,
                    borderColor: '#E2E8F0',
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 9,
                    fontSize: 13,
                    color: '#0F172A',
                    backgroundColor: '#F8FAFC',
                  }}
                />
                <Text style={{ fontSize: 10, color: '#64748B' }}>~35% of Total Marks</Text>
              </View>
            </View>

            {/* 9. Test Status */}
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#334155' }}>Initial Test Status</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[
                  {
                    id: 'upcoming' as const,
                    label: 'Scheduled (Upcoming)',
                    sub: 'Activates at scheduled time',
                    color: '#0891B2',
                  },
                  {
                    id: 'live' as const,
                    label: 'Live Now',
                    sub: 'Students can take right now',
                    color: '#EF4444',
                  },
                ].map((item) => {
                  const isSelected = status === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      activeOpacity={0.8}
                      onPress={() => {
                        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setStatus(item.id);
                      }}
                      style={{
                        flex: 1,
                        padding: 10,
                        borderRadius: 12,
                        backgroundColor: isSelected ? '#FFFFFF' : '#F8FAFC',
                        borderWidth: 1.5,
                        borderColor: isSelected ? item.color : '#E2E8F0',
                        gap: 2,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: 6,
                            backgroundColor: isSelected ? item.color : '#CBD5E1',
                          }}
                        />
                        <Text style={{ fontSize: 12, fontWeight: '800', color: isSelected ? item.color : '#475569' }}>
                          {item.label}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 10, color: '#64748B', marginLeft: 18 }} numberOfLines={1}>
                        {item.sub}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 10. Action Buttons */}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              {test && onDelete && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    Alert.alert(
                      'Cancel Test',
                      `Are you sure you want to cancel and remove "${test.title}"?`,
                      [
                        { text: 'Keep Test', style: 'cancel' },
                        {
                          text: 'Delete Test',
                          style: 'destructive',
                          onPress: () => onDelete(test.id),
                        },
                      ]
                    );
                  }}
                  style={{
                    backgroundColor: '#FEE2E2',
                    borderWidth: 1,
                    borderColor: '#FECACA',
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                    borderRadius: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Trash2 size={18} color="#DC2626" />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleSave}
                style={{
                  flex: 1,
                  backgroundColor: '#0891B2',
                  paddingVertical: 14,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 8,
                  elevation: 3,
                  shadowColor: '#0891B2',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 4,
                }}
              >
                <Award size={18} color="#FFFFFF" />
                <Text style={{ fontSize: 14.5, fontWeight: '800', color: '#FFFFFF' }}>
                  {test ? 'Save Test Changes' : 'Schedule & Publish to Batch'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
