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
} from 'react-native';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import {
  X,
  QrCode,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Camera,
} from 'lucide-react-native';
import { Button } from '../ui/Button';
import { useJoinBatch } from '../../api/hooks';
import { analytics } from '../../lib/analytics';
import type { BatchJoinResponse } from '@quick2learn/shared';

interface JoinBatchModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (batchSlug?: string) => void;
}

export function JoinBatchModal({ visible, onClose, onSuccess }: JoinBatchModalProps) {
  const [tab, setTab] = useState<'code' | 'scanner'>('code');
  const [code, setCode] = useState('');
  const [result, setResult] = useState<BatchJoinResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

      // Check if QR encodes JSON { code: "..." }
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
      // Fallback: use raw data
      setCode(scan.data.toUpperCase());
      setTab('code');
      handleSubmitCode(scan.data.toUpperCase());
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-black/60 justify-end">
        <View className="bg-surface rounded-t-3xl border-t border-border p-6 max-h-[90%] space-y-4">
          {/* Header */}
          <View className="flex-row items-center justify-between pb-3 border-b border-border">
            <View>
              <Text className="text-h2 font-bold text-ink">Join a Batch</Text>
              <Text className="text-small text-ink-muted">
                Quick2Learn Classroom & Online Batches
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              className="w-10 h-10 rounded-full bg-surface-subtle items-center justify-center"
              accessibilityLabel="Close"
            >
              <X size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Mode Switcher Tabs */}
          {!result && (
            <View className="flex-row p-1 bg-surface-subtle rounded-xl border border-border">
              <TouchableOpacity
                onPress={() => setTab('code')}
                className={`flex-1 py-2.5 rounded-lg flex-row items-center justify-center space-x-2 ${
                  tab === 'code' ? 'bg-surface shadow-sm' : ''
                }`}
              >
                <KeyRound
                  size={16}
                  color={tab === 'code' ? '#2563EB' : '#6B7280'}
                />
                <Text
                  className={`text-small font-semibold ml-1.5 ${
                    tab === 'code' ? 'text-primary' : 'text-ink-muted'
                  }`}
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
                className={`flex-1 py-2.5 rounded-lg flex-row items-center justify-center space-x-2 ${
                  tab === 'scanner' ? 'bg-surface shadow-sm' : ''
                }`}
              >
                <QrCode
                  size={16}
                  color={tab === 'scanner' ? '#2563EB' : '#6B7280'}
                />
                <Text
                  className={`text-small font-semibold ml-1.5 ${
                    tab === 'scanner' ? 'text-primary' : 'text-ink-muted'
                  }`}
                >
                  Scan QR
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Success or Redirection State */}
          {result ? (
            <View className="py-6 items-center text-center space-y-4">
              <View
                className={`w-16 h-16 rounded-full items-center justify-center ${
                  result.status === 'enrol_online'
                    ? 'bg-amber-100'
                    : 'bg-emerald-100'
                }`}
              >
                {result.status === 'enrol_online' ? (
                  <ExternalLink size={32} color="#D97706" />
                ) : (
                  <CheckCircle2 size={32} color="#059669" />
                )}
              </View>

              <View className="items-center">
                <Text className="text-h2 font-bold text-ink text-center mb-1">
                  {result.batchTitle || 'Batch'}
                </Text>
                <Text className="text-body text-ink-muted text-center max-w-xs leading-relaxed">
                  {result.message}
                </Text>
              </View>

              {result.status === 'enrol_online' && result.checkoutUrl && (
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full mt-2"
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
                className="w-full mt-2"
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
              contentContainerStyle={{ paddingVertical: 8 }}
            >
              <Text className="text-caption font-semibold uppercase tracking-wider text-ink-muted mb-2">
                6-Character Join Code
              </Text>

              <TextInput
                value={code}
                onChangeText={(val) => {
                  setCode(val.toUpperCase());
                  setErrorMessage(null);
                }}
                maxLength={6}
                placeholder="e.g. MTH101"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="characters"
                autoCorrect={false}
                className="w-full bg-surface-subtle border-2 border-border focus:border-primary rounded-2xl px-4 py-3.5 text-center font-mono text-2xl font-black tracking-widest text-ink mb-3"
              />

              {errorMessage && (
                <View className="flex-row items-center p-3 rounded-xl bg-critical/10 border border-critical/30 mb-3">
                  <AlertCircle size={16} color="#DC2626" />
                  <Text className="text-caption text-critical font-medium ml-2 flex-1">
                    {errorMessage}
                  </Text>
                </View>
              )}

              <Text className="text-caption text-ink-muted text-center mb-6 leading-relaxed">
                You can find the join code on your Quick2Learn admission slip,
                classroom notice board, or WhatsApp group.
              </Text>

              <Button
                variant="primary"
                size="lg"
                onPress={() => handleSubmitCode()}
                loading={joinBatchMutation.isPending}
                disabled={code.trim().length < 4 || joinBatchMutation.isPending}
              >
                Send Join Request
              </Button>
            </ScrollView>
          ) : (
            /* Scanner Tab */
            <View className="py-2 items-center">
              {permission?.granted ? (
                <View className="w-full h-72 rounded-2xl overflow-hidden border border-border bg-black relative items-center justify-center">
                  <CameraView
                    style={{ width: '100%', height: '100%' }}
                    barcodeScannerSettings={{
                      barcodeTypes: ['qr'],
                    }}
                    onBarcodeScanned={handleBarcodeScanned}
                  />
                  {/* Framing Overlay */}
                  <View className="absolute w-48 h-48 border-2 border-primary rounded-2xl bg-primary/10" />
                  {joinBatchMutation.isPending && (
                    <View className="absolute inset-0 bg-black/60 items-center justify-center">
                      <ActivityIndicator size="large" color="#2563EB" />
                      <Text className="text-caption text-white font-semibold mt-2">
                        Submitting request...
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
                <View className="py-12 items-center text-center space-y-3">
                  <Camera size={36} color="#6B7280" />
                  <Text className="text-body text-ink font-semibold">
                    Camera Access Required
                  </Text>
                  <Button
                    variant="primary"
                    size="sm"
                    onPress={requestPermission}
                  >
                    Grant Permission
                  </Button>
                </View>
              )}

              <Text className="text-caption text-ink-muted text-center mt-3">
                Point your camera at the QR code poster in the Quick2Learn classroom.
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
