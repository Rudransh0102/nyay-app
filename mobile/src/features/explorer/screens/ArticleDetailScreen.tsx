import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Share,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../theme";
import { Tag } from "../../../shared/components";
import { type LegalDocument, bookmarkApi } from "../../../api/endpoints";
import { useLegalStore } from "../../../store/useLegalStore";
import { parseLegalText, LegalNode } from "../../../utils/parseLegalText";
import { SectionCard } from "../components/SectionCard";
import { ClauseModal } from "../components/ClauseModal";

interface Props {
  doc: Partial<LegalDocument> & {
    id: string;
    title?: string;
    content?: string;
    plain_summary?: string;
  };
  onBack: () => void;
}

export function ArticleDetailScreen({ doc, onBack }: Props) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const { bookmarks, toggleBookmark } = useLegalStore();

  const [fontSize, setFontSize] = useState(16);
  const [isFocusMode, setIsFocusMode] = useState(false);
  
  // Update state type to match LegalNode
  const [activeSection, setActiveSection] = useState<LegalNode | null>(null);

  const canBookmark = !!doc.type;
  const isBookmarked = canBookmark && bookmarks.some((b) => b.id === doc.id);
  const docType = doc.type ?? (doc.section_number ? "section" : "document");
  const title = doc.article_title ?? doc.title ?? "Untitled";
  const content = doc.content ?? doc.plain_summary ?? "";

  // Simply call the updated parser; manual grouping logic is no longer needed
  const parsedTree = useMemo(() => parseLegalText(content), [content]);

  const onShare = async () => {
    try {
      await Share.share({ message: `${title}\n\n${content}\n\n— NyayAPP` });
    } catch {}
  };

  const onBookmark = async () => {
    if (!canBookmark) return;

    try {
      if (isBookmarked) {
        await bookmarkApi.remove(doc.id);
      } else {
        await bookmarkApi.add(doc.id);
      }
      toggleBookmark(doc as LegalDocument);
    } catch (e: any) {
      Alert.alert(
        "Error",
        e?.response?.data?.message ?? "Could not update bookmark",
      );
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* NAVBAR */}
      <View
        style={[
          styles.nav,
          {
            borderBottomColor: colors.glassBorder,
            paddingHorizontal: spacing.lg,
          },
        ]}
      >
        <TouchableOpacity
          onPress={onBack}
          style={[
            styles.navBtn,
            {
              backgroundColor: colors.surfaceLight,
              borderRadius: borderRadius.full,
            },
          ]}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.navActions}>
          <TouchableOpacity
            onPress={() => setIsFocusMode(!isFocusMode)}
            style={[
              styles.navBtn,
              {
                backgroundColor: colors.surfaceLight,
                borderRadius: borderRadius.full,
              },
            ]}
          >
            <Ionicons
              name={isFocusMode ? "eye-off" : "eye"}
              size={20}
              color={colors.text}
            />
          </TouchableOpacity>

          {canBookmark && (
            <TouchableOpacity
              onPress={onBookmark}
              style={[
                styles.navBtn,
                {
                  backgroundColor: colors.surfaceLight,
                  borderRadius: borderRadius.full,
                },
              ]}
            >
              <Ionicons
                name={isBookmarked ? "bookmark" : "bookmark-outline"}
                size={20}
                color={isBookmarked ? colors.primary : colors.text}
              />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={onShare}
            style={[
              styles.navBtn,
              {
                backgroundColor: colors.surfaceLight,
                borderRadius: borderRadius.full,
              },
            ]}
          >
            <Ionicons name="share-outline" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.lg }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.meta}>
          <Tag label={docType} variant="primary" />
          {doc.chapter && (
            <Tag label={`Chapter ${doc.chapter}`} variant="gray" />
          )}
          {doc.part && <Tag label={doc.part} variant="gray" />}
        </View>

        {(doc.article_number != null || doc.section_number != null) && (
          <Text
            style={[
              styles.articleNum,
              {
                color: colors.textTertiary,
                fontSize: typography.fontSize.sm,
              },
            ]}
          >
            {doc.article_number
              ? `Article ${doc.article_number}`
              : `Section ${doc.section_number}`}
          </Text>
        )}

        <Text
          style={[
            styles.title,
            {
              color: colors.text,
              fontSize: typography.fontSize["2xl"],
            },
          ]}
        >
          {title}
        </Text>

        <View style={styles.controls}>
          <View
            style={[
              styles.controlGroup,
              { backgroundColor: colors.surfaceLight },
            ]}
          >
            <TouchableOpacity
              style={styles.controlBtn}
              onPress={() => setFontSize((s) => Math.max(14, s - 2))}
            >
              <Text style={[styles.controlText, { color: colors.text }]}>
                A-
              </Text>
            </TouchableOpacity>

            <View
              style={[
                styles.controlDivider,
                { backgroundColor: colors.glassBorder },
              ]}
            />

            <TouchableOpacity
              style={styles.controlBtn}
              onPress={() => setFontSize((s) => Math.min(24, s + 2))}
            >
              <Text style={[styles.controlText, { color: colors.text }]}>
                A+
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View
          style={[styles.divider, { backgroundColor: colors.glassBorder }]}
        />

        <TouchableOpacity
          style={[styles.copyBtn, { backgroundColor: colors.primary + "15" }]}
          onPress={() => Share.share({ message: content })}
        >
          <Ionicons name="copy-outline" size={14} color={colors.primary} />
          <Text
            style={{ color: colors.primary, fontWeight: "600", fontSize: 12 }}
          >
            Copy Section
          </Text>
        </TouchableOpacity>

        <View
          style={{
            backgroundColor: isFocusMode ? colors.surfaceLight : "transparent",
            padding: isFocusMode ? 12 : 0,
            borderRadius: 12,
          }}
        >
          <View style={{ marginTop: 12 }}>
            {parsedTree.map((section, index) => (
              <SectionCard
                key={index}
                label={section.label}
                text={section.content}
                clauses={section.children} 
                onPress={() => setActiveSection(section)}
              />
            ))}
          </View>
        </View>

        {doc.tags && doc.tags.length > 0 && (
          <View style={styles.tags}>
            {doc.tags.map((tag) => (
              <View
                key={tag}
                style={[
                  styles.tag,
                  {
                    backgroundColor: colors.primary + "15",
                    borderRadius: borderRadius.full,
                    borderWidth: 1,
                    borderColor: colors.glassBorder,
                  },
                ]}
              >
                <Text
                  style={{
                    color: colors.primary,
                    fontSize: typography.fontSize.xs,
                    fontWeight: "600",
                  }}
                >
                  #{tag}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Updated Modal call to pass the entire section object */}
      <ClauseModal
        visible={!!activeSection}
        onClose={() => setActiveSection(null)}
        section={activeSection}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  nav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  navBtn: {
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  navActions: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    height: 30,
    borderRadius: 999,
    marginBottom: 12,
  },
  meta: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
    alignItems: "center",
  },
  articleNum: {
    fontWeight: "600",
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  title: {
    fontWeight: "800",
    letterSpacing: -0.5,
    lineHeight: 34,
    marginBottom: 12,
  },
  controls: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginBottom: 12,
  },
  controlGroup: {
    flexDirection: "row",
    borderRadius: 10,
    paddingHorizontal: 6,
    height: 32,
    alignItems: "center",
  },
  controlBtn: {
    paddingHorizontal: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  controlText: {
    fontSize: 13,
    fontWeight: "600",
  },
  controlDivider: {
    width: 1,
    height: 16,
    marginHorizontal: 2,
  },
  divider: {
    height: 1,
    marginBottom: 16,
    marginTop: 8,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 24,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
});