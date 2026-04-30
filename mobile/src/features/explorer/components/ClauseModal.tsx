import React from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  NativeSyntheticEvent,
  TextLayoutEventData,
} from "react-native";
import { useTheme } from "../../../theme";
import { LegalNode } from "../../../utils/parseLegalText";
import { Ionicons } from "@expo/vector-icons";
import { darkColors as colors } from "../../../theme";

interface Props {
  visible: boolean;
  onClose: () => void;
  section: LegalNode | null;
}


export function ClauseModal({ visible, onClose, section }: Props) {
  const { colors } = useTheme();

  const scrollRef = React.useRef<ScrollView>(null);
  const nodePositions = React.useRef<Record<string, number>>({});
  const [highlighted, setHighlighted] = React.useState<string | null>(null);
  
  const [expanded, setExpanded] = React.useState(false);
  const [isOverflowing, setIsOverflowing] = React.useState(false);

  React.useEffect(() => {
    setHighlighted(null);
  }, [section]);

  const handleTextLayout = (e: NativeSyntheticEvent<TextLayoutEventData>) => {
    if (!expanded && !isOverflowing && e.nativeEvent.lines.length > 2) {
      setIsOverflowing(true);
    }
  };

  const handleReferencePress = (target: string) => {
    const y = nodePositions.current[target];
    if (y !== undefined) {
      scrollRef.current?.scrollTo({ y, animated: true });
      setHighlighted(target);
      setTimeout(() => setHighlighted(null), 1200);
    }
  };

  const renderTextWithRefs = (text: string) => {
    const parts = text.split(/(sub-section\s*\(\d+[A-Z]?\))/gi);
    return (
      <Text style={[styles.content, { color: colors.text }]}>
        {parts.map((part, i) => {
          const match = part.match(/sub-section\s*\((\d+[A-Z]?)\)/i);

          if (match) {
            const target = match[1];

            return (
              <Text
                key={i}
                style={{
                  color: colors.primary,
                  textDecorationLine: "underline",
                  fontWeight: "600",
                }}
                onPress={() => handleReferencePress(target)}
              >
                {part}
              </Text>
            );
          }

          return <Text key={i}>{part}</Text>;
        })}
      </Text>
    );
  };

  const RenderNode = ({
    node,
    depth = 0,
  }: {
    node: LegalNode;
    depth?: number;
  }) => {
    if (node.meta?.omitted) {
      return (
        <View style={[styles.omittedBox, { marginLeft: depth * 16 }]}>
          <Ionicons name="close-circle-outline" size={16} color="#991B1B" />
          <View style={{ flex: 1 }}>
            <Text style={styles.omittedLabel}>
              {node.label
                ? `Sub-clause (${node.label})`
                : "Unlabeled Provision"}{" "}
              Repealed or Omitted.
            </Text>
            <Text style={styles.omittedText}>
              {renderTextWithRefs(node.content) ||
                "This portion has been formally removed from the Act by amendment."}
            </Text>
          </View>
        </View>
      );
    }

    if (node.type === "text" && !node.label) {
      return (
        <View style={[styles.textNode, { marginLeft: depth * 16 }]}>
          <Text
            style={[styles.explanationText, { color: colors.textSecondary }]}
          >
            {renderTextWithRefs(node.content)}
          </Text>
          {node.children.map((child, idx) => (
            <RenderNode key={idx} node={child} depth={depth + 1} />
          ))}
        </View>
      );
    }

    return (
      <View
        style={[styles.nodeContainer, { marginLeft: depth * 16 }]}
        onLayout={(e) => {
          if (node.label) {
            nodePositions.current[node.label] = e.nativeEvent.layout.y;
          }
        }}
      >
        <View
          style={[
            styles.card,
            {
              backgroundColor:
                highlighted === node.label
                  ? colors.primary + "20"
                  : colors.surfaceLight,
              borderColor:
                highlighted === node.label
                  ? colors.primary
                  : colors.glassBorder,
            },
          ]}
        >
          {node.label ? (
            <Text style={[styles.label, { color: colors.primary }]}>
              ({node.label})
            </Text>
          ) : null}
          <Text style={[styles.content, { color: colors.text }]}>
            {renderTextWithRefs(node.content)}
          </Text>
        </View>

        {node.children.map((child, idx) => (
          <RenderNode key={idx} node={child} depth={depth + 1} />
        ))}
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View
          style={[styles.container, { backgroundColor: colors.background }]}
        >
          <View style={styles.header}>
            <Text style={[styles.sectionTag, { color: colors.primary }]}>
              SECTION ({section?.label})
            </Text>
            <View style={{ position: "relative" }}>
              <Text
                onTextLayout={handleTextLayout}
                numberOfLines={expanded ? undefined : 2}
                style={[styles.sectionTitle, { color: colors.text }]}
              >
                {section?.content.replace(/^"|"$/g, "").trim()}
              </Text>

              {isOverflowing && (
                <TouchableOpacity
                  onPress={() => setExpanded((prev) => !prev)}
                  style={styles.expandIcon}
                >
                  <Ionicons
                    name={expanded ? "chevron-up" : "chevron-down"}
                    size={18}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              )}
            </View>
            <Text style={[styles.subLabel, { color: colors.textTertiary }]}>
              HIERARCHICAL SUB-CLAUSES
            </Text>
          </View>
          <ScrollView ref={scrollRef} showsVerticalScrollIndicator>
            {section?.children.map((child, idx) => (
              <RenderNode key={idx} node={child} />
            ))}
          </ScrollView>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <View
              style={[
                styles.readPill,
                { backgroundColor: colors.primaryLight + "15" },
              ]}
            >
              <Text style={[styles.readText, { color: colors.primary }]}>
                CLOSE
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 16,
  },
  container: { borderRadius: 24, padding: 16, maxHeight: "80%", elevation: 20 },
  header: { marginBottom: 16 },
  sectionTag: { fontWeight: "800", fontSize: 12, letterSpacing: 1 },
  sectionTitle: {
    fontWeight: "700",
    fontSize: 18,
    marginTop: 4,
    lineHeight: 24,
  },
  expandIcon: {
    position: "absolute",
    right: 0,
    top: 0,
    padding: 4,
    zIndex: 2,
  },
  subLabel: {
    fontSize: 10,
    fontWeight: "800",
    marginTop: 12,
    letterSpacing: 0.5,
  },
  nodeContainer: { marginTop: 12 },
  textNode: { marginTop: 12, marginBottom: 4, paddingHorizontal: 4 },
  explanationText: { fontStyle: "italic", fontSize: 13, lineHeight: 18 },
  card: { padding: 12, borderRadius: 12, borderWidth: 1 },
  label: { fontWeight: "700", fontSize: 13, marginBottom: 4 },
  content: { lineHeight: 20 },
  closeBtn: { marginTop: 16, alignItems: "center", padding: 10 },
  omittedBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    borderStyle: "dashed",
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  omittedText: {
    color: "#991B1B",
    fontSize: 12,
    fontWeight: "600",
    fontStyle: "italic",
    flex: 1,
  },
  omittedLabel: {
    color: "#991B1B",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  readPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 15,
    height: 36,
    borderRadius: 999,
    borderColor: colors.accent,
    borderWidth: 2,
  },
  readText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
