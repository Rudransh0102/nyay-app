import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme';
import { Card, SearchBar, Tag } from '../../../shared/components';

const RECENT_CASES = [
  { id: '1', title: 'Kesavananda Bharati v. State of Kerala', court: 'Supreme Court', year: '1973', status: 'Decided', summary: 'Basic structure doctrine established.' },
  { id: '2', title: 'Maneka Gandhi v. Union of India', court: 'Supreme Court', year: '1978', status: 'Decided', summary: 'Expanded the scope of Art. 21.' },
  { id: '3', title: 'Navtej Singh Johal v. Union of India', court: 'Supreme Court', year: '2018', status: 'Decided', summary: 'Decriminalization of Section 377.' },
];

export function CasesListScreen() {
  const { colors, spacing, borderRadius, typography } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingHorizontal: spacing.lg }]}>
        <Text style={[styles.title, { color: colors.text, fontSize: typography.fontSize['2xl'] }]}>Case Law</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Research landmark judgments & precedents</Text>
      </View>

      <View style={{ paddingHorizontal: spacing.lg, marginVertical: spacing.md }}>
        <SearchBar placeholder="Search cases, judges, or keywords..." value="" onChangeText={() => {}} />
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ marginTop: spacing.md, gap: 10 }}>
          <Tag label="Supreme Court" variant="primary" />
          <Tag label="High Courts" variant="gray" />
          <Tag label="Constitutional" variant="gray" />
          <Tag label="Civil" variant="gray" />
          <Tag label="Criminal" variant="gray" />
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 20 }}>
        {RECENT_CASES.map((item) => (
          <TouchableOpacity key={item.id} activeOpacity={0.8}>
            <Card style={styles.caseCard} variant="surface">
              <View style={styles.caseHeader}>
                <View style={styles.caseInfo}>
                  <Text style={[styles.caseTitle, { color: colors.text }]} numberOfLines={2}>{item.title}</Text>
                  <Text style={[styles.caseMeta, { color: colors.textSecondary }]}>{item.court} • {item.year}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
              </View>
              <View style={[styles.divider, { backgroundColor: colors.glassBorder }]} />
              <Text style={[styles.caseSummary, { color: colors.textSecondary }]} numberOfLines={2}>
                {item.summary}
              </Text>
              <View style={styles.caseFooter}>
                <Tag label={item.status} variant="success" />
                <TouchableOpacity style={styles.actionBtn}>
                  <Ionicons name="bookmark-outline" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </Card>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { marginTop: 20 },
  title: { fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, marginTop: 4 },
  caseCard: {
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  caseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  caseInfo: { flex: 1, paddingRight: 10 },
  caseTitle: { fontSize: 16, fontWeight: '700', lineHeight: 22 },
  caseMeta: { fontSize: 13, marginTop: 4, fontWeight: '500' },
  divider: { height: 1, width: '100%' },
  caseSummary: { fontSize: 14, lineHeight: 20 },
  caseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
