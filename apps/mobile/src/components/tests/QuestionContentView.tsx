import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { ZoomIn, BookOpen, Layers } from 'lucide-react-native';
import { Badge } from '../ui/Badge';
import { MathView } from '../composite/MathView';
import { ImageViewerModal } from './ImageViewerModal';
import type { StudentTestQuestion } from '@quick2learn/shared';

interface QuestionContentViewProps {
  question: StudentTestQuestion;
  questionNumber: number;
  totalQuestions: number;
}

export function QuestionContentView({
  question,
  questionNumber,
  totalQuestions,
}: QuestionContentViewProps) {
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [showFullPassage, setShowFullPassage] = useState(true);

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case 'mcq_single':
        return 'Single Choice';
      case 'mcq_multi':
        return 'Multiple Choice';
      case 'assertion_reason':
        return 'Assertion-Reason';
      case 'numeric':
        return 'Numerical Value';
      case 'case_study':
        return 'Case Study';
      case 'true_false':
        return 'True / False';
      default:
        return 'Question';
    }
  };

  return (
    <View className="space-y-4">
      {/* Question Header: Position & Marks */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center space-x-2">
          <Badge
            label={`Q${questionNumber} of ${totalQuestions}`}
            variant="primary"
            size="sm"
          />
          <Badge
            label={getQuestionTypeLabel(question.type)}
            variant="neutral"
            size="sm"
          />
        </View>

        <View className="flex-row items-center space-x-1">
          <Text className="text-caption font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            +{question.marks}
          </Text>
          {question.negativeMarks > 0 ? (
            <Text className="text-caption font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200 ml-1.5">
              -{question.negativeMarks}
            </Text>
          ) : (
            <Text className="text-caption font-medium text-ink-muted bg-gray-100 px-1.5 py-0.5 rounded ml-1.5">
              0 neg
            </Text>
          )}
        </View>
      </View>

      {/* Case Study Shared Passage (if present) */}
      {question.caseGroup?.passage ? (
        <View className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 shadow-2xs">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setShowFullPassage(!showFullPassage)}
            className="flex-row items-center justify-between mb-2"
          >
            <View className="flex-row items-center space-x-1.5">
              <BookOpen size={16} color="#D97706" />
              <Text className="text-small font-bold text-amber-900 ml-1.5">
                Passage / Context
              </Text>
            </View>
            <Text className="text-caption font-semibold text-amber-700">
              {showFullPassage ? 'Collapse' : 'Expand'}
            </Text>
          </TouchableOpacity>

          {showFullPassage ? (
            <View className="mt-1">
              <MathView
                content={question.caseGroup.passage}
                fontSize={14}
                color="#78350F"
              />

              {question.caseGroup.imageKey ? (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setZoomImage(question.caseGroup?.imageKey ?? null)}
                  className="mt-3 relative rounded-xl overflow-hidden border border-amber-200 bg-surface"
                >
                  <Image
                    source={{ uri: question.caseGroup.imageKey }}
                    style={{ width: '100%', height: 160 }}
                    contentFit="contain"
                  />
                  <View className="absolute bottom-2 right-2 bg-black/60 px-2 py-1 rounded-md flex-row items-center">
                    <ZoomIn size={12} color="#FFFFFF" />
                    <Text className="text-[10px] text-white font-medium ml-1">
                      Tap to zoom
                    </Text>
                  </View>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Question Stem (rendered via MathView) */}
      <View className="bg-surface rounded-2xl p-4 border border-border shadow-2xs">
        <MathView
          content={question.stem}
          fontSize={16}
          color="#111827"
          minHeight={36}
        />

        {/* Question Diagram Image (if any) */}
        {question.imageKey ? (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setZoomImage(question.imageKey ?? null)}
            className="mt-4 relative rounded-xl overflow-hidden border border-border/80 bg-surface-subtle"
          >
            <Image
              source={{ uri: question.imageKey }}
              style={{ width: '100%', height: 200 }}
              contentFit="contain"
            />
            <View className="absolute bottom-2 right-2 bg-black/70 px-2.5 py-1 rounded-md flex-row items-center">
              <ZoomIn size={13} color="#FFFFFF" />
              <Text className="text-caption text-white font-medium ml-1.5">
                Tap to zoom
              </Text>
            </View>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Zoom Modal */}
      <ImageViewerModal
        visible={Boolean(zoomImage)}
        imageUrl={zoomImage}
        onClose={() => setZoomImage(null)}
      />
    </View>
  );
}
