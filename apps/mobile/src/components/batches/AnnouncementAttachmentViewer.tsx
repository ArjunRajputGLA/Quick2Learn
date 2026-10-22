import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Dimensions,
  Linking,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { X, ExternalLink, Download } from 'lucide-react-native';
import type { AnnouncementAttachment } from '@quick2learn/shared';

interface AnnouncementAttachmentViewerProps {
  visible: boolean;
  onClose: () => void;
  attachment: AnnouncementAttachment | null;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export function AnnouncementAttachmentViewer({
  visible,
  onClose,
  attachment,
}: AnnouncementAttachmentViewerProps) {
  if (!attachment) return null;

  const isImage = attachment.type === 'image';
  const isPdf = attachment.type === 'pdf';

  const handleOpenPdf = async () => {
    try {
      const canOpen = await Linking.canOpenURL(attachment.fileUrl);
      if (canOpen) {
        await Linking.openURL(attachment.fileUrl);
      } else {
        Alert.alert('Cannot Open PDF', 'No application available to open this PDF.');
      }
    } catch {
      Alert.alert('Error', 'Failed to open PDF document.');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/95 justify-between">
        {/* Top Bar */}
        <View className="flex-row items-center justify-between p-4 pt-12">
          <View className="flex-1 mr-4">
            <Text
              className="text-white text-body font-bold truncate"
              numberOfLines={1}
            >
              {attachment.fileName}
            </Text>
            <Text className="text-white/60 text-caption">
              {isPdf ? 'PDF Document' : 'Image Attachment'}
            </Text>
          </View>

          <View className="flex-row items-center space-x-2">
            <TouchableOpacity
              onPress={() => Linking.openURL(attachment.fileUrl).catch(() => {})}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              className="w-10 h-10 rounded-full bg-white/20 items-center justify-center mr-2"
              accessibilityLabel="Open externally"
            >
              <ExternalLink size={18} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              className="w-10 h-10 rounded-full bg-white/20 items-center justify-center"
              accessibilityLabel="Close"
            >
              <X size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content Body */}
        <View className="flex-1 items-center justify-center p-4">
          {isImage ? (
            <Image
              source={{ uri: attachment.fileUrl }}
              style={{
                width: SCREEN_WIDTH - 24,
                height: SCREEN_HEIGHT * 0.65,
              }}
              contentFit="contain"
              transition={200}
            />
          ) : (
            <View className="items-center p-8 bg-white/10 rounded-3xl max-w-sm space-y-4">
              <View className="w-20 h-20 rounded-2xl bg-primary/20 items-center justify-center">
                <Text className="text-2xl font-black text-white">PDF</Text>
              </View>

              <Text className="text-white text-body-large font-bold text-center">
                {attachment.fileName}
              </Text>
              <Text className="text-white/70 text-small text-center">
                Tap below to view this PDF in your device's PDF viewer.
              </Text>

              <TouchableOpacity
                onPress={handleOpenPdf}
                className="px-6 py-3 rounded-xl bg-primary flex-row items-center space-x-2"
              >
                <Download size={18} color="#FFFFFF" />
                <Text className="text-white font-bold ml-2">Open Document</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Footer Bottom Bar */}
        <View className="p-4 pb-8 items-center">
          <Text className="text-white/40 text-caption">
            Quick2Learn · Batch Resource
          </Text>
        </View>
      </View>
    </Modal>
  );
}
