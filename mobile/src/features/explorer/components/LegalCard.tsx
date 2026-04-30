import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../theme";
import { Card, Tag } from "../../../shared/components";
import type { LegalAct } from "../types";

interface LegalCardProps {
  act: LegalAct;
  onPress: (act: LegalAct) => void;
}

const iconByCategory: Record<string, keyof typeof Ionicons.glyphMap> = {
  Constitutional: "document-text-outline",
  Criminal: "shield-outline",
  Civil: "layers-outline",
  Evidence: "newspaper-outline",
  Family: "people-outline",
  Transport: "car-outline",
  Commercial: "briefcase-outline",
};

export function LegalCard({ act, onPress }: LegalCardProps) {
  const { colors, typography, borderRadius, shadow } = useTheme();
  const iconName = iconByCategory[act.category] ?? "library-outline";

  return (
    <Card style={styles.card} onPress={() => onPress(act)} variant="surface">
      <View style={styles.cardHeader}>
        <View
          style={[
            styles.iconWrap,
            {
              backgroundColor: colors.surfaceLight,
              borderRadius: borderRadius.lg,
            },
          ]}
        >
          <Ionicons name={iconName} size={22} color={colors.primary} />
        </View>
        <View style={styles.headerMeta}>
          <Tag
            label={act.category}
            variant={act.category === "Criminal" ? "error" : "primary"}
          />
          <Text
            style={[
              styles.year,
              { color: colors.textTertiary, fontSize: typography.fontSize.xs },
            ]}
          >
            ESTD {act.year || "N/A"}
          </Text>
        </View>
      </View>

      <Text
        style={[
          styles.title,
          { color: colors.text, fontSize: typography.fontSize.lg },
        ]}
        numberOfLines={2}
      >
        {act.title}
      </Text>

      <Text
        style={[
          styles.description,
          { color: colors.textSecondary, fontSize: typography.fontSize.sm },
        ]}
        numberOfLines={3}
      >
        {act.description || "Explore sections and summaries of this act."}
      </Text>

      <View style={styles.cardFooter}>
        <View
          style={[styles.readPill, { backgroundColor: colors.primary + "15" }]}
        >
          <Text style={[styles.readText, { color: colors.primary }]}>
            EXPLORE SECTIONS
          </Text>
          <Ionicons name="arrow-forward" size={12} color={colors.primary} />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    gap: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  iconWrap: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerMeta: {
    alignItems: "flex-end",
    gap: 4,
  },
  year: {
    fontWeight: "600",
  },
  title: {
    fontWeight: "700",
    lineHeight: 26,
    letterSpacing: -0.3,
  },
  description: {
    lineHeight: 20,
    fontWeight: "400",
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  cta: {
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  readPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    height: 28,
    borderRadius: 999,
  },
  readText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
