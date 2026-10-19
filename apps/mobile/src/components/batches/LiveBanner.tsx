import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { Video, Radio, Clock, Play, X, ExternalLink } from "lucide-react-native";
import YoutubePlayer from "react-native-youtube-iframe";
import { useJoinLiveSession } from "../../api/hooks";
import type { LiveSessionItem } from "@quick2learn/shared";

interface LiveBannerProps {
  session: LiveSessionItem | null;
  onJoinSuccess?: (joinUrl: string) => void;
}

export function LiveBanner({ session, onJoinSuccess }: LiveBannerProps) {
  const joinMutation = useJoinLiveSession();
  const [countdownText, setCountdownText] = useState<string>("");
  const [showYoutubeModal, setShowYoutubeModal] = useState(false);
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(null);

  // Countdown timer effect
  useEffect(() => {
    if (!session || session.isLive) {
      setCountdownText("");
      return;
    }

    const updateCountdown = () => {
      const now = new Date().getTime();
      const start = new Date(session.startsAt).getTime();
      const diffMs = start - now;

      if (diffMs <= 0) {
        setCountdownText("Starting now");
        return;
      }

      const totalMinutes = Math.floor(diffMs / (1000 * 60));
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      if (hours > 24) {
        setCountdownText(session.startsAtFormatted);
      } else if (hours > 0) {
        setCountdownText(`Starts in ${hours}h ${minutes}m`);
      } else if (minutes > 0) {
        setCountdownText(`Starts in ${minutes}m ${seconds}s`);
      } else {
        setCountdownText(`Starts in ${seconds}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [session]);

  if (!session) return null;

  const handleJoin = async () => {
    try {
      const result = await joinMutation.mutateAsync(session.id);

      const statusMsg =
        result.attendanceStatus === "late"
          ? "You joined late (>10 mins). Marked as Late."
          : "You have joined! Marked as Present.";

      Alert.alert(
        "Attendance Recorded",
        statusMsg,
        [
          {
            text: "Proceed to Class",
            onPress: async () => {
              // 1. YouTube Live provider
              if (session.provider === "youtube_live") {
                const videoId =
                  session.recordingYoutubeId ||
                  extractYoutubeId(result.joinUrl) ||
                  null;

                if (videoId) {
                  setYoutubeVideoId(videoId);
                  setShowYoutubeModal(true);
                  return;
                }
              }

              // 2. Zoom / Meet / other URLs: Open in installed app via Linking
              if (result.joinUrl) {
                const supported = await Linking.canOpenURL(result.joinUrl);
                if (supported) {
                  await Linking.openURL(result.joinUrl);
                } else {
                  await Linking.openURL(result.joinUrl);
                }
                onJoinSuccess?.(result.joinUrl);
              } else {
                Alert.alert("Link Unavailable", "Teacher has not provided a live stream link yet.");
              }
            },
          },
        ]
      );
    } catch (err: unknown) {
      Alert.alert(
        "Unable to Join",
        err instanceof Error ? err.message : "Failed to join live class. Please try again."
      );
    }
  };

  const isLive = session.isLive;

  return (
    <>
      <View
        className={`rounded-2xl p-4 mb-4 border ${
          isLive
            ? "bg-emerald-950/90 border-emerald-500/50 shadow-lg"
            : "bg-slate-900 border-slate-700/60"
        }`}
      >
        <View className="flex-row items-center justify-between mb-2">
          {/* Status Badge */}
          <View className="flex-row items-center space-x-2 gap-2">
            {isLive ? (
              <View className="flex-row items-center bg-rose-600 px-2.5 py-1 rounded-full">
                <Radio size={12} color="#ffffff" className="mr-1 animate-pulse" />
                <Text className="text-white text-[11px] font-black tracking-wider uppercase">
                  LIVE NOW
                </Text>
              </View>
            ) : (
              <View className="flex-row items-center bg-amber-500/20 border border-amber-500/40 px-2.5 py-1 rounded-full">
                <Clock size={12} color="#f59e0b" className="mr-1" />
                <Text className="text-amber-400 text-[11px] font-bold">
                  {countdownText || "Upcoming"}
                </Text>
              </View>
            )}

            <View className="bg-white/10 px-2 py-0.5 rounded-md">
              <Text className="text-slate-300 text-[11px] font-bold uppercase">
                {session.provider.replace("_", " ")}
              </Text>
            </View>
          </View>

          {session.subjectName && (
            <Text className="text-primary-300 text-xs font-bold">
              {session.subjectName}
            </Text>
          )}
        </View>

        {/* Title & Teacher */}
        <Text className="text-white text-base font-extrabold mb-1" numberOfLines={2}>
          {session.title}
        </Text>

        <View className="flex-row items-center justify-between mt-1">
          <View>
            <Text className="text-slate-400 text-xs">
              {session.timeFormatted}
            </Text>
            {session.teacherName && (
              <Text className="text-slate-300 text-xs font-medium mt-0.5">
                Instructor: {session.teacherName}
              </Text>
            )}
          </View>

          {/* Action Button */}
          {isLive ? (
            <TouchableOpacity
              onPress={handleJoin}
              disabled={joinMutation.isPending}
              activeOpacity={0.8}
              className="bg-emerald-500 hover:bg-emerald-600 px-5 py-2.5 rounded-xl flex-row items-center shadow-md shadow-emerald-900/40"
            >
              {joinMutation.isPending ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Video size={16} color="#ffffff" className="mr-1.5" />
                  <Text className="text-white text-xs font-black uppercase tracking-wider">
                    Join Now
                  </Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleJoin}
              disabled={joinMutation.isPending}
              activeOpacity={0.8}
              className="bg-white/10 border border-white/20 px-4 py-2 rounded-xl flex-row items-center"
            >
              {joinMutation.isPending ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <ExternalLink size={14} color="#e2e8f0" className="mr-1.5" />
                  <Text className="text-slate-200 text-xs font-bold">
                    Class Details
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* YouTube Live In-App Player Modal */}
      {showYoutubeModal && youtubeVideoId && (
        <Modal
          visible={showYoutubeModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowYoutubeModal(false)}
        >
          <View className="flex-1 bg-black/90 justify-center items-center p-4">
            <View className="w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl">
              <View className="flex-row items-center justify-between p-4 border-b border-slate-800">
                <Text className="text-white font-bold text-sm flex-1 mr-2" numberOfLines={1}>
                  {session.title}
                </Text>
                <TouchableOpacity
                  onPress={() => setShowYoutubeModal(false)}
                  className="p-1 rounded-full bg-slate-800"
                >
                  <X size={18} color="#ffffff" />
                </TouchableOpacity>
              </View>

              <View className="w-full aspect-video bg-black">
                <YoutubePlayer
                  height={220}
                  play={true}
                  videoId={youtubeVideoId}
                />
              </View>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

function extractYoutubeId(url?: string | null): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|live\/|shorts\/))([\w-]{11})/);
  return match ? match[1] : null;
}
