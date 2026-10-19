import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
} from "react-native";
import { PlaySquare, Play, X, Calendar, Video } from "lucide-react-native";
import YoutubePlayer from "react-native-youtube-iframe";
import type { LiveSessionItem } from "@quick2learn/shared";

interface BatchRecordingsSectionProps {
  recordings: LiveSessionItem[];
}

export function BatchRecordingsSection({ recordings }: BatchRecordingsSectionProps) {
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [selectedTitle, setSelectedTitle] = useState<string>("");

  if (!recordings || recordings.length === 0) {
    return null;
  }

  return (
    <View className="mb-6">
      <View className="flex-row items-center justify-between mb-3 px-1">
        <View className="flex-row items-center">
          <PlaySquare size={18} color="#dc2626" className="mr-2" />
          <Text className="text-slate-900 dark:text-white font-extrabold text-base">
            Class Recordings
          </Text>
        </View>
        <Text className="text-slate-500 text-xs font-semibold">
          {recordings.length} available
        </Text>
      </View>

      <FlatList
        horizontal
        data={recordings}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 4, gap: 12 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => {
              if (item.recordingYoutubeId) {
                setSelectedVideoId(item.recordingYoutubeId);
                setSelectedTitle(item.title);
              }
            }}
            activeOpacity={0.8}
            className="w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs"
          >
            {/* Header info */}
            <View className="flex-row items-center justify-between mb-2">
              <View className="bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-900">
                <Text className="text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase">
                  RECORDING
                </Text>
              </View>
              {item.subjectName && (
                <Text className="text-primary-600 dark:text-primary-400 text-[11px] font-bold">
                  {item.subjectName}
                </Text>
              )}
            </View>

            <Text
              className="text-slate-900 dark:text-white font-extrabold text-sm mb-1.5"
              numberOfLines={2}
            >
              {item.title}
            </Text>

            <View className="flex-row items-center text-slate-500 text-xs mb-3">
              <Calendar size={12} color="#64748b" className="mr-1" />
              <Text className="text-slate-500 text-xs">
                {item.startsAtFormatted.split("•")[0]?.trim() || item.startsAtFormatted}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => {
                if (item.recordingYoutubeId) {
                  setSelectedVideoId(item.recordingYoutubeId);
                  setSelectedTitle(item.title);
                }
              }}
              activeOpacity={0.8}
              className="bg-primary-600 dark:bg-primary-500 py-2 px-3 rounded-xl flex-row items-center justify-center gap-1.5 mt-auto"
            >
              <Play size={14} color="#ffffff" fill="#ffffff" />
              <Text className="text-white text-xs font-bold">
                Watch Recording
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />

      {/* YouTube Player Modal */}
      {selectedVideoId && (
        <Modal
          visible={Boolean(selectedVideoId)}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedVideoId(null)}
        >
          <View className="flex-1 bg-black/90 justify-center items-center p-4">
            <View className="w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl">
              <View className="flex-row items-center justify-between p-4 border-b border-slate-800">
                <Text className="text-white font-bold text-sm flex-1 mr-2" numberOfLines={1}>
                  {selectedTitle}
                </Text>
                <TouchableOpacity
                  onPress={() => setSelectedVideoId(null)}
                  className="p-1 rounded-full bg-slate-800"
                >
                  <X size={18} color="#ffffff" />
                </TouchableOpacity>
              </View>

              <View className="w-full aspect-video bg-black">
                <YoutubePlayer
                  height={220}
                  play={true}
                  videoId={selectedVideoId}
                />
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}
