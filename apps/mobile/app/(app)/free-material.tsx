import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import {
  Folder,
  FileText,
  Download,
  BookOpen,
  Plus,
  X,
  Search,
  Trash2,
  CheckCircle2,
} from 'lucide-react-native';
import { Screen } from '../../src/components/ui/Screen';
import { AppHeader } from '../../src/components/ui/AppHeader';
import { useMe } from '../../src/api/hooks';
import { useAdminStore, type AdminResourceItem, type AdminStore } from '../../src/lib/adminDataStore';
import { downloadAndSavePdf, getAllDownloads, type DownloadedItem } from '../../src/lib/offline-downloads';

const INITIAL_FREE_MATERIALS: AdminResourceItem[] = [];

const CATEGORIES = [
  { id: 'all', label: 'All Free Material' },
  { id: 'pyq', label: 'Sample Papers & PYQ' },
  { id: 'formula_sheet', label: 'Formula Sheets' },
  { id: 'notes', label: 'Revision Notes' },
  { id: 'solution', label: 'Solutions' },
];

const CLASS_FILTERS = [
  { id: 'all', label: 'All Classes' },
  { id: '12', label: 'Class 12' },
  { id: '11', label: 'Class 11' },
  { id: '10', label: 'Class 10' },
  { id: '9', label: 'Class 9' },
];

