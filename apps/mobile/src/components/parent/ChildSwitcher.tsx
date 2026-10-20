import React, { useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { Check, Users } from "lucide-react-native";
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

  // If 0 or 1 child is linked, no switching banner is required
  if (linkedStudents.length <= 1) {
    return null;
  }

  // Multiple children switcher
  return (
    <View
      style={{
        backgroundColor: "#FFFFFF",
        borderBottomWidth: 1,
        borderBottomColor: "#E2E8F0",
        paddingVertical: 10,
        paddingHorizontal: 14,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Users size={14} color="#2563EB" />
          <Text
            style={{
              fontSize: 11,
              fontWeight: "700",
              color: "#64748B",
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            Switch Child ({linkedStudents.length} Linked)
          </Text>
        </View>
        <Text style={{ fontSize: 11, color: "#2563EB", fontWeight: "600" }}>
          All tabs sync to selection
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingRight: 8 }}
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
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 14,
                borderWidth: isSelected ? 1.5 : 1,
                borderColor: isSelected ? "#2563EB" : "#E2E8F0",
                backgroundColor: isSelected ? "#EFF6FF" : "#F8FAFC",
                minHeight: 46,
              }}
            >
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 10,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: isSelected ? "#2563EB" : "#E2E8F0",
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "800",
                    color: isSelected ? "#FFFFFF" : "#475569",
                  }}
                >
                  {initials}
                </Text>
              </View>

              <View>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "700",
                    color: isSelected ? "#1D4ED8" : "#1E293B",
                  }}
                  numberOfLines={1}
                >
                  {child.fullName}
                </Text>
                <Text
                  style={{
                    fontSize: 10.5,
                    color: isSelected ? "#3B82F6" : "#64748B",
                    fontWeight: "500",
                  }}
                >
                  {child.classLevel ? `Class ${child.classLevel}` : ""}{" "}
                  {child.board ? `• ${child.board.toUpperCase()}` : ""}
                </Text>
              </View>

              {isSelected && (
                <View
                  style={{
                    marginLeft: 2,
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    backgroundColor: "#2563EB",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Check size={11} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
