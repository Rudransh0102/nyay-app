import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme';
import { Card, Tag } from '../../../shared/components';

export function UploadDocScreen({ onBack }: { onBack?: () => void }) {
  const { colors, spacing, borderRadius, typography } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingHorizontal: spacing.lg }]}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Document Tools</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <Card variant="outline" style={styles.uploadCard}>
          <View style={[styles.uploadIcon, { backgroundColor: colors.primary + '10' }]}>
            <Ionicons name="cloud-upload-outline" size={48} color={colors.primary} />
          </View>
          <Text style={[styles.uploadTitle, { color: colors.text }]}>Upload Document</Text>
          <Text style={[styles.uploadSub, { color: colors.textSecondary }]}>
            PDF, JPG or PNG (Max 10MB)
          </Text>
          <TouchableOpacity style={[styles.browseBtn, { backgroundColor: colors.primary }]}>
            <Text style={styles.browseText}>Browse Files</Text>
          </TouchableOpacity>
        </Card>

        <View style={styles.infoSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>AI Processing Features</Text>
          
          <View style={styles.featureRow}>
            <View style={[styles.featureIcon, { backgroundColor: '#4ADE8020' }]}>
              <Ionicons name="scan-outline" size={24} color="#4ADE80" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>OCR Extraction</Text>
              <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>Convert images and PDFs into editable text.</Text>
            </View>
          </View>

          <View style={styles.featureRow}>
            <View style={[styles.featureIcon, { backgroundColor: '#F8717120' }]}>
              <Ionicons name="eye-off-outline" size={24} color="#F87171" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>Smart Redaction</Text>
              <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>Automatically hide sensitive PII data.</Text>
            </View>
          </View>

          <View style={styles.featureRow}>
            <View style={[styles.featureIcon, { backgroundColor: '#60A5FA20' }]}>
              <Ionicons name="language-outline" size={24} color="#60A5FA" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>Translation</Text>
              <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>Translate documents into 12+ Indian languages.</Text>
            </View>
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
  uploadCard: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
    borderWidth: 2,
  },
  uploadIcon: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  uploadTitle: { fontSize: 20, fontWeight: '800' },
  uploadSub: { fontSize: 14, marginTop: 8, marginBottom: 24 },
  browseBtn: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  browseText: { color: 'white', fontWeight: '700' },
  infoSection: { marginTop: 40, gap: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  featureIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  featureTitle: { fontSize: 16, fontWeight: '700' },
  featureDesc: { fontSize: 13, marginTop: 2, lineHeight: 18 },
});
