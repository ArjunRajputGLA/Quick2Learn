import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import {
  X,
  QrCode,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Camera,
  Info,
  ArrowRight,
  GraduationCap,
} from 'lucide-react-native';
import { Button } from '../ui/Button';
import { KeyboardAwareView } from '../ui/KeyboardAwareView';
import { useJoinBatch } from '../../api/hooks';
import { analytics } from '../../lib/analytics';
import { colors, radii } from '@quick2learn/shared';
import type { BatchJoinResponse } from '@quick2learn/shared';

interface JoinBatchModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (batchSlug?: string) => void;
}

export function JoinBatchModal({ visible, onClose, onSuccess }: JoinBatchModalProps) {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<'code' | 'scanner'>('code');
  const [code, setCode] = useState('');
  const [result, setResult] = useState<BatchJoinResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  const [permission, requestPermission] = useCameraPermissions();
  const joinBatchMutation = useJoinBatch();

  const resetState = () => {
    setCode('');
    setResult(null);
    setErrorMessage(null);
    setTab('code');
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleSubmitCode = (codeToSubmit?: string) => {
    const rawCode = (codeToSubmit || code).trim().toUpperCase();
    if (rawCode.length < 4) {
      setErrorMessage('Please enter a valid 6-character join code.');
      return;
    }

    setErrorMessage(null);
    joinBatchMutation.mutate(rawCode, {
      onSuccess: (data) => {
        setResult(data);
        if (data.status === 'already_enrolled' || data.status === 'request_created') {
          analytics.track('join_requested', {
            batchId: data.batchSlug || rawCode,
            batchName: data.batchTitle,
          });
          onSuccess?.(data.batchSlug);
        }
      },
      onError: (err) => {
        setErrorMessage(
          err.message || 'Invalid join code. Please check with your teacher.'
        );
      },
    });
  };

  const handleBarcodeScanned = (scan: BarcodeScanningResult) => {
    if (joinBatchMutation.isPending) return;

    try {
      const dataStr = scan.data;
      let extractedCode = dataStr;

      if (dataStr.startsWith('{')) {
        const parsed = JSON.parse(dataStr);
        if (parsed.code) {
          extractedCode = parsed.code;
        }
      }

      const clean = extractedCode.trim().toUpperCase();
      if (clean) {
        setCode(clean);
        setTab('code');
        handleSubmitCode(clean);
      }
    } catch {
      const raw = scan.data.toUpperCase();
      setCode(raw);
      setTab('code');
      handleSubmitCode(raw);
    }
  };

  const isCodeValid = code.trim().length >= 4;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAwareView
        style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.65)', justifyContent: 'flex-end' }}
      >
        <View
          style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: Math.max(insets.bottom, 16) + 8,
            maxHeight: '92%',
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.12,
            shadowRadius: 16,
            elevation: 20,
          }}
        >
          {/* Top Drag Handle */}
          <View
            style={{
              width: 38,
              height: 4,
              borderRadius: 2,
              backgroundColor: '#CBD5E1',
              alignSelf: 'center',
              marginBottom: 14,
            }}
          />

          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: 14,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <View style={{ flex: 1, paddingRight: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: colors.ink }}>
                  Join a Batch
                </Text>
                <View
                  style={{
                    backgroundColor: colors['primary-soft'],
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 12,
                  }}
                >
                  <Text style={{ fontSize: 10, fontWeight: '700', color: colors.primary }}>
                    Quick2Learn
                  </Text>
                </View>
              </View>
              <Text style={{ fontSize: 12.5, color: colors['ink-muted'] }}>
                Classroom, Online & Hybrid Batches
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: colors['surface-subtle'],
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: colors.border,
              }}
              accessibilityLabel="Close"
            >
              <X size={18} color={colors['ink-muted']} />
            </TouchableOpacity>
          </View>

          {/* Mode Switcher Tabs */}
          {!result && (
            <View
              style={{
                flexDirection: 'row',
                backgroundColor: '#F1F5F9',
                borderRadius: 14,
                padding: 4,
                marginTop: 14,
                marginBottom: 14,
              }}
            >
              <TouchableOpacity
                onPress={() => setTab('code')}
                activeOpacity={0.8}
                style={{
                  flex: 1,
                  paddingVertical: 9,
                  borderRadius: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: tab === 'code' ? '#FFFFFF' : 'transparent',
                  shadowColor: '#000000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: tab === 'code' ? 0.08 : 0,
                  shadowRadius: 3,
                  elevation: tab === 'code' ? 2 : 0,
                }}
              >
                <KeyRound
                  size={15}
                  color={tab === 'code' ? colors.primary : colors['ink-muted']}
                />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '700',
                    color: tab === 'code' ? colors.primary : colors['ink-muted'],
                    marginLeft: 6,
                  }}
                >
                  Enter Code
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={async () => {
                  if (!permission?.granted) {
                    const res = await requestPermission();
                    if (!res.granted) {
                      Alert.alert(
                        'Camera Permission Required',
                        'Quick2Learn needs camera access to scan the batch QR code.'
                      );
                      return;
                    }
                  }
                  setTab('scanner');
                }}
                activeOpacity={0.8}
                style={{
                  flex: 1,
                  paddingVertical: 9,
                  borderRadius: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: tab === 'scanner' ? '#FFFFFF' : 'transparent',
                  shadowColor: '#000000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: tab === 'scanner' ? 0.08 : 0,
                  shadowRadius: 3,
                  elevation: tab === 'scanner' ? 2 : 0,
                }}
              >
                <QrCode
                  size={15}
                  color={tab === 'scanner' ? colors.primary : colors['ink-muted']}
                />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '700',
                    color: tab === 'scanner' ? colors.primary : colors['ink-muted'],
                    marginLeft: 6,
                  }}
                >
                  Scan QR
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Success or Redirection State */}
          {result ? (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor:
                    result.status === 'enrol_online' ? '#FEF3C7' : '#D1FAE5',
                  marginBottom: 16,
                }}
              >
                {result.status === 'enrol_online' ? (
                  <ExternalLink size={32} color="#D97706" />
                ) : (
                  <CheckCircle2 size={32} color="#059669" />
                )}
              </View>

              <Text
                style={{
                  fontSize: 19,
                  fontWeight: '800',
                  color: colors.ink,
                  textAlign: 'center',
                  marginBottom: 6,
                }}
              >
                {result.batchTitle || 'Batch Request'}
              </Text>
              <Text
                style={{
                  fontSize: 13.5,
                  color: colors['ink-muted'],
                  textAlign: 'center',
                  maxWidth: 300,
                  lineHeight: 20,
                  marginBottom: 20,
                }}
              >
                {result.message}
              </Text>

              {result.status === 'enrol_online' && result.checkoutUrl && (
                <Button
                  variant="primary"
                  size="lg"
                  style={{ width: '100%', marginBottom: 10 }}
                  onPress={() => {
                    if (result.checkoutUrl) {
                      Linking.openURL(result.checkoutUrl).catch(() => {});
                    }
                  }}
                  icon={<ExternalLink size={18} color="#FFFFFF" />}
                >
                  Enrol on Website
                </Button>
              )}

              <Button
                variant={result.status === 'enrol_online' ? 'outline' : 'primary'}
                size="lg"
                style={{ width: '100%' }}
                onPress={handleClose}
              >
                Done
              </Button>
            </View>
          ) : tab === 'code' ? (
            /* Enter Join Code Tab */
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: 4 }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '700',
                    color: colors['ink-muted'],
                    textTransform: 'uppercase',
                    letterSpacing: 0.8,
                  }}
                >
                  6-Character Join Code
                </Text>
                <Text style={{ fontSize: 11, color: colors['ink-muted'] }}>
                  {code.length}/6 characters
                </Text>
              </View>

              {/* Code Input Box */}
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderWidth: 2,
                  borderColor: isFocused
                    ? colors.primary
                    : colors.border,
                  borderRadius: 16,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: isFocused ? colors.primary : '#000000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isFocused ? 0.12 : 0.03,
                  shadowRadius: 6,
                  elevation: isFocused ? 3 : 1,
                  marginBottom: 12,
                }}
              >
                <TextInput
                  value={code}
                  onChangeText={(val) => {
                    setCode(val.toUpperCase());
                    setErrorMessage(null);
                  }}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  maxLength={6}
                  placeholder="e.g. MTH101"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="characters"
                  autoCorrect={false}
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
                    fontSize: 24,
                    fontWeight: '800',
                    letterSpacing: 8,
                    color: colors.ink,
                    paddingVertical: 2,
                  }}
                />
                {code.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setCode('')}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: '#E2E8F0',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <X size={14} color="#64748B" />
                  </TouchableOpacity>
                )}
              </View>

              {errorMessage && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 10,
                    borderRadius: 12,
                    backgroundColor: '#FEF2F2',
                    borderWidth: 1,
                    borderColor: '#FECACA',
                    marginBottom: 12,
                  }}
                >
                  <AlertCircle size={16} color="#DC2626" />
                  <Text
                    style={{
                      fontSize: 12,
                      color: '#DC2626',
                      fontWeight: '600',
                      marginLeft: 8,
                      flex: 1,
                    }}
                  >
                    {errorMessage}
                  </Text>
                </View>
              )}

              {/* Informative Help Card */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  backgroundColor: '#EFF6FF',
                  borderWidth: 1,
                  borderColor: '#DBEAFE',
                  borderRadius: 14,
                  padding: 12,
                  marginBottom: 18,
                }}
              >
                <Info size={16} color={colors.primary} style={{ marginTop: 1, marginRight: 8 }} />
                <Text
                  style={{
                    fontSize: 11.5,
                    color: '#1E40AF',
                    lineHeight: 17,
                    flex: 1,
                  }}
                >
                  You can find your batch join code on your <Text style={{ fontWeight: '700' }}>admission receipt</Text>, <Text style={{ fontWeight: '700' }}>classroom notice board</Text>, or directly from Dinesh Sir in your <Text style={{ fontWeight: '700' }}>WhatsApp group</Text>.
                </Text>
              </View>

              <Button
                variant="primary"
                size="lg"
                onPress={() => handleSubmitCode()}
                loading={joinBatchMutation.isPending}
                disabled={!isCodeValid || joinBatchMutation.isPending}
                icon={
                  !joinBatchMutation.isPending && (
                    <ArrowRight size={18} color="#FFFFFF" />
                  )
                }
              >
                Send Join Request
              </Button>
            </ScrollView>
          ) : (
            /* Scanner Tab */
            <View style={{ paddingVertical: 6, alignItems: 'center' }}>
              {permission?.granted ? (
                <View
                  style={{
                    width: '100%',
                    height: 260,
                    borderRadius: 20,
                    overflow: 'hidden',
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: '#0F172A',
                    position: 'relative',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CameraView
                    style={{ width: '100%', height: '100%' }}
                    barcodeScannerSettings={{
                      barcodeTypes: ['qr'],
                    }}
                    onBarcodeScanned={handleBarcodeScanned}
                  />
                  {/* Framing Overlay */}
                  <View
                    style={{
                      position: 'absolute',
                      width: 180,
                      height: 180,
                      borderWidth: 2,
                      borderColor: '#3B82F6',
                      borderRadius: 18,
                      backgroundColor: 'rgba(37, 99, 235, 0.08)',
                    }}
                  />
                  {joinBatchMutation.isPending && (
                    <View
                      style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <ActivityIndicator size="large" color="#3B82F6" />
                      <Text
                        style={{
                          fontSize: 12,
                          color: '#FFFFFF',
                          fontWeight: '700',
                          marginTop: 8,
                        }}
                      >
                        Submitting request...
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
                <View style={{ paddingVertical: 32, alignItems: 'center' }}>
                  <View
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 28,
                      backgroundColor: '#F1F5F9',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 12,
                    }}
                  >
                    <Camera size={26} color="#64748B" />
                  </View>
                  <Text
                    style={{
                      fontSize: 14,
                      color: colors.ink,
                      fontWeight: '700',
                      marginBottom: 6,
                    }}
                  >
                    Camera Access Required
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: colors['ink-muted'],
                      textAlign: 'center',
                      marginBottom: 14,
                      maxWidth: 240,
                    }}
                  >
                    Grant camera permission to scan classroom QR codes instantly.
                  </Text>
                  <Button variant="primary" size="sm" onPress={requestPermission}>
                    Grant Permission
                  </Button>
                </View>
              )}

              <Text
                style={{
                  fontSize: 11.5,
                  color: colors['ink-muted'],
                  textAlign: 'center',
                  marginTop: 10,
                }}
              >
                Point camera directly at the QR code poster in the classroom
              </Text>
            </View>
          )}
        </View>
      </KeyboardAwareView>
    </Modal>
  );
}
