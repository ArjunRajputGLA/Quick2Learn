import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { BottomSheet } from '../ui/BottomSheet';
import type { StudentTestQuestion } from '@quick2learn/shared';
import type { LocalAnswerRecord } from '../../lib/offline-tests';

interface QuestionPaletteBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  questions: StudentTestQuestion[];
  currentIndex: number;
  answers: Record<string, LocalAnswerRecord>;
  visitedQuestions: Set<string>;
  onSelectQuestion: (index: number) => void;
}

export function QuestionPaletteBottomSheet({
  visible,
  onClose,
  questions,
  currentIndex,
  answers,
  visitedQuestions,
  onSelectQuestion,
}: QuestionPaletteBottomSheetProps) {
  // Compute counts
  let answeredCount = 0;
  let markedCount = 0;
  let notAnsweredCount = 0;
  let notVisitedCount = 0;

  for (const q of questions) {
    const ansRecord = answers[q.id];
    const isAns =
      ansRecord?.answer !== null &&
      ansRecord?.answer !== undefined &&
      (Array.isArray(ansRecord.answer) ? ansRecord.answer.length > 0 : String(ansRecord.answer).trim().length > 0);
    const isMarked = Boolean(ansRecord?.markedForReview);
    const isVisited = visitedQuestions.has(q.id);

    if (isMarked) {
      markedCount++;
    } else if (isAns) {
      answeredCount++;
    } else if (isVisited) {
      notAnsweredCount++;
    } else {
      notVisitedCount++;
    }
  }

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Question Palette"
    >
      <View className="py-2 space-y-4">
        {/* Legend Summary Bar */}
        <View className="flex-row flex-wrap items-center justify-between bg-surface-subtle p-3 rounded-2xl border border-border/70 mb-3">
          <View className="flex-row items-center space-x-1.5 mr-2 mb-1">
            <View className="w-3.5 h-3.5 rounded-full bg-emerald-600 mr-1" />
            <Text className="text-[12px] font-semibold text-ink">
              Answered ({answeredCount})
            </Text>
          </View>

          <View className="flex-row items-center space-x-1.5 mr-2 mb-1">
            <View className="w-3.5 h-3.5 rounded-full bg-amber-500 mr-1" />
            <Text className="text-[12px] font-semibold text-ink">
              Review ({markedCount})
            </Text>
          </View>

          <View className="flex-row items-center space-x-1.5 mr-2 mb-1">
            <View className="w-3.5 h-3.5 rounded-full bg-slate-500 mr-1" />
            <Text className="text-[12px] font-semibold text-ink">
              Unanswered ({notAnsweredCount})
            </Text>
          </View>

          <View className="flex-row items-center space-x-1.5 mb-1">
            <View className="w-3.5 h-3.5 rounded-full bg-gray-200 border border-gray-300 mr-1" />
            <Text className="text-[12px] font-semibold text-ink">
              Not Visited ({notVisitedCount})
            </Text>
          </View>
        </View>

        {/* Questions Number Grid */}
        <ScrollView
          style={{ maxHeight: 320 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 16 }}
        >
          <View className="flex-row flex-wrap">
            {questions.map((q, idx) => {
              const ansRecord = answers[q.id];
              const isAns =
                ansRecord?.answer !== null &&
                ansRecord?.answer !== undefined &&
                (Array.isArray(ansRecord.answer)
                  ? ansRecord.answer.length > 0
                  : String(ansRecord.answer).trim().length > 0);
              const isMarked = Boolean(ansRecord?.markedForReview);
              const isVisited = visitedQuestions.has(q.id);
              const isCurrent = idx === currentIndex;

              // Color determination
              let bgClass = 'bg-gray-100 border-gray-300';
              let textClass = 'text-gray-700';

              if (isMarked) {
                bgClass = 'bg-amber-500 border-amber-600';
                textClass = 'text-white';
              } else if (isAns) {
                bgClass = 'bg-emerald-600 border-emerald-700';
                textClass = 'text-white';
              } else if (isVisited) {
                bgClass = 'bg-slate-500 border-slate-600';
                textClass = 'text-white';
              }

              return (
                <TouchableOpacity
                  key={q.id}
                  activeOpacity={0.7}
                  onPress={() => {
                    onSelectQuestion(idx);
                    onClose();
                  }}
                  className={`w-12 h-12 m-1.5 rounded-xl items-center justify-center border-2 ${bgClass} ${
                    isCurrent ? 'ring-2 ring-primary ring-offset-2' : ''
                  }`}
                  style={isCurrent ? { borderWidth: 2.5, borderColor: '#2563EB' } : undefined}
                >
                  <Text className={`text-body font-bold ${textClass}`}>
                    {idx + 1}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </BottomSheet>
  );
}
