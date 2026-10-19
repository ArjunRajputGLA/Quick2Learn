import React from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import { AlertCircle, CheckCircle2, Clock, HelpCircle, Bookmark } from 'lucide-react-native';
import { Button } from '../ui/Button';

interface SubmitSummaryModalProps {
  visible: boolean;
  totalQuestions: number;
  answeredCount: number;
  unansweredCount: number;
  markedCount: number;
  remainingTimeFormatted: string;
  isSubmitting: boolean;
  onConfirmSubmit: () => void;
  onCancel: () => void;
}

export function SubmitSummaryModal({
  visible,
  totalQuestions,
  answeredCount,
  unansweredCount,
  markedCount,
  remainingTimeFormatted,
  isSubmitting,
  onConfirmSubmit,
  onCancel,
}: SubmitSummaryModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View className="flex-1 bg-black/60 justify-center p-5">
        <View className="bg-surface rounded-3xl p-6 shadow-xl border border-border">
          {/* Header */}
          <View className="items-center mb-4">
            <View className="w-12 h-12 rounded-full bg-primary-soft items-center justify-center mb-2">
              <CheckCircle2 size={28} color="#2563EB" />
            </View>
            <Text className="text-h2 font-bold text-ink text-center">
              Submit Test?
            </Text>
            <Text className="text-caption text-ink-muted text-center mt-1">
              Please review your question status before final submission.
            </Text>
          </View>

          {/* Breakdown Cards */}
          <View className="bg-surface-subtle rounded-2xl p-4 border border-border/70 mb-5 space-y-2.5">
            <View className="flex-row items-center justify-between py-1 border-b border-border/50">
              <View className="flex-row items-center">
                <View className="w-3 h-3 rounded-full bg-emerald-600 mr-2" />
                <Text className="text-body text-ink">Answered</Text>
              </View>
              <Text className="text-body font-bold text-emerald-700">
                {answeredCount} of {totalQuestions}
              </Text>
            </View>

            <View className="flex-row items-center justify-between py-1 border-b border-border/50">
              <View className="flex-row items-center">
                <View className="w-3 h-3 rounded-full bg-slate-500 mr-2" />
                <Text className="text-body text-ink">Unanswered</Text>
              </View>
              <Text className="text-body font-bold text-slate-700">
                {unansweredCount}
              </Text>
            </View>

            <View className="flex-row items-center justify-between py-1 border-b border-border/50">
              <View className="flex-row items-center">
                <View className="w-3 h-3 rounded-full bg-amber-500 mr-2" />
                <Text className="text-body text-ink">Marked for Review</Text>
              </View>
              <Text className="text-body font-bold text-amber-700">
                {markedCount}
              </Text>
            </View>

            <View className="flex-row items-center justify-between py-1">
              <View className="flex-row items-center">
                <Clock size={14} color="#6B7280" />
                <Text className="text-body text-ink-muted ml-2">Time Remaining</Text>
              </View>
              <Text className="text-body font-bold text-ink">
                {remainingTimeFormatted}
              </Text>
            </View>
          </View>

          {unansweredCount > 0 ? (
            <View className="flex-row items-center bg-amber-50/80 p-3 rounded-xl border border-amber-200 mb-5">
              <AlertCircle size={16} color="#D97706" />
              <Text className="text-caption text-amber-800 ml-2 flex-1">
                You still have {unansweredCount} unanswered {unansweredCount === 1 ? 'question' : 'questions'}.
              </Text>
            </View>
          ) : null}

          {/* Action Buttons */}
          <View className="space-y-3">
            <Button
              variant="primary"
              size="lg"
              loading={isSubmitting}
              onPress={onConfirmSubmit}
            >
              Confirm & Submit Test
            </Button>

            <Button
              variant="outline"
              size="md"
              disabled={isSubmitting}
              onPress={onCancel}
            >
              Resume Answering
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}
