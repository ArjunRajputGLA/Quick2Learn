import React, { useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { User, Check, Users } from "lucide-react-native";
import { useMe, useParentStudents } from "../../api/hooks";
import { useParentStore } from "../../lib/parentStore";

export function ChildSwitcher() {
  const { data: me } = useMe();
  const { data: parentStudentsData } = useParentStudents();
  const { selectedChildId, setSelectedChildId } = useParentStore();

  const linkedStudents =
    parentStudentsData?.students || me?.linkedStudents || [];

  // Automatically default to the first child if not selected or invalid
  useEffect(() => {
    if (linkedStudents.length > 0) {
      const exists = linkedStudents.some(
        (s) => s.userId === selectedChildId || s.id === selectedChildId
      );
      if (!selectedChildId || !exists) {
        setSelectedChildId(linkedStudents[0]!.userId || linkedStudents[0]!.id);
      }
    }
  }, [linkedStudents, selectedChildId, setSelectedChildId]);

  if (linkedStudents.length === 0) {
    return null;
  }

  // Single child display
  if (linkedStudents.length === 1) {
    const child = linkedStudents[0]!;
    return (
      <View className="bg-surface-subtle px-4 py-2.5 border-b border-border flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <View className="w-7 h-7 rounded-full bg-primary/10 items-center justify-center">
            <User size={14} color="#2563EB" />
          </View>
          <View>
            <Text className="text-body-xs text-ink-muted">Tracking Child Records</Text>
            <Text className="text-body-sm font-bold text-ink">
              {child.fullName}{" "}
              <Text className="text-body-xs font-normal text-ink-muted">
                ({child.classLevel ? `Class ${child.classLevel}` : ""}{child.board ? ` • ${child.board.toUpperCase()}` : ""}{child.school ? ` • ${child.school}` : ""})
              </Text>
            </Text>
          </View>
        </View>
        <View className="bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex-row items-center gap-1">
          <Check size={11} color="#059669" />
          <Text className="text-[11px] font-bold text-emerald-700">Linked</Text>
        </View>
      </View>
    );
  }

  // Multiple children switcher
  return (
    <View className="bg-white border-b border-border py-2.5 px-3">
      <View className="flex-row items-center justify-between mb-1.5 px-1">
        <View className="flex-row items-center gap-1.5">
          <Users size={14} color="#2563EB" />
          <Text className="text-caption font-bold text-ink-muted uppercase tracking-wider">
            Switch Child ({linkedStudents.length} Linked)
          </Text>
        </View>
        <Text className="text-[11px] text-primary font-medium">All tabs follow selection</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 2, gap: 8 }}
      >
        {linkedStudents.map((child) => {
          const childKey = child.userId || child.id;
          const isSelected = selectedChildId === child.userId || selectedChildId === child.id;
          const initials = child.fullName
            ? child.fullName
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()
            : "ST";

          return (
            <TouchableOpacity
              key={childKey}
              onPress={() => setSelectedChildId(childKey)}
              activeOpacity={0.7}
              className={`flex-row items-center gap-2 px-3.5 py-2 rounded-xl border min-h-[48px] ${
                isSelected
                  ? "bg-primary border-primary shadow-xs"
                  : "bg-surface-subtle border-border active:bg-neutral-subtle"
              }`}
            >
              <View
                className={`w-6 h-6 rounded-full items-center justify-center ${
                  isSelected ? "bg-white/20" : "bg-primary/10"
                }`}
              >
                <Text
                  className={`text-[10px] font-bold ${
                    isSelected ? "text-white" : "text-primary"
                  }`}
                >
                  {initials}
                </Text>
              </View>

              <View>
                <Text
                  className={`text-body-sm font-bold ${
                    isSelected ? "text-white" : "text-ink"
                  }`}
                >
                  {child.fullName}
                </Text>
                <Text
                  className={`text-[10px] ${
                    isSelected ? "text-white/80" : "text-ink-muted"
                  }`}
                >
                  {child.classLevel ? `Class ${child.classLevel}` : ""}{" "}
                  {child.board ? child.board.toUpperCase() : ""}
                </Text>
              </View>

              {isSelected && (
                <View className="ml-1 w-4 h-4 rounded-full bg-white/20 items-center justify-center">
                  <Check size={10} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
