import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import {
  AlertTriangle,
  LogOut,
  HelpCircle,
  CheckCircle2,
  Info,
} from 'lucide-react-native';
import { colors, radii } from '@quick2learn/shared';
import { Button } from './Button';

export type ConfirmDialogType = 'danger' | 'warning' | 'info' | 'success';

export interface ConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmDialogType;
  icon?: React.ReactNode;
  loading?: boolean;
}

export function ConfirmModal({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'info',
  icon,
  loading = false,
}: ConfirmModalProps) {
  const getBadgeStyle = () => {
    switch (type) {
      case 'danger':
        return {
          bg: '#FEE2E2',
          border: '#FECACA',
          defaultIcon: <LogOut size={26} color="#DC2626" />,
        };
      case 'warning':
        return {
          bg: '#FEF3C7',
          border: '#FDE68A',
          defaultIcon: <AlertTriangle size={26} color="#D97706" />,
        };
      case 'success':
        return {
          bg: '#ECFDF5',
          border: '#A7F3D0',
          defaultIcon: <CheckCircle2 size={26} color="#059669" />,
        };
      case 'info':
      default:
        return {
          bg: '#EFF6FF',
          border: '#DBEAFE',
          defaultIcon: <HelpCircle size={26} color="#2563EB" />,
        };
    }
  };

  const badge = getBadgeStyle();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {
        if (!loading) onClose();
      }}
    >
      <TouchableWithoutFeedback
        onPress={() => {
          if (!loading) onClose();
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 24,
          }}
        >
          <TouchableWithoutFeedback>
            <View
              style={{
                width: '100%',
                maxWidth: 360,
                backgroundColor: colors.surface,
                borderRadius: 26,
                paddingVertical: 24,
                paddingHorizontal: 22,
                borderWidth: 1,
                borderColor: 'rgba(226, 232, 240, 0.9)',
                shadowColor: '#0F172A',
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.16,
                shadowRadius: 24,
                elevation: 12,
                alignItems: 'center',
              }}
            >
              {/* Emblem Badge Icon */}
              <View
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: 29,
                  backgroundColor: badge.bg,
                  borderWidth: 1.5,
                  borderColor: badge.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                }}
              >
                {icon || badge.defaultIcon}
              </View>

              {/* Title */}
              <Text
                style={{
                  fontSize: 18.5,
                  fontWeight: '800',
                  color: colors.ink,
                  textAlign: 'center',
                  marginBottom: 8,
                  letterSpacing: -0.3,
                }}
              >
                {title}
              </Text>

              {/* Message */}
              <Text
                style={{
                  fontSize: 14,
                  color: colors['ink-muted'],
                  textAlign: 'center',
                  lineHeight: 21,
                  marginBottom: 24,
                  paddingHorizontal: 6,
                }}
              >
                {message}
              </Text>

              {/* Actions Button Row */}
              <View
                style={{
                  flexDirection: 'row',
                  width: '100%',
                  gap: 10,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Button
                    variant="outline"
                    size="md"
                    fullWidth
                    disabled={loading}
                    onPress={onClose}
                  >
                    {cancelText}
                  </Button>
                </View>

                <View style={{ flex: 1 }}>
                  <Button
                    variant={type === 'danger' ? 'danger' : 'primary'}
                    size="md"
                    fullWidth
                    loading={loading}
                    onPress={onConfirm}
                  >
                    {confirmText}
                  </Button>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmDialogType;
  icon?: React.ReactNode;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

interface ConfirmContextType {
  confirm: (options: ConfirmDialogOptions) => void;
}

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
  const [dialogState, setDialogState] = useState<{
    visible: boolean;
    options: ConfirmDialogOptions | null;
    loading: boolean;
  }>({
    visible: false,
    options: null,
    loading: false,
  });

  const confirm = useCallback((options: ConfirmDialogOptions) => {
    setDialogState({
      visible: true,
      options,
      loading: false,
    });
  }, []);

  const handleClose = () => {
    if (dialogState.options?.onCancel) {
      dialogState.options.onCancel();
    }
    setDialogState((prev) => ({ ...prev, visible: false }));
  };

  const handleConfirm = async () => {
    if (!dialogState.options) return;
    try {
      setDialogState((prev) => ({ ...prev, loading: true }));
      await dialogState.options.onConfirm();
      setDialogState((prev) => ({ ...prev, visible: false, loading: false }));
    } catch (err) {
      setDialogState((prev) => ({ ...prev, loading: false }));
      console.warn('[ConfirmDialog] error during confirm callback:', err);
    }
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {dialogState.options && (
        <ConfirmModal
          visible={dialogState.visible}
          onClose={handleClose}
          onConfirm={handleConfirm}
          title={dialogState.options.title}
          message={dialogState.options.message}
          confirmText={dialogState.options.confirmText}
          cancelText={dialogState.options.cancelText}
          type={dialogState.options.type || 'info'}
          icon={dialogState.options.icon}
          loading={dialogState.loading}
        />
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirmDialog() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error('useConfirmDialog must be used within ConfirmDialogProvider');
  }
  return ctx;
}
