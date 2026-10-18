import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Clock, HelpCircle, Award } from 'lucide-react-native';

export interface TestCardProps {
  title: string;
  questionsCount: number;
  durationMinutes: number;
  status: 'not_started' | 'in_progress' | 'completed';
  score?: string; // e.g. "92/100"
  onActionPress: () => void;
  className?: string;
}

export function TestCard({
  title,
  questionsCount,
  durationMinutes,
  status,
  score,
  onActionPress,
  className = '',
}: TestCardProps) {
  let badgeVariant: 'neutral' | 'warning' | 'success' = 'neutral';
  let badgeLabel = 'Not attempted';
  let actionLabel = 'Start Test';

  if (status === 'in_progress') {
    badgeVariant = 'warning';
    badgeLabel = 'In progress';
    actionLabel = 'Resume';
  } else if (status === 'completed') {
    badgeVariant = 'success';
    badgeLabel = score ? `Scored ${score}` : 'Completed';
    actionLabel = 'View Analysis';
  }

  return (
    <View
      className={`bg-surface border border-border rounded-2xl p-4 shadow-sm ${className}`}
    >
      <View className="flex-row items-center justify-between mb-2">
        <Badge
          label={badgeLabel}
          variant={badgeVariant}
          size="sm"
          icon={status === 'completed' ? <Award size={12} color="#15803D" /> : undefined}
        />
      </View>

      <Text className="text-h3 font-bold text-ink mb-3 leading-snug" numberOfLines={2}>
        {title}
      </Text>

      {/* Meta tags: Questions and Duration */}
      <View className="flex-row items-center space-x-4 mb-4">
        <View className="flex-row items-center mr-4">
          <HelpCircle size={15} color="#6B7280" />
          <Text className="text-small text-ink-muted ml-1.5 font-medium">
            {questionsCount} Questions
          </Text>
        </View>

        <View className="flex-row items-center">
          <Clock size={15} color="#6B7280" />
          <Text className="text-small text-ink-muted ml-1.5 font-medium">
            {durationMinutes} mins
          </Text>
        </View>
      </View>

      <Button
        variant={status === 'completed' ? 'outline' : 'primary'}
        size="md"
        onPress={onActionPress}
      >
        {actionLabel}
      </Button>
    </View>
  );
}
