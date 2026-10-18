import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { FileText, Download, Check, Eye } from 'lucide-react-native';

export type PdfDownloadState = 'idle' | 'downloading' | 'downloaded';

export interface PdfRowProps {
  title: string;
  size: string; // e.g. "2.4 MB"
  downloadState?: PdfDownloadState;
  onPress?: () => void;
  onDownloadPress?: () => void;
  className?: string;
}

export function PdfRow({
  title,
  size,
  downloadState = 'idle',
  onPress,
  onDownloadPress,
  className = '',
}: PdfRowProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      className={`min-h-[56px] py-3 px-4 flex-row items-center justify-between border-b border-border/70 bg-surface active:bg-surface-subtle ${className}`}
    >
      <View className="flex-row items-center flex-1 mr-3">
        <View className="w-10 h-10 rounded-lg bg-red-50 border border-red-100 items-center justify-center mr-3">
          <FileText size={20} color="#B91C1C" />
        </View>

        <View className="flex-1 justify-center">
          <Text
            className="text-body font-medium text-ink leading-snug"
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {title}
          </Text>
          <Text className="text-caption text-ink-muted mt-0.5">{size}</Text>
        </View>
      </View>

      {/* Download / Open Action */}
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={
          downloadState === 'downloaded' ? 'Open PDF' : 'Download PDF'
        }
        onPress={onDownloadPress || onPress}
        className="w-11 h-11 items-center justify-center rounded-full bg-surface-subtle active:bg-primary-soft/50"
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      >
        {downloadState === 'downloading' ? (
          <ActivityIndicator size="small" color="#3B82F6" />
        ) : downloadState === 'downloaded' ? (
          <Check size={18} color="#15803D" />
        ) : (
          <Download size={18} color="#3B82F6" />
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  );
}
