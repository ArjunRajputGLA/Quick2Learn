import React from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  Text,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { X, ZoomIn } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ImageViewerModalProps {
  visible: boolean;
  imageUrl: string | null;
  onClose: () => void;
  title?: string;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export function ImageViewerModal({
  visible,
  imageUrl,
  onClose,
  title = 'Diagram Preview',
}: ImageViewerModalProps) {
  const insets = useSafeAreaInsets();

  if (!imageUrl) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/90 justify-between">
        {/* Top Header */}
        <View
          style={{ paddingTop: insets.top + 8 }}
          className="px-4 pb-3 flex-row items-center justify-between bg-black/60 z-10"
        >
          <View className="flex-row items-center space-x-2">
            <ZoomIn size={18} color="#9CA3AF" />
            <Text className="text-body font-semibold text-white ml-2">
              {title} (Pinch to Zoom)
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onClose}
            className="w-10 h-10 rounded-full bg-white/20 items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel="Close image preview"
          >
            <X size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Zoomable Image ScrollView */}
        <ScrollView
          maximumZoomScale={3}
          minimumZoomScale={1}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
          }}
          centerContent
        >
          <Image
            source={{ uri: imageUrl }}
            style={{
              width: SCREEN_WIDTH - 24,
              height: SCREEN_HEIGHT * 0.7,
            }}
            contentFit="contain"
            transition={200}
          />
        </ScrollView>

        {/* Bottom hint */}
        <View
          style={{ paddingBottom: insets.bottom + 12 }}
          className="items-center py-2"
        >
          <Text className="text-caption text-gray-400">
            Pinch to zoom in/out • Double-tap to reset
          </Text>
        </View>
      </View>
    </Modal>
  );
}
