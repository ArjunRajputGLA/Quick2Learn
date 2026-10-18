import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react-native';

export interface ToastProps {
  type?: 'success' | 'error' | 'info';
  title?: string;
  message: string;
  onDismiss?: () => void;
  className?: string;
}

export function Toast({
  type = 'info',
  title,
  message,
  onDismiss,
  className = '',
}: ToastProps) {
  let bgClass = 'bg-primary-soft border-primary/30';
  let titleColor = 'text-primary';
  let IconComponent = Info;
  let iconColor = '#3B82F6';

  if (type === 'success') {
    bgClass = 'bg-green-50 border-green-200';
    titleColor = 'text-success';
    IconComponent = CheckCircle2;
    iconColor = '#15803D';
  } else if (type === 'error') {
    bgClass = 'bg-red-50 border-red-200';
    titleColor = 'text-danger';
    IconComponent = AlertCircle;
    iconColor = '#B91C1C';
  }

  return (
    <View
      className={`p-3.5 rounded-xl border flex-row items-start ${bgClass} shadow-sm ${className}`}
    >
      <View className="mr-3 mt-0.5">
        <IconComponent size={20} color={iconColor} />
      </View>

      <View className="flex-1 mr-2">
        {title ? (
          <Text className={`text-small font-semibold mb-0.5 ${titleColor}`}>
            {title}
          </Text>
        ) : null}
        <Text className="text-small text-ink font-normal">{message}</Text>
      </View>

      {onDismiss ? (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Dismiss message"
          onPress={onDismiss}
          className="w-8 h-8 items-center justify-center -mr-1 -mt-1 rounded-full active:bg-black/5"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <X size={16} color="#6B7280" />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
