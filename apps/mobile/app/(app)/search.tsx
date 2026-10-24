import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';
import {
  Search as SearchIcon,
  X,
  Clock,
  Play,
  BookOpen,
  FileText,
  ChevronRight,
  Trash2,
  Sparkles,
  TrendingUp,
  Award,
  Layers,
} from 'lucide-react-native';
import { Screen } from '../../src/components/ui/Screen';
import { AppHeader } from '../../src/components/ui/AppHeader';
import { Chip } from '../../src/components/ui/Chip';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { BookLoader } from '../../src/components/ui/BookLoader';
import { useLibrarySearch, useLearnClasses } from '../../src/api/hooks';

const RECENT_SEARCHES_KEY = 'quick2learn_recent_searches';
const MAX_RECENT_SEARCHES = 8;

const POPULAR_SEARCH_TOPICS = [
  'Trigonometry Formulas',
  'Class 12 Calculus',
  'Formula Cheat Sheets',
  'Chapter-wise PYQs',
  'Chemical Reactions',
  'Sample Question Papers',
  'Matrices & Determinants',
  'Light & Optics',
];

const QUICK_EXPLORE_CARDS = [
  {
    title: 'Formula Sheets',
    desc: 'Formulas & theorems',
    query: 'Formula',
    icon: Sparkles,
    color: '#2563EB',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  {
    title: '10-Yr Board PYQs',
    desc: 'Solved past papers',
    query: 'PYQ',
    icon: Award,
    color: '#D97706',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
  },
  {
    title: 'Sample Papers',
    desc: 'Board blueprint mock tests',
    query: 'Sample Paper',
    icon: Layers,
    color: '#059669',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
  },
  {
    title: 'Revision Notes',
    desc: 'Chapter high-yield notes',
    query: 'Notes',
    icon: BookOpen,
    color: '#7C3AED',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
];

const CLASS_OPTIONS = [
  { label: 'All Classes', value: undefined },
  { label: 'Class 9', value: 9 },
  { label: 'Class 10', value: 10 },
  { label: 'Class 11', value: 11 },
  { label: 'Class 12', value: 12 },
];

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<number | undefined>(undefined);
  const [selectedSubject, setSelectedSubject] = useState<string | undefined>(undefined);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches on mount
  useEffect(() => {
    SecureStore.getItemAsync(RECENT_SEARCHES_KEY)
      .then((val) => {
        if (val) {
          try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed)) {
              setRecentSearches(parsed);
            }
          } catch {}
        }
      })
      .catch(() => {});
  }, []);

  const saveRecentSearch = useCallback(
    (term: string) => {
      const trimmed = term.trim();
      if (!trimmed) return;
      const updated = [trimmed, ...recentSearches.filter((s) => s.toLowerCase() !== trimmed.toLowerCase())].slice(
        0,
        MAX_RECENT_SEARCHES
      );
      setRecentSearches(updated);
      SecureStore.setItemAsync(RECENT_SEARCHES_KEY, JSON.stringify(updated)).catch(() => {});
    },
    [recentSearches]
  );

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    SecureStore.deleteItemAsync(RECENT_SEARCHES_KEY).catch(() => {});
  }, []);

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = query.trim();
      setActiveQuery(trimmed);
      if (trimmed.length >= 2) {
        saveRecentSearch(trimmed);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query, saveRecentSearch]);

  const { data: classesData } = useLearnClasses();

  // Extract unique subjects across classes
  const subjectOptions = useMemo(() => {
    const list: { label: string; value: string | undefined }[] = [
      { label: 'All Subjects', value: undefined },
    ];
    if (classesData?.classes) {
      const set = new Set<string>();
      for (const c of classesData.classes) {
        for (const s of c.subjects) {
          if (!set.has(s.slug)) {
            set.add(s.slug);
            list.push({ label: s.name, value: s.slug });
          }
        }
      }
    } else {
      list.push(
        { label: 'Mathematics', value: 'mathematics' },
        { label: 'Physics', value: 'physics' },
        { label: 'Chemistry', value: 'chemistry' },
        { label: 'Biology', value: 'biology' }
      );
    }
    return list;
  }, [classesData]);

  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: searchResults, isLoading, isFetching, refetch } = useLibrarySearch(
    activeQuery,
    selectedClass,
    selectedSubject
  );

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Promise.all([
        refetch(),
        queryClient.refetchQueries({ type: 'active' }),
        new Promise((resolve) => setTimeout(resolve, 350)),
      ]);
    } catch (err) {
      console.warn('[Search] Refresh error:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const lectures = searchResults?.lectures || [];
  const chapters = searchResults?.chapters || [];
  const notes = searchResults?.notes || [];
  const totalResults = searchResults?.total || 0;

  const handleSelectRecent = (term: string) => {
    setQuery(term);
    setActiveQuery(term);
  };

  const handleOpenLecture = (lectureId: string) => {
    router.push(`/lecture/${lectureId}` as any);
  };

  const handleOpenChapter = (chapterId: string) => {
    router.push(`/chapter/${chapterId}` as any);
  };

  const handleOpenNote = (url: string) => {
    Linking.openURL(url).catch((err) => {
      console.warn('Could not open PDF note:', err);
    });
  };

  return (
    <Screen
      scrollable={false}
      header={<AppHeader title="Search Library" showBack />}
    >
      <View className="flex-1 bg-surface-subtle">
        {/* Search Bar Input */}
        <View className="p-3 bg-surface border-b border-border">
          <View className="flex-row items-center bg-surface-subtle border border-border rounded-xl px-3 min-h-[48px]">
            <SearchIcon size={20} color="#6B7280" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search lectures, chapters, formulas, notes..."
              placeholderTextColor="#9CA3AF"
              className="flex-1 ml-2.5 text-base text-text-primary py-2.5"
              autoFocus={true}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
            {query.length > 0 && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  setQuery('');
                  setActiveQuery('');
                }}
                className="w-10 h-10 items-center justify-center -mr-1"
                accessibilityLabel="Clear search input"
              >
                <X size={18} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>

          {/* Filter Chips: Class and Subject */}
          <View className="mt-3">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="flex-row"
              contentContainerStyle={{ paddingRight: 12 }}
            >
              {/* Class Filter Chips */}
              {CLASS_OPTIONS.map((item) => {
                const isSelected = selectedClass === item.value;
                return (
                  <View key={`class-${item.label}`} className="mr-2">
                    <Chip
                      label={item.label}
                      selected={isSelected}
                      onPress={() => setSelectedClass(item.value)}
                    />
                  </View>
                );
              })}

              <View className="w-px h-6 bg-border mx-1 self-center" />

              {/* Subject Filter Chips */}
              {subjectOptions.map((item) => {
                const isSelected = selectedSubject === item.value;
                return (
                  <View key={`subj-${item.label}`} className="mr-2">
                    <Chip
                      label={item.label}
                      selected={isSelected}
                      onPress={() => setSelectedSubject(item.value)}
                    />
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>

        {/* Content Area */}
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={['#2563EB']}
              tintColor="#2563EB"
            />
          }
        >
          {/* Query Empty: Show Discovery Hub (Recent Searches + Popular Topics + Quick Explore Cards) */}
          {!activeQuery ? (
            <View className="space-y-5">
              {/* 1. Recent Searches (if any) */}
              {recentSearches.length > 0 && (
                <View className="space-y-2.5">
                  <View className="flex-row items-center justify-between px-0.5">
                    <View className="flex-row items-center space-x-1.5">
                      <Clock size={13} color="#6B7280" />
                      <Text className="text-xs font-bold uppercase tracking-wider text-text-tertiary">
                        Recent Searches
                      </Text>
                    </View>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={clearRecentSearches}
                      className="flex-row items-center px-1.5 py-1"
                      accessibilityLabel="Clear recent searches"
                    >
                      <Trash2 size={12} color="#9CA3AF" />
                      <Text className="text-xs text-text-secondary ml-1 font-medium">Clear</Text>
                    </TouchableOpacity>
                  </View>

                  <View className="bg-surface rounded-2xl border border-border overflow-hidden divide-y divide-border/60 shadow-2xs">
                    {recentSearches.map((term, idx) => (
                      <TouchableOpacity
                        key={idx}
                        activeOpacity={0.7}
                        onPress={() => handleSelectRecent(term)}
                        className="min-h-[46px] px-3.5 py-2 flex-row items-center justify-between active:bg-surface-subtle"
                      >
                        <View className="flex-row items-center flex-1 mr-2">
                          <Clock size={14} color="#9CA3AF" />
                          <Text className="text-xs text-text-primary ml-2.5 font-medium truncate">
                            {term}
                          </Text>
                        </View>
                        <ChevronRight size={14} color="#D1D5DB" />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* 2. Popular & Trending Topics */}
              <View className="space-y-2.5">
                <View className="flex-row items-center space-x-1.5 px-0.5">
                  <TrendingUp size={14} color="#2563EB" />
                  <Text className="text-xs font-bold uppercase tracking-wider text-text-tertiary">
                    Popular Searches
                  </Text>
                </View>

                <View className="flex-row flex-wrap gap-2">
                  {POPULAR_SEARCH_TOPICS.map((topic) => (
                    <TouchableOpacity
                      key={topic}
                      activeOpacity={0.75}
                      onPress={() => handleSelectRecent(topic)}
                      className="px-3 py-1.5 rounded-xl bg-surface border border-border shadow-2xs flex-row items-center active:bg-blue-50 active:border-blue-200"
                    >
                      <Text className="text-xs font-medium text-text-primary">
                        {topic}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* 3. Quick Resource Explorer (2x2 Grid) */}
              <View className="space-y-2.5">
                <View className="flex-row items-center space-x-1.5 px-0.5">
                  <Sparkles size={14} color="#2563EB" />
                  <Text className="text-xs font-bold uppercase tracking-wider text-text-tertiary">
                    Quick Resource Hub
                  </Text>
                </View>

                <View className="flex-row flex-wrap justify-between gap-y-2.5">
                  {QUICK_EXPLORE_CARDS.map((card) => {
                    const CardIcon = card.icon;
                    return (
                      <TouchableOpacity
                        key={card.title}
                        activeOpacity={0.8}
                        onPress={() => handleSelectRecent(card.query)}
                        style={{ width: '48.5%' }}
                        className="bg-surface rounded-2xl p-3 border border-border shadow-2xs active:scale-[0.98]"
                      >
                        <View
                          className={`w-8 h-8 rounded-xl items-center justify-center mb-2 ${card.bgColor}`}
                        >
                          <CardIcon size={16} color={card.color} />
                        </View>
                        <Text className="text-xs font-bold text-text-primary" numberOfLines={1}>
                          {card.title}
                        </Text>
                        <Text className="text-[10px] text-text-secondary mt-0.5" numberOfLines={2}>
                          {card.desc}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          ) : isLoading ? (
            <View className="py-12 items-center justify-center">
              <BookLoader text="Searching library..." size="lg" />
            </View>
          ) : totalResults === 0 ? (
            <View className="py-8">
              <EmptyState
                illustration={<SearchIcon size={36} color="#2563EB" />}
                title="No results found"
                description={`We couldn't find anything matching "${activeQuery}". Try searching with different keywords or explore popular topics.`}
              />
            </View>
          ) : (
            <View className="space-y-5">
              {/* Results Count Header */}
              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-bold uppercase tracking-wider text-text-tertiary">
                  Search Results ({totalResults})
                </Text>
                {isFetching && <ActivityIndicator size="small" color="#2563EB" />}
              </View>

              {/* 1. Lectures Section */}
              {lectures.length > 0 && (
                <View className="space-y-2">
                  <View className="flex-row items-center gap-1.5 pb-1">
                    <Play size={14} color="#2563EB" fill="#2563EB" />
                    <Text className="text-xs font-bold text-text-primary">
                      Lectures ({lectures.length})
                    </Text>
                  </View>

                  <View className="bg-surface rounded-2xl border border-border divide-y divide-border/60 overflow-hidden shadow-2xs">
                    {lectures.map((lec) => (
                      <TouchableOpacity
                        key={lec.id}
                        activeOpacity={0.7}
                        onPress={() => handleOpenLecture(lec.id)}
                        className="p-3 flex-row items-center justify-between active:bg-surface-subtle min-h-[52px]"
                      >
                        <View className="flex-1 mr-2.5">
                          <Text
                            className="text-xs font-bold text-text-primary line-clamp-2 leading-tight"
                            numberOfLines={2}
                          >
                            {lec.title}
                          </Text>
                          <View className="flex-row items-center gap-1.5 mt-1">
                            {lec.chapterTitle && (
                              <Text
                                className="text-[11px] text-text-secondary truncate max-w-[160px]"
                                numberOfLines={1}
                              >
                                {lec.chapterTitle}
                              </Text>
                            )}
                            <Text className="text-[11px] text-text-tertiary">
                              • {lec.durationFormatted}
                            </Text>
                          </View>
                        </View>

                        <View className="w-8 h-8 rounded-full bg-blue-50 items-center justify-center shrink-0">
                          <Play size={14} color="#2563EB" fill="#2563EB" />
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* 2. Chapters Section */}
              {chapters.length > 0 && (
                <View className="space-y-2">
                  <View className="flex-row items-center gap-1.5 pb-1">
                    <BookOpen size={14} color="#2563EB" />
                    <Text className="text-xs font-bold text-text-primary">
                      Chapters ({chapters.length})
                    </Text>
                  </View>

                  <View className="bg-surface rounded-2xl border border-border divide-y divide-border/60 overflow-hidden shadow-2xs">
                    {chapters.map((ch) => (
                      <TouchableOpacity
                        key={ch.id}
                        activeOpacity={0.7}
                        onPress={() => handleOpenChapter(ch.id)}
                        className="p-3 flex-row items-center justify-between active:bg-surface-subtle min-h-[52px]"
                      >
                        <View className="flex-1 mr-2.5">
                          <Text
                            className="text-xs font-bold text-text-primary line-clamp-1"
                            numberOfLines={1}
                          >
                            {ch.number ? `Ch ${ch.number}: ` : ''}
                            {ch.title}
                          </Text>
                          <Text className="text-[11px] text-text-secondary mt-0.5">
                            Class {ch.classLevel} {ch.subjectName ? `• ${ch.subjectName}` : ''}{' '}
                            • {ch.lectureCount} lectures
                          </Text>
                        </View>

                        <ChevronRight size={16} color="#9CA3AF" />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* 3. Notes Section */}
              {notes.length > 0 && (
                <View className="space-y-2">
                  <View className="flex-row items-center gap-1.5 pb-1">
                    <FileText size={14} color="#DC2626" />
                    <Text className="text-xs font-bold text-text-primary">
                      Notes & Formula PDFs ({notes.length})
                    </Text>
                  </View>

                  <View className="bg-surface rounded-2xl border border-border divide-y divide-border/60 overflow-hidden shadow-2xs">
                    {notes.map((note) => (
                      <TouchableOpacity
                        key={note.id}
                        activeOpacity={0.7}
                        onPress={() => handleOpenNote(note.fileUrl)}
                        className="p-3 flex-row items-center justify-between active:bg-surface-subtle min-h-[52px]"
                      >
                        <View className="flex-1 mr-2.5">
                          <Text
                            className="text-xs font-bold text-text-primary line-clamp-1"
                            numberOfLines={1}
                          >
                            {note.title}
                          </Text>
                          <Text className="text-[11px] text-text-secondary mt-0.5">
                            PDF • {note.chapterTitle || 'Chapter Resource'}{' '}
                            {note.subjectName ? `• ${note.subjectName}` : ''}
                          </Text>
                        </View>

                        <View className="px-2.5 py-1 rounded-lg bg-red-50 border border-red-100">
                          <Text className="text-[10px] font-bold text-red-600">Open</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </Screen>
  );
}
