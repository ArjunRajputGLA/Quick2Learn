import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Platform,
  Alert,
} from 'react-native';
import {
  AlertTriangle,
  LogOut,
  HelpCircle,
  CheckCircle2,
  Check,
  AlertCircle,
  Info,
  X,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '@quick2learn/shared';
import { Button } from './Button';

export type ConfirmDialogType = 'danger' | 'warning' | 'info' | 'success';

export interface ConfirmModalButton {
  text?: string;
  onPress?: () => void | Promise<void>;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface ConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm?: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string | null;
  buttons?: ConfirmModalButton[];
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
  confirmText = 'OK',
  cancelText,
  buttons,
  type = 'info',
  icon,
  loading = false,
}: ConfirmModalProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0.92);
      opacityAnim.setValue(1);
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 70,
        useNativeDriver: true,
      }).start();

      // Trigger modern haptic feedback based on dialog category
      try {
        if (type === 'success') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        } else if (type === 'danger') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        } else if (type === 'warning') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
        } else {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        }
      } catch {
        // Haptics safe fallback
      }
    } else {
      scaleAnim.setValue(1);
      opacityAnim.setValue(1);
    }
  }, [visible, type, scaleAnim, opacityAnim]);

  const getEmblemConfig = () => {
    const isLogout = (title || '').toLowerCase().includes('log out') || (title || '').toLowerCase().includes('logout');

    switch (type) {
      case 'danger':
        return {
          outerBg: '#FEE2E2',
          outerBorder: '#FECACA',
          innerBg: '#EF4444',
          btnBg: '#EF4444',
          btnShadow: '#EF4444',
          defaultIcon: isLogout ? (
            <LogOut size={24} color="#FFFFFF" strokeWidth={2.4} />
          ) : (
            <AlertTriangle size={24} color="#FFFFFF" strokeWidth={2.4} />
          ),
        };
      case 'warning':
        return {
          outerBg: '#FEF3C7',
          outerBorder: '#FDE68A',
          innerBg: '#F59E0B',
          btnBg: '#F59E0B',
          btnShadow: '#F59E0B',
          defaultIcon: <AlertCircle size={24} color="#FFFFFF" strokeWidth={2.4} />,
        };
      case 'success':
        return {
          outerBg: '#DCFCE7',
          outerBorder: '#A7F3D0',
          innerBg: '#10B981',
          btnBg: '#10B981',
          btnShadow: '#10B981',
          defaultIcon: <Check size={26} color="#FFFFFF" strokeWidth={3} />,
        };
      case 'info':
      default:
        return {
          outerBg: '#EFF6FF',
          outerBorder: '#DBEAFE',
          innerBg: '#2563EB',
          btnBg: '#2563EB',
          btnShadow: '#2563EB',
          defaultIcon: <HelpCircle size={24} color="#FFFFFF" strokeWidth={2.4} />,
        };
    }
  };

  const emblem = getEmblemConfig();

  // Determine button configuration
  const resolvedButtons: ConfirmModalButton[] = buttons && buttons.length > 0
    ? buttons
    : cancelText
    ? [
        { text: cancelText, style: 'cancel', onPress: onClose },
        { text: confirmText, style: type === 'danger' ? 'destructive' : 'default', onPress: onConfirm },
      ]
    : [
        { text: confirmText || 'OK', style: 'default', onPress: onConfirm || onClose },
      ];

  const handleButtonClick = async (btn: ConfirmModalButton) => {
    if (loading) return;
    try {
      if (btn.onPress) {
        await btn.onPress();
      }
    } finally {
      onClose();
    }
  };

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
            <Animated.View
              style={{
                width: '100%',
                maxWidth: 340,
                backgroundColor: colors.surface,
                borderRadius: 26,
                paddingTop: 26,
                paddingBottom: 22,
                paddingHorizontal: 22,
                borderWidth: 1,
                borderColor: 'rgba(226, 232, 240, 0.9)',
                shadowColor: '#0F172A',
                shadowOffset: { width: 0, height: 16 },
                shadowOpacity: 0.18,
                shadowRadius: 28,
                elevation: 16,
                alignItems: 'center',
                transform: [{ scale: scaleAnim }],
                opacity: opacityAnim,
              }}
            >
              {/* Emblem Badge Icon */}
              <View
                style={{
                  width: 66,
                  height: 66,
                  borderRadius: 33,
                  backgroundColor: emblem.outerBg,
                  borderWidth: 2,
                  borderColor: emblem.outerBorder,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                }}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: emblem.innerBg,
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: emblem.btnShadow,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.35,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                >
                  {icon || emblem.defaultIcon}
                </View>
              </View>

              {/* Title */}
              <Text
                style={{
                  fontSize: 19,
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
              {message ? (
                <Text
                  style={{
                    fontSize: 14.5,
                    color: colors['ink-muted'],
                    textAlign: 'center',
                    lineHeight: 21.5,
                    marginBottom: 22,
                    paddingHorizontal: 6,
                  }}
                >
                  {message}
                </Text>
              ) : (
                <View style={{ height: 12 }} />
              )}

              {/* Action Buttons Layout */}
              {resolvedButtons.length === 1 ? (
                // Single Full-Width Action Button (Alert/Success Confirmation)
                <TouchableOpacity
                  activeOpacity={0.85}
                  disabled={loading}
                  onPress={() => handleButtonClick(resolvedButtons[0])}
                  style={{
                    width: '100%',
                    height: 46,
                    borderRadius: 14,
                    backgroundColor: emblem.btnBg,
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: emblem.btnShadow,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: '700',
                      color: '#FFFFFF',
                      letterSpacing: 0.2,
                    }}
                  >
                    {resolvedButtons[0].text || 'OK'}
                  </Text>
                </TouchableOpacity>
              ) : resolvedButtons.length === 2 ? (
                // Dual Action Buttons (Cancel + Confirm)
                <View
                  style={{
                    flexDirection: 'row',
                    width: '100%',
                    gap: 10,
                  }}
                >
                  {/* Left (typically cancel) */}
                  <View style={{ flex: 1 }}>
                    <Button
                      variant={resolvedButtons[0].style === 'destructive' ? 'danger' : 'outline'}
                      size="md"
                      fullWidth
                      disabled={loading}
                      onPress={() => handleButtonClick(resolvedButtons[0])}
                    >
                      {resolvedButtons[0].text || 'Cancel'}
                    </Button>
                  </View>

                  {/* Right (typically confirm) */}
                  <View style={{ flex: 1 }}>
                    <Button
                      variant={
                        resolvedButtons[1].style === 'destructive' || type === 'danger'
                          ? 'danger'
                          : 'primary'
                      }
                      size="md"
                      fullWidth
                      loading={loading}
                      onPress={() => handleButtonClick(resolvedButtons[1])}
                    >
                      {resolvedButtons[1].text || 'Confirm'}
                    </Button>
                  </View>
                </View>
              ) : (
                // 3+ Buttons Stacked
                <View style={{ width: '100%', gap: 8 }}>
                  {resolvedButtons.map((btn, idx) => (
                    <Button
                      key={idx}
                      variant={
                        btn.style === 'destructive'
                          ? 'danger'
                          : btn.style === 'cancel'
                          ? 'outline'
                          : 'primary'
                      }
                      size="md"
                      fullWidth
                      disabled={loading}
                      onPress={() => handleButtonClick(btn)}
                    >
                      {btn.text}
                    </Button>
                  ))}
                </View>
              )}
            </Animated.View>
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
  cancelText?: string | null;
  buttons?: ConfirmModalButton[];
  type?: ConfirmDialogType;
  icon?: React.ReactNode;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  cancelable?: boolean;
}

export interface AlertDialogOptions {
  title: string;
  message: string;
  type?: ConfirmDialogType;
  buttonText?: string;
  buttons?: ConfirmModalButton[];
  icon?: React.ReactNode;
  onConfirm?: () => void | Promise<void>;
}

interface ConfirmContextType {
  confirm: (options: ConfirmDialogOptions) => void;
  alert: (options: AlertDialogOptions) => void;
  showSuccess: (title: string, message: string, onOk?: () => void) => void;
  showError: (title: string, message: string, onOk?: () => void) => void;
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
      options: {
        ...options,
        cancelText: options.cancelText ?? 'Cancel',
      },
      loading: false,
    });
  }, []);

  const alert = useCallback((options: AlertDialogOptions) => {
    setDialogState({
      visible: true,
      options: {
        title: options.title,
        message: options.message,
        type: options.type || 'info',
        icon: options.icon,
        confirmText: options.buttonText || 'OK',
        cancelText: null, // Single button alert
        buttons: options.buttons,
        onConfirm: options.onConfirm,
      },
      loading: false,
    });
  }, []);

  const showSuccess = useCallback((title: string, message: string, onOk?: () => void) => {
    alert({
      title,
      message,
      type: 'success',
      buttonText: 'OK',
      onConfirm: onOk,
    });
  }, [alert]);

  const showError = useCallback((title: string, message: string, onOk?: () => void) => {
    alert({
      title,
      message,
      type: 'danger',
      buttonText: 'OK',
      onConfirm: onOk,
    });
  }, [alert]);

  // Intercept standard React Native Alert.alert calls across the entire app
  // so every screen gets the modern, polished popups automatically!
  useEffect(() => {
    const originalAlert = Alert.alert;

    Alert.alert = (
      title?: string,
      message?: string,
      buttons?: Array<{ text?: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }>,
      options?: { cancelable?: boolean; onDismiss?: () => void }
    ) => {
      const lowerTitle = (title || '').toLowerCase();
      const lowerMsg = (message || '').toLowerCase();
      let type: ConfirmDialogType = 'info';

      if (
        lowerTitle.includes('success') ||
        lowerTitle.includes('linked') ||
        lowerTitle.includes('submitted') ||
        lowerTitle.includes('completed') ||
        lowerTitle.includes('saved') ||
        lowerTitle.includes('updated') ||
        lowerMsg.includes('successfully') ||
        lowerTitle.includes('request sent') ||
        lowerTitle.includes('request submitted')
      ) {
        type = 'success';
      } else if (
        lowerTitle.includes('error') ||
        lowerTitle.includes('fail') ||
        lowerTitle.includes('invalid') ||
        lowerTitle.includes('denied') ||
        lowerTitle.includes('delete') ||
        lowerTitle.includes('cannot') ||
        lowerTitle.includes('unable')
      ) {
        type = 'danger';
      } else if (
        lowerTitle.includes('warning') ||
        lowerTitle.includes('caution') ||
        lowerTitle.includes('notice') ||
        lowerTitle.includes('limit') ||
        lowerTitle.includes('required')
      ) {
        type = 'warning';
      }

      const formattedButtons: ConfirmModalButton[] =
        buttons && buttons.length > 0
          ? buttons.map((b) => ({
              text: b.text || 'OK',
              style: b.style,
              onPress: b.onPress,
            }))
          : [
              {
                text: 'OK',
                onPress: undefined,
              },
            ];

      setDialogState({
        visible: true,
        options: {
          title: title || (type === 'success' ? 'Success' : 'Notice'),
          message: message || '',
          type,
          buttons: formattedButtons,
          cancelable: options?.cancelable ?? true,
          onCancel: options?.onDismiss,
        },
        loading: false,
      });
    };

    return () => {
      Alert.alert = originalAlert;
    };
  }, []);

  const handleClose = () => {
    if (dialogState.options?.onCancel) {
      dialogState.options.onCancel();
    }
    setDialogState({ visible: false, options: null, loading: false });
  };

  const handleConfirm = async () => {
    if (!dialogState.options) return;
    try {
      setDialogState((prev) => ({ ...prev, loading: true }));
      if (dialogState.options.onConfirm) {
        await dialogState.options.onConfirm();
      }
      setDialogState({ visible: false, options: null, loading: false });
    } catch (err) {
      setDialogState((prev) => ({ ...prev, loading: false }));
      console.warn('[ConfirmDialog] error during confirm callback:', err);
    }
  };

  return (
    <ConfirmContext.Provider value={{ confirm, alert, showSuccess, showError }}>
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
          buttons={dialogState.options.buttons}
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

export const useAppAlert = useConfirmDialog;
