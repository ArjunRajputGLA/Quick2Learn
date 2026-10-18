import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function BottomSheet({
  visible,
  onClose,
  title,
  children,
  className = '',
}: BottomSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 bg-black/40 justify-end">
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
              <View
                className={`bg-surface rounded-t-3xl pt-3 px-5 border-t border-border shadow-lg ${className}`}
                style={{ paddingBottom: Math.max(insets.bottom, 20) }}
              >
                {/* Drag indicator pill */}
                <View className="items-center mb-3">
                  <View className="w-12 h-1.5 rounded-full bg-border" />
                </View>

                {title ? (
                  <View className="flex-row items-center justify-between pb-3 mb-2 border-b border-border/60">
                    <Text className="text-h3 font-semibold text-ink">
                      {title}
                    </Text>
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel="Close bottom sheet"
                      onPress={onClose}
                      className="w-10 h-10 items-center justify-center -mr-2 rounded-full active:bg-surface-subtle"
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <X size={20} color="#6B7280" />
                    </TouchableOpacity>
                  </View>
                ) : null}

                {children}
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
