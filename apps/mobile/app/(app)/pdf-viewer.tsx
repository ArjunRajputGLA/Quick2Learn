import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Dimensions,
  StyleSheet,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ChevronLeft,
  ShieldAlert,
  ShieldCheck,
  ChevronRight,
  Maximize2,
  ZoomIn,
  BookOpen,
  ArrowRight,
  X,
} from 'lucide-react-native';
import * as ScreenCapture from 'expo-screen-capture';
import Pdf, { type PdfRef } from 'react-native-pdf';
import { WebView } from 'react-native-webview';
import { BookLoader } from '../../src/components/ui/BookLoader';
import {
  getLastReadPage,
  saveLastReadPage,
} from '../../src/lib/offline-downloads';

export default function PdfViewerScreen() {
  const router = useRouter();
  const { contentId, localUri, remoteUrl, title, isBatch } = useLocalSearchParams<{
    contentId: string;
    localUri?: string;
    remoteUrl?: string;
    title?: string;
    isBatch?: string;
  }>();

  const isProtectedBatch = isBatch === '1' || isBatch === 'true';

  // 1. Prevent screenshots & screen recording for batch PDFs
  useEffect(() => {
    if (isProtectedBatch) {
      ScreenCapture.preventScreenCaptureAsync('batch-pdf-screen').catch(() => {});
      return () => {
        ScreenCapture.allowScreenCaptureAsync('batch-pdf-screen').catch(() => {});
      };
    }
  }, [isProtectedBatch]);

  const pdfSourceUri = localUri || remoteUrl || '';
  const pdfRef = useRef<PdfRef>(null);

  const [initialPage, setInitialPage] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [useWebViewFallback, setUseWebViewFallback] = useState<boolean>(false);
  const [isJumpModalOpen, setIsJumpModalOpen] = useState<boolean>(false);
  const [jumpPageInput, setJumpPageInput] = useState<string>('');

  // 2. Load remembered last page
  useEffect(() => {
    if (contentId) {
      const savedPage = getLastReadPage(contentId);
      if (savedPage > 0) {
        setInitialPage(savedPage);
        setCurrentPage(savedPage);
      }
    }
  }, [contentId]);

  // Page changed handler
  const handlePageChanged = (page: number, numberOfPages: number) => {
    setCurrentPage(page);
    setTotalPages(numberOfPages);
    if (contentId) {
      saveLastReadPage(contentId, page, numberOfPages);
    }
  };

  // Jump to specific page
  const handleJumpToPage = () => {
    const target = parseInt(jumpPageInput.trim(), 10);
    if (!isNaN(target) && target >= 1 && target <= totalPages) {
      if (pdfRef.current) {
        pdfRef.current.setPage(target);
      }
      setCurrentPage(target);
      if (contentId) {
        saveLastReadPage(contentId, target, totalPages);
      }
      setIsJumpModalOpen(false);
      setJumpPageInput('');
    } else {
      Alert.alert(
        'Invalid Page',
        `Please enter a page number between 1 and ${totalPages}.`
      );
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      const nextP = currentPage - 1;
      pdfRef.current?.setPage(nextP);
      setCurrentPage(nextP);
      if (contentId) saveLastReadPage(contentId, nextP, totalPages);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      const nextP = currentPage + 1;
      pdfRef.current?.setPage(nextP);
      setCurrentPage(nextP);
      if (contentId) saveLastReadPage(contentId, nextP, totalPages);
    }
  };

  return (
    <View className="flex-1 bg-slate-900">
      {/* Top Header Bar */}
      <View className="pt-12 pb-3 px-4 bg-slate-900 border-b border-slate-800 flex-row items-center justify-between">
        <View className="flex-row items-center flex-1 mr-2">
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-slate-800 items-center justify-center mr-2.5 active:bg-slate-700"
          >
            <ChevronLeft size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <View className="flex-1">
            <Text
              className="text-white font-bold text-body"
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {title || 'Document'}
            </Text>
            {isProtectedBatch && (
              <View className="flex-row items-center space-x-1 mt-0.5">
                <ShieldCheck size={12} color="#10B981" />
                <Text className="text-[11px] font-semibold text-emerald-400">
                  Protected Batch Study Material
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Jump To Page Trigger Button */}
        <TouchableOpacity
          onPress={() => {
            setJumpPageInput(String(currentPage));
            setIsJumpModalOpen(true);
          }}
          className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 flex-row items-center space-x-1 active:bg-slate-700"
        >
          <BookOpen size={14} color="#94A3B8" />
          <Text className="text-xs font-bold text-slate-200">
            {currentPage} / {totalPages || '—'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main PDF Content Area */}
      <View className="flex-1 bg-slate-950 relative justify-center items-center">
        {!pdfSourceUri ? (
          <View className="p-6 items-center">
            <Text className="text-slate-400 text-body">
              No valid document URL or local file path provided.
            </Text>
          </View>
        ) : useWebViewFallback ? (
          // Graceful WebView Fallback
          <WebView
            source={{ uri: pdfSourceUri }}
            style={{ flex: 1, width: Dimensions.get('window').width }}
            originWhitelist={['*']}
            allowFileAccess={true}
            allowFileAccessFromFileURLs={true}
            allowUniversalAccessFromFileURLs={true}
          />
        ) : (
          // Native react-native-pdf component
          <Pdf
            ref={pdfRef}
            source={{ uri: pdfSourceUri, cache: true }}
            page={initialPage}
            minScale={1.0}
            maxScale={4.0}
            enableDoubleTapZoom={true}
            fitPolicy={0}
            spacing={8}
            onLoadComplete={(numberOfPages) => {
              setTotalPages(numberOfPages);
              setIsLoading(false);
            }}
            onPageChanged={handlePageChanged}
            onError={(error) => {
              console.warn('[PdfViewer] Native Pdf failed, using fallback:', error);
              setUseWebViewFallback(true);
              setIsLoading(false);
            }}
            style={styles.pdf}
          />
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <View className="absolute inset-0 bg-slate-950/80 items-center justify-center p-4">
            <BookLoader text="Opening study document..." size="lg" />
          </View>
        )}
      </View>

      {/* Bottom Floating Navigation Toolbar */}
      <View className="pb-8 pt-3 px-6 bg-slate-900 border-t border-slate-800 flex-row items-center justify-between">
        <TouchableOpacity
          disabled={currentPage <= 1}
          onPress={handlePrevPage}
          className={`flex-row items-center px-4 py-2.5 rounded-xl ${
            currentPage <= 1 ? 'opacity-40 bg-slate-800' : 'bg-slate-800 active:bg-slate-700'
          }`}
        >
          <ChevronLeft size={18} color="#FFFFFF" />
          <Text className="text-white text-caption font-bold ml-1">Prev</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setJumpPageInput(String(currentPage));
            setIsJumpModalOpen(true);
          }}
          className="items-center px-3 py-1 active:opacity-80"
        >
          <Text className="text-white font-extrabold text-body leading-tight">
            Page {currentPage}
          </Text>
          <Text className="text-slate-400 text-[11px]">
            of {totalPages} · Tap to jump
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          disabled={currentPage >= totalPages}
          onPress={handleNextPage}
          className={`flex-row items-center px-4 py-2.5 rounded-xl ${
            currentPage >= totalPages ? 'opacity-40 bg-slate-800' : 'bg-slate-800 active:bg-slate-700'
          }`}
        >
          <Text className="text-white text-caption font-bold mr-1">Next</Text>
          <ChevronRight size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Jump To Page Modal */}
      <Modal
        visible={isJumpModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsJumpModalOpen(false)}
      >
        <View className="flex-1 bg-black/70 items-center justify-center p-5">
          <View className="bg-slate-800 rounded-3xl p-6 w-full max-w-xs border border-slate-700 space-y-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-h3 font-black text-white">
                Jump to Page
              </Text>
              <TouchableOpacity
                onPress={() => setIsJumpModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-700 items-center justify-center"
              >
                <X size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <Text className="text-caption text-slate-300">
              Enter a page number between 1 and {totalPages}:
            </Text>

            <TextInput
              value={jumpPageInput}
              onChangeText={setJumpPageInput}
              keyboardType="number-pad"
              autoFocus
              className="bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white text-h2 font-black text-center"
              placeholder="1"
              placeholderTextColor="#64748B"
            />

            <View className="flex-row items-center space-x-3 pt-2">
              <TouchableOpacity
                onPress={() => setIsJumpModalOpen(false)}
                className="flex-1 py-3 rounded-xl bg-slate-700 items-center justify-center"
              >
                <Text className="text-white font-bold text-caption">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleJumpToPage}
                className="flex-1 py-3 rounded-xl bg-primary items-center justify-center"
              >
                <Text className="text-white font-bold text-caption">Go to Page</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  pdf: {
    flex: 1,
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    backgroundColor: '#020617',
  },
});
