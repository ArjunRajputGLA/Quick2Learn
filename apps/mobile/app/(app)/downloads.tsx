import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Switch,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import {
  Download,
  Trash2,
  FileText,
  AlertCircle,
  HardDrive,
  FolderOpen,
  ChevronRight,
  Plus,
  X,
  CheckCircle2,
  BookOpen,
  Library,
} from 'lucide-react-native';
import { Screen } from '../../src/components/ui/Screen';
import { AppHeader } from '../../src/components/ui/AppHeader';
import { useMe } from '../../src/api/hooks';
import { useAdminStore, type AdminResourceItem, type AdminStore } from '../../src/lib/adminDataStore';
import {
  getAllDownloads,
  deleteDownloadedPdf,
  deleteAllBatchDownloads,
  deleteAllDownloads,
  downloadAndSavePdf,
  formatBytes,
  type DownloadedItem,
} from '../../src/lib/offline-downloads';

export default function DownloadsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: me } = useMe();
  const isAdmin = me?.role === 'admin' || me?.role === 'teacher';

  const [activeTab, setActiveTab] = useState<'downloaded' | 'library'>('downloaded');
  const [downloads, setDownloads] = useState<DownloadedItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Admin upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState<'notes' | 'formula_sheet' | 'pyq' | 'solution'>('notes');
  const [uploadClass, setUploadClass] = useState<9 | 10 | 11 | 12>(12);
  const [uploadSubject, setUploadSubject] = useState('Mathematics');
  const [uploadChapter, setUploadChapter] = useState('');
  const [uploadFileUrl, setUploadFileUrl] = useState('');
  const [pickedFileName, setPickedFileName] = useState<string | null>(null);
  const [autoSaveLocally, setAutoSaveLocally] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Admin resources store
  const storeResources = useAdminStore((s: AdminStore) => s.resources);
  const uploadResource = useAdminStore((s: AdminStore) => s.uploadResource);
  const deleteResource = useAdminStore((s: AdminStore) => s.deleteResource);

  const loadDownloads = useCallback(async () => {
    try {
      const items = await getAllDownloads();
      setDownloads(items);
    } catch (err) {
      console.warn('[DownloadsScreen] Failed to load offline items:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDownloads();
  }, [loadDownloads]);

  const totalSizeBytes = downloads.reduce((acc, it) => acc + (it.sizeBytes || 0), 0);

  // Group downloaded files by batch
  const groupedByBatch: Record<string, { batchTitle: string; items: DownloadedItem[]; batchSizeBytes: number }> = {};
  for (const item of downloads) {
    const bId = item.batchId || 'unassigned';
    if (!groupedByBatch[bId]) {
      groupedByBatch[bId] = {
        batchTitle: item.batchTitle || 'Batch Study Material',
        items: [],
        batchSizeBytes: 0,
      };
    }
    groupedByBatch[bId].items.push(item);
    groupedByBatch[bId].batchSizeBytes += item.sizeBytes || 0;
  }

  const handleOpenLocalPdf = (item: DownloadedItem) => {
    router.push({
      pathname: '/(app)/pdf-viewer' as any,
      params: {
        contentId: item.id,
        localUri: item.localPath,
        title: item.title,
        isBatch: '1',
      },
    });
  };

  const handleDeleteOne = (item: DownloadedItem) => {
    Alert.alert(
      'Delete Offline Copy',
      `Are you sure you want to delete "${item.title}" from your device? You can re-download it anytime with an active connection.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteDownloadedPdf(item.id);
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            loadDownloads();
          },
        },
      ]
    );
  };

  const handleDeleteBatch = (batchId: string, batchTitle: string) => {
    Alert.alert(
      'Delete All Batch Downloads',
      `Delete all downloaded notes for "${batchTitle}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            await deleteAllBatchDownloads(batchId);
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            loadDownloads();
          },
        },
      ]
    );
  };

  const handleDeleteAll = () => {
    Alert.alert(
      'Clear All Offline Downloads',
      'Are you sure you want to delete all downloaded study materials across all batches? This frees up local device storage.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await deleteAllDownloads();
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            loadDownloads();
          },
        },
      ]
    );
  };

  const handleDownloadFromLibrary = async (item: AdminResourceItem) => {
    try {
      setDownloadingId(item.id);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      await downloadAndSavePdf({
        id: item.id,
        batchId: item.batchId || 'admin-library',
        batchTitle: item.batchTitle || 'Institute Library',
        subjectName: item.subject,
        chapterTitle: item.chapter,
        section: item.type.toUpperCase(),
        title: item.title,
        downloadUrl: item.fileUrl,
        pageCount: item.filePages,
      });

      await loadDownloads();
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Alert.alert(
        'Download Complete',
        `"${item.title}" is saved to your device. You can open and read it anytime with zero data!`,
        [
          { text: 'Done', style: 'cancel' },
          {
            text: 'View Saved Files',
            onPress: () => setActiveTab('downloaded'),
          },
        ]
      );
    } catch {
      Alert.alert('Notice', 'Failed to download file. Please check connection and try again.');
    } finally {
      setDownloadingId(null);
    }
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
      Alert.alert('Notice', 'Could not open file picker. You can enter a PDF link directly.');
    }
  };

  const handleCreateOfflineMaterial = async () => {
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

      const createdItem = await uploadResource({
        title: uploadTitle.trim(),
        type: uploadCategory,
        fileUrl: effectiveUrl,
        fileSize: '1.4 MB',
        filePages: 12,
        subject: uploadSubject,
        classLevel: uploadClass,
        chapter: uploadChapter.trim() || 'General Study Material',
        visibility: 'public',
        subtext: `Uploaded by Quick2Learn for Class ${uploadClass} offline access`,
      });

      if (autoSaveLocally) {
        try {
          await downloadAndSavePdf({
            id: createdItem.id,
            batchId: 'admin-library',
            batchTitle: 'Institute Library',
            subjectName: uploadSubject,
            chapterTitle: uploadChapter.trim() || 'General Study Material',
            section: uploadCategory.toUpperCase(),
            title: uploadTitle.trim(),
            downloadUrl: effectiveUrl,
            pageCount: 12,
          });
          await loadDownloads();
        } catch (downloadErr) {
          console.warn('[DownloadsScreen] Auto-save offline failed:', downloadErr);
        }
      }

      Alert.alert(
        'Published Successfully',
        `"${uploadTitle.trim()}" is now available in Institute Library for all students!`,
        [{ text: 'OK' }]
      );

      setShowUploadModal(false);
      setUploadTitle('');
      setUploadChapter('');
      setUploadFileUrl('');
      setPickedFileName(null);
    } catch {
      Alert.alert('Error', 'Could not upload study material. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLibraryItem = (item: AdminResourceItem) => {
    Alert.alert(
      'Delete from Institute Library',
      `Are you sure you want to delete "${item.title}" from the shared library?`,
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

  return (
    <Screen
      scrollable={false}
      header={<AppHeader title="Offline Downloads" showBack />}
    >
      {/* Top Segment Selector */}
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
          onPress={() => setActiveTab('downloaded')}
          style={{
            flex: 1,
            paddingVertical: 9,
            borderRadius: 12,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            backgroundColor: activeTab === 'downloaded' ? '#2563EB' : '#F1F5F9',
            borderWidth: 1,
            borderColor: activeTab === 'downloaded' ? '#2563EB' : '#E2E8F0',
          }}
        >
          <HardDrive size={15} color={activeTab === 'downloaded' ? '#FFFFFF' : '#64748B'} />
          <Text
            style={{
              fontSize: 12.5,
              fontWeight: '700',
              marginLeft: 6,
              color: activeTab === 'downloaded' ? '#FFFFFF' : '#475569',
            }}
          >
            Saved on Device ({downloads.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setActiveTab('library')}
          style={{
            flex: 1,
            paddingVertical: 9,
            borderRadius: 12,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            marginLeft: 8,
            backgroundColor: activeTab === 'library' ? '#2563EB' : '#F1F5F9',
            borderWidth: 1,
            borderColor: activeTab === 'library' ? '#2563EB' : '#E2E8F0',
          }}
        >
          <Library size={15} color={activeTab === 'library' ? '#FFFFFF' : '#64748B'} />
          <Text
            style={{
              fontSize: 12.5,
              fontWeight: '700',
              marginLeft: 6,
              color: activeTab === 'library' ? '#FFFFFF' : '#475569',
            }}
          >
            Institute Library ({storeResources.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Admin Upload Action Trigger */}
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
            onPress={() => setShowUploadModal(true)}
            style={{
              backgroundColor: '#2563EB',
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
              Upload Material for Offline Downloads (Admin)
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        contentContainerStyle={{
          padding: 12,
          paddingBottom: Math.max(insets.bottom, 24) + 60,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              setIsRefreshing(true);
              loadDownloads();
            }}
            tintColor="#2563EB"
            colors={['#2563EB']}
          />
        }
      >
        {/* Compact, clean YouTube disclaimer */}
        <View
          style={{
            backgroundColor: '#FFFBEB',
            borderRadius: 12,
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderWidth: 1,
            borderColor: '#FDE68A',
            marginBottom: 12,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <AlertCircle size={15} color="#D97706" />
          <Text
            style={{
              fontSize: 11,
              color: '#92400E',
              fontWeight: '500',
              lineHeight: 16,
              marginLeft: 8,
              flex: 1,
            }}
          >
            Notes, formulas & solutions open fully offline. Video lectures stream online per YouTube TOS.
          </Text>
        </View>

        {/* TAB 1: SAVED ON DEVICE */}
        {activeTab === 'downloaded' ? (
          <>
            {/* Storage Summary Strip */}
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 14,
                padding: 12,
                borderWidth: 1,
                borderColor: '#E2E8F0',
                marginBottom: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                shadowColor: '#000',
                shadowOpacity: 0.03,
                shadowOffset: { width: 0, height: 1 },
                shadowRadius: 3,
                elevation: 1,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: '#EFF6FF',
                    borderWidth: 1,
                    borderColor: '#BFDBFE',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 10,
                  }}
                >
                  <HardDrive size={16} color="#2563EB" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                    <Text style={{ fontSize: 12.5, fontWeight: '700', color: '#0F172A' }}>
                      Storage: {formatBytes(totalSizeBytes)}
                    </Text>
                    <Text style={{ fontSize: 11, color: '#64748B' }}>
                      • {downloads.length} {downloads.length === 1 ? 'file' : 'files'} offline
                    </Text>
                  </View>
                  <Text style={{ fontSize: 10.5, color: '#94A3B8', marginTop: 2 }}>
                    Saved locally on device for zero-data reading
                  </Text>
                </View>
              </View>

              {downloads.length > 0 && (
                <TouchableOpacity
                  onPress={handleDeleteAll}
                  activeOpacity={0.7}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 8,
                    backgroundColor: '#FEF2F2',
                    borderWidth: 1,
                    borderColor: '#FECACA',
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <Trash2 size={12} color="#DC2626" />
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#DC2626', marginLeft: 4 }}>
                    Clear All
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Loading state */}
            {isLoading ? (
              <View style={{ paddingVertical: 40, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="small" color="#2563EB" />
                <Text style={{ fontSize: 12, color: '#64748B', marginTop: 8, fontWeight: '500' }}>
                  Checking offline files...
                </Text>
              </View>
            ) : downloads.length === 0 ? (
              /* Compact Refined Empty State */
              <View
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 16,
                  padding: 24,
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 6,
                }}
              >
                <Image
                  source={require('../../assets/empty material.png')}
                  style={{ width: 140, height: 140, marginBottom: 10 }}
                  contentFit="contain"
                />
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F172A', textAlign: 'center' }}>
                  No Offline Downloads Yet
                </Text>
                <Text style={{ fontSize: 11.5, color: '#64748B', textAlign: 'center', maxWidth: 260, marginTop: 4, lineHeight: 16 }}>
                  Switch to the "Institute Library" tab to download notes, formula sheets, and chapter solutions for zero-data reading.
                </Text>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setActiveTab('library')}
                  style={{
                    marginTop: 14,
                    paddingHorizontal: 16,
                    paddingVertical: 9,
                    backgroundColor: '#2563EB',
                    borderRadius: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFFFFF' }}>
                    Browse Downloadable Notes
                  </Text>
                  <ChevronRight size={14} color="#FFFFFF" style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              </View>
            ) : (
              /* Grouped by Batch */
              <View style={{ gap: 12 }}>
                {Object.entries(groupedByBatch).map(([bId, group]) => (
                  <View key={bId} style={{ gap: 6 }}>
                    {/* Batch Group Header */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 }}>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#0F172A' }} numberOfLines={1}>
                          {group.batchTitle}
                        </Text>
                        <Text style={{ fontSize: 10.5, color: '#64748B' }}>
                          {group.items.length} {group.items.length === 1 ? 'file' : 'files'} · {formatBytes(group.batchSizeBytes)}
                        </Text>
                      </View>

                      <TouchableOpacity
                        onPress={() => handleDeleteBatch(bId, group.batchTitle)}
                        activeOpacity={0.7}
                        style={{ paddingHorizontal: 8, paddingVertical: 4 }}
                      >
                        <Text style={{ fontSize: 10.5, fontWeight: '700', color: '#DC2626' }}>
                          Delete Batch
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Batch Items List */}
                    <View
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: '#E2E8F0',
                        overflow: 'hidden',
                      }}
                    >
                      {group.items.map((item, idx) => (
                        <View
                          key={item.id}
                          style={{
                            paddingVertical: 10,
                            paddingHorizontal: 12,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderTopWidth: idx > 0 ? 1 : 0,
                            borderTopColor: '#F1F5F9',
                          }}
                        >
                          <TouchableOpacity
                            onPress={() => handleOpenLocalPdf(item)}
                            activeOpacity={0.7}
                            style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 }}
                          >
                            <View
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: 8,
                                backgroundColor: '#FEF2F2',
                                borderWidth: 1,
                                borderColor: '#FEE2E2',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: 10,
                              }}
                            >
                              <FileText size={16} color="#DC2626" />
                            </View>

                            <View style={{ flex: 1, justifyContent: 'center' }}>
                              <Text
                                style={{ fontSize: 12, fontWeight: '700', color: '#0F172A', lineHeight: 16 }}
                                numberOfLines={1}
                              >
                                {item.title}
                              </Text>
                              <Text style={{ fontSize: 10.5, color: '#64748B', marginTop: 2 }}>
                                {item.section || item.chapterTitle || 'Study Note'} · {formatBytes(item.sizeBytes)}
                              </Text>
                            </View>
                          </TouchableOpacity>

                          {/* Delete item button */}
                          <TouchableOpacity
                            onPress={() => handleDeleteOne(item)}
                            activeOpacity={0.7}
                            accessibilityRole="button"
                            accessibilityLabel="Delete offline copy"
                            style={{
                              width: 30,
                              height: 30,
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: 8,
                            }}
                          >
                            <Trash2 size={14} color="#94A3B8" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        ) : (
          /* TAB 2: INSTITUTE LIBRARY (AVAILABLE TO DOWNLOAD) */
          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4, marginBottom: 2 }}>
              <Text style={{ fontSize: 12.5, fontWeight: '700', color: '#0F172A' }}>
                All Available Institute Notes & Formula Sheets
              </Text>
              <Text style={{ fontSize: 11, color: '#64748B' }}>
                {storeResources.length} items
              </Text>
            </View>

            {storeResources.length === 0 ? (
              <View
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 16,
                  padding: 24,
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 6,
                }}
              >
                <Image
                  source={require('../../assets/empty material.png')}
                  style={{ width: 140, height: 140, marginBottom: 10 }}
                  contentFit="contain"
                />
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F172A', textAlign: 'center' }}>
                  No Institute Materials Available
                </Text>
                <Text style={{ fontSize: 11.5, color: '#64748B', textAlign: 'center', maxWidth: 260, marginTop: 4, lineHeight: 16 }}>
                  Study materials and formula sheets uploaded for offline access will appear here.
                </Text>
              </View>
            ) : (
              storeResources.map((item: AdminResourceItem) => {
              const isSaved = downloads.some((d) => d.id === item.id);
              const isDownloading = downloadingId === item.id;

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
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', flex: 1, marginRight: 8 }}>
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          backgroundColor: '#EFF6FF',
                          borderWidth: 1,
                          borderColor: '#BFDBFE',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 10,
                          marginTop: 2,
                        }}
                      >
                        <FileText size={17} color="#2563EB" />
                      </View>
                      <View style={{ flex: 1 }}>
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
                        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
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
                            <Text style={{ fontSize: 10, fontWeight: '700', color: '#1D4ED8', textTransform: 'uppercase' }}>
                              {item.type}
                            </Text>
                          </View>
                          <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '500' }}>
                            Class {item.classLevel} • {item.subject}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {isAdmin && (
                      <TouchableOpacity
                        onPress={() => handleDeleteLibraryItem(item)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        style={{ padding: 4, borderRadius: 6 }}
                        accessibilityLabel="Delete item"
                      >
                        <Trash2 size={14} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Chapter info if present and distinct */}
                  {item.chapter && item.chapter !== item.title ? (
                    <Text
                      style={{
                        fontSize: 11,
                        color: '#64748B',
                        lineHeight: 15,
                        marginTop: 6,
                        paddingLeft: 46,
                      }}
                    >
                      {item.chapter}
                    </Text>
                  ) : item.subtext && !item.subtext.includes(item.fileSize) ? (
                    <Text
                      style={{
                        fontSize: 11,
                        color: '#64748B',
                        lineHeight: 15,
                        marginTop: 6,
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
                          onPress={() => handleDownloadFromLibrary(item)}
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
                        onPress={() => {
                          router.push({
                            pathname: '/(app)/pdf-viewer' as any,
                            params: {
                              contentId: item.id,
                              localUri: item.fileUrl,
                              title: item.title,
                              isBatch: '0',
                            },
                          });
                        }}
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
                          Preview
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })
          )}
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
                    backgroundColor: '#EFF6FF',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 10,
                  }}
                >
                  <Plus size={18} color="#2563EB" strokeWidth={2.5} />
                </View>
                <View>
                  <Text style={{ fontSize: 14.5, fontWeight: '700', color: '#0F172A' }}>
                    Upload Offline Study Material
                  </Text>
                  <Text style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>
                    Notes, formula sheets & solutions for students
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
                  Material Title *
                </Text>
                <TextInput
                  value={uploadTitle}
                  onChangeText={setUploadTitle}
                  placeholder="e.g. Class 12 Calculus Master Formula Sheet"
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

              {/* Type */}
              <View style={{ marginBottom: 14 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569', marginBottom: 6, letterSpacing: 0.3, textTransform: 'uppercase' }}>
                  Category *
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
                  {[
                    { id: 'notes', label: 'Chapter Notes' },
                    { id: 'formula_sheet', label: 'Formula Sheet' },
                    { id: 'pyq', label: 'Sample Paper / PYQ' },
                    { id: 'solution', label: 'Solutions' },
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
                          backgroundColor: isSelected ? '#2563EB' : '#F8FAFC',
                          borderWidth: 1,
                          borderColor: isSelected ? '#2563EB' : '#E2E8F0',
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

              {/* Class */}
              <View style={{ marginBottom: 14 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569', marginBottom: 6, letterSpacing: 0.3, textTransform: 'uppercase' }}>
                  Class Level *
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
                          backgroundColor: isSelected ? '#2563EB' : '#F8FAFC',
                          borderWidth: 1,
                          borderColor: isSelected ? '#2563EB' : '#E2E8F0',
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
                          backgroundColor: isSelected ? '#2563EB' : '#F8FAFC',
                          borderWidth: 1,
                          borderColor: isSelected ? '#2563EB' : '#E2E8F0',
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

              {/* Chapter */}
              <View style={{ marginBottom: 14 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569', marginBottom: 6, letterSpacing: 0.3, textTransform: 'uppercase' }}>
                  Chapter / Topic (Optional)
                </Text>
                <TextInput
                  value={uploadChapter}
                  onChangeText={setUploadChapter}
                  placeholder="e.g. Calculus, Trigonometry"
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

              {/* Pick Document */}
              <View style={{ marginBottom: 14 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569', marginBottom: 6, letterSpacing: 0.3, textTransform: 'uppercase' }}>
                  PDF Document *
                </Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handlePickDocument}
                  style={{
                    backgroundColor: pickedFileName ? '#EFF6FF' : '#F8FAFC',
                    borderWidth: 1.5,
                    borderStyle: pickedFileName ? 'solid' : 'dashed',
                    borderColor: pickedFileName ? '#3B82F6' : '#CBD5E1',
                    borderRadius: 10,
                    paddingVertical: 11,
                    paddingHorizontal: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 8,
                  }}
                >
                  <FileText size={16} color={pickedFileName ? '#2563EB' : '#64748B'} />
                  <Text
                    numberOfLines={1}
                    style={{
                      fontSize: 12,
                      fontWeight: '700',
                      color: pickedFileName ? '#1D4ED8' : '#475569',
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
                  placeholder="Or enter PDF URL (https://...)"
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

              {/* Auto Save Locally Card */}
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
                    Save to offline storage now
                  </Text>
                  <Text style={{ fontSize: 10.5, color: '#64748B', marginTop: 2 }}>
                    Pre-download so it is immediately readable offline
                  </Text>
                </View>
                <Switch
                  value={autoSaveLocally}
                  onValueChange={setAutoSaveLocally}
                  trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                  thumbColor={autoSaveLocally ? '#2563EB' : '#F8FAFC'}
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
                onPress={handleCreateOfflineMaterial}
                disabled={isSubmitting}
                activeOpacity={0.85}
                style={{
                  backgroundColor: '#2563EB',
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#2563EB',
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
                    Publish Material for Offline Downloads
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
