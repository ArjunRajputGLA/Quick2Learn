import React from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Check, Circle, CheckSquare, Square, Hash } from 'lucide-react-native';
import { MathView } from '../composite/MathView';
import type { StudentTestQuestion } from '@quick2learn/shared';

interface AnswerControlProps {
  question: StudentTestQuestion;
  currentAnswer: any;
  onAnswerChange: (newAnswer: any) => void;
}

const ASSERTION_REASON_DEFAULT_OPTIONS = [
  {
    id: 'A',
    text: 'Both (A) and (R) are true and (R) is the correct explanation of (A).',
  },
  {
    id: 'B',
    text: 'Both (A) and (R) are true but (R) is not the correct explanation of (A).',
  },
  {
    id: 'C',
    text: 'Assertion (A) is true but Reason (R) is false.',
  },
  {
    id: 'D',
    text: 'Assertion (A) is false but Reason (R) is true.',
  },
];

export function AnswerControl({
  question,
  currentAnswer,
  onAnswerChange,
}: AnswerControlProps) {
  const triggerHaptic = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Haptics not available
    }
  };

  // 1. Single Choice (MCQ)
  if (question.type === 'mcq_single' || question.type === 'case_study') {
    const options = question.options || [];

    const handleSelectOption = (optId: string) => {
      triggerHaptic();
      if (currentAnswer === optId) {
        // Deselect if already selected
        onAnswerChange(null);
      } else {
        onAnswerChange(optId);
      }
    };

    return (
      <View className="space-y-3">
        <View className="flex-row items-center justify-between mb-1">
          <Text className="text-caption font-bold text-ink-muted uppercase tracking-wider">
            Select one option:
          </Text>
          {currentAnswer !== null && currentAnswer !== undefined ? (
            <TouchableOpacity
              onPress={() => {
                triggerHaptic();
                onAnswerChange(null);
              }}
              className="py-1 px-2"
            >
              <Text className="text-caption text-primary font-semibold">
                Clear selection
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {options.map((opt, idx) => {
          const isSelected = currentAnswer === opt.id || currentAnswer === opt.text;
          const letter = String.fromCharCode(65 + idx);

          return (
            <TouchableOpacity
              key={opt.id || idx}
              activeOpacity={0.8}
              onPress={() => handleSelectOption(opt.id || opt.text)}
              className={`min-h-[52px] p-3.5 rounded-2xl border flex-row items-center shadow-2xs ${
                isSelected
                  ? 'bg-primary-soft/40 border-primary'
                  : 'bg-surface border-border'
              }`}
            >
              {/* Radio Circle */}
              <View
                className={`w-7 h-7 rounded-full items-center justify-center mr-3 border ${
                  isSelected
                    ? 'border-primary bg-primary'
                    : 'border-border bg-surface'
                }`}
              >
                {isSelected ? (
                  <View className="w-2.5 h-2.5 rounded-full bg-white" />
                ) : (
                  <Text className="text-caption font-bold text-ink-muted">
                    {letter}
                  </Text>
                )}
              </View>

              {/* Option Text / Math */}
              <View className="flex-1">
                <MathView
                  content={opt.text}
                  fontSize={15}
                  color={isSelected ? '#1E3A8A' : '#1F2937'}
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  // 2. Multiple Choice (MCQ Multi)
  if (question.type === 'mcq_multi') {
    const options = question.options || [];
    const selectedList: string[] = Array.isArray(currentAnswer) ? currentAnswer : [];

    const handleToggleMulti = (optId: string) => {
      triggerHaptic();
      let updated: string[];
      if (selectedList.includes(optId)) {
        updated = selectedList.filter((id) => id !== optId);
      } else {
        updated = [...selectedList, optId];
      }
      onAnswerChange(updated.length > 0 ? updated : null);
    };

    return (
      <View className="space-y-3">
        <View className="flex-row items-center justify-between mb-1">
          <Text className="text-caption font-bold text-ink-muted uppercase tracking-wider">
            Select all that apply:
          </Text>
          {selectedList.length > 0 ? (
            <TouchableOpacity
              onPress={() => {
                triggerHaptic();
                onAnswerChange(null);
              }}
              className="py-1 px-2"
            >
              <Text className="text-caption text-primary font-semibold">
                Clear all ({selectedList.length})
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {options.map((opt, idx) => {
          const isSelected = selectedList.includes(opt.id || opt.text);
          const letter = String.fromCharCode(65 + idx);

          return (
            <TouchableOpacity
              key={opt.id || idx}
              activeOpacity={0.8}
              onPress={() => handleToggleMulti(opt.id || opt.text)}
              className={`min-h-[52px] p-3.5 rounded-2xl border flex-row items-center shadow-2xs ${
                isSelected
                  ? 'bg-primary-soft/40 border-primary'
                  : 'bg-surface border-border'
              }`}
            >
              {/* Checkbox Icon */}
              <View
                className={`w-7 h-7 rounded-lg items-center justify-center mr-3 border ${
                  isSelected
                    ? 'border-primary bg-primary'
                    : 'border-border bg-surface'
                }`}
              >
                {isSelected ? (
                  <Check size={16} color="#FFFFFF" strokeWidth={3} />
                ) : (
                  <Text className="text-caption font-bold text-ink-muted">
                    {letter}
                  </Text>
                )}
              </View>

              {/* Option Text / Math */}
              <View className="flex-1">
                <MathView
                  content={opt.text}
                  fontSize={15}
                  color={isSelected ? '#1E3A8A' : '#1F2937'}
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  // 3. Assertion-Reason Options
  if (question.type === 'assertion_reason') {
    const options = question.options?.length ? question.options : ASSERTION_REASON_DEFAULT_OPTIONS;

    const handleSelectAR = (optId: string) => {
      triggerHaptic();
      if (currentAnswer === optId) {
        onAnswerChange(null);
      } else {
        onAnswerChange(optId);
      }
    };

    return (
      <View className="space-y-3">
        <View className="flex-row items-center justify-between mb-1">
          <Text className="text-caption font-bold text-ink-muted uppercase tracking-wider">
            Choose relationship:
          </Text>
          {currentAnswer ? (
            <TouchableOpacity
              onPress={() => {
                triggerHaptic();
                onAnswerChange(null);
              }}
              className="py-1 px-2"
            >
              <Text className="text-caption text-primary font-semibold">
                Clear
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {options.map((opt, idx) => {
          const optKey = opt.id || String.fromCharCode(65 + idx);
          const isSelected = currentAnswer === optKey || currentAnswer === opt.text;

          return (
            <TouchableOpacity
              key={opt.id || idx}
              activeOpacity={0.8}
              onPress={() => handleSelectAR(optKey)}
              className={`min-h-[54px] p-3.5 rounded-2xl border flex-row items-center shadow-2xs ${
                isSelected
                  ? 'bg-primary-soft/40 border-primary'
                  : 'bg-surface border-border'
              }`}
            >
              <View
                className={`w-7 h-7 rounded-full items-center justify-center mr-3 border ${
                  isSelected
                    ? 'border-primary bg-primary'
                    : 'border-border bg-surface'
                }`}
              >
                <Text
                  className={`text-caption font-bold ${
                    isSelected ? 'text-white' : 'text-ink-muted'
                  }`}
                >
                  {optKey}
                </Text>
              </View>

              <View className="flex-1">
                <Text
                  className={`text-small leading-snug ${
                    isSelected ? 'font-semibold text-primary' : 'text-ink'
                  }`}
                >
                  {opt.text}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  // 4. Numerical Keypad Field
  if (question.type === 'numeric') {
    const rawValue = currentAnswer !== null && currentAnswer !== undefined ? String(currentAnswer) : '';

    const handleNumericChange = (text: string) => {
      // Allow only numbers, decimal dot, minus sign
      const sanitized = text.replace(/[^0-9.-]/g, '');
      onAnswerChange(sanitized.length > 0 ? sanitized : null);
    };

    return (
      <View className="bg-surface rounded-2xl p-5 border border-border shadow-2xs space-y-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Hash size={18} color="#2563EB" />
            <Text className="text-body font-bold text-ink ml-2">
              Enter Numeric Answer
            </Text>
          </View>
          {rawValue.length > 0 ? (
            <TouchableOpacity
              onPress={() => {
                triggerHaptic();
                onAnswerChange(null);
              }}
              className="py-1 px-2"
            >
              <Text className="text-caption text-primary font-semibold">
                Clear
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <Text className="text-caption text-ink-muted leading-relaxed">
          Type the exact numerical value (e.g. 42 or 3.14). Do not include units like cm or kg.
        </Text>

        <View className="flex-row items-center bg-surface-subtle border-2 border-primary/40 rounded-xl px-4 py-3">
          <TextInput
            value={rawValue}
            onChangeText={handleNumericChange}
            keyboardType="decimal-pad"
            placeholder="e.g. 14.5"
            placeholderTextColor="#9CA3AF"
            className="flex-1 text-h2 font-mono font-bold text-ink"
            style={{ minHeight: 48 }}
          />
        </View>
      </View>
    );
  }

  // 5. True / False
  if (question.type === 'true_false') {
    const isTrue = currentAnswer === true || currentAnswer === 'true';
    const isFalse = currentAnswer === false || currentAnswer === 'false';

    const handleSelectTF = (val: boolean) => {
      triggerHaptic();
      if ((val && isTrue) || (!val && isFalse)) {
        onAnswerChange(null);
      } else {
        onAnswerChange(val);
      }
    };

    return (
      <View className="space-y-3">
        <Text className="text-caption font-bold text-ink-muted uppercase tracking-wider mb-1">
          Select True or False:
        </Text>

        <View className="flex-row space-x-3">
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleSelectTF(true)}
            className={`flex-1 min-h-[50px] rounded-2xl border p-4 items-center justify-center mr-2 shadow-2xs ${
              isTrue
                ? 'bg-emerald-50 border-emerald-600'
                : 'bg-surface border-border'
            }`}
          >
            <Text
              className={`text-body font-bold ${
                isTrue ? 'text-emerald-700' : 'text-ink'
              }`}
            >
              TRUE
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleSelectTF(false)}
            className={`flex-1 min-h-[50px] rounded-2xl border p-4 items-center justify-center ml-2 shadow-2xs ${
              isFalse
                ? 'bg-red-50 border-red-600'
                : 'bg-surface border-border'
            }`}
          >
            <Text
              className={`text-body font-bold ${
                isFalse ? 'text-red-700' : 'text-ink'
              }`}
            >
              FALSE
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return null;
}
