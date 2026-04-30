import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { spacing, useTheme } from "../../../theme";
import { LegalNode } from "../../../utils/parseLegalText";

interface Props {
  label: string;
  text: string;
  clauses?: LegalNode[];
  onPress?: () => void;
}

export function SectionCard({ label, text, clauses = [], onPress }: Props) {
  const { colors, spacing } = useTheme();

  const hasContent = clauses.length > 0;
  const structuralClauses = clauses.filter(
    (clause) => clause.type === "clause",
  );
  const clauseCount = structuralClauses.filter(
    (clause) => !clause.meta?.omitted,
  ).length;
  const explanations = clauses.filter(
    (clause) => clause.type === "explanation",
  );
  const hasOmitted = clauses.some((clause) => clause.meta?.omitted);
  const omittedCount = structuralClauses.filter((c) => c.meta?.omitted).length;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={hasContent ? onPress : undefined}
      style={[
        styles.card,
        {
          backgroundColor: colors.surfaceLight,
          borderColor: colors.glassBorder,
        },
      ]}
    >
      {label ? (
        <Text style={[styles.label, { color: colors.primary }]}>({label})</Text>
      ) : null}

      <Text
        style={[
          styles.text,
          { color: colors.text },
          !label && { fontStyle: "italic", opacity: 0.8 },
        ]}
      >
        {text}
      </Text>

      {/* Omitted Badge */}
      {hasOmitted && (
        <View style={styles.omittedBadge}>
          <Text style={styles.omittedBadgeText}>
            Contains Omitted Clause{omittedCount > 1 ? `s (${omittedCount})` : ""}
          </Text>
        </View>
      )}

      {/* Clause Indicator */}
      {hasContent && (
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.primary }]}>
            {clauseCount} clause{clauseCount !== 1 ? "s" : ""}
          </Text>
          <Ionicons name="chevron-forward" size={14} color={colors.primary} />
        </View>
      )}

      {/* Explanations */}
      {explanations.length > 0 && (
        <View style={{ marginTop: spacing.sm }}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            {explanations.length} explanation
            {explanations.length > 1 ? "s" : ""}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  label: {
    fontWeight: "700",
    marginBottom: 4,
  },
  text: {
    lineHeight: 20,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 4,
  },
  footerText: {
    fontSize: 12,
    fontWeight: "600",
  },
  omittedBadge: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 8,
    alignSelf: "flex-start",
  },
  omittedBadgeText: {
    color: "#991B1B",
    fontSize: 12,
    textAlign: "center",
    fontWeight: "700",
    textTransform: "uppercase",
  },
});
