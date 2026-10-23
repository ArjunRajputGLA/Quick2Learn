import React from "react";
import { View, Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { CheckCircle2, AlertCircle, ArrowLeft, Receipt } from "lucide-react-native";
import { Screen } from "../../../src/components/ui/Screen";
import { AppHeader } from "../../../src/components/ui/AppHeader";
import { Button } from "../../../src/components/ui/Button";
import { Card } from "../../../src/components/ui/Card";
import { useQueryClient } from "@tanstack/react-query";

export default function PaymentResultScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{
    status?: string;
    paymentId?: string;
    dueId?: string;
  }>();

  const isSuccess = params.status === "paid" || params.status === "success";

  // Invalidate fees query so the latest cleared dues and receipts are loaded
  React.useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["fees"] });
    queryClient.invalidateQueries({ queryKey: ["home"] });
  }, [queryClient]);

  return (
    <Screen
      scrollable={false}
      header={<AppHeader title="Payment Status" showBack />}
    >
      <View className="flex-1 p-6 items-center justify-center">
        <View
          className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${
            isSuccess ? "bg-emerald-100" : "bg-amber-100"
          }`}
        >
          {isSuccess ? (
            <CheckCircle2 size={36} color="#059669" />
          ) : (
            <AlertCircle size={36} color="#D97706" />
          )}
        </View>

        <Text className="text-h2 font-extrabold text-ink text-center mb-2">
          {isSuccess ? "Payment Completed" : "Payment Incomplete"}
        </Text>

        <Text className="text-body text-ink-muted text-center max-w-xs mb-8 leading-relaxed">
          {isSuccess
            ? "Your tuition instalment has been recorded and an official receipt has been issued."
            : "Your payment was not completed or was cancelled. If amount was debited, it will be refunded automatically."}
        </Text>

        <View className="w-full space-y-3">
          <Button
            variant="primary"
            size="lg"
            onPress={() => router.replace("/(app)/fee-receipts" as any)}
            icon={<Receipt size={18} color="#FFFFFF" />}
          >
            View Fees & Receipts
          </Button>

          <Button
            variant="ghost"
            size="md"
            onPress={() => router.replace("/(app)/(tabs)" as any)}
          >
            Return to Home
          </Button>
        </View>
      </View>
    </Screen>
  );
}
