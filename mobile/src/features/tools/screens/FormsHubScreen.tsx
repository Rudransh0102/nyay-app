import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme';
import { Card, SearchBar, Tag } from '../../../shared/components';

const FORM_CATEGORIES = [
  { id: '1', name: 'Government', icon: 'business' },
  { id: '2', name: 'Taxation', icon: 'calculator' },
  { id: '3', name: 'Property', icon: 'home' },
  { id: '4', name: 'Legal', icon: 'document-attach' },
];

const POPULAR_FORMS = [
  { id: 'f1', title: 'PAN Card Application', type: 'Form 49A', size: '2.4 MB' },
  { id: 'f2', title: 'ITR-1 (Sahaj)', type: 'Income Tax', size: '1.8 MB' },
  { id: 'f3', title: 'Passport Re-issue', type: 'Government', size: '3.1 MB' },
  { id: 'f4', title: 'RTI Application', type: 'General', size: '0.5 MB' },
];

export function FormsHubScreen({ onBack }: { onBack?: () => void }) {
  const { colors, spacing, borderRadius, typography } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingHorizontal: spacing.lg }]}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Forms Hub</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={{ paddingHorizontal: spacing.lg, marginVertical: spacing.md }}>
        <SearchBar placeholder="Search for any official form..." value="" onChangeText={() => {}} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text, paddingHorizontal: spacing.lg }]}>Categories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.lg, marginTop: 12, gap: 12 }}>
            {FORM_CATEGORIES.map((cat) => (
              <TouchableOpacity key={cat.id} style={[styles.catCard, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
                <Ionicons name={cat.icon as any} size={24} color={colors.primary} />
                <Text style={[styles.catName, { color: colors.text }]}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={[styles.section, { marginTop: 32 }]}>
          <Text style={[styles.sectionTitle, { color: colors.text, paddingHorizontal: spacing.lg }]}>Popular Forms</Text>
          <View style={{ paddingHorizontal: spacing.lg, marginTop: 16, gap: 12 }}>
            {POPULAR_FORMS.map((form) => (
              <Card key={form.id} variant="surface" style={styles.formCard}>
                <View style={[styles.pdfIcon, { backgroundColor: '#F8717120' }]}>
                  <Ionicons name="document-outline" size={24} color="#F87171" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.formTitle, { color: colors.text }]}>{form.title}</Text>
                  <Text style={[styles.formMeta, { color: colors.textSecondary }]}>{form.type} • {form.size}</Text>
                </View>
                <TouchableOpacity style={[styles.downloadBtn, { backgroundColor: colors.primary + '10' }]}>
                  <Ionicons name="download-outline" size={20} color={colors.primary} />
                </TouchableOpacity>
              </Card>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 56 },
  title: { fontSize: 18, fontWeight: '700' },
  section: { marginTop: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  catCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: 110,
    gap: 8,
  },
  catName: { fontSize: 13, fontWeight: '600' },
  formCard: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 16 },
  pdfIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  formTitle: { fontSize: 15, fontWeight: '700' },
  formMeta: { fontSize: 13, marginTop: 2 },
  downloadBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
