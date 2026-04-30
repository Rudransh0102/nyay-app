import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../theme";
import { Card, Loader } from "../../../shared/components";
import apiClient, { isApiAbortError } from "../../../api/client";
import { darkColors as Colors } from "../../../theme";

interface Section {
  id: string;
  section_number: string;
  title: string;
  content: string;
}

interface Act {
  id: string;
  title: string;
}

interface Props {
  act: Act;
  onBack: () => void;
  onSectionPress: (section: Section) => void;
}

export function ActDetailsScreen({ act, onBack, onSectionPress }: Props) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const [sections, setSections] = useState<Section[]>([]);
  const [filteredSections, setFilteredSections] = useState<Section[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const loadSections = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get<any>(`/legal/acts/${act.id}`, {
        params: { limit: 500 },
      });
      const loadedSections = res.data.sections ?? [];
      setSections(loadedSections);
      setFilteredSections(loadedSections);
    } catch (err) {
      if (!isApiAbortError(err)) {
        console.error("Failed to load sections", err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [act.id]);

  useEffect(() => {
    loadSections();
  }, [loadSections]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSections(sections);
      return;
    }
    const q = searchQuery.toLowerCase();
    setFilteredSections(
      sections.filter(
        (s) =>
          s.section_number.toLowerCase().includes(q) ||
          s.title.toLowerCase().includes(q) ||
          s.content.toLowerCase().includes(q),
      ),
    );
  }, [searchQuery, sections]);

  const renderSection = ({ item }: { item: Section }) => (
    <Card
      style={[
        styles.sectionCard,
        {
          borderColor: colors.glassBorder,
        },
      ]}
      onPress={() => onSectionPress(item)}
    >
      <View style={styles.sectionHeader}>
        <View
          style={[
            styles.numberBadge,
            { backgroundColor: colors.primary + "15" },
          ]}
        >
          <Text style={[styles.numberText, { color: colors.primary }]}>
            {item.section_number}
          </Text>
        </View>

        <Text
          style={[
            styles.sectionTitle,
            { color: colors.text, fontSize: typography.fontSize.md },
          ]}
          numberOfLines={2}
        >
          {item.title}
        </Text>
      </View>

      <Text
        style={[
          styles.sectionPreview,
          { color: colors.textSecondary, fontSize: typography.fontSize.sm },
        ]}
        numberOfLines={2}
      >
        {item.content}
      </Text>

      <View style={styles.footerRow}>
        <View style={[styles.readPill, {backgroundColor: colors.accent + "15"}]}>
          <Text
            style={[styles.readText, { color: colors.primary }]}
          >
            READ SECTION
          </Text>
          <Ionicons name="arrow-forward" size={14} color={colors.primary} />
        </View>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* HERO HEADER */}
      <View style={styles.hero}>
        <View
          style={[styles.heroGlow, { backgroundColor: colors.primary + "20" }]}
        />

        <View style={styles.headerRow}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={[styles.actNameHero, { color: colors.text }]}>
              {act.title}
            </Text>
            <Text style={[styles.sectionCount, { color: colors.textTertiary }]}>
              {sections.length} Sections
            </Text>
          </View>
        </View>
      </View>

      {/* SEARCH */}
      <View style={[styles.searchRow, { marginHorizontal: spacing.lg }]}>
        <View
          style={[
            styles.searchBox,
            {
              backgroundColor: colors.surfaceLight,
              borderRadius: borderRadius.xl,
              borderColor: colors.glassBorder,
            },
          ]}
        >
          <Ionicons
            name="search-outline"
            size={16}
            color={colors.textTertiary}
          />
          <TextInput
            placeholder="Find section, keyword..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[
              styles.searchInput,
              { color: colors.text, fontSize: typography.fontSize.sm },
            ]}
          />
        </View>
      </View>

      {isLoading ? (
        <Loader message="Indexing sections…" />
      ) : (
        <FlatList
          data={filteredSections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.sm,
            paddingBottom: 100,
            gap: spacing.md,
          }}
          renderItem={renderSection}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

  hero: {
    paddingTop: 12,
    paddingBottom: 20,
  },

  heroGlow: {
    position: "absolute",
    top: -80,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.3,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
  },

  backBtn: { padding: 4 },

  actNameHero: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.5,
  },

  sectionCount: {
    fontWeight: "600",
    marginTop: 2,
    fontSize: 12,
  },

  searchRow: { marginBottom: 12 },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    height: 46,
    paddingHorizontal: 14,
    borderWidth: 1,
    gap: 8,
  },

  searchInput: { flex: 1 },

  sectionCard: {
    padding: 16,
    gap: 10,
    borderWidth: 1,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  numberBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    minWidth: 40,
    alignItems: "center",
    justifyContent: "center",
    height: 28,
    borderWidth: 1,
    borderColor: Colors.accent + "50",
  },

  numberText: {
    fontWeight: "900",
    fontSize: 13,
  },

  sectionTitle: {
    flex: 1,
    fontWeight: "600",
  },

  sectionPreview: {
    lineHeight: 20,
  },

  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
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
