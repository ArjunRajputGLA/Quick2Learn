import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { Award, Quote, Sparkles, Star, Trophy } from "lucide-react-native";
import { Screen } from "../../src/components/ui/Screen";
import { AppHeader } from "../../src/components/ui/AppHeader";
import { Badge } from "../../src/components/ui/Badge";
import { useResultsAndTestimonials } from "../../src/api/hooks";
import { useI18n } from "../../src/lib/i18n";
import type { ResultsAndTestimonialsResponse } from "@quick2learn/shared";

type ResultItem = ResultsAndTestimonialsResponse['results'][number];
type TestimonialItem = ResultsAndTestimonialsResponse['testimonials'][number];

export default function ResultsScreen() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<"results" | "testimonials">(
    "results"
  );
  const {
    data,
    isLoading,
    isRefetching,
    refetch,
  } = useResultsAndTestimonials();

  const results = data?.results || [];
  const testimonials = data?.testimonials || [];

  return (
    <Screen
      scrollable={false}
      header={<AppHeader title={t("resultsRow")} showBack />}
    >
      {/* Segment Selector */}
      <View className="flex-row p-3 bg-surface border-b border-border">
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveTab("results")}
          accessibilityRole="tab"
          accessibilityLabel="Board Toppers tab"
          className={`flex-1 py-2.5 rounded-xl items-center flex-row justify-center space-x-1.5 ${
            activeTab === "results" ? "bg-primary" : "bg-surface-subtle"
          }`}
        >
          <Trophy
            size={16}
            color={activeTab === "results" ? "#FFFFFF" : "#6B7280"}
          />
          <Text
            className={`text-small font-bold ml-1.5 ${
              activeTab === "results" ? "text-white" : "text-ink-muted"
            }`}
          >
            Board Toppers
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveTab("testimonials")}
          accessibilityRole="tab"
          accessibilityLabel="Student Reviews tab"
          className={`flex-1 py-2.5 rounded-xl items-center flex-row justify-center space-x-1.5 ml-2 ${
            activeTab === "testimonials" ? "bg-primary" : "bg-surface-subtle"
          }`}
        >
          <Quote
            size={16}
            color={activeTab === "testimonials" ? "#FFFFFF" : "#6B7280"}
          />
          <Text
            className={`text-small font-bold ml-1.5 ${
              activeTab === "testimonials" ? "text-white" : "text-ink-muted"
            }`}
          >
            Student Reviews
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : activeTab === "results" ? (
        <View className="flex-1 px-4 pt-3">
          <FlashList
            data={results}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <MemoizedResultRow item={item} />}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={() => {
                  refetch();
                }}
                tintColor="#2563EB"
              />
            }
            contentContainerStyle={{ paddingBottom: 60 }}
          />
        </View>
      ) : (
        <View className="flex-1 px-4 pt-3">
          <FlashList
            data={testimonials}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <MemoizedTestimonialRow item={item} />}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={() => {
                  refetch();
                }}
                tintColor="#2563EB"
              />
            }
            contentContainerStyle={{ paddingBottom: 60 }}
          />
        </View>
      )}
    </Screen>
  );
}

function ResultRow({ item }: { item: ResultItem }) {
  return (
    <View
      className="bg-surface rounded-2xl p-4 border border-border shadow-xs flex-row items-center justify-between mb-3"
      accessibilityLabel={`${item.studentName}, ${item.exam}, Batch of ${item.year}, Score: ${item.scoreText}`}
    >
      <View className="flex-1 mr-3">
        <View className="flex-row items-center space-x-2 mb-1">
          <Text className="text-body font-bold text-ink">
            {item.studentName}
          </Text>
          {item.isFeatured ? (
            <Badge label="TOPPER" variant="primary" size="sm" />
          ) : null}
        </View>
        <Text className="text-caption text-ink-muted">
          {item.exam} • Batch of {item.year}
        </Text>
      </View>

      <View className="bg-primary-soft/80 px-3.5 py-2 rounded-xl items-center justify-center">
        <Text className="text-body font-black text-primary">
          {item.scoreText}
        </Text>
      </View>
    </View>
  );
}

const MemoizedResultRow = React.memo(ResultRow);

function TestimonialRow({ item }: { item: TestimonialItem }) {
  return (
    <View
      className="bg-surface rounded-2xl p-4 border border-border shadow-xs space-y-2.5 mb-3"
      accessibilityLabel={`Review from ${item.studentName}, Class ${item.classLevel}, ${item.year}: ${item.quote}`}
    >
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-body font-bold text-ink">
            {item.studentName}
          </Text>
          <Text className="text-caption text-ink-muted">
            Class {item.classLevel} • {item.year}
          </Text>
        </View>
        <Quote size={20} color="#93C5FD" />
      </View>

      <Text className="text-body-sm text-ink-muted italic leading-relaxed">
        &ldquo;{item.quote}&rdquo;
      </Text>
    </View>
  );
}

const MemoizedTestimonialRow = React.memo(TestimonialRow);
