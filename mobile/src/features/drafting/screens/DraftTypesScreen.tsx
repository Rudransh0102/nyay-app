import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme';
import { Card, SearchBar, Tag, Loader } from '../../../shared/components';
import apiClient from '../../../api/client';

interface DraftTemplate {
  id: string;
  title: string;
  category: string;
  description: string;
  content?: string;
}

interface Props {
  onTemplateSelect?: (template: DraftTemplate) => void;
}

export function DraftTypesScreen({ onTemplateSelect }: Props) {
  const { colors, spacing, borderRadius, typography } = useTheme();
  const [templates, setTemplates] = useState<DraftTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<DraftTemplate[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      // TODO: Replace with actual API call once endpoint is ready
      // const response = await apiClient.get('/api/drafting/templates');
      // setTemplates(response.data);
      
      // Mock data for now
      const mockTemplates: DraftTemplate[] = [
        { id: '1', title: 'FIR Draft', category: 'Criminal', description: 'Standard First Information Report for police stations.' },
        { id: '2', title: 'Legal Notice', category: 'Civil', description: 'Formal notice for recovery of dues or property disputes.' },
        { id: '3', title: 'Rental Agreement', category: 'Contract', description: 'Residential or commercial lease agreement.' },
        { id: '4', title: 'NDA', category: 'Business', description: 'Non-Disclosure Agreement for confidential data.' },
        { id: '5', title: 'Power of Attorney', category: 'Legal', description: 'Authorizing another person to act on your behalf.' },
      ];
      setTemplates(mockTemplates);
      setFilteredTemplates(mockTemplates);
    } catch (err) {
      setError('Failed to load templates. Please try again.');
      console.error('Failed to fetch templates:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchInput(query);
    const filtered = templates.filter((t) =>
      t.title.toLowerCase().includes(query.toLowerCase()) ||
      t.description.toLowerCase().includes(query.toLowerCase()) ||
      t.category.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredTemplates(filtered);
  }, [templates]);

  const handleTemplatePress = useCallback((template: DraftTemplate) => {
    onTemplateSelect?.(template);
  }, [onTemplateSelect]);

  if (isLoading) {
    return <Loader fullScreen />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingHorizontal: spacing.lg }]}>
        <Text style={[styles.title, { color: colors.text, fontSize: typography.fontSize['2xl'] }]}>Legal Drafting</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Select a template to begin drafting</Text>
      </View>

      <View style={{ paddingHorizontal: spacing.lg, marginVertical: spacing.md }}>
        <SearchBar
          placeholder="Search templates..."
          value={searchInput}
          onChangeText={handleSearch}
          variant="outlined"
        />
      </View>

      {error && (
        <View style={[styles.errorContainer, { backgroundColor: colors.error + '10' }]}>
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        </View>
      )}

      {filteredTemplates.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={48} color={colors.textTertiary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {searchInput ? 'No templates found' : 'No templates available'}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 20 }}>
          <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: spacing.md }]}>
            Templates ({filteredTemplates.length})
          </Text>
          <View style={styles.grid}>
            {filteredTemplates.map((item) => (
              <Card key={item.id} style={styles.draftCard} variant="surface">
                <View style={[styles.iconBox, { backgroundColor: colors.primary + '15' }]}>
                  <Ionicons name="document-text" size={24} color={colors.primary} />
                </View>
                <Tag label={item.category} variant="primary" />
                <Text style={[styles.cardTitle, { color: colors.text }]}>{item.title}</Text>
                <Text style={[styles.cardDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                  {item.description}
                </Text>
                <TouchableOpacity
                  style={[styles.startBtn, { backgroundColor: colors.primary }]}
                  onPress={() => handleTemplatePress(item)}
                  accessibilityLabel={`Select ${item.title} template`}
                >
                  <Text style={styles.startBtnText}>Start Drafting</Text>
                  <Ionicons name="arrow-forward" size={16} color="white" />
                </TouchableOpacity>
              </Card>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { marginTop: 20 },
  title: { fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  grid: { gap: 16 },
  draftCard: {
    padding: 20,
    gap: 12,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontSize: 18, fontWeight: '700' },
  cardDesc: { fontSize: 13, lineHeight: 18 },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  startBtnText: { color: 'white', fontWeight: '700', fontSize: 14 },
  errorContainer: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 12,
    borderRadius: 8,
  },
  errorText: { fontSize: 14, fontWeight: '500' },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: { fontSize: 16, marginTop: 12, textAlign: 'center' },
});