export default function FreeMaterialScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: me } = useMe();
  const isAdmin = me?.role === 'admin' || me?.role === 'teacher';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [offlineIds, setOfflineIds] = useState<Set<string>>(new Set());

  // Admin upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState<'pyq' | 'formula_sheet' | 'notes' | 'solution'>('pyq');
  const [uploadClass, setUploadClass] = useState<9 | 10 | 11 | 12>(12);
  const [uploadSubject, setUploadSubject] = useState('Mathematics');
  const [uploadChapter, setUploadChapter] = useState('');
  const [uploadSubtext, setUploadSubtext] = useState('');
  const [uploadFileUrl, setUploadFileUrl] = useState('');
  const [pickedFileName, setPickedFileName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Store resources
  const storeResources = useAdminStore((s: AdminStore) => s.resources);
  const uploadResource = useAdminStore((s: AdminStore) => s.uploadResource);
  const deleteResource = useAdminStore((s: AdminStore) => s.deleteResource);

  // Track which items are already downloaded offline
  const checkOfflineDownloads = async () => {
    try {
      const items = await getAllDownloads();
      setOfflineIds(new Set(items.map((it: DownloadedItem) => it.id)));
    } catch {
      // ignore
    }
  };

  React.useEffect(() => {
    checkOfflineDownloads();
  }, []);

  // Combine store public resources with initial built-ins
  const allFreeMaterials = useMemo(() => {
    const publicStoreItems = storeResources.filter((r: AdminResourceItem) => r.visibility === 'public');
    const existingIds = new Set(publicStoreItems.map((i: AdminResourceItem) => i.id));
    const uniqueBuiltIns = INITIAL_FREE_MATERIALS.filter((b) => !existingIds.has(b.id));
    return [...publicStoreItems, ...uniqueBuiltIns];
  }, [storeResources]);

  // Filtered list
  const filteredMaterials = useMemo(() => {
    return allFreeMaterials.filter((item) => {
      // Category filter
      if (selectedCategory !== 'all' && item.type !== selectedCategory) {
        return false;
      }
      // Class filter
      if (selectedClass !== 'all' && String(item.classLevel) !== selectedClass) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesSubject = item.subject.toLowerCase().includes(q);
        const matchesChapter = item.chapter.toLowerCase().includes(q);
        if (!matchesTitle && !matchesSubject && !matchesChapter) return false;
      }
      return true;
    });
  }, [allFreeMaterials, selectedCategory, selectedClass, searchQuery]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await checkOfflineDownloads();
    await new Promise((res) => setTimeout(res, 350));
    setIsRefreshing(false);
  };

  const handlePickDocument = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets && res.assets[0]) {
        const asset = res.assets[0];
        setPickedFileName(asset.name);
        setUploadFileUrl(asset.uri);
        if (!uploadTitle.trim()) {
          setUploadTitle(asset.name.replace(/\.[^/.]+$/, ''));
        }
      }
    } catch {
      Alert.alert('Notice', 'Could not access file picker. You can enter a PDF URL directly.');
    }
  };

  const handleCreateFreeMaterial = async () => {
    if (!uploadTitle.trim()) {
      Alert.alert('Required', 'Please enter a title for the material.');
      return;
    }

    try {
      setIsSubmitting(true);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const effectiveUrl =
        uploadFileUrl.trim() ||
        'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

      await uploadResource({
        title: uploadTitle.trim(),
        type: uploadCategory,
        fileUrl: effectiveUrl,
        fileSize: pickedFileName ? '2.1 MB' : '1.5 MB',
        filePages: 12,
        subject: uploadSubject,
        classLevel: uploadClass,
        chapter: uploadChapter.trim() || 'General Study Material',
        visibility: 'public',
        subtext: uploadSubtext.trim() || 'Uploaded by Dinesh Sir for free student access',
      });

      Alert.alert('Success', `"${uploadTitle.trim()}" published to Free Material library!`);
      setShowUploadModal(false);
      setUploadTitle('');
      setUploadChapter('');
      setUploadSubtext('');
      setUploadFileUrl('');
      setPickedFileName(null);
    } catch {
      Alert.alert('Error', 'Could not upload material. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadOffline = async (item: AdminResourceItem) => {
    try {
      setDownloadingId(item.id);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      await downloadAndSavePdf({
        id: item.id,
        batchId: 'free-material',
        batchTitle: 'Free Study Material',
        subjectName: item.subject,
        chapterTitle: item.chapter,
        section: item.type.toUpperCase(),
        title: item.title,
        downloadUrl: item.fileUrl,
        pageCount: item.filePages,
      });

      setOfflineIds((prev) => new Set([...prev, item.id]));
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Alert.alert(
        'Offline Download Complete',
        `"${item.title}" is saved locally. You can read it anytime from Sidebar > Offline Downloads without internet.`,
        [
          { text: 'Done', style: 'cancel' },
          {
            text: 'View Downloads',
            onPress: () => router.push('/downloads'),
          },
        ]
      );
    } catch {
      Alert.alert('Download Notice', 'Failed to save offline copy. Check connection or try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleOpenPdf = (item: AdminResourceItem) => {
    router.push({
      pathname: '/(app)/pdf-viewer' as any,
      params: {
        contentId: item.id,
        localUri: item.fileUrl,
        title: item.title,
        isBatch: '0',
      },
    });
  };

  const handleDeleteItem = (item: AdminResourceItem) => {
    Alert.alert(
      'Delete Free Material',
      `Are you sure you want to delete "${item.title}" from the public library?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteResource(item.id);
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'pyq':
        return 'Sample Paper / PYQ';
      case 'formula_sheet':
        return 'Formula Sheet';
      case 'notes':
        return 'Revision Notes';
      case 'solution':
        return 'Solutions';
      default:
        return 'Study Notes';
    }
  };

  return (
    <Screen
      scrollable={false}
      header={<AppHeader title="Free Study Material" showBack />}
    >
      <ScrollView
        contentContainerStyle={{ padding: 14, paddingBottom: Math.max(insets.bottom, 24) + 60 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#047857']}
            tintColor="#047857"
          />
        }
      >
        {/* Banner with guaranteed background contrast & visibility */}
        <View
          style={{
            backgroundColor: '#047857',
            borderRadius: 16,
            padding: 14,
            marginBottom: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
              <Folder size={18} color="#FFFFFF" />
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF', marginLeft: 8 }}>
                Public Study Library
              </Text>
            </View>
            <View
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.22)',
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 12,
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: '800', color: '#FFFFFF' }}>
                100% FREE
              </Text>
            </View>
          </View>

          <Text style={{ fontSize: 11.5, color: '#D1FAE5', lineHeight: 16, marginBottom: 10 }}>
            Official board sample papers, calculus formula handbooks, and chapter notes. View online or save offline with zero data!
          </Text>

          {isAdmin && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setShowUploadModal(true)}
              style={{
                backgroundColor: '#FFFFFF',
                paddingVertical: 9,
                paddingHorizontal: 12,
                borderRadius: 10,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Plus size={15} color="#047857" strokeWidth={2.5} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#047857', marginLeft: 6 }}>
                Upload Free Study Material (Admin)
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Search Input */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#E2E8F0',
            paddingHorizontal: 10,
            paddingVertical: 7,
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 10,
          }}
        >
          <Search size={15} color="#64748B" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search papers, formulas, chapters..."
            placeholderTextColor="#94A3B8"
            style={{ flex: 1, marginLeft: 8, fontSize: 12, color: '#0F172A', padding: 0 }}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={14} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Class Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 8 }}
          contentContainerStyle={{ gap: 6 }}
        >
          {CLASS_FILTERS.map((cf) => {
            const isSelected = selectedClass === cf.id;
            return (
              <TouchableOpacity
                key={cf.id}
                onPress={() => setSelectedClass(cf.id)}
                style={{
                  paddingVertical: 5,
                  paddingHorizontal: 11,
                  borderRadius: 20,
                  backgroundColor: isSelected ? '#047857' : '#F1F5F9',
                  borderWidth: 1,
                  borderColor: isSelected ? '#047857' : '#E2E8F0',
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '700',
                    color: isSelected ? '#FFFFFF' : '#475569',
                  }}
                >
                  {cf.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Category Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 12 }}
          contentContainerStyle={{ gap: 6 }}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setSelectedCategory(cat.id)}
                style={{
                  paddingVertical: 5,
                  paddingHorizontal: 11,
                  borderRadius: 20,
                  backgroundColor: isSelected ? '#1E293B' : '#F1F5F9',
                  borderWidth: 1,
                  borderColor: isSelected ? '#1E293B' : '#E2E8F0',
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '700',
                    color: isSelected ? '#FFFFFF' : '#475569',
                  }}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Material Items List */}
        {filteredMaterials.length === 0 ? (
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
            <Folder size={32} color="#94A3B8" />
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#0F172A', marginTop: 8 }}>
              No Free Materials Found
            </Text>
            <Text style={{ fontSize: 11, color: '#64748B', textAlign: 'center', marginTop: 4, maxWidth: 220 }}>
              Try adjusting your class or category filters.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {filteredMaterials.map((item) => {
              const isDownloading = downloadingId === item.id;
              const isSaved = offlineIds.has(item.id);

              return (
                <View
                  key={item.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 14,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                    shadowColor: '#000',
                    shadowOpacity: 0.03,
                    shadowOffset: { width: 0, height: 1 },
                    shadowRadius: 3,
                    elevation: 1,
                  }}
                >
                  {/* Top Row: Icon + Title & Metadata + Trash */}
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    {/* File Icon */}
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        backgroundColor: '#F0FDF4',
                        borderWidth: 1,
                        borderColor: '#DCFCE7',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 10,
                        marginTop: 2,
                      }}
                    >
                      <FileText size={18} color="#15803D" />
                    </View>

                    {/* Title & Metadata */}
                    <View style={{ flex: 1, marginRight: 6 }}>
                      <Text
                        style={{
                          fontSize: 12.5,
                          fontWeight: '700',
                          color: '#0F172A',
                          lineHeight: 18,
                        }}
                      >
                        {item.title}
                      </Text>

                      {/* Badges Row - Clean and Non-overlapping */}
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: 6,
                          marginTop: 5,
                        }}
                      >
                        <View
                          style={{
                            backgroundColor: '#EFF6FF',
                            borderWidth: 1,
                            borderColor: '#BFDBFE',
                            borderRadius: 6,
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 10,
                              fontWeight: '700',
                              color: '#1D4ED8',
                            }}
                          >
                            {getTypeLabel(item.type)}
                          </Text>
                        </View>

                        <Text
                          style={{
                            fontSize: 11,
                            color: '#64748B',
                            fontWeight: '500',
                          }}
                        >
                          Class {item.classLevel} • {item.subject}
                        </Text>
                      </View>
                    </View>

                    {/* Delete action for Admin */}
                    {isAdmin && (
                      <TouchableOpacity
                        onPress={() => handleDeleteItem(item)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        style={{ padding: 4, borderRadius: 6 }}
                        accessibilityLabel="Delete item"
                      >
                        <Trash2 size={15} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Subtext if present */}
                  {item.subtext ? (
                    <Text
                      style={{
                        fontSize: 11,
                        color: '#64748B',
                        lineHeight: 15,
                        marginTop: 7,
                        paddingLeft: 46,
                      }}
                    >
                      {item.subtext}
                    </Text>
                  ) : null}

                  {/* Footer: Size/Pages + Buttons */}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: 8,
                      marginTop: 8,
                      borderTopWidth: 1,
                      borderTopColor: '#F1F5F9',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10.5,
                        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                        color: '#94A3B8',
                      }}
                    >
                      {item.fileSize} • {item.filePages} Pages
                    </Text>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      {isSaved ? (
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: '#F0FDF4',
                            borderWidth: 1,
                            borderColor: '#BBF7D0',
                            paddingVertical: 4,
                            paddingHorizontal: 8,
                            borderRadius: 8,
                          }}
                        >
                          <CheckCircle2 size={12} color="#15803D" />
                          <Text style={{ fontSize: 10.5, fontWeight: '700', color: '#15803D', marginLeft: 4 }}>
                            Saved Offline
                          </Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          onPress={() => handleDownloadOffline(item)}
                          disabled={isDownloading}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: '#F0FDF4',
                            borderWidth: 1,
                            borderColor: '#BBF7D0',
                            paddingVertical: 5,
                            paddingHorizontal: 9,
                            borderRadius: 8,
                          }}
                        >
                          {isDownloading ? (
                            <ActivityIndicator size="small" color="#15803D" />
                          ) : (
                            <>
                              <Download size={12} color="#15803D" />
                              <Text style={{ fontSize: 11, fontWeight: '700', color: '#15803D', marginLeft: 4 }}>
                                Save Offline
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        onPress={() => handleOpenPdf(item)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: '#2563EB',
                          paddingVertical: 5,
                          paddingHorizontal: 11,
                          borderRadius: 8,
                        }}
                      >
                        <BookOpen size={12} color="#FFFFFF" />
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#FFFFFF', marginLeft: 4 }}>
                          Open
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
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
                    backgroundColor: '#ECFDF5',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 10,
                  }}
                >
                  <Plus size={18} color="#059669" strokeWidth={2.5} />
                </View>
                <View>
                  <Text style={{ fontSize: 14.5, fontWeight: '700', color: '#0F172A' }}>
                    Upload Free Study Material
                  </Text>
                  <Text style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>
                    Sample papers, formulas & notes for all students
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

            <ScrollView
              contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 14, paddingBottom: 16 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Title */}
              <View style={{ marginBottom: 14 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569', marginBottom: 6, letterSpacing: 0.3, textTransform: 'uppercase' }}>
                  Document / Material Title *
                </Text>
                <TextInput
                  value={uploadTitle}
                  onChangeText={setUploadTitle}
                  placeholder="e.g. CBSE Class 12 Maths Sample Paper 2026"
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

              {/* Category Picker */}
              <View style={{ marginBottom: 14 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569', marginBottom: 6, letterSpacing: 0.3, textTransform: 'uppercase' }}>
                  Category / Type *
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
                  {[
                    { id: 'pyq', label: 'Sample Paper / PYQ' },
                    { id: 'formula_sheet', label: 'Formula Sheet' },
                    { id: 'notes', label: 'Revision Notes' },
                    { id: 'solution', label: 'Step Solutions' },
                  ].map((ct) => {
                    const isSelected = uploadCategory === ct.id;
                    return (
                      <TouchableOpacity
                        key={ct.id}
                        onPress={() => setUploadCategory(ct.id as any)}
                        activeOpacity={0.75}
                        style={{
                          paddingVertical: 7,
                          paddingHorizontal: 12,
                          borderRadius: 9,
                          backgroundColor: isSelected ? '#059669' : '#F8FAFC',
                          borderWidth: 1,
                          borderColor: isSelected ? '#059669' : '#E2E8F0',
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11.5,
                            fontWeight: isSelected ? '700' : '600',
                            color: isSelected ? '#FFFFFF' : '#475569',
                          }}
                        >
                          {ct.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Class Picker */}
              <View style={{ marginBottom: 14 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569', marginBottom: 6, letterSpacing: 0.3, textTransform: 'uppercase' }}>
                  Target Class *
                </Text>
                <View style={{ flexDirection: 'row', gap: 7 }}>
                  {([12, 11, 10, 9] as const).map((cl) => {
                    const isSelected = uploadClass === cl;
                    return (
                      <TouchableOpacity
                        key={cl}
                        onPress={() => setUploadClass(cl)}
                        activeOpacity={0.75}
                        style={{
                          flex: 1,
                          paddingVertical: 8,
                          borderRadius: 9,
                          alignItems: 'center',
                          backgroundColor: isSelected ? '#059669' : '#F8FAFC',
                          borderWidth: 1,
                          borderColor: isSelected ? '#059669' : '#E2E8F0',
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

              {/* Subject */}
              <View style={{ marginBottom: 14 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569', marginBottom: 6, letterSpacing: 0.3, textTransform: 'uppercase' }}>
                  Subject *
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
                  {['Mathematics', 'Science', 'Chemistry', 'Physics', 'Biology'].map((sub) => {
                    const isSelected = uploadSubject === sub;
                    return (
                      <TouchableOpacity
                        key={sub}
                        onPress={() => setUploadSubject(sub)}
                        activeOpacity={0.75}
                        style={{
                          paddingVertical: 6,
                          paddingHorizontal: 11,
                          borderRadius: 9,
                          backgroundColor: isSelected ? '#059669' : '#F8FAFC',
                          borderWidth: 1,
                          borderColor: isSelected ? '#059669' : '#E2E8F0',
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11.5,
                            fontWeight: isSelected ? '700' : '600',
                            color: isSelected ? '#FFFFFF' : '#475569',
                          }}
                        >
                          {sub}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Chapter / Topic */}
              <View style={{ marginBottom: 14 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569', marginBottom: 6, letterSpacing: 0.3, textTransform: 'uppercase' }}>
                  Chapter / Topic (Optional)
                </Text>
                <TextInput
                  value={uploadChapter}
                  onChangeText={setUploadChapter}
                  placeholder="e.g. Calculus, Trigonometry, Complete Syllabus"
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

              {/* File Picker or URL */}
              <View style={{ marginBottom: 14 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569', marginBottom: 6, letterSpacing: 0.3, textTransform: 'uppercase' }}>
                  PDF File Attachment *
                </Text>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handlePickDocument}
                  style={{
                    backgroundColor: pickedFileName ? '#ECFDF5' : '#F8FAFC',
                    borderWidth: 1.5,
                    borderStyle: pickedFileName ? 'solid' : 'dashed',
                    borderColor: pickedFileName ? '#10B981' : '#CBD5E1',
                    borderRadius: 10,
                    paddingVertical: 11,
                    paddingHorizontal: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 8,
                  }}
                >
                  <FileText size={16} color={pickedFileName ? '#059669' : '#64748B'} />
                  <Text
                    numberOfLines={1}
                    style={{
                      fontSize: 12,
                      fontWeight: '700',
                      color: pickedFileName ? '#047857' : '#475569',
                      marginLeft: 7,
                      flexShrink: 1,
                    }}
                  >
                    {pickedFileName ? `Selected: ${pickedFileName}` : 'Choose PDF from Device'}
                  </Text>
                </TouchableOpacity>

                <TextInput
                  value={uploadFileUrl}
                  onChangeText={setUploadFileUrl}
                  placeholder="Or enter direct online PDF URL (https://...)"
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

              {/* Subtext description */}
              <View style={{ marginBottom: 8 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569', marginBottom: 6, letterSpacing: 0.3, textTransform: 'uppercase' }}>
                  Short Description / Highlight Note
                </Text>
                <TextInput
                  value={uploadSubtext}
                  onChangeText={setUploadSubtext}
                  placeholder="e.g. Verified by Dinesh Sir with 100% accurate steps"
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
                onPress={handleCreateFreeMaterial}
                disabled={isSubmitting}
                activeOpacity={0.85}
                style={{
                  backgroundColor: '#059669',
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#059669',
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
                    Publish Free Material for All Students
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
