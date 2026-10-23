import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Linking,
  Alert,
} from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import {
  MessageSquare,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  BookOpen,
  Award,
  Download,
  Users,
  Video,
  ExternalLink,
} from "lucide-react-native";
import { Screen } from "../../src/components/ui/Screen";
import { AppHeader } from "../../src/components/ui/AppHeader";
import { Button } from "../../src/components/ui/Button";
import { Card } from "../../src/components/ui/Card";
import { useI18n } from "../../src/lib/i18n";

export default function HelpScreen() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Promise.all([
        queryClient.refetchQueries({ type: 'active' }),
        new Promise((resolve) => setTimeout(resolve, 350)),
      ]);
    } catch (err) {
      console.warn('[Help] Refresh error:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const [activeSlide, setActiveSlide] = useState(0);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const walkthroughSlides = [
    {
      title: "1. Interactive Live Classes",
      subtitle:
        "Join scheduled live lectures directly from your home screen. View attendance and live session replays anytime.",
      icon: <Video size={18} color="#2563EB" />,
      accent: "bg-blue-50",
    },
    {
      title: "2. Practice Tests & Analytics",
      subtitle:
        "Take chapter-wise timed tests with instant scoring, percentiles, ranking, and step-by-step mathematical solutions.",
      icon: <Award size={18} color="#059669" />,
      accent: "bg-emerald-50",
    },
    {
      title: "3. 1-on-1 Doubts with Faculty",
      subtitle:
        "Stuck on a problem? Snap a photo of your notebook or test question to get personal answers from Dinesh Sir & Namita Ma'am.",
      icon: <MessageSquare size={18} color="#8B5CF6" />,
      accent: "bg-purple-50",
    },
    {
      title: "4. Offline Notes & Study Library",
      subtitle:
        "Download NCERT solutions, chapter formula sheets, and study materials for revision even when you have no internet.",
      icon: <Download size={18} color="#D97706" />,
      accent: "bg-amber-50",
    },
  ];

  const faqs = [
    {
      q: "How do I join a live lecture?",
      a: "When a class is active, an orange banner appears on your Home screen. Tap 'Join Live' to enter the live classroom stream.",
    },
    {
      q: "How do I ask a doubt with a photo?",
      a: "Go to the Doubts tab and tap 'Ask a doubt'. Select your subject and chapter, take a picture of your notebook, and send it to our teachers.",
    },
    {
      q: "How can my parents view my progress?",
      a: "Under Profile > Parent Access, tap 'Share' to send your 6-character link code to your parents. When they enter this code, they can track your attendance and test scores.",
    },
    {
      q: "How do I access official fee receipts?",
      a: "Navigate to Profile > Fees & Receipts > Payment History. Every completed instalment has a 'Download Receipt' button for a computer-generated PDF.",
    },
    {
      q: "Can I download notes for offline study?",
      a: "Yes! Open any PDF note and tap 'Download for Offline Study'. You can access all downloaded files under Profile > Offline Downloads without an internet connection.",
    },
  ];

  const handleOpenWhatsApp = async () => {
    const phone = "919412278888";
    const text = encodeURIComponent(
      "Hello Quick2Learn team, I need assistance with the student app."
    );
    const url = `https://wa.me/${phone}?text=${text}`;

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL(`https://api.whatsapp.com/send?phone=${phone}&text=${text}`);
      }
    } catch {
      Alert.alert(
        "WhatsApp Notice",
        "Could not launch WhatsApp. You can reach us directly at +91 94122 78888."
      );
    }
  };

  return (
    <Screen
      scrollable={false}
      header={<AppHeader title={t("helpTitle")} showBack />}
    >
      <ScrollView
        contentContainerStyle={{ padding: 14, paddingBottom: 50 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#2563EB']}
            tintColor="#2563EB"
          />
        }
      >
        {/* Top Support Banner (WhatsApp) */}
        <View className="bg-emerald-600 rounded-xl p-3.5 mb-3 shadow-xs text-white">
          <View className="flex-row items-center space-x-2 mb-1.5">
            <MessageSquare size={18} color="#FFFFFF" />
            <Text className="text-sm font-bold text-white ml-1.5">
              Institute WhatsApp Support
            </Text>
          </View>
          <Text className="text-xs text-emerald-100 leading-snug mb-2.5">
            Have questions about your batch, admissions, or app features? Chat directly with Dinesh Sir and the academic team.
          </Text>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleOpenWhatsApp}
            className="bg-white py-2 px-3 rounded-lg flex-row items-center justify-center min-h-[38px] active:bg-emerald-50"
          >
            <Text className="text-xs font-bold text-emerald-800 mr-1.5">
              Chat on WhatsApp (+91 94122 78888)
            </Text>
            <ExternalLink size={14} color="#065F46" />
          </TouchableOpacity>
        </View>

        {/* 4-Screen "How to Use the App" Walkthrough Carousel */}
        <View className="bg-surface rounded-xl p-3.5 border border-border mb-3 shadow-xs space-y-2.5">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-bold text-ink">
              {t("walkthroughHeader")}
            </Text>
            <View className="bg-primary/10 px-2 py-0.5 rounded-full">
              <Text className="text-[11px] font-bold text-primary">
                Step {activeSlide + 1} of 4
              </Text>
            </View>
          </View>

          {/* Active Card */}
          <View className="p-3 rounded-lg bg-surface-subtle border border-border/70">
            <View
              className={`w-9 h-9 rounded-lg items-center justify-center mb-2 ${walkthroughSlides[activeSlide]?.accent}`}
            >
              {walkthroughSlides[activeSlide]?.icon}
            </View>
            <Text className="text-xs font-bold text-ink mb-0.5">
              {walkthroughSlides[activeSlide]?.title}
            </Text>
            <Text className="text-[11.5px] text-ink-muted leading-relaxed">
              {walkthroughSlides[activeSlide]?.subtitle}
            </Text>
          </View>

          {/* Carousel Navigation Buttons & Dots */}
          <View className="flex-row items-center justify-between pt-1">
            <View className="flex-row items-center">
              {[0, 1, 2, 3].map((idx) => (
                <View
                  key={idx}
                  className={`h-1.5 rounded-full mr-1 ${
                    activeSlide === idx ? "w-4 bg-primary" : "w-1.5 bg-border"
                  }`}
                />
              ))}
            </View>

            <View className="flex-row items-center">
              <TouchableOpacity
                disabled={activeSlide === 0}
                onPress={() => setActiveSlide((prev) => Math.max(0, prev - 1))}
                className={`py-1 px-2.5 rounded-md border ${
                  activeSlide === 0
                    ? "border-border/40 opacity-40"
                    : "border-border bg-surface"
                }`}
              >
                <Text className="text-xs font-semibold text-ink">Prev</Text>
              </TouchableOpacity>

              <TouchableOpacity
                disabled={activeSlide === 3}
                onPress={() => setActiveSlide((prev) => Math.min(3, prev + 1))}
                className={`py-1 px-2.5 rounded-md border ml-2 ${
                  activeSlide === 3
                    ? "border-border/40 opacity-40"
                    : "border-primary bg-primary"
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    activeSlide === 3 ? "text-ink-muted" : "text-white"
                  }`}
                >
                  Next
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* FAQ Accordion Section */}
        <View className="bg-surface rounded-xl p-3.5 border border-border shadow-xs space-y-2">
          <View className="flex-row items-center space-x-1.5 mb-0.5">
            <HelpCircle size={16} color="#2563EB" />
            <Text className="text-sm font-bold text-ink ml-1.5">
              {t("faqHeader")}
            </Text>
          </View>

          <View className="divide-y divide-border/50">
            {faqs.map((faq, index) => {
              const isOpen = expandedFaq === index;
              return (
                <View key={index} className="py-2.5">
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setExpandedFaq(isOpen ? null : index)}
                    className="flex-row items-center justify-between"
                  >
                    <Text className="text-xs font-semibold text-ink flex-1 mr-2 leading-snug">
                      {faq.q}
                    </Text>
                    {isOpen ? (
                      <ChevronUp size={16} color="#2563EB" />
                    ) : (
                      <ChevronDown size={16} color="#9CA3AF" />
                    )}
                  </TouchableOpacity>

                  {isOpen && (
                    <Text className="text-xs text-ink-muted mt-2 leading-relaxed bg-surface-subtle p-2.5 rounded-lg border border-border/50">
                      {faq.a}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
